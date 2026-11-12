import { type NextRequest, NextResponse } from "next/server";
import { courseInclude, serializeCourse } from "@/lib/courses";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

// POST - Finaliza manualmente un curso antes del fin del periodo (RF-CUR-05).
// El curso queda en solo lectura (RF-CUR-08).
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
    if (existing.status === "FINALIZED") {
      return NextResponse.json(
        { error: "El curso ya está finalizado" },
        { status: 409 },
      );
    }

    const course = await prisma.course.update({
      where: { id },
      data: { status: "FINALIZED", finalizedAt: new Date() },
      include: courseInclude,
    });
    return NextResponse.json({
      message: "Curso finalizado",
      course: serializeCourse(course),
    });
  } catch (error) {
    console.error("Error finalizando curso:", error);
    return NextResponse.json(
      { error: "Error finalizando curso" },
      { status: 500 },
    );
  }
}
