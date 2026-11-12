"use client";

import {
  ArrowLeft,
  Link2,
  Pencil,
  Plus,
  Trash2,
  Unlink,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
import { generarSlug } from "@/lib/slug";
import SubjectCoursesPanel, { type SubjectCourse } from "./SubjectCoursesPanel";

interface Topic {
  id: string;
  slug: string;
  title: string;
  order: number;
  parte: string | null;
  parentSlug: string | null;
}

interface Subject {
  id: string;
  code: string;
  slug: string;
  name: string;
  credits: number;
  objective: string;
  specificObjectives: string[];
  topics: Topic[];
  courses: SubjectCourse[];
}

export default function SubjectDetailClient({
  subjectId,
}: {
  subjectId: string;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [showCreateTopic, setShowCreateTopic] = useState(false);
  const [creatingTopic, setCreatingTopic] = useState(false);

  // Formulario de creación de tema (mismo que /perfil)
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newTopicSlug, setNewTopicSlug] = useState("");
  const [newTopicParte, setNewTopicParte] = useState("");
  const [newTopicParent, setNewTopicParent] = useState("");
  // true cuando el usuario elige "+ Nueva parte..." en el select de parte.
  const [newParteMode, setNewParteMode] = useState(false);

  const authHeaders = useCallback((): HeadersInit => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return {
      Authorization: `Bearer ${token ?? ""}`,
      "Content-Type": "application/json",
    };
  }, []);

  const loadSubject = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/subjects/${subjectId}`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (res.ok) setSubject(data.subject);
      else toast(data.error || "Error al cargar la asignatura", "error");
    } catch {
      toast("Error al cargar la asignatura", "error");
    } finally {
      setLoading(false);
    }
  }, [subjectId, authHeaders, toast]);

  useEffect(() => {
    loadSubject();
  }, [loadSubject]);

  const handleDelete = async () => {
    if (!subject) return;
    if (subject.courses.some((c) => c.status === "ACTIVE")) {
      toast(
        "No se puede eliminar: la asignatura tiene cursos activos",
        "warning",
      );
      return;
    }
    const finalized = subject.courses.length;
    const ok = window.confirm(
      `¿Eliminar la asignatura "${subject.name}"?${
        finalized > 0
          ? ` También se eliminarán sus ${finalized} cursos finalizados con sus matrículas.`
          : ""
      } Sus temas no se borrarán, solo quedarán sin asignatura. Esta acción no se puede deshacer.`,
    );
    if (!ok) return;
    try {
      const res = await fetch(`/api/admin/subjects/${subjectId}`, {
        method: "DELETE",
        headers: authHeaders(),
        body: JSON.stringify({ confirm: true }),
      });
      const data = await res.json();
      if (res.ok) {
        toast("Asignatura eliminada", "success");
        router.push("/admin/dashboard");
      } else {
        toast(data.error || "Error al eliminar", "error");
      }
    } catch {
      toast("Error al eliminar", "error");
    }
  };

  const resetTopicForm = () => {
    setNewTopicTitle("");
    setNewTopicSlug("");
    setNewTopicParte("");
    setNewTopicParent("");
    setNewParteMode(false);
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicTitle.trim() || !newTopicSlug.trim()) {
      toast("El título y el slug son obligatorios", "warning");
      return;
    }
    setCreatingTopic(true);
    try {
      const res = await fetch(`/api/admin/subjects/${subjectId}/topics`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          title: newTopicTitle,
          slug: newTopicSlug,
          parte: newTopicParte || null,
          parentSlug: newTopicParent || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast("Tema creado", "success");
        resetTopicForm();
        setShowCreateTopic(false);
        loadSubject();
      } else {
        toast(data.error || "Error al crear el tema", "error");
      }
    } catch {
      toast("Error al crear el tema", "error");
    } finally {
      setCreatingTopic(false);
    }
  };

  const handleDissociate = async (topicId: string) => {
    try {
      const res = await fetch(
        `/api/admin/subjects/${subjectId}/topics/${topicId}`,
        {
          method: "DELETE",
          headers: authHeaders(),
        },
      );
      const data = await res.json();
      if (res.ok) {
        toast("Tema desasociado", "success");
        loadSubject();
      } else {
        toast(data.error || "Error al desasociar", "error");
      }
    } catch {
      toast("Error al desasociar", "error");
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--color-background)" }}
      >
        <p style={{ color: "var(--color-text-medium)" }}>Cargando...</p>
      </div>
    );
  }

  if (!subject) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{ background: "var(--color-background)" }}
      >
        <p style={{ color: "var(--color-text-medium)" }}>
          No se encontró la asignatura.
        </p>
        <button
          type="button"
          onClick={() => router.push("/admin/dashboard")}
          className="btn btn-primary text-sm"
        >
          Volver al panel
        </button>
      </div>
    );
  }

  // Partes existentes entre los temas de ESTA asignatura (para el select de parte).
  const partes = [
    ...new Set(
      subject.topics.map((t) => t.parte).filter((p): p is string => !!p),
    ),
  ];
  // Posibles temas padre: solo los de la asignatura que no son a su vez subtemas.
  const posiblesPadres = subject.topics.filter((t) => !t.parentSlug);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--color-background)" }}
    >
      <header
        className="shadow-sm border-b"
        style={{
          background: "var(--color-surface)",
          borderColor: "var(--color-border)",
        }}
      >
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => router.push("/admin/dashboard")}
            className="flex items-center gap-2 text-sm hover:underline"
            style={{ color: "var(--color-text-medium)" }}
          >
            <ArrowLeft className="w-4 h-4" /> Panel
          </button>
          <h1
            className="text-lg font-semibold truncate"
            style={{ color: "var(--color-header)" }}
          >
            {subject.name}
          </h1>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="btn btn-ghost text-sm"
            >
              <Pencil className="w-4 h-4" /> Editar
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="btn btn-ghost text-sm"
              style={{ color: "#dc2626" }}
            >
              <Trash2 className="w-4 h-4" /> Eliminar
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-5xl mx-auto px-6 py-8 w-full space-y-8">
        {/* Información de la asignatura */}
        <section className="card p-6" aria-labelledby="info-heading">
          <h2 id="info-heading" className="sr-only">
            Información de la asignatura
          </h2>
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span
              className="text-sm px-2 py-0.5 rounded font-mono"
              style={{
                background: "var(--color-accent-soft)",
                color: "var(--color-accent)",
              }}
            >
              {subject.code}
            </span>
            <span
              className="text-sm"
              style={{ color: "var(--color-text-muted)" }}
            >
              {subject.credits} créditos
            </span>
          </div>
          <div className="mb-4">
            <h3
              className="text-sm font-semibold mb-1"
              style={{ color: "var(--color-text-dark)" }}
            >
              Objetivo general
            </h3>
            <p
              className="text-sm"
              style={{ color: "var(--color-text-medium)" }}
            >
              {subject.objective || "Sin objetivo definido."}
            </p>
          </div>
          {subject.specificObjectives.length > 0 && (
            <div>
              <h3
                className="text-sm font-semibold mb-1"
                style={{ color: "var(--color-text-dark)" }}
              >
                Objetivos específicos
              </h3>
              <ul
                className="list-disc list-inside text-sm space-y-1"
                style={{ color: "var(--color-text-medium)" }}
              >
                {subject.specificObjectives.map((o, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: lista estática de solo lectura
                  <li key={i}>{o}</li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* Temas */}
        <section className="card p-6" aria-labelledby="topics-heading">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2
              id="topics-heading"
              className="text-lg font-semibold"
              style={{ color: "var(--color-text-dark)" }}
            >
              Temas ({subject.topics.length})
            </h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowAssign(true)}
                className="btn btn-ghost text-sm"
              >
                <Link2 className="w-4 h-4" /> Asociar temas existentes
              </button>
              <button
                type="button"
                onClick={() => {
                  if (showCreateTopic) resetTopicForm();
                  setShowCreateTopic((v) => !v);
                }}
                className="btn btn-primary text-sm"
              >
                {showCreateTopic ? (
                  <>
                    <X className="w-4 h-4" /> Cancelar
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" /> Crear tema
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Formulario de creación de tema (mismo que /perfil) */}
          {showCreateTopic && (
            <div
              className="mb-6 p-4 border rounded-lg"
              style={{
                borderColor: "var(--color-accent)",
                background: "var(--color-accent-soft)",
              }}
            >
              <h3
                className="text-sm font-semibold mb-3"
                style={{ color: "var(--color-header)" }}
              >
                Crear nuevo tema
              </h3>
              <form onSubmit={handleCreateTopic} className="space-y-3">
                <div>
                  <label
                    htmlFor="nt-title"
                    className="block text-xs font-medium mb-1"
                    style={{ color: "var(--color-text-dark)" }}
                  >
                    Título <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="nt-title"
                    type="text"
                    required
                    value={newTopicTitle}
                    onChange={(e) => {
                      setNewTopicTitle(e.target.value);
                      setNewTopicSlug(generarSlug(e.target.value));
                    }}
                    placeholder="Título del tema"
                    className="w-full p-2 border rounded text-sm outline-none focus:ring-2"
                    style={{
                      borderColor: "var(--color-border)",
                      background: "var(--color-surface)",
                    }}
                  />
                </div>
                <div>
                  <label
                    htmlFor="nt-slug"
                    className="block text-xs font-medium mb-1"
                    style={{ color: "var(--color-text-dark)" }}
                  >
                    Slug <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="nt-slug"
                    type="text"
                    required
                    value={newTopicSlug}
                    onChange={(e) => setNewTopicSlug(e.target.value)}
                    placeholder="slug-del-tema"
                    className="w-full p-2 border rounded text-sm outline-none focus:ring-2 font-mono"
                    style={{
                      borderColor: "var(--color-border)",
                      background: "var(--color-background)",
                    }}
                  />
                </div>
                <div>
                  <label
                    htmlFor="nt-parte"
                    className="block text-xs font-medium mb-1"
                    style={{ color: "var(--color-text-dark)" }}
                  >
                    Parte (opcional)
                  </label>
                  <select
                    id="nt-parte"
                    value={newParteMode ? "__new__" : newTopicParte}
                    onChange={(e) => {
                      if (e.target.value === "__new__") {
                        setNewParteMode(true);
                        setNewTopicParte("");
                      } else {
                        setNewParteMode(false);
                        setNewTopicParte(e.target.value);
                      }
                    }}
                    className="w-full p-2 border rounded text-sm outline-none focus:ring-2"
                    style={{
                      borderColor: "var(--color-border)",
                      background: "var(--color-surface)",
                    }}
                  >
                    <option value="">-- Seleccionar parte --</option>
                    {partes.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                    <option value="__new__">+ Nueva parte...</option>
                  </select>
                  {newParteMode && (
                    <input
                      type="text"
                      value={newTopicParte}
                      onChange={(e) => setNewTopicParte(e.target.value)}
                      placeholder="Nombre de la nueva parte"
                      aria-label="Nombre de la nueva parte"
                      className="w-full mt-2 p-2 border rounded text-sm outline-none focus:ring-2"
                      style={{
                        borderColor: "var(--color-border)",
                        background: "var(--color-surface)",
                      }}
                    />
                  )}
                </div>
                <div>
                  <label
                    htmlFor="nt-parent"
                    className="block text-xs font-medium mb-1"
                    style={{ color: "var(--color-text-dark)" }}
                  >
                    Tema padre (opcional, para subtemas)
                  </label>
                  <select
                    id="nt-parent"
                    value={newTopicParent}
                    onChange={(e) => setNewTopicParent(e.target.value)}
                    className="w-full p-2 border rounded text-sm outline-none focus:ring-2"
                    style={{
                      borderColor: "var(--color-border)",
                      background: "var(--color-surface)",
                    }}
                  >
                    <option value="">-- Sin tema padre --</option>
                    {posiblesPadres.map((t) => (
                      <option key={t.slug} value={t.slug}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                  {posiblesPadres.length === 0 && (
                    <p
                      className="text-xs mt-1"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      Esta asignatura aún no tiene temas que puedan ser padres.
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={creatingTopic}
                  className="btn btn-primary text-sm disabled:opacity-50"
                >
                  {creatingTopic ? "Guardando..." : "Guardar tema"}
                </button>
              </form>
            </div>
          )}

          {subject.topics.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              Esta asignatura aún no tiene temas. Crea uno nuevo o asocia temas
              existentes.
            </p>
          ) : (
            <ul
              className="divide-y"
              style={{ borderColor: "var(--color-border)" }}
            >
              {subject.topics.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between py-2 gap-3"
                >
                  <span
                    className="text-sm"
                    style={{ color: "var(--color-text-dark)" }}
                  >
                    {t.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDissociate(t.id)}
                    className="btn btn-ghost text-xs shrink-0"
                    aria-label={`Desasociar el tema ${t.title}`}
                  >
                    <Unlink className="w-3.5 h-3.5" /> Desasociar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <SubjectCoursesPanel courses={subject.courses} />
      </main>

      {editing && (
        <EditSubjectModal
          subject={subject}
          authHeaders={authHeaders}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            loadSubject();
          }}
        />
      )}

      {showAssign && (
        <AssignTopicsModal
          subjectId={subjectId}
          authHeaders={authHeaders}
          onClose={() => setShowAssign(false)}
          onChanged={loadSubject}
        />
      )}
    </div>
  );
}

// ---------- Modal de edición ----------
function EditSubjectModal({
  subject,
  authHeaders,
  onClose,
  onSaved,
}: {
  subject: Subject;
  authHeaders: () => HeadersInit;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [name, setName] = useState(subject.name);
  const [slug, setSlug] = useState(subject.slug);
  const [code, setCode] = useState(subject.code);
  const [credits, setCredits] = useState(String(subject.credits));
  const [objective, setObjective] = useState(subject.objective);
  const [specificObjectives, setSpecificObjectives] = useState<string[]>(
    subject.specificObjectives.length ? subject.specificObjectives : [""],
  );
  const [saving, setSaving] = useState(false);

  const updateObjective = (i: number, v: string) =>
    setSpecificObjectives((prev) => prev.map((o, idx) => (idx === i ? v : o)));
  const addObjective = () => setSpecificObjectives((prev) => [...prev, ""]);
  const removeObjective = (i: number) =>
    setSpecificObjectives((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim() || !slug.trim()) {
      toast("El nombre, el código y el slug son obligatorios", "warning");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/subjects/${subject.id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          name,
          slug,
          code,
          credits,
          objective,
          specificObjectives: specificObjectives.filter((o) => o.trim()),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast("Asignatura actualizada", "success");
        onSaved();
      } else {
        toast(data.error || "Error al actualizar", "error");
      }
    } catch {
      toast("Error al actualizar", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-subject-title"
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg p-6"
        style={{ background: "var(--color-surface)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2
            id="edit-subject-title"
            className="text-lg font-semibold"
            style={{ color: "var(--color-text-dark)" }}
          >
            Editar asignatura
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="btn btn-ghost p-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="e-name"
              className="block text-sm font-medium mb-1"
              style={{ color: "var(--color-text-dark)" }}
            >
              Nombre <span aria-hidden="true">*</span>
            </label>
            <input
              id="e-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border rounded-md outline-none focus:ring-2"
              style={{ borderColor: "var(--color-border)" }}
            />
          </div>
          <div>
            <label
              htmlFor="e-slug"
              className="block text-sm font-medium mb-1"
              style={{ color: "var(--color-text-dark)" }}
            >
              Slug <span aria-hidden="true">*</span>
            </label>
            <input
              id="e-slug"
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="slug-de-la-asignatura"
              className="w-full p-2 border rounded-md outline-none focus:ring-2 font-mono"
              style={{ borderColor: "var(--color-border)" }}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="e-code"
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--color-text-dark)" }}
              >
                Código <span aria-hidden="true">*</span>
              </label>
              <input
                id="e-code"
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full p-2 border rounded-md outline-none focus:ring-2 font-mono"
                style={{ borderColor: "var(--color-border)" }}
              />
            </div>
            <div>
              <label
                htmlFor="e-credits"
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--color-text-dark)" }}
              >
                Créditos
              </label>
              <input
                id="e-credits"
                type="number"
                min="0"
                value={credits}
                onChange={(e) => setCredits(e.target.value)}
                className="w-full p-2 border rounded-md outline-none focus:ring-2"
                style={{ borderColor: "var(--color-border)" }}
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="e-objective"
              className="block text-sm font-medium mb-1"
              style={{ color: "var(--color-text-dark)" }}
            >
              Objetivo general
            </label>
            <textarea
              id="e-objective"
              rows={3}
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              className="w-full p-2 border rounded-md outline-none focus:ring-2"
              style={{ borderColor: "var(--color-border)" }}
            />
          </div>
          <div>
            <span
              className="block text-sm font-medium mb-1"
              style={{ color: "var(--color-text-dark)" }}
            >
              Objetivos específicos
            </span>
            <div className="space-y-2">
              {specificObjectives.map((obj, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: lista editable controlada sin id estable; solo se agrega/quita al final
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={obj}
                    onChange={(e) => updateObjective(i, e.target.value)}
                    placeholder={`Objetivo específico ${i + 1}`}
                    aria-label={`Objetivo específico ${i + 1}`}
                    className="flex-1 p-2 border rounded-md outline-none focus:ring-2"
                    style={{ borderColor: "var(--color-border)" }}
                  />
                  {specificObjectives.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeObjective(i)}
                      aria-label={`Quitar objetivo específico ${i + 1}`}
                      className="btn btn-ghost p-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addObjective}
              className="btn btn-ghost text-sm mt-2"
            >
              <Plus className="w-4 h-4" /> Añadir objetivo
            </button>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary text-sm disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------- Modal de asociar temas existentes ----------
interface UnassignedTopic {
  id: string;
  title: string;
  slug: string;
}

function AssignTopicsModal({
  subjectId,
  authHeaders,
  onClose,
  onChanged,
}: {
  subjectId: string;
  authHeaders: () => HeadersInit;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { toast } = useToast();
  const [topics, setTopics] = useState<UnassignedTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const loadUnassigned = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/topics?unassigned=true", {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (res.ok) setTopics(data.topics);
      else toast(data.error || "Error al cargar temas", "error");
    } catch {
      toast("Error al cargar temas", "error");
    } finally {
      setLoading(false);
    }
  }, [authHeaders, toast]);

  useEffect(() => {
    loadUnassigned();
  }, [loadUnassigned]);

  const handleAssign = async (topicId: string) => {
    try {
      const res = await fetch(
        `/api/admin/subjects/${subjectId}/topics/${topicId}`,
        {
          method: "PATCH",
          headers: authHeaders(),
        },
      );
      const data = await res.json();
      if (res.ok) {
        toast("Tema asociado", "success");
        setTopics((prev) => prev.filter((t) => t.id !== topicId));
        onChanged();
      } else {
        toast(data.error || "Error al asociar", "error");
      }
    } catch {
      toast("Error al asociar", "error");
    }
  };

  const filtered = topics.filter((t) =>
    t.title.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="assign-title"
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg p-6"
        style={{ background: "var(--color-surface)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2
            id="assign-title"
            className="text-lg font-semibold"
            style={{ color: "var(--color-text-dark)" }}
          >
            Asociar temas existentes
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="btn btn-ghost p-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar tema..."
          aria-label="Buscar tema"
          className="w-full p-2 border rounded-md outline-none focus:ring-2 mb-4"
          style={{ borderColor: "var(--color-border)" }}
        />

        {loading ? (
          <p className="text-sm" style={{ color: "var(--color-text-medium)" }}>
            Cargando temas sin asignatura...
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            No hay temas sin asignatura que coincidan.
          </p>
        ) : (
          <ul
            className="divide-y"
            style={{ borderColor: "var(--color-border)" }}
          >
            {filtered.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between py-2 gap-3"
              >
                <span
                  className="text-sm"
                  style={{ color: "var(--color-text-dark)" }}
                >
                  {t.title}
                </span>
                <button
                  type="button"
                  onClick={() => handleAssign(t.id)}
                  className="btn btn-ghost text-xs shrink-0"
                  aria-label={`Asociar el tema ${t.title}`}
                >
                  <Link2 className="w-3.5 h-3.5" /> Asociar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
