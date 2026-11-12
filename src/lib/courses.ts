import type { Prisma, User } from "@prisma/client";
import { NextResponse } from "next/server";
import { serializePeriod } from "@/lib/periods";
import { prisma } from "@/lib/prisma";

type Db = typeof prisma | Prisma.TransactionClient;

// Etiqueta legible del curso. También es el texto que se pide escribir para
// confirmar la purga (RF-CUR-09).
export function courseLabel(course: {
  group: string;
  subject: { code: string };
  period: { name: string };
}): string {
  return `${course.subject.code} · ${course.period.name} · Grupo ${course.group}`;
}

// RF-CUR-08: un curso finalizado es de solo lectura. Todo endpoint que
// modifique datos de un curso debe llamar a esta función antes de escribir.
export function assertCourseWritable(course: {
  status: string;
}): NextResponse | null {
  if (course.status === "FINALIZED") {
    return NextResponse.json(
      { error: "Curso finalizado: solo lectura" },
      { status: 409 },
    );
  }
  return null;
}

// Include estándar para responder un curso con su asignatura y periodo.
export const courseInclude = {
  subject: { select: { id: true, code: true, name: true } },
  period: true,
  _count: { select: { enrollments: { where: { active: true } } } },
} satisfies Prisma.CourseInclude;

type CourseWithRefs = Prisma.CourseGetPayload<{
  include: typeof courseInclude;
}>;

export function serializeCourse(c: CourseWithRefs) {
  return {
    id: c.id,
    label: courseLabel(c),
    group: c.group,
    status: c.status,
    finalizedAt: c.finalizedAt,
    reactivatedAt: c.reactivatedAt,
    exportedAt: c.exportedAt,
    purgedAt: c.purgedAt,
    subject: c.subject,
    period: serializePeriod(c.period),
    activeStudents: c._count.enrollments,
  };
}

// Grupo o sección: texto corto no vacío ("1", "2", "A"...).
export function parseGroup(value: unknown): string | null {
  const group =
    typeof value === "number"
      ? String(value)
      : typeof value === "string"
        ? value.trim()
        : "";
  return group && group.length <= 20 ? group : null;
}

export function isAdminRole(role: string): boolean {
  return role === "admin" || role === "teacher";
}

// Registros académicos de un curso, para RF-CUR-11 (no se puede eliminar un
// curso con estudiantes o registros). Los módulos futuros (bonos, tareas,
// asistencia...) deben sumar aquí sus conteos.
export async function countCourseRecords(courseId: string): Promise<number> {
  return prisma.courseEnrollment.count({ where: { courseId } });
}

// Mantiene User.grupo (obsoleto) alineado con la matrícula activa, para que el
// código anterior siga funcionando si hay que revertir el despliegue.
export async function syncLegacyGrupo(db: Db, userId: string): Promise<void> {
  const enrollment = await db.courseEnrollment.findFirst({
    where: { userId, active: true, course: { status: "ACTIVE" } },
    orderBy: { enrolledAt: "desc" },
    select: { course: { select: { group: true } } },
  });
  const parsed = enrollment ? Number(enrollment.course.group) : 0;
  const grupo = Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
  await db.user.update({ where: { id: userId }, data: { grupo } });
}

interface TopicVisibilityInput {
  id: string;
  subjectId: string | null;
  visibleGroup1: boolean;
  visibleGroup2: boolean;
}

// Visibilidad de temas para un usuario (RF-ASG-05, RF-CUR-03).
// - Admin/teacher: ven todo.
// - Estudiante con matrículas activas: un tema es visible si alguno de sus
//   cursos es de la asignatura del tema y no lo ocultó (CourseTopic.visible).
//   La fecha de publicación es informativa y no se tiene en cuenta.
// - Temas sin asignatura, o estudiantes sin matrícula: regla anterior por
//   User.grupo (transitorio hasta retirar grupo y visibleGroup1/2).
export async function filterVisibleTopics<T extends TopicVisibilityInput>(
  user: Pick<User, "id" | "role" | "grupo">,
  topics: T[],
): Promise<T[]> {
  if (isAdminRole(user.role)) return topics;

  const legacyVisible = (t: T) => {
    if (user.grupo === 1) return t.visibleGroup1;
    if (user.grupo === 2) return t.visibleGroup2;
    return true;
  };

  const enrollments = await prisma.courseEnrollment.findMany({
    where: { userId: user.id, active: true, course: { purgedAt: null } },
    select: { course: { select: { id: true, subjectId: true } } },
  });
  if (enrollments.length === 0) return topics.filter(legacyVisible);

  const courses = enrollments.map((e) => e.course);
  const hidden = await prisma.courseTopic.findMany({
    where: { courseId: { in: courses.map((c) => c.id) }, visible: false },
    select: { courseId: true, topicId: true },
  });
  const hiddenKeys = new Set(hidden.map((h) => `${h.courseId}:${h.topicId}`));

  return topics.filter((t) => {
    if (!t.subjectId) return legacyVisible(t);
    return courses.some(
      (c) => c.subjectId === t.subjectId && !hiddenKeys.has(`${c.id}:${t.id}`),
    );
  });
}

// Cursos del usuario para /api/auth/me y /perfil.
export async function getUserEnrollments(userId: string) {
  const enrollments = await prisma.courseEnrollment.findMany({
    where: { userId, active: true },
    orderBy: { enrolledAt: "desc" },
    select: {
      isMonitor: true,
      course: {
        select: {
          id: true,
          group: true,
          status: true,
          subject: { select: { code: true, name: true } },
          period: { select: { name: true } },
        },
      },
    },
  });
  return enrollments.map((e) => ({
    courseId: e.course.id,
    group: e.course.group,
    status: e.course.status,
    isMonitor: e.isMonitor,
    subject: e.course.subject,
    period: e.course.period,
  }));
}
