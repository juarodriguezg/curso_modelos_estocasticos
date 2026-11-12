"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
import { AdminShell, StatusBadge } from "../../AdminShell";
import { adminFetch, type Course, type Period } from "../../adminApi";
import CourseStudents from "./CourseStudents";
import CourseTopics from "./CourseTopics";

// Detalle de un curso: datos, estado (RF-CUR-05, 08, 09, 11), estudiantes
// (RF-CUR-02, 04) y temario heredado de la asignatura (RF-CUR-03).
export default function CourseDetailClient({ courseId }: { courseId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [course, setCourse] = useState<Course | null>(null);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ group: "", periodId: "" });
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { ok, data } = await adminFetch<{ course: Course }>(
      `/api/admin/courses/${courseId}`,
    );
    if (ok) setCourse(data.course);
    else toast(data.error || "Error al cargar el curso", "error");
  }, [courseId, toast]);

  useEffect(() => {
    load();
    adminFetch<{ periods: Period[] }>("/api/admin/periods").then(
      ({ ok, data }) => ok && setPeriods(data.periods),
    );
  }, [load]);

  if (!course) {
    return (
      <AdminShell title="Curso" backHref="/admin/dashboard/cursos">
        <p style={{ color: "var(--color-text-medium)" }}>Cargando curso...</p>
      </AdminShell>
    );
  }

  const readOnly = course.status === "FINALIZED";

  const action = async (
    path: string,
    method: string,
    success: string,
    body?: unknown,
  ) => {
    setBusy(true);
    const { ok, data } = await adminFetch(
      `/api/admin/courses/${courseId}${path}`,
      { method, body: body ? JSON.stringify(body) : undefined },
    );
    setBusy(false);
    if (!ok) {
      toast(data.error || "No se pudo completar la acción", "error");
      return false;
    }
    toast(success, "success");
    return true;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await action("", "PUT", "Curso actualizado", form)) {
      setEditing(false);
      load();
    }
  };

  const handleFinalize = async () => {
    if (
      !window.confirm(
        "¿Finalizar el curso? Quedará en solo lectura hasta que lo reactives.",
      )
    )
      return;
    if (await action("/finalize", "POST", "Curso finalizado")) load();
  };

  const handleReactivate = async () => {
    if (
      !window.confirm(
        "¿Reactivar el curso? Volverá a permitir cambios y el sistema no lo finalizará automáticamente.",
      )
    )
      return;
    if (await action("/reactivate", "POST", "Curso reactivado")) load();
  };

  const handleDelete = async () => {
    if (!window.confirm(`¿Eliminar el curso ${course.label}?`)) return;
    if (await action("", "DELETE", "Curso eliminado")) {
      router.push("/admin/dashboard/cursos");
    }
  };

  const handleExport = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/export`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
        },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast(data.error || "Error al exportar", "error");
        return;
      }
      const blob = await res.blob();
      const name =
        res.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] ??
        "curso.xlsx";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
      toast("Curso exportado", "success");
      load();
    } finally {
      setBusy(false);
    }
  };

  const handlePurge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      await action("/purge", "POST", "Datos del curso purgados", {
        confirmation,
      })
    ) {
      setConfirmation("");
      load();
    }
  };

  return (
    <AdminShell
      title={`${course.subject.name} · Grupo ${course.group}`}
      backHref="/admin/dashboard/cursos"
    >
      <section className="card p-5 mb-6" aria-labelledby="course-data">
        <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
          <div>
            <h2
              id="course-data"
              className="text-lg font-semibold flex items-center gap-2"
              style={{ color: "var(--color-text-dark)" }}
            >
              {course.label} <StatusBadge status={course.status} />
            </h2>
            <p
              className="text-sm"
              style={{ color: "var(--color-text-medium)" }}
            >
              {course.period.startDate} a {course.period.endDate} (heredadas del
              periodo) · {course.activeStudents} estudiantes activos
            </p>
            {readOnly && (
              <p
                className="text-sm mt-1"
                style={{ color: "var(--color-warning)" }}
              >
                Curso finalizado: solo lectura.
                {course.purgedAt ? " Sus datos fueron purgados." : ""}
              </p>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            {!readOnly && (
              <>
                <button
                  type="button"
                  className="btn btn-ghost text-sm"
                  onClick={() => {
                    setForm({
                      group: course.group,
                      periodId: course.period.id,
                    });
                    setEditing(true);
                  }}
                >
                  Editar
                </button>
                <button
                  type="button"
                  className="btn btn-primary text-sm"
                  disabled={busy}
                  onClick={handleFinalize}
                >
                  Finalizar curso
                </button>
              </>
            )}
            {readOnly && !course.purgedAt && (
              <button
                type="button"
                className="btn btn-primary text-sm"
                disabled={busy}
                onClick={handleReactivate}
              >
                Reactivar
              </button>
            )}
            <button
              type="button"
              className="btn text-sm"
              style={{ background: "var(--color-error)", color: "white" }}
              disabled={busy}
              onClick={handleDelete}
            >
              Eliminar
            </button>
          </div>
        </div>

        {editing && (
          <form
            onSubmit={handleSave}
            className="grid gap-3 sm:grid-cols-3 items-end"
          >
            <div>
              <label htmlFor="e-group" className="block text-sm mb-1">
                Grupo
              </label>
              <input
                id="e-group"
                required
                maxLength={20}
                value={form.group}
                onChange={(e) => setForm({ ...form, group: e.target.value })}
                className="w-full p-2 border rounded text-sm"
                style={{ borderColor: "var(--color-border)" }}
              />
            </div>
            <div>
              <label htmlFor="e-period" className="block text-sm mb-1">
                Periodo
              </label>
              <select
                id="e-period"
                value={form.periodId}
                onChange={(e) => setForm({ ...form, periodId: e.target.value })}
                className="w-full p-2 border rounded text-sm"
                style={{ borderColor: "var(--color-border)" }}
              >
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn btn-ghost text-sm"
                onClick={() => setEditing(false)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary text-sm"
                disabled={busy}
              >
                Guardar
              </button>
            </div>
          </form>
        )}

        {readOnly && !course.purgedAt && (
          <div
            className="mt-4 pt-4 border-t grid gap-3"
            style={{ borderColor: "var(--color-border)" }}
          >
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                className="btn btn-primary text-sm"
                disabled={busy}
                onClick={handleExport}
              >
                Exportar a Excel
              </button>
              <span
                className="text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                {course.exportedAt
                  ? `Última exportación: ${new Date(course.exportedAt).toLocaleString("es-CO", { timeZone: "America/Bogota" })}`
                  : "Debes exportar el curso antes de purgarlo."}
              </span>
            </div>
            {course.exportedAt && (
              <form
                onSubmit={handlePurge}
                className="grid gap-2"
                aria-label="Purgar datos del curso"
              >
                <label htmlFor="purge-confirm" className="text-sm">
                  Purgar borra las matrículas y la configuración del temario de
                  este curso (las cuentas se conservan). No se puede deshacer.
                  Para confirmar escribe <strong>{course.label}</strong>
                </label>
                <div className="flex gap-2 flex-wrap">
                  <input
                    id="purge-confirm"
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value)}
                    className="p-2 border rounded text-sm flex-grow"
                    style={{ borderColor: "var(--color-border)" }}
                    autoComplete="off"
                  />
                  <button
                    type="submit"
                    className="btn text-sm"
                    style={{ background: "var(--color-error)", color: "white" }}
                    disabled={busy || confirmation !== course.label}
                  >
                    Purgar datos
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </section>

      {!course.purgedAt && (
        <>
          <CourseStudents
            courseId={courseId}
            readOnly={readOnly}
            onChanged={load}
          />
          <CourseTopics courseId={courseId} readOnly={readOnly} />
        </>
      )}
    </AdminShell>
  );
}
