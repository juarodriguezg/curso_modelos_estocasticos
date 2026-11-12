"use client";

import Link from "next/link";
import { StatusBadge } from "../../AdminShell";

export interface SubjectCourse {
  id: string;
  label: string;
  group: string;
  status: "ACTIVE" | "FINALIZED";
  periodName: string;
  startDate: string;
  endDate: string;
  activeStudents: number;
}

// Cursos de la asignatura (RF-CUR-01). La creación se hace en /cursos.
export default function SubjectCoursesPanel({
  courses,
}: {
  courses: SubjectCourse[];
}) {
  return (
    <section aria-labelledby="subject-courses-heading">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2
          id="subject-courses-heading"
          className="text-lg font-semibold"
          style={{ color: "var(--color-text-dark)" }}
        >
          Cursos
        </h2>
        <Link href="/admin/dashboard/cursos" className="btn btn-ghost text-sm">
          Gestionar cursos
        </Link>
      </div>
      {courses.length === 0 ? (
        <p
          className="rounded-lg border border-dashed p-6 text-sm"
          style={{
            borderColor: "var(--color-border)",
            color: "var(--color-text-muted)",
          }}
        >
          Esta asignatura aún no tiene cursos.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {courses.map((c) => (
            <li key={c.id}>
              <Link
                href={`/admin/dashboard/cursos/${c.id}`}
                className="card card-interactive p-4 flex items-center justify-between gap-3"
              >
                <span>
                  <span
                    className="block font-medium"
                    style={{ color: "var(--color-text-dark)" }}
                  >
                    {c.periodName} · Grupo {c.group}
                  </span>
                  <span
                    className="block text-xs"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {c.startDate} a {c.endDate} · {c.activeStudents} estudiantes
                  </span>
                </span>
                <StatusBadge status={c.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
