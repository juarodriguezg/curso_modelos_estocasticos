"use client";

import {
  ArrowLeft,
  BookOpen,
  LogOut,
  Moon,
  Plus,
  Sun,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
import { generarSlug } from "@/lib/slug";

interface Subject {
  id: string;
  code: string;
  name: string;
  credits: number;
  objective: string;
  specificObjectives: string[];
  topicCount: number;
}

export default function DashboardClient({ userName }: { userName: string }) {
  const router = useRouter();
  const { toast } = useToast();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Tema claro/oscuro, mismo mecanismo que /perfil (data-theme + localStorage).
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    setDarkMode(savedTheme === "dark");
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    document.documentElement.setAttribute(
      "data-theme",
      newMode ? "dark" : "light",
    );
    localStorage.setItem("theme", newMode ? "dark" : "light");
  };

  // Formulario de creación
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [code, setCode] = useState("");
  const [credits, setCredits] = useState("3");
  const [objective, setObjective] = useState("");
  const [specificObjectives, setSpecificObjectives] = useState<string[]>([""]);

  const authHeaders = useCallback((): HeadersInit => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return {
      Authorization: `Bearer ${token ?? ""}`,
      "Content-Type": "application/json",
    };
  }, []);

  const loadSubjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/subjects", {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (res.ok) setSubjects(data.subjects);
      else toast(data.error || "Error al cargar asignaturas", "error");
    } catch {
      toast("Error al cargar asignaturas", "error");
    } finally {
      setLoading(false);
    }
  }, [authHeaders, toast]);

  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  const resetForm = () => {
    setName("");
    setSlug("");
    setCode("");
    setCredits("3");
    setObjective("");
    setSpecificObjectives([""]);
  };

  const updateObjective = (index: number, value: string) => {
    setSpecificObjectives((prev) =>
      prev.map((o, i) => (i === index ? value : o)),
    );
  };
  const addObjective = () => setSpecificObjectives((prev) => [...prev, ""]);
  const removeObjective = (index: number) =>
    setSpecificObjectives((prev) => prev.filter((_, i) => i !== index));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim() || !slug.trim()) {
      toast("El nombre, el código y el slug son obligatorios", "warning");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/subjects", {
        method: "POST",
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
        toast("Asignatura creada", "success");
        resetForm();
        setShowCreate(false);
        loadSubjects();
      } else {
        toast(data.error || "Error al crear la asignatura", "error");
      }
    } catch {
      toast("Error al crear la asignatura", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      /* ignore */
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/";
    }
  };

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
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-sm hover:underline"
            style={{ color: "var(--color-text-medium)" }}
          >
            <ArrowLeft className="w-4 h-4" /> Inicio
          </button>
          <h1
            className="text-xl font-semibold"
            style={{ color: "var(--color-header)" }}
          >
            Panel de Administración
          </h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push("/perfil")}
              className="btn btn-ghost text-sm"
              aria-label="Ir a mi perfil"
              title="Ir a mi perfil"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">{userName}</span>
            </button>
            <button
              type="button"
              onClick={toggleDarkMode}
              className="btn btn-ghost p-2"
              aria-label={
                darkMode ? "Activar modo claro" : "Activar modo oscuro"
              }
              title={darkMode ? "Modo claro" : "Modo oscuro"}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="btn btn-ghost text-sm"
            >
              <LogOut className="w-4 h-4" /> Salir
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-6xl mx-auto px-6 py-8 w-full">
        <section aria-labelledby="subjects-heading">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <BookOpen
                className="w-5 h-5"
                style={{ color: "var(--color-accent)" }}
                aria-hidden="true"
              />
              <h2
                id="subjects-heading"
                className="text-lg font-semibold"
                style={{ color: "var(--color-text-dark)" }}
              >
                Asignaturas
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="btn btn-primary text-sm"
            >
              <Plus className="w-4 h-4" /> Nueva asignatura
            </button>
          </div>

          {loading ? (
            <p style={{ color: "var(--color-text-medium)" }}>
              Cargando asignaturas...
            </p>
          ) : subjects.length === 0 ? (
            <div
              className="text-center py-12 rounded-lg border-2 border-dashed"
              style={{
                color: "var(--color-text-muted)",
                borderColor: "var(--color-border)",
              }}
            >
              Aún no hay asignaturas. Crea la primera con el botón de arriba.
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {subjects.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() =>
                      router.push(`/admin/dashboard/subjects/${s.id}`)
                    }
                    className="card card-interactive p-5 text-left w-full h-full"
                    aria-label={`Ver la asignatura ${s.name}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3
                        className="font-semibold"
                        style={{ color: "var(--color-text-dark)" }}
                      >
                        {s.name}
                      </h3>
                      <span
                        className="text-xs px-2 py-0.5 rounded font-mono shrink-0"
                        style={{
                          background: "var(--color-accent-soft)",
                          color: "var(--color-accent)",
                        }}
                      >
                        {s.code}
                      </span>
                    </div>
                    <p
                      className="text-sm mb-3 line-clamp-2"
                      style={{ color: "var(--color-text-medium)" }}
                    >
                      {s.objective || "Sin objetivo definido"}
                    </p>
                    <div
                      className="flex gap-4 text-xs"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      <span>{s.credits} créditos</span>
                      <span>{s.topicCount} temas</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Hueco para secciones futuras */}
        <section className="mt-12" aria-label="Secciones próximamente">
          <div
            className="rounded-lg border border-dashed p-6 text-sm"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text-muted)",
            }}
          >
            Próximamente: gestión de cursos, periodos académicos y usuarios.
          </div>
        </section>
      </main>

      {showCreate && (
        <CreateSubjectModal
          name={name}
          slug={slug}
          code={code}
          credits={credits}
          objective={objective}
          specificObjectives={specificObjectives}
          saving={saving}
          onName={(v) => {
            setName(v);
            // Sugerir el slug a partir del nombre (editable después).
            setSlug(generarSlug(v));
          }}
          onSlug={(v) => setSlug(v)}
          onCode={setCode}
          onCredits={setCredits}
          onObjective={setObjective}
          onUpdateObjective={updateObjective}
          onAddObjective={addObjective}
          onRemoveObjective={removeObjective}
          onSubmit={handleCreate}
          onClose={() => {
            setShowCreate(false);
            resetForm();
          }}
        />
      )}
    </div>
  );
}

interface ModalProps {
  name: string;
  slug: string;
  code: string;
  credits: string;
  objective: string;
  specificObjectives: string[];
  saving: boolean;
  onName: (v: string) => void;
  onSlug: (v: string) => void;
  onCode: (v: string) => void;
  onCredits: (v: string) => void;
  onObjective: (v: string) => void;
  onUpdateObjective: (i: number, v: string) => void;
  onAddObjective: () => void;
  onRemoveObjective: (i: number) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

function CreateSubjectModal(props: ModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-subject-title"
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg p-6"
        style={{ background: "var(--color-surface)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2
            id="create-subject-title"
            className="text-lg font-semibold"
            style={{ color: "var(--color-text-dark)" }}
          >
            Nueva asignatura
          </h2>
          <button
            type="button"
            onClick={props.onClose}
            aria-label="Cerrar"
            className="btn btn-ghost p-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={props.onSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="s-name"
              className="block text-sm font-medium mb-1"
              style={{ color: "var(--color-text-dark)" }}
            >
              Nombre <span aria-hidden="true">*</span>
            </label>
            <input
              id="s-name"
              type="text"
              required
              value={props.name}
              onChange={(e) => props.onName(e.target.value)}
              className="w-full p-2 border rounded-md outline-none focus:ring-2"
              style={{ borderColor: "var(--color-border)" }}
            />
          </div>

          <div>
            <label
              htmlFor="s-slug"
              className="block text-sm font-medium mb-1"
              style={{ color: "var(--color-text-dark)" }}
            >
              Slug <span aria-hidden="true">*</span>
            </label>
            <input
              id="s-slug"
              type="text"
              required
              value={props.slug}
              onChange={(e) => props.onSlug(e.target.value)}
              placeholder="slug-de-la-asignatura"
              className="w-full p-2 border rounded-md outline-none focus:ring-2 font-mono"
              style={{ borderColor: "var(--color-border)" }}
            />
            <p
              className="text-xs mt-1"
              style={{ color: "var(--color-text-muted)" }}
            >
              Se sugiere a partir del nombre; puedes editarlo.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="s-code"
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--color-text-dark)" }}
              >
                Código <span aria-hidden="true">*</span>
              </label>
              <input
                id="s-code"
                type="text"
                required
                value={props.code}
                onChange={(e) => props.onCode(e.target.value)}
                className="w-full p-2 border rounded-md outline-none focus:ring-2 font-mono"
                style={{ borderColor: "var(--color-border)" }}
              />
            </div>
            <div>
              <label
                htmlFor="s-credits"
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--color-text-dark)" }}
              >
                Créditos
              </label>
              <input
                id="s-credits"
                type="number"
                min="0"
                value={props.credits}
                onChange={(e) => props.onCredits(e.target.value)}
                className="w-full p-2 border rounded-md outline-none focus:ring-2"
                style={{ borderColor: "var(--color-border)" }}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="s-objective"
              className="block text-sm font-medium mb-1"
              style={{ color: "var(--color-text-dark)" }}
            >
              Objetivo general
            </label>
            <textarea
              id="s-objective"
              rows={3}
              value={props.objective}
              onChange={(e) => props.onObjective(e.target.value)}
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
              {props.specificObjectives.map((obj, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: lista editable controlada sin id estable; solo se agrega/quita al final
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={obj}
                    onChange={(e) => props.onUpdateObjective(i, e.target.value)}
                    placeholder={`Objetivo específico ${i + 1}`}
                    aria-label={`Objetivo específico ${i + 1}`}
                    className="flex-1 p-2 border rounded-md outline-none focus:ring-2"
                    style={{ borderColor: "var(--color-border)" }}
                  />
                  {props.specificObjectives.length > 1 && (
                    <button
                      type="button"
                      onClick={() => props.onRemoveObjective(i)}
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
              onClick={props.onAddObjective}
              className="btn btn-ghost text-sm mt-2"
            >
              <Plus className="w-4 h-4" /> Añadir objetivo
            </button>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={props.onClose}
              className="btn btn-ghost text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={props.saving}
              className="btn btn-primary text-sm disabled:opacity-50"
            >
              {props.saving ? "Guardando..." : "Crear asignatura"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
