import { Prisma } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import { courseInclude, parseGroup, serializeCourse } from "@/lib/courses";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

// GET - Lista cursos. Filtros opcionales: subjectId, periodId, status
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if ("error" in auth) return auth.error;

    const sp = req.nextUrl.searchParams;
    const status = sp.get("status");
    const where: Prisma.CourseWhereInput = {
      subjectId: sp.get("subjectId") || undefined,
      periodId: sp.get("periodId") || undefined,
      status:
        status === "ACTIVE" || status === "FINALIZED" ? status : undefined,
    };

    const courses = await prisma.course.findMany({
      where,
      include: courseInclude,
      orderBy: [
        { period: { startDate: "desc" } },
        { subject: { name: "asc" } },
        { group: "asc" },
      ],
    });

    return NextResponse.json({ courses: courses.map(serializeCourse) });
  } catch (error) {
    console.error("Error listando cursos:", error);
    return NextResponse.json(
      { error: "Error listando cursos" },
      { status: 500 },
    );
  }
}

// POST - Crea un curso: asignatura + periodo + grupo (RF-CUR-01, RF-CUR-06).
// Las fechas no se guardan en el curso: se heredan del periodo.
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if ("error" in auth) return auth.error;

    const body = await req.json();
    const subjectId = typeof body.subjectId === "string" ? body.subjectId : "";
    const periodId = typeof body.periodId === "string" ? body.periodId : "";
    const group = parseGroup(body.group);
    if (!subjectId || !periodId || !group) {
      return NextResponse.json(
        { error: "Asignatura, periodo y grupo son obligatorios" },
        { status: 400 },
      );
    }

    const [subject, period] = await Promise.all([
      prisma.subject.findUnique({ where: { id: subjectId } }),
      prisma.academicPeriod.findUnique({ where: { id: periodId } }),
    ]);
    if (!subject || !period) {
      return NextResponse.json(
        { error: "La asignatura o el periodo no existen" },
        { status: 400 },
      );
    }

    try {
      const course = await prisma.course.create({
        data: { subjectId, periodId, group },
        include: courseInclude,
      });
      return NextResponse.json({
        message: "Curso creado",
        course: serializeCourse(course),
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return NextResponse.json(
          {
            error: `Ya existe el grupo ${group} de ${subject.code} en el periodo ${period.name}`,
          },
          { status: 409 },
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("Error creando curso:", error);
    return NextResponse.json({ error: "Error creando curso" }, { status: 500 });
  }
}
