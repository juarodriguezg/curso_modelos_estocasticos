import { type NextRequest, NextResponse } from "next/server";
import { courseLabel } from "@/lib/courses";
import { formatDateOnly, isOutsideRange } from "@/lib/dates";
import { parsePeriodInput, serializePeriod } from "@/lib/periods";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

// GET - Detalle del periodo con sus cursos
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const auth = await requireAdmin(req);
    if ("error" in auth) return auth.error;

    const { id } = await params;
    const period = await prisma.academicPeriod.findUnique({
      where: { id },
      include: {
        courses: {
          orderBy: [{ subject: { name: "asc" } }, { group: "asc" }],
          include: { subject: { select: { code: true, name: true } } },
        },
      },
    });
    if (!period) {
      return NextResponse.json(
        { error: "Periodo no encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      period: {
        ...serializePeriod(period),
        courses: period.courses.map((c) => ({
          id: c.id,
          group: c.group,
          status: c.status,
          subject: c.subject,
        })),
      },
    });
  } catch (error) {
    console.error("Error obteniendo periodo:", error);
    return NextResponse.json(
      { error: "Error obteniendo periodo" },
      { status: 500 },
    );
  }
}

// PUT - Edita el periodo. Si alguna fecha de publicación de los cursos queda
// fuera del nuevo rango se advierte sin bloquear (RF-CUR-07).
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const auth = await requireAdmin(req);
    if ("error" in auth) return auth.error;

    const { id } = await params;
    const existing = await prisma.academicPeriod.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Periodo no encontrado" },
        { status: 404 },
      );
    }

    const parsed = parsePeriodInput(await req.json());
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const nameOwner = await prisma.academicPeriod.findUnique({
      where: { name: parsed.data.name },
    });
    if (nameOwner && nameOwner.id !== id) {
      return NextResponse.json(
        { error: `Ya existe otro periodo llamado "${parsed.data.name}"` },
        { status: 409 },
      );
    }

    const period = await prisma.academicPeriod.update({
      where: { id },
      data: parsed.data,
    });

    const dated = await prisma.courseTopic.findMany({
      where: { course: { periodId: id }, publishDate: { not: null } },
      include: {
        topic: { select: { title: true } },
        course: {
          select: {
            group: true,
            subject: { select: { code: true } },
            period: { select: { name: true } },
          },
        },
      },
    });
    const warnings = dated
      .filter(
        (ct) =>
          ct.publishDate &&
          isOutsideRange(ct.publishDate, period.startDate, period.endDate),
      )
      .map(
        (ct) =>
          `${courseLabel(ct.course)}: la publicación de "${ct.topic.title}" (${formatDateOnly(
            ct.publishDate as Date,
          )}) queda fuera del periodo`,
      );

    return NextResponse.json({
      message: "Periodo actualizado",
      period: serializePeriod(period),
      warnings,
    });
  } catch (error) {
    console.error("Error actualizando periodo:", error);
    return NextResponse.json(
      { error: "Error actualizando periodo" },
      { status: 500 },
    );
  }
}

// DELETE - Elimina el periodo solo si no tiene cursos
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const auth = await requireAdmin(req);
    if ("error" in auth) return auth.error;

    const { id } = await params;
    const period = await prisma.academicPeriod.findUnique({
      where: { id },
      include: { _count: { select: { courses: true } } },
    });
    if (!period) {
      return NextResponse.json(
        { error: "Periodo no encontrado" },
        { status: 404 },
      );
    }
    if (period._count.courses > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar un periodo que tiene cursos" },
        { status: 409 },
      );
    }

    await prisma.academicPeriod.delete({ where: { id } });
    return NextResponse.json({ message: "Periodo eliminado" });
  } catch (error) {
    console.error("Error eliminando periodo:", error);
    return NextResponse.json(
      { error: "Error eliminando periodo" },
      { status: 500 },
    );
  }
}
