import { type NextRequest, NextResponse } from "next/server";
import { assertCourseWritable } from "@/lib/courses";
import { enrollStudent, parseStudentInput } from "@/lib/enroll";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

// GET - Estudiantes matriculados en el curso (activos e inactivos)
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const auth = await requireAdmin(req);
    if ("error" in auth) return auth.error;

    const { id } = await params;
    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) {
      return NextResponse.json(
        { error: "Curso no encontrado" },
        { status: 404 },
      );
    }

    const enrollments = await prisma.courseEnrollment.findMany({
      where: { courseId: id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            firstName: true,
            lastName: true,
            documentId: true,
          },
        },
      },
      orderBy: [{ active: "desc" }, { user: { name: "asc" } }],
    });

    return NextResponse.json({
      students: enrollments.map((e) => ({
        enrollmentId: e.id,
        active: e.active,
        isMonitor: e.isMonitor,
        enrolledAt: e.enrolledAt,
        deactivatedAt: e.deactivatedAt,
        user: e.user,
      })),
    });
  } catch (error) {
    console.error("Error listando estudiantes:", error);
    return NextResponse.json(
      { error: "Error listando estudiantes" },
      { status: 500 },
    );
  }
}

// POST - Registra y matricula un estudiante (RF-CUR-02)
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const auth = await requireAdmin(req);
    if ("error" in auth) return auth.error;

    const { id } = await params;
    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) {
      return NextResponse.json(
        { error: "Curso no encontrado" },
        { status: 404 },
      );
    }
    const readOnly = assertCourseWritable(course);
    if (readOnly) return readOnly;

    const parsed = parseStudentInput(await req.json());
    if (!parsed.ok) {
      return NextResponse.json(
        { error: parsed.error },
        { status: parsed.status },
      );
    }

    const result = await enrollStudent(id, parsed.data);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status },
      );
    }

    const message = result.reactivated
      ? "Matrícula reactivada"
      : result.userCreated
        ? "Estudiante creado y matriculado"
        : "Cuenta existente matriculada en el curso";
    return NextResponse.json({ message, ...result });
  } catch (error) {
    console.error("Error matriculando estudiante:", error);
    return NextResponse.json(
      { error: "Error matriculando estudiante" },
      { status: 500 },
    );
  }
}
