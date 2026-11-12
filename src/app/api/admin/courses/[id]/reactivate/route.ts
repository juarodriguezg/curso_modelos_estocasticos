import { type NextRequest, NextResponse } from "next/server";
import { courseInclude, serializeCourse } from "@/lib/courses";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

// POST - Reactiva de forma explícita un curso finalizado (RF-CUR-08).
// reactivatedAt evita que el cron lo vuelva a finalizar por la fecha del periodo.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin(req);
    if ("error" in auth) return auth.error;

    const { id } = await params;
    const existing = await prisma.course.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Curso no encontrado" },
        { status: 404 },
      );
    }
    if (existing.status === "ACTIVE") {
      return NextResponse.json(
        { error: "El curso ya está activo" },
        { status: 409 },
      );
    }
    if (existing.purgedAt) {
      return NextResponse.json(
        { error: "No se puede reactivar un curso purgado" },
        { status: 409 },
      );
    }

    const course = await prisma.course.update({
      where: { id },
      data: { status: "ACTIVE", finalizedAt: null, reactivatedAt: new Date() },
      include: courseInclude,
    });
    return NextResponse.json({
      message: "Curso reactivado",
      course: serializeCourse(course),
    });
  } catch (error) {
    console.error("Error reactivando curso:", error);
    return NextResponse.json(
      { error: "Error reactivando curso" },
      { status: 500 },
    );
  }
}
