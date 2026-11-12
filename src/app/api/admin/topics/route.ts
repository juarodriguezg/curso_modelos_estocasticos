import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { assertCourseWritable, courseLabel } from '@/lib/courses';
import { requireAdmin } from '@/lib/session';

// GET - Listar todos los temas con su visibilidad por curso.
// Devuelve también los cursos activos y, por tema, los cursos que lo ocultan.
// Con ?unassigned=true, devuelve solo los temas sin asignatura (subjectId null),
// para el selector de "asociar temas existentes" del módulo de asignaturas.
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if ('error' in auth) return auth.error;

    const unassigned = req.nextUrl.searchParams.get('unassigned') === 'true';

    const [topics, courses] = await Promise.all([
      prisma.topic.findMany({
        where: unassigned ? { subjectId: null } : undefined,
        orderBy: { order: 'asc' },
        include: { courseTopics: { where: { visible: false }, select: { courseId: true } } }
      }),
      prisma.course.findMany({
        where: { status: 'ACTIVE' },
        include: { subject: { select: { code: true } }, period: { select: { name: true } } },
        orderBy: [{ period: { startDate: 'desc' } }, { group: 'asc' }]
      })
    ]);

    return NextResponse.json({
      topics: topics.map(({ courseTopics, ...t }) => ({
        ...t,
        hiddenInCourses: courseTopics.map(ct => ct.courseId)
      })),
      courses: courses.map(c => ({
        id: c.id,
        subjectId: c.subjectId,
        group: c.group,
        label: courseLabel(c)
      }))
    });
  } catch (error) {
    console.error('Error listando temas:', error);
    return NextResponse.json({ error: 'Error listando temas' }, { status: 500 });
  }
}

// POST - Actualizar visibilidad de un tema.
// { topicId, courseId, visible }: visibilidad en un curso (CourseTopic).
// { topicId, group, visible }: regla anterior por grupo, solo para temas que
// aún no tienen asignatura (y por lo tanto ningún curso).
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if ('error' in auth) return auth.error;

    const { topicId, courseId, group, visible } = await req.json();

    if (!topicId || typeof visible !== 'boolean' || (!courseId && !group)) {
      return NextResponse.json({ error: 'ID de tema, curso y visibilidad requeridos' }, { status: 400 });
    }

    const topic = await prisma.topic.findUnique({ where: { id: topicId } });
    if (!topic) {
      return NextResponse.json({ error: 'Tema no encontrado' }, { status: 404 });
    }

    if (courseId) {
      const course = await prisma.course.findUnique({ where: { id: courseId } });
      if (!course || course.subjectId !== topic.subjectId) {
        return NextResponse.json({ error: 'El tema no pertenece a la asignatura del curso' }, { status: 400 });
      }
      const readOnly = assertCourseWritable(course);
      if (readOnly) return readOnly;

      await prisma.courseTopic.upsert({
        where: { courseId_topicId: { courseId, topicId } },
        create: { courseId, topicId, visible },
        update: { visible }
      });
      return NextResponse.json({ message: `Visibilidad actualizada para el grupo ${course.group}` });
    }

    if (group !== 1 && group !== 2) {
      return NextResponse.json({ error: 'Grupo debe ser 1 o 2' }, { status: 400 });
    }

    // Actualizar visibilidad para el grupo específico
    const updateData = group === 1
      ? { visibleGroup1: visible }
      : { visibleGroup2: visible };

    const updated = await prisma.topic.update({
      where: { id: topicId },
      data: updateData
    });

    return NextResponse.json({
      topic: updated,
      message: `Visibilidad actualizada para Grupo ${group}`
    });
  } catch (error) {
    console.error('Error actualizando tema:', error);
    return NextResponse.json({ error: 'Error actualizando tema' }, { status: 500 });
  }
}
