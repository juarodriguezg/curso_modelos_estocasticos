"use client"
import { useState } from "react"
import Link from "next/link"
import { Home, Calendar, BookOpen, Settings, Menu } from "lucide-react"

export default function Sidebar() {
  const [open, setOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openCursos, setOpenCursos] = useState(true)

  const cursos = [
    { titulo: "Variables Aleatorias", enlace: "/temas/variables" },
    { titulo: "Cadenas de Markov", enlace: "/temas/markov" },
    { titulo: "Procesos de Poisson", enlace: "/temas/poisson" },
    { titulo: "Teoría de Colas", enlace: "/temas/colas" },
  ]

  return (
    <>
      {/* Botón hamburguesa en móviles */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden p-3 fixed top-4 left-4 z-50 rounded-md"
        style={{ backgroundColor: "var(--color-button)", color: "var(--color-text-light)" }}
      >
        <Menu size={20} />
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen shadow-md transition-all duration-300
          ${open ? "w-64" : "w-16"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
        style={{ backgroundColor: "var(--color-section)", color: "var(--color-text-light)" }}
      >
        {/* Header del sidebar */}
        <div
          className="flex items-center justify-between py-5 px-4 font-bold text-lg shadow-md"
          style={{ backgroundColor: "var(--color-header)", color: "var(--color-text-light)" }}
        >
          {open && <span> Curso</span>}
          <button
            onClick={() => (mobileOpen ? setMobileOpen(false) : setOpen(!open))}
            className="ml-auto"
          >
            {mobileOpen ? "✖" : open ? "⇤" : "⇥"}
          </button>
        </div>

        {/* Links principales */}
        <nav className="flex-1 overflow-y-auto px-2 py-4">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[color:var(--color-button)] transition"
          >
            <Home size={18} />
            {open && <span>Inicio</span>}
          </Link>

          <Link
            href="/calendario"
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[color:var(--color-button)] transition"
          >
            <Calendar size={18} />
            {open && <span>Calendario</span>}
          </Link>

          {/* Sección de cursos */}
          <div className="mt-6">
            <button
              onClick={() => setOpenCursos(!openCursos)}
              className="flex items-center justify-between w-full px-3 py-2 font-semibold rounded-md hover:bg-[color:var(--color-button)]"
            >
              <span className="flex items-center gap-3">
                <BookOpen size={18} />
                {open && "Cursos"}
              </span>
              {open && <span>{openCursos ? "▾" : "▸"}</span>}
            </button>

            {open && openCursos && (
              <ul className="mt-2 pl-6 space-y-1 text-sm">
                {cursos.map((curso, idx) => (
                  <li key={idx}>
                    <Link
                      href={curso.enlace}
                      className="block px-2 py-1 rounded hover:bg-[color:var(--color-button)]"
                    >
                      {curso.titulo}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </nav>

        {/* Footer del sidebar */}
        <div className="px-3 py-4 border-t border-[color:var(--color-button)]">
          <Link
            href="/ajustes"
            className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-[color:var(--color-button)] transition"
          >
            <Settings size={18} />
            {open && <span>Ajustes</span>}
          </Link>
        </div>
      </aside>
    </>
  )
}
