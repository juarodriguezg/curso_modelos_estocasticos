"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
import { AdminShell, inputClass, inputStyle, labelClass } from "../AdminShell";
import { adminFetch, type Period } from "../adminApi";

const EMPTY = { name: "", startDate: "", endDate: "" };

// Gestión de periodos académicos (RF-CUR-10, RF-CUR-07).
export default function PeriodsClient() {
  const { toast } = useToast();
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { ok, data } = await adminFetch<{ periods: Period[] }>(
      "/api/admin/periods",
    );
    if (ok) setPeriods(data.periods);
    else toast(data.error || "Error al cargar periodos", "error");
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setForm(EMPTY);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (p: Period) => {
    setForm({ name: p.name, startDate: p.startDate, endDate: p.endDate });
    setEditingId(p.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.startDate && form.endDate && form.startDate >= form.endDate) {
      toast("La fecha de inicio debe ser anterior a la fecha final", "warning");
      return;
    }
    setSaving(true);
    const { ok, data } = await adminFetch(
      editingId ? `/api/admin/periods/${editingId}` : "/api/admin/periods",
      { method: editingId ? "PUT" : "POST", body: JSON.stringify(form) },
    );
    setSaving(false);
    if (!ok) {
      toast(data.error || "Error al guardar el periodo", "error");
      return;
    }
    toast(editingId ? "Periodo actualizado" : "Periodo creado", "success");
    for (const w of data.warnings ?? []) toast(w, "warning");
    setShowForm(false);
    load();
  };

  const handleDelete = async (p: Period) => {
    if (!window.confirm(`¿Eliminar el periodo ${p.name}?`)) return;
    const { ok, data } = await adminFetch(`/api/admin/periods/${p.id}`, {
      method: "DELETE",
    });
    if (ok) {
      toast("Periodo eliminado", "success");
      load();
    } else toast(data.error || "Error al eliminar", "error");
  };

  return (
    <AdminShell title="Periodos académicos">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <p className="text-sm" style={{ color: "var(--color-text-medium)" }}>
          Los cursos heredan las fechas de su periodo.
        </p>
        <button
          type="button"
          onClick={openCreate}
          className="btn btn-primary text-sm"
        >
          <Plus className="w-4 h-4" aria-hidden="true" /> Nuevo periodo
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="card p-4 mb-6 grid gap-4 sm:grid-cols-3"
          aria-label={editingId ? "Editar periodo" : "Nuevo periodo"}
        >
          <div>
            <label htmlFor="p-name" className={labelClass}>
              Nombre
            </label>
            <input
              id="p-name"
              required
              placeholder="2026-1S"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass}
              style={inputStyle}
            />
          </div>
          <div>
            <label htmlFor="p-start" className={labelClass}>
              Fecha de inicio
            </label>
            <input
              id="p-start"
              type="date"
              required
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className={inputClass}
              style={inputStyle}
            />
          </div>
          <div>
            <label htmlFor="p-end" className={labelClass}>
              Fecha final
            </label>
            <input
              id="p-end"
              type="date"
              required
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              className={inputClass}
              style={inputStyle}
            />
          </div>
          <div className="sm:col-span-3 flex gap-2 justify-end">
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
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p style={{ color: "var(--color-text-medium)" }}>
          Cargando periodos...
        </p>
      ) : periods.length === 0 ? (
        <p
          className="text-center py-12 rounded-lg border-2 border-dashed"
          style={{
            color: "var(--color-text-muted)",
            borderColor: "var(--color-border)",
          }}
        >
          Aún no hay periodos académicos.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr
                className="text-left"
                style={{ color: "var(--color-text-muted)" }}
              >
                <th className="py-2 pr-4">Periodo</th>
                <th className="py-2 pr-4">Inicio</th>
                <th className="py-2 pr-4">Final</th>
                <th className="py-2 pr-4">Cursos</th>
                <th className="py-2">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {periods.map((p) => (
                <tr
                  key={p.id}
                  className="border-t"
                  style={{
                    borderColor: "var(--color-border)",
                    color: "var(--color-text-dark)",
                  }}
                >
                  <td className="py-2 pr-4 font-medium">{p.name}</td>
                  <td className="py-2 pr-4">{p.startDate}</td>
                  <td className="py-2 pr-4">{p.endDate}</td>
                  <td className="py-2 pr-4">{p.courseCount ?? 0}</td>
                  <td className="py-2 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => openEdit(p)}
                      className="btn btn-ghost text-xs"
                      aria-label={`Editar el periodo ${p.name}`}
                    >
                      <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(p)}
                      disabled={(p.courseCount ?? 0) > 0}
                      className="btn btn-ghost text-xs disabled:opacity-40"
                      aria-label={`Eliminar el periodo ${p.name}`}
                      title={
                        (p.courseCount ?? 0) > 0
                          ? "No se puede eliminar un periodo con cursos"
                          : undefined
                      }
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
