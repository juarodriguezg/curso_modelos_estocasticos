import { Prisma } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import { assertCourseWritable, syncLegacyGrupo } from "@/lib/courses";
import { fullName, parseStudentInput } from "@/lib/enroll";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

type Params = { params: Promise<{ id: string; enrollmentId: string }> };

// PUT - Edita los datos del estudiante y su matrícula. Campos opcionales:
// firstName/lastName/email/documentId (se envían juntos), isMonitor, active.
// No hay DELETE: la matrícula se desactiva y se conserva el historial (RF-CUR-04).
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const auth = await requireAdmin(req);
    if ("error" in auth) return auth.error;

    const { id, enrollmentId } = await params;
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: { id: enrollmentId },
      include: { course: true },
    });
    if (!enrollment || enrollment.courseId !== id) {
      return NextResponse.json(
        { error: "Matrícula no encontrada" },
        { status: 404 },
      );
    }
    const readOnly = assertCourseWritable(enrollment.course);
    if (readOnly) return readOnly;

    const body = await req.json();
    const editsProfile = ["firstName", "lastName", "email", "documentId"].some(
      (k) => k in body,
    );

    let profile: Prisma.UserUpdateInput | undefined;
    if (editsProfile) {
      const parsed = parseStudentInput(body);
      if (!parsed.ok) {
        return NextResponse.json(
          { error: parsed.error },
          { status: parsed.status },
        );
      }
      profile = {
        ...parsed.data,
        name: fullName(parsed.data.firstName, parsed.data.lastName),
      };
    }

    const enrollmentData: Prisma.CourseEnrollmentUpdateInput = {};
    if (typeof body.isMonitor === "boolean") {
      enrollmentData.isMonitor = body.isMonitor;
    }
    if (typeof body.active === "boolean" && body.active !== enrollment.active) {
      enrollmentData.active = body.active;
      enrollmentData.deactivatedAt = body.active ? null : new Date();
    }

    try {
      await prisma.$transaction(async (tx) => {
        if (profile) {
          await tx.user.update({
            where: { id: enrollment.userId },
            data: profile,
          });
        }
        await tx.courseEnrollment.update({
          where: { id: enrollmentId },
          data: enrollmentData,
        });
        await syncLegacyGrupo(tx, enrollment.userId);
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return NextResponse.json(
          { error: "El correo o el documento ya pertenecen a otra cuenta" },
          { status: 409 },
        );
      }
      throw error;
    }

    return NextResponse.json({ message: "Estudiante actualizado" });
  } catch (error) {
    console.error("Error actualizando estudiante:", error);
    return NextResponse.json(
      { error: "Error actualizando estudiante" },
      { status: 500 },
    );
  }
}
