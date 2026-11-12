import { type NextRequest, NextResponse } from "next/server";
import { courseLabel } from "@/lib/courses";
import { formatDateOnly } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { generarSlug } from "@/lib/slug";

function sanitizeSpecificObjectives(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((o): o is string => typeof o === "string")
    .map((o) => o.trim())
    .filter((o) => o.length > 0);
}

// GET - Detalle de la asignatura con sus temas asociados (ordenados)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin(req);
    if ("error" in auth) return auth.error;

    const { id } = await params;
    const subject = await prisma.subject.findUnique({
      where: { id },
      include: {
        topics: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            slug: true,
            title: true,
            order: true,
            parte: true,
            parentSlug: true,
          },
        },
        courses: {
          include: {
            subject: { select: { code: true } },
            period: true,
            _count: { select: { enrollments: { where: { active: true } } } },
          },
          orderBy: [{ period: { startDate: "desc" } }, { group: "asc" }],
        },
      },
    });

    if (!subject) {
      return NextResponse.json(
        { error: "Asignatura no encontrada" },
        { status: 404 },
      );
    }

    const { courses, ...rest } = subject;
    return NextResponse.json({
      subject: {
        ...rest,
        courses: courses.map((c) => ({
          id: c.id,
          label: courseLabel(c),
          group: c.group,
          status: c.status,
          periodName: c.period.name,
          startDate: formatDateOnly(c.period.startDate),
          endDate: formatDateOnly(c.period.endDate),
          activeStudents: c._count.enrollments,
        })),
      },
    });
  } catch (error) {
    console.error("Error obteniendo asignatura:", error);
    return NextResponse.json(
      { error: "Error obteniendo asignatura" },
      { status: 500 },
    );
  }
}

// PUT - Edita la asignatura (RF-ASG-04)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin(req);
    if ("error" in auth) return auth.error;

    const { id } = await params;
    const existing = await prisma.subject.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Asignatura no encontrada" },
        { status: 404 },
      );
    }

    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const code = typeof body.code === "string" ? body.code.trim() : "";
    const objective =
      typeof body.objective === "string" ? body.objective.trim() : "";
    const specificObjectives = sanitizeSpecificObjectives(
      body.specificObjectives,
    );

    if (!name || !code) {
      return NextResponse.json(
        { error: "El nombre y el código son obligatorios" },
        { status: 400 },
      );
    }

    const credits = Number.parseInt(String(body.credits), 10);
    if (Number.isNaN(credits) || credits < 0) {
      return NextResponse.json(
        { error: "Los créditos deben ser un entero mayor o igual a 0" },
        { status: 400 },
      );
    }

    // Código único, excluyendo la propia asignatura
    const codeOwner = await prisma.subject.findUnique({ where: { code } });
    if (codeOwner && codeOwner.id !== id) {
      return NextResponse.json(
        { error: `Ya existe otra asignatura con el código "${code}"` },
        { status: 400 },
      );
    }

    // Slug: normalizar el provisto o derivarlo del nombre; validar unicidad
    // excluyendo la propia asignatura.
    const slugBase =
      typeof body.slug === "string" && body.slug.trim() ? body.slug : name;
    const slug = generarSlug(slugBase) || "asignatura";
    const slugOwner = await prisma.subject.findUnique({ where: { slug } });
    if (slugOwner && slugOwner.id !== id) {
      return NextResponse.json(
        { error: `Ya existe otra asignatura con el slug "${slug}"` },
        { status: 400 },
      );
    }

    const subject = await prisma.subject.update({
      where: { id },
      data: { name, code, slug, credits, objective, specificObjectives },
    });

    return NextResponse.json({
      message: "Asignatura actualizada exitosamente",
      subject,
    });
  } catch (error) {
    console.error("Error actualizando asignatura:", error);
    return NextResponse.json(
      { error: "Error actualizando asignatura" },
      { status: 500 },
    );
  }
}

// DELETE - Elimina la asignatura (RF-ASG-04)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin(req);
    if ("error" in auth) return auth.error;

    const { id } = await params;
    const existing = await prisma.subject.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Asignatura no encontrada" },
        { status: 404 },
      );
    }

    // RF-ASG-04: solo se puede eliminar si no tiene cursos activos.
    const activeCourses = await prisma.course.count({
      where: { subjectId: id, status: "ACTIVE" },
    });
    if (activeCourses > 0) {
      return NextResponse.json(
        { error: "La asignatura tiene cursos activos" },
        { status: 409 },
      );
    }

    // La eliminación borra en cascada los cursos finalizados, así que exige
    // confirmación explícita.
    const body = await req.json().catch(() => ({}));
    if (body.confirm !== true) {
      return NextResponse.json(
        { error: "Se requiere confirmación explícita (confirm: true)" },
        { status: 400 },
      );
    }

    // Borrar los cursos finalizados (matrículas y temas por curso caen en
    // cascada), desasociar los temas (no se borran) y eliminar la asignatura.
    // Las cuentas de los estudiantes se conservan.
    const finalized = await prisma.course.findMany({
      where: { subjectId: id },
      select: { id: true },
    });
    await prisma.$transaction([
      prisma.course.deleteMany({ where: { subjectId: id } }),
      prisma.topic.updateMany({
        where: { subjectId: id },
        data: { subjectId: null },
      }),
      prisma.subject.delete({ where: { id } }),
    ]);

    return NextResponse.json({
      message: `Asignatura eliminada junto con ${finalized.length} cursos finalizados. Sus temas quedaron sin asignatura.`,
    });
  } catch (error) {
    console.error("Error eliminando asignatura:", error);
    return NextResponse.json(
      { error: "Error eliminando asignatura" },
      { status: 500 },
    );
  }
}
