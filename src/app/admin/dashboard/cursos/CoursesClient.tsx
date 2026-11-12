"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
import {
  AdminShell,
  inputClass,
  inputStyle,
  labelClass,
  StatusBadge,
} from "../AdminShell";
import { adminFetch, type Course, type Period } from "../adminApi";

interface SubjectOption {
  id: string;
  code: string;
  name: string;
}

// Listado y alta de cursos: asignatura + periodo + grupo (RF-CUR-01, RF-CUR-06).
export default function CoursesClient() {
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    subjectId: "",
    periodId: "",
    status: "",
  });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ subjectId: "", periodId: "", group: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const [s, p] = await Promise.all([
        adminFetch<{ subjects: SubjectOption[] }>("/api/admin/subjects"),
        adminFetch<{ periods: Period[] }>("/api/admin/periods"),
      ]);
      if (s.ok) setSubjects(s.data.subjects);
      if (p.ok) setPeriods(p.data.periods);
    })();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams(
      Object.entries(filters).filter(([, v]) => v),
    );
    const { ok, data } = await adminFetch<{ courses: Course[] }>(
      `/api/admin/courses?${params}`,
    );
    if (ok) setCourses(data.courses);
    else toast(data.error || "Error al cargar cursos", "error");
    setLoading(false);
  }, [filters, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const selectedPeriod = periods.find((p) => p.id === form.periodId);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { ok, data } = await adminFetch("/api/admin/courses", {
      method: "POST",
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!ok) {
      toast(data.error || "Error al crear el curso", "error");
      return;
    }
    toast("Curso creado", "success");
    setShowForm(false);
    setForm({ subjectId: "", periodId: "", group: "" });
    load();
  };

  return (
    <AdminShell title="Cursos">
      <div className="flex items-end justify-between mb-4 flex-wrap gap-3">
        <div className="grid gap-3 sm:grid-cols-3 flex-grow max-w-3xl">
          <div>
            <label htmlFor="f-subject" className={labelClass}>
              Asignatura
            </label>
            <select
              id="f-subject"
              value={filters.subjectId}
              onChange={(e) =>
                setFilters({ ...filters, subjectId: e.target.value })
              }
              className={inputClass}
              style={inputStyle}
            >
              <option value="">Todas</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} — {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="f-period" className={labelClass}>
              Periodo
            </label>
            <select
              id="f-period"
              value={filters.periodId}
              onChange={(e) =>
                setFilters({ ...filters, periodId: e.target.value })
              }
              className={inputClass}
              style={inputStyle}
            >
              <option value="">Todos</option>
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="f-status" className={labelClass}>
              Estado
            </label>
            <select
              id="f-status"
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              className={inputClass}
              style={inputStyle}
            >
              <option value="">Todos</option>
              <option value="ACTIVE">Activos</option>
              <option value="FINALIZED">Finalizados</option>
            </select>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="btn btn-primary text-sm"
        >
          <Plus className="w-4 h-4" aria-hidden="true" /> Nuevo curso
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="card p-4 mb-6 grid gap-4 sm:grid-cols-3"
          aria-label="Nuevo curso"
        >
          <div>
            <label htmlFor="c-subject" className={labelClass}>
              Asignatura
            </label>
            <select
              id="c-subject"
              required
              value={form.subjectId}
              onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
              className={inputClass}
              style={inputStyle}
            >
              <option value="">Selecciona...</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} — {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="c-period" className={labelClass}>
              Periodo académico
            </label>
            <select
              id="c-period"
              required
              value={form.periodId}
              onChange={(e) => setForm({ ...form, periodId: e.target.value })}
              className={inputClass}
              style={inputStyle}
            >
              <option value="">Selecciona...</option>
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="c-group" className={labelClass}>
              Grupo o sección
            </label>
            <input
              id="c-group"
              required
              maxLength={20}
              placeholder="1"
              value={form.group}
              onChange={(e) => setForm({ ...form, group: e.target.value })}
              className={inputClass}
              style={inputStyle}
            />
          </div>
          <p
            className="sm:col-span-2 text-xs self-center"
            style={{ color: "var(--color-text-muted)" }}
          >
            {selectedPeriod
              ? `Fechas heredadas del periodo: ${selectedPeriod.startDate} a ${selectedPeriod.endDate}`
              : "Las fechas de inicio y final se heredan del periodo."}
          </p>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="btn btn-ghost text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary text-sm disabled:opacity-50"
            >
              {saving ? "Creando..." : "Crear curso"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p style={{ color: "var(--color-text-medium)" }}>Cargando cursos...</p>
      ) : courses.length === 0 ? (
        <p
          className="text-center py-12 rounded-lg border-2 border-dashed"
          style={{
            color: "var(--color-text-muted)",
            borderColor: "var(--color-border)",
          }}
        >
          No hay cursos con estos filtros.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <li key={c.id}>
              <Link
                href={`/admin/dashboard/cursos/${c.id}`}
                className="card card-interactive p-5 block h-full"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h2
                    className="font-semibold"
                    style={{ color: "var(--color-text-dark)" }}
                  >
                    {c.subject.name} · Grupo {c.group}
                  </h2>
                  <StatusBadge status={c.status} />
                </div>
                <p
                  className="text-sm mb-1"
                  style={{ color: "var(--color-text-medium)" }}
                >
                  {c.subject.code} · {c.period.name}
                </p>
                <p
                  className="text-xs"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {c.period.startDate} a {c.period.endDate} · {c.activeStudents}{" "}
                  estudiantes
                  {c.purgedAt ? " · purgado" : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}
