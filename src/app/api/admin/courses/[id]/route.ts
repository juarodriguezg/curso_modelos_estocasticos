import { Prisma } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import {
  assertCourseWritable,
  countCourseRecords,
  courseInclude,
  parseGroup,
  serializeCourse,
} from "@/lib/courses";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

const notFound = () =>
  NextResponse.json({ error: "Curso no encontrado" }, { status: 404 });

// GET - Detalle del curso
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const auth = await requireAdmin(req);
    if ("error" in auth) return auth.error;

    const { id } = await params;
    const course = await prisma.course.findUnique({
      where: { id },
      include: courseInclude,
    });
    if (!course) return notFound();

    return NextResponse.json({ course: serializeCourse(course) });
  } catch (error) {
    console.error("Error obteniendo curso:", error);
    return NextResponse.json(
      { error: "Error obteniendo curso" },
      { status: 500 },
    );
  }
}

// PUT - Edita grupo y periodo de un curso activo (RF-CUR-11)
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const auth = await requireAdmin(req);
    if ("error" in auth) return auth.error;

    const { id } = await params;
    const existing = await prisma.course.findUnique({ where: { id } });
    if (!existing) return notFound();
    const readOnly = assertCourseWritable(existing);
    if (readOnly) return readOnly;

    const body = await req.json();
    const group = parseGroup(body.group);
    const periodId = typeof body.periodId === "string" ? body.periodId : "";
    if (!group || !periodId) {
      return NextResponse.json(
        { error: "Grupo y periodo son obligatorios" },
        { status: 400 },
      );
    }
    const period = await prisma.academicPeriod.findUnique({
      where: { id: periodId },
    });
    if (!period) {
      return NextResponse.json(
        { error: "El periodo no existe" },
        { status: 400 },
      );
    }

    try {
      const course = await prisma.course.update({
        where: { id },
        data: { group, periodId },
        include: courseInclude,
      });
      return NextResponse.json({
        message: "Curso actualizado",
        course: serializeCourse(course),
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return NextResponse.json(
          {
            error: `Ya existe el grupo ${group} de esta asignatura en ${period.name}`,
          },
          { status: 409 },
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("Error actualizando curso:", error);
    return NextResponse.json(
      { error: "Error actualizando curso" },
      { status: 500 },
    );
  }
}

// DELETE - Elimina el curso solo si no tiene estudiantes ni registros
// académicos (RF-CUR-11). Las filas de CourseTopic se borran en cascada.
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const auth = await requireAdmin(req);
    if ("error" in auth) return auth.error;

    const { id } = await params;
    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) return notFound();

    if ((await countCourseRecords(id)) > 0) {
      return NextResponse.json(
        {
          error:
            "No se puede eliminar un curso con estudiantes o registros académicos",
        },
        { status: 409 },
      );
    }

    await prisma.course.delete({ where: { id } });
    return NextResponse.json({ message: "Curso eliminado" });
  } catch (error) {
    console.error("Error eliminando curso:", error);
    return NextResponse.json(
      { error: "Error eliminando curso" },
      { status: 500 },
    );
  }
}
