"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const SECTIONS = [
  { href: "/admin/dashboard", label: "Asignaturas" },
  { href: "/admin/dashboard/periodos", label: "Periodos" },
  { href: "/admin/dashboard/cursos", label: "Cursos" },
];

// Navegación entre las secciones del panel de administración.
export function AdminNav() {
  const pathname = usePathname();
  const current = (href: string) =>
    href === "/admin/dashboard"
      ? pathname === href || pathname.startsWith("/admin/dashboard/subjects")
      : pathname.startsWith(href);

  return (
    <nav
      aria-label="Secciones del panel"
      className="flex gap-1 border-b mb-6 overflow-x-auto"
      style={{ borderColor: "var(--color-border)" }}
    >
      {SECTIONS.map((s) => (
        <Link
          key={s.href}
          href={s.href}
          aria-current={current(s.href) ? "page" : undefined}
          className="px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap"
          style={{
            borderColor: current(s.href)
              ? "var(--color-accent)"
              : "transparent",
            color: current(s.href)
              ? "var(--color-accent)"
              : "var(--color-text-muted)",
          }}
        >
          {s.label}
        </Link>
      ))}
    </nav>
  );
}

// Marco de las páginas nuevas del panel (periodos y cursos).
export function AdminShell({
  title,
  backHref = "/admin/dashboard",
  children,
}: {
  title: string;
  backHref?: string;
  children: ReactNode;
}) {
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link
            href={backHref}
            className="flex items-center gap-2 text-sm hover:underline"
            style={{ color: "var(--color-text-medium)" }}
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Volver
          </Link>
          <h1
            className="text-xl font-semibold"
            style={{ color: "var(--color-header)" }}
          >
            {title}
          </h1>
        </div>
      </header>
      <main className="flex-grow max-w-6xl mx-auto px-4 sm:px-6 py-8 w-full">
        <AdminNav />
        {children}
      </main>
    </div>
  );
}

export function StatusBadge({ status }: { status: "ACTIVE" | "FINALIZED" }) {
  const active = status === "ACTIVE";
  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-xs font-medium"
      style={{
        background: active ? "var(--color-success)" : "var(--color-text-muted)",
        color: "white",
      }}
    >
      {active ? "Activo" : "Finalizado"}
    </span>
  );
}

export const inputClass = "w-full p-2 border rounded text-sm";
export const inputStyle = {
  borderColor: "var(--color-border)",
  background: "var(--color-surface)",
  color: "var(--color-text-dark)",
};
export const labelClass = "block text-sm font-medium mb-1";
