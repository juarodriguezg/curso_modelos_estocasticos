"use client";

import { Pencil, Plus, Upload } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
import { inputClass, inputStyle, labelClass } from "../../AdminShell";
import { adminFetch } from "../../adminApi";

interface Student {
  enrollmentId: string;
  active: boolean;
  isMonitor: boolean;
  user: {
    id: string;
    email: string;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    documentId: string | null;
  };
}

const EMPTY = { firstName: "", lastName: "", email: "", documentId: "" };

const FIELDS = [
  ["firstName", "Nombre", "text"],
  ["lastName", "Apellidos", "text"],
  ["email", "Correo electrónico", "email"],
  ["documentId", "Documento de identificación", "text"],
] as const;

// Estudiantes del curso: alta individual o por CSV (RF-CUR-02), edición,
// marca de monitor y desactivación sin perder historial (RF-CUR-04).
export default function CourseStudents({
  courseId,
  readOnly,
  onChanged,
}: {
  courseId: string;
  readOnly: boolean;
  onChanged: () => void;
}) {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [importErrors, setImportErrors] = useState<string[]>([]);

  const base = `/api/admin/courses/${courseId}/students`;

  const load = useCallback(async () => {
    const { ok, data } = await adminFetch<{ students: Student[] }>(base);
    if (ok) setStudents(data.students);
    else toast(data.error || "Error al cargar estudiantes", "error");
  }, [base, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = () => {
    load();
    onChanged();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { ok, data } = await adminFetch<{ message: string }>(
      editingId ? `${base}/${editingId}` : base,
      { method: editingId ? "PUT" : "POST", body: JSON.stringify(form) },
    );
    setBusy(false);
    if (!ok) {
      toast(data.error || "Error al guardar el estudiante", "error");
      return;
    }
    toast(data.message, "success");
    setForm(EMPTY);
    setEditingId(null);
    setShowForm(false);
    refresh();
  };

  const update = async (s: Student, changes: Record<string, boolean>) => {
    const { ok, data } = await adminFetch(`${base}/${s.enrollmentId}`, {
      method: "PUT",
      body: JSON.stringify(changes),
    });
    if (ok) refresh();
    else toast(data.error || "Error al actualizar", "error");
  };

  const handleImport = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem("csv") as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      toast("Selecciona un archivo CSV", "warning");
      return;
    }
    const body = new FormData();
    body.append("file", file);
    setBusy(true);
    const { ok, data } = await adminFetch<{
      message: string;
      errors: string[];
    }>(`${base}/import`, { method: "POST", body });
    setBusy(false);
    if (!ok) {
      toast(data.error || "Error al importar", "error");
      return;
    }
    toast(data.message, data.errors.length ? "warning" : "success");
    setImportErrors(data.errors);
    input.value = "";
    refresh();
  };

  const startEdit = (s: Student) => {
    setForm({
      firstName: s.user.firstName ?? s.user.name ?? "",
      lastName: s.user.lastName ?? "",
      email: s.user.email,
      documentId: s.user.documentId ?? "",
    });
    setEditingId(s.enrollmentId);
    setShowForm(true);
  };

  return (
    <section className="card p-5 mb-6" aria-labelledby="students-heading">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <h2
          id="students-heading"
          className="text-lg font-semibold"
          style={{ color: "var(--color-text-dark)" }}
        >
          Estudiantes
        </h2>
        {!readOnly && (
          <button
            type="button"
            className="btn btn-primary text-sm"
            onClick={() => {
              setForm(EMPTY);
              setEditingId(null);
              setShowForm(true);
            }}
          >
            <Plus className="w-4 h-4" aria-hidden="true" /> Agregar estudiante
          </button>
        )}
      </div>

      {showForm && !readOnly && (
        <form
          onSubmit={handleSubmit}
          className="grid gap-3 sm:grid-cols-2 mb-4 p-4 rounded border"
          style={{ borderColor: "var(--color-border)" }}
          aria-label={editingId ? "Editar estudiante" : "Agregar estudiante"}
        >
          {FIELDS.map(([key, label, type]) => (
            <div key={key}>
              <label htmlFor={`st-${key}`} className={labelClass}>
                {label}
              </label>
              <input
                id={`st-${key}`}
                type={type}
                required
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className={inputClass}
                style={inputStyle}
              />
            </div>
          ))}
          <p
            className="text-xs sm:col-span-2"
            style={{ color: "var(--color-text-muted)" }}
          >
            Si el correo ya tiene cuenta se reutiliza; si no, se crea con el
            documento como contraseña inicial.
          </p>
          <div className="sm:col-span-2 flex gap-2 justify-end">
            <button
              type="button"
              className="btn btn-ghost text-sm"
              onClick={() => setShowForm(false)}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={busy}
              className="btn btn-primary text-sm disabled:opacity-50"
            >
              {editingId ? "Guardar cambios" : "Matricular"}
            </button>
          </div>
        </form>
      )}

      {!readOnly && (
        <form
          onSubmit={handleImport}
          className="flex items-center gap-2 flex-wrap mb-4 text-sm"
          aria-label="Importar estudiantes desde CSV"
        >
          <label
            htmlFor="csv-file"
            style={{ color: "var(--color-text-medium)" }}
          >
            Importar CSV (columnas Correo, Documento, Nombre, Apellidos):
          </label>
          <input id="csv-file" name="csv" type="file" accept=".csv" />
          <button
            type="submit"
            disabled={busy}
            className="btn btn-ghost text-sm disabled:opacity-50"
          >
            <Upload className="w-4 h-4" aria-hidden="true" /> Importar
          </button>
        </form>
      )}
      {importErrors.length > 0 && (
        <ul
          className="mb-4 text-xs list-disc pl-5"
          style={{ color: "var(--color-error)" }}
          aria-label="Errores de la importación"
        >
          {importErrors.map((err) => (
            <li key={err}>{err}</li>
          ))}
        </ul>
      )}

      {students.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Aún no hay estudiantes matriculados.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr
                className="text-left"
                style={{ color: "var(--color-text-muted)" }}
              >
                <th className="py-2 pr-3">Estudiante</th>
                <th className="py-2 pr-3">Documento</th>
                <th className="py-2 pr-3">Monitor</th>
                <th className="py-2 pr-3">Matrícula</th>
                <th className="py-2">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr
                  key={s.enrollmentId}
                  className="border-t"
                  style={{
                    borderColor: "var(--color-border)",
                    color: "var(--color-text-dark)",
                    opacity: s.active ? 1 : 0.6,
                  }}
                >
                  <td className="py-2 pr-3">
                    <div className="font-medium">{s.user.name}</div>
                    <div
                      className="text-xs"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {s.user.email}
                    </div>
                  </td>
                  <td className="py-2 pr-3">{s.user.documentId ?? "—"}</td>
                  <td className="py-2 pr-3">
                    <input
                      type="checkbox"
                      checked={s.isMonitor}
                      disabled={readOnly}
                      onChange={(e) =>
                        update(s, { isMonitor: e.target.checked })
                      }
                      aria-label={`Monitor: ${s.user.name}`}
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <button
                      type="button"
                      disabled={readOnly}
                      className="btn btn-ghost text-xs disabled:opacity-50"
                      onClick={() => update(s, { active: !s.active })}
                      aria-label={`${s.active ? "Desactivar" : "Reactivar"} la matrícula de ${s.user.name}`}
                    >
                      {s.active
                        ? "Activa · desactivar"
                        : "Inactiva · reactivar"}
                    </button>
                  </td>
                  <td className="py-2 text-right">
                    {!readOnly && (
                      <button
                        type="button"
                        className="btn btn-ghost text-xs"
                        onClick={() => startEdit(s)}
                        aria-label={`Editar a ${s.user.name}`}
                      >
                        <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
