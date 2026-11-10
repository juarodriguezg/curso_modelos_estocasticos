import { type NextRequest, NextResponse } from "next/server";
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
      },
    });

    if (!subject) {
      return NextResponse.json(
        { error: "Asignatura no encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json({ subject });
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
    // El modelo Course aún no existe (módulo 4.3 fuera de alcance), por lo que
    // la condición se cumple trivialmente. Gancho para cuando exista:
    //   const activeCourses = await prisma.course.count({ where: { subjectId: id, status: 'ACTIVE' } });
    //   if (activeCourses > 0) return NextResponse.json({ error: 'La asignatura tiene cursos activos' }, { status: 409 });

    // Desasociar los temas (no se borran) y luego eliminar la asignatura.
    // Nota: la relación ya tiene onDelete: SetNull, pero lo hacemos explícito
    // dentro de una transacción para dejar claro el comportamiento.
    await prisma.$transaction([
      prisma.topic.updateMany({
        where: { subjectId: id },
        data: { subjectId: null },
      }),
      prisma.subject.delete({ where: { id } }),
    ]);

    return NextResponse.json({
      message: "Asignatura eliminada. Sus temas quedaron sin asignatura.",
    });
  } catch (error) {
    console.error("Error eliminando asignatura:", error);
    return NextResponse.json(
      { error: "Error eliminando asignatura" },
      { status: 500 },
    );
  }
}
