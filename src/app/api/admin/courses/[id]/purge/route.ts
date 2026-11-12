import { type NextRequest, NextResponse } from "next/server";
import { courseLabel, syncLegacyGrupo } from "@/lib/courses";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

// POST - Purga los datos de un curso finalizado ya exportado (RF-CUR-09).
// Requiere { confirmation } igual a la etiqueta del curso. Borra matrículas y
// configuración del temario; conserva la fila del curso (con purgedAt) y las
// cuentas de usuario. Los módulos futuros deben añadir aquí sus borrados.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin(req);
    if ("error" in auth) return auth.error;

    const { id } = await params;
    const course = await prisma.course.findUnique({
      where: { id },
      include: { subject: true, period: true },
    });
    if (!course) {
      return NextResponse.json(
        { error: "Curso no encontrado" },
        { status: 404 },
      );
    }
    if (course.status !== "FINALIZED") {
      return NextResponse.json(
        { error: "Solo se pueden purgar cursos finalizados" },
        { status: 409 },
      );
    }
    if (course.purgedAt) {
      return NextResponse.json(
        { error: "El curso ya fue purgado" },
        { status: 409 },
      );
    }
    if (!course.exportedAt) {
      return NextResponse.json(
        { error: "Exporta el curso a Excel antes de purgarlo" },
        { status: 409 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const label = courseLabel(course);
    if (body.confirmation !== label) {
      return NextResponse.json(
        { error: `Para confirmar escribe exactamente: ${label}` },
        { status: 400 },
      );
    }

    await prisma.$transaction(
      async (tx) => {
        const enrolled = await tx.courseEnrollment.findMany({
          where: { courseId: id },
          select: { userId: true },
        });
        await tx.courseEnrollment.deleteMany({ where: { courseId: id } });
        await tx.courseTopic.deleteMany({ where: { courseId: id } });
        await tx.course.update({
          where: { id },
          data: { purgedAt: new Date() },
        });
        for (const { userId } of enrolled) await syncLegacyGrupo(tx, userId);
      },
      { timeout: 30_000 },
    );

    return NextResponse.json({ message: "Datos del curso purgados" });
  } catch (error) {
    console.error("Error purgando curso:", error);
    return NextResponse.json(
      { error: "Error purgando curso" },
      { status: 500 },
    );
  }
}
