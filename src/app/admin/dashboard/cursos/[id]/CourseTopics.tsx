"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
import { adminFetch } from "../../adminApi";

interface CourseTopic {
  id: string;
  title: string;
  parentSlug: string | null;
  visible: boolean;
  publishDate: string | null;
}

// Temario heredado de la asignatura (RF-ASG-05) con visibilidad y fecha de
// publicación informativa por curso (RF-CUR-03, RF-CUR-07).
export default function CourseTopics({
  courseId,
  readOnly,
}: {
  courseId: string;
  readOnly: boolean;
}) {
  const { toast } = useToast();
  const [topics, setTopics] = useState<CourseTopic[]>([]);
  const [changed, setChanged] = useState<Record<string, CourseTopic>>({});
  const [saving, setSaving] = useState(false);

  const url = `/api/admin/courses/${courseId}/topics`;

  const load = useCallback(async () => {
    const { ok, data } = await adminFetch<{ topics: CourseTopic[] }>(url);
    if (ok) {
      setTopics(data.topics);
      setChanged({});
    } else toast(data.error || "Error al cargar el temario", "error");
  }, [url, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const edit = (t: CourseTopic, patch: Partial<CourseTopic>) => {
    const next = { ...t, ...patch };
    setTopics((prev) => prev.map((x) => (x.id === t.id ? next : x)));
    setChanged((prev) => ({ ...prev, [t.id]: next }));
  };

  const save = async () => {
    setSaving(true);
    const { ok, data } = await adminFetch(url, {
      method: "PUT",
      body: JSON.stringify({
        items: Object.values(changed).map((t) => ({
          topicId: t.id,
          visible: t.visible,
          publishDate: t.publishDate || null,
        })),
      }),
    });
    setSaving(false);
    if (!ok) {
      toast(data.error || "Error al guardar el temario", "error");
      return;
    }
    toast("Temario del curso actualizado", "success");
    for (const w of data.warnings ?? []) toast(w, "warning");
    load();
  };

  const pending = Object.keys(changed).length;

  return (
    <section className="card p-5 mb-6" aria-labelledby="topics-heading">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
        <h2
          id="topics-heading"
          className="text-lg font-semibold"
          style={{ color: "var(--color-text-dark)" }}
        >
          Temario
        </h2>
        {!readOnly && (
          <button
            type="button"
            className="btn btn-primary text-sm disabled:opacity-50"
            disabled={pending === 0 || saving}
            onClick={save}
          >
            {saving ? "Guardando..." : `Guardar cambios (${pending})`}
          </button>
        )}
      </div>
      <p className="text-xs mb-4" style={{ color: "var(--color-text-muted)" }}>
        El temario se hereda de la asignatura. La visibilidad controla qué ven
        los estudiantes de este curso; la fecha de publicación es informativa y
        no restringe el acceso.
      </p>

      {topics.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          La asignatura aún no tiene temas.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr
                className="text-left"
                style={{ color: "var(--color-text-muted)" }}
              >
                <th className="py-2 pr-3">Tema</th>
                <th className="py-2 pr-3">Visible</th>
                <th className="py-2">Publicación</th>
              </tr>
            </thead>
            <tbody>
              {topics.map((t) => (
                <tr
                  key={t.id}
                  className="border-t"
                  style={{
                    borderColor: "var(--color-border)",
                    color: "var(--color-text-dark)",
                  }}
                >
                  <td
                    className={`py-2 pr-3 ${t.parentSlug ? "pl-6 text-xs" : ""}`}
                  >
                    {t.title}
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="checkbox"
                      checked={t.visible}
                      disabled={readOnly}
                      onChange={(e) => edit(t, { visible: e.target.checked })}
                      aria-label={`Visible: ${t.title}`}
                    />
                  </td>
                  <td className="py-2">
                    <input
                      type="date"
                      value={t.publishDate ?? ""}
                      disabled={readOnly}
                      onChange={(e) =>
                        edit(t, { publishDate: e.target.value || null })
                      }
                      className="p-1 border rounded text-sm"
                      style={{ borderColor: "var(--color-border)" }}
                      aria-label={`Fecha de publicación: ${t.title}`}
                    />
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
