import { type NextRequest, NextResponse } from "next/server";
import { assertCourseWritable } from "@/lib/courses";
import { formatDateOnly, isOutsideRange, parseDateOnly } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

// GET - Temario de la asignatura del curso con su estado en este curso.
// Sin fila en CourseTopic el tema es visible y no tiene fecha (RF-ASG-05).
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

    const topics = await prisma.topic.findMany({
      where: { subjectId: course.subjectId },
      orderBy: { order: "asc" },
      select: {
        id: true,
        slug: true,
        title: true,
        parte: true,
        parentSlug: true,
        courseTopics: { where: { courseId: id } },
      },
    });

    return NextResponse.json({
      topics: topics.map(({ courseTopics, ...t }) => ({
        ...t,
        visible: courseTopics[0]?.visible ?? true,
        publishDate: courseTopics[0]?.publishDate
          ? formatDateOnly(courseTopics[0].publishDate)
          : null,
      })),
    });
  } catch (error) {
    console.error("Error listando temas del curso:", error);
    return NextResponse.json(
      { error: "Error listando temas del curso" },
      { status: 500 },
    );
  }
}

// PUT - Actualiza visibilidad y fecha de publicación de uno o varios temas:
// { items: [{ topicId, visible, publishDate: "AAAA-MM-DD" | null }] }.
// La fecha es informativa (RF-CUR-03); si queda fuera del periodo se advierte
// sin bloquear el guardado (RF-CUR-07).
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const auth = await requireAdmin(req);
    if ("error" in auth) return auth.error;

    const { id } = await params;
    const course = await prisma.course.findUnique({
      where: { id },
      include: { period: true },
    });
    if (!course) {
      return NextResponse.json(
        { error: "Curso no encontrado" },
        { status: 404 },
      );
    }
    const readOnly = assertCourseWritable(course);
    if (readOnly) return readOnly;

    const body = await req.json();
    const items: unknown[] = Array.isArray(body.items) ? body.items : [];
    if (items.length === 0) {
      return NextResponse.json({ error: "No hay cambios" }, { status: 400 });
    }

    const updates: {
      topicId: string;
      visible: boolean;
      publishDate: Date | null;
    }[] = [];
    for (const raw of items) {
      const item = (raw ?? {}) as Record<string, unknown>;
      const topicId = typeof item.topicId === "string" ? item.topicId : "";
      const publishDate =
        item.publishDate === null || item.publishDate === ""
          ? null
          : parseDateOnly(item.publishDate);
      if (!topicId || typeof item.visible !== "boolean") {
        return NextResponse.json(
          { error: "Cada tema requiere topicId y visible" },
          { status: 400 },
        );
      }
      if (item.publishDate && !publishDate) {
        return NextResponse.json(
          { error: `Fecha inválida: ${String(item.publishDate)}` },
          { status: 400 },
        );
      }
      updates.push({ topicId, visible: item.visible, publishDate });
    }

    const topics = await prisma.topic.findMany({
      where: {
        id: { in: updates.map((u) => u.topicId) },
        subjectId: course.subjectId,
      },
      select: { id: true, title: true },
    });
    if (topics.length !== new Set(updates.map((u) => u.topicId)).size) {
      return NextResponse.json(
        { error: "Algún tema no pertenece a la asignatura del curso" },
        { status: 400 },
      );
    }

    await prisma.$transaction(
      updates.map((u) =>
        prisma.courseTopic.upsert({
          where: { courseId_topicId: { courseId: id, topicId: u.topicId } },
          create: { courseId: id, ...u },
          update: { visible: u.visible, publishDate: u.publishDate },
        }),
      ),
    );

    const titles = new Map(topics.map((t) => [t.id, t.title]));
    const warnings = updates
      .filter(
        (u) =>
          u.publishDate &&
          isOutsideRange(
            u.publishDate,
            course.period.startDate,
            course.period.endDate,
          ),
      )
      .map(
        (u) =>
          `La publicación de "${titles.get(u.topicId)}" (${formatDateOnly(
            u.publishDate as Date,
          )}) queda fuera del periodo ${course.period.name}`,
      );

    return NextResponse.json({
      message: "Temario del curso actualizado",
      warnings,
    });
  } catch (error) {
    console.error("Error actualizando temas del curso:", error);
    return NextResponse.json(
      { error: "Error actualizando temas del curso" },
      { status: 500 },
    );
  }
}
