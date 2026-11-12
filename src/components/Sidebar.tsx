"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  ChevronDown,
  ChevronRight,
  BookOpen,
  GraduationCap,
  Menu,
  Moon,
  Sun,
} from "lucide-react"

interface Subtema {
  slug: string
  titulo: string
  enlace: string
}

interface Seccion {
  slug: string
  titulo: string
  enlace: string
  subtemas: Subtema[]
}

interface Parte {
  titulo: string
  secciones: Seccion[]
}

// Asignatura (primer nivel del menú). id = null agrupa los temas sin asignatura.
interface Asignatura {
  id: string | null
  code: string | null
  titulo: string
  partes: Parte[]
}

const asignaturaKey = (a: Asignatura) => a.id ?? "otros"
// Dos asignaturas pueden tener partes con el mismo nombre
const parteKey = (a: Asignatura, p: Parte) => `${asignaturaKey(a)}/${p.titulo}`

export default function Sidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [closedAsignaturas, setClosedAsignaturas] = useState<string[]>([])
  const [openPartes, setOpenPartes] = useState<string[]>([])
  const [openSecciones, setOpenSecciones] = useState<string[]>([])
  const [structure, setStructure] = useState<Asignatura[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(false)

  const toggleAsignatura = (key: string) => {
    setClosedAsignaturas((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const toggleParte = (parte: string) => {
    setOpenPartes((prev) =>
      prev.includes(parte) ? prev.filter((p) => p !== parte) : [...prev, parte]
    )
  }

  const toggleSeccion = (seccion: string) => {
    setOpenSecciones((prev) =>
      prev.includes(seccion)
        ? prev.filter((s) => s !== seccion)
        : [...prev, seccion]
    )
  }

  const toggleSidebar = () => setIsCollapsed(!isCollapsed)

  const toggleDarkMode = () => {
    const newMode = !darkMode
    setDarkMode(newMode)
    document.documentElement.setAttribute('data-theme', newMode ? 'dark' : 'light')
    localStorage.setItem('theme', newMode ? 'dark' : 'light')
  }

  // Cargar estructura desde la BD
  useEffect(() => {
    const loadStructure = async () => {
      try {
        const token = localStorage.getItem('token')
        const userData = localStorage.getItem('user')
        if (userData) {
          const user = JSON.parse(userData)
          setIsAdmin(user.role === 'admin')
        }

        const res = await fetch('/api/topics/structure', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })

        if (res.ok) {
          const data = await res.json()
          setStructure(data.structure)
          if (data.isAdmin) setIsAdmin(true)
        }
      } catch (error) {
        console.error('Error cargando estructura:', error)
      } finally {
        setLoading(false)
      }
    }

    // Dark mode init
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark') {
      setDarkMode(true)
      document.documentElement.setAttribute('data-theme', 'dark')
    }

    loadStructure()
  }, [])

  // Auto-expand the asignatura and parte that contain the current page
  useEffect(() => {
    if (!pathname || structure.length === 0) return
    for (const asig of structure) {
      for (const parte of asig.partes) {
        for (const sec of parte.secciones) {
          if (pathname === sec.enlace || sec.subtemas.some(s => pathname === s.enlace)) {
            const aKey = asignaturaKey(asig)
            const pKey = parteKey(asig, parte)
            setClosedAsignaturas(prev => prev.filter(k => k !== aKey))
            if (!openPartes.includes(pKey)) {
              setOpenPartes(prev => [...prev, pKey])
            }
            if (sec.subtemas.length > 0 && !openSecciones.includes(sec.slug)) {
              setOpenSecciones(prev => [...prev, sec.slug])
            }
            return
          }
        }
      }
    }
  }, [pathname, structure])

  const isActive = (enlace: string) => pathname === enlace

  // Con una sola asignatura el menú se ve como antes, sin el nivel extra
  const showAsignaturas = structure.length > 1

  const renderParte = (asig: Asignatura, parte: Parte) => {
    const pKey = parteKey(asig, parte)
    return (
      <div key={pKey} className="mb-2 text-left">
        {/* Parte */}
        <button
          onClick={() => toggleParte(pKey)}
          className="sidebar-link flex w-full items-start justify-between font-semibold py-2.5 px-3 rounded-lg transition text-left"
        >
          <span className="text-left leading-snug text-sm">
            {parte.titulo}
          </span>
          {openPartes.includes(pKey) ? (
            <ChevronDown size={16} className="mt-0.5 flex-shrink-0 opacity-60" />
          ) : (
            <ChevronRight size={16} className="mt-0.5 flex-shrink-0 opacity-60" />
          )}
        </button>

        {/* Secciones */}
        {openPartes.includes(pKey) && (
          <div className="pl-3 space-y-0.5 mt-1 animate-slideDown">
            {parte.secciones.map((sec) => (
              <div key={sec.slug}>
                {sec.subtemas && sec.subtemas.length > 0 ? (
                  <>
                    <div className="flex items-center gap-1">
                      <Link
                        href={sec.enlace}
                        className={`sidebar-link flex-1 text-sm py-1.5 px-2.5 rounded-lg transition text-left ${
                          isActive(sec.enlace) ? 'sidebar-link-active' : ''
                        }`}
                      >
                        {sec.titulo}
                      </Link>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleSeccion(sec.slug)
                        }}
                        className="p-1 rounded-lg hover:bg-white/10 transition"
                      >
                        {openSecciones.includes(sec.slug) ? (
                          <ChevronDown size={14} className="opacity-60" />
                        ) : (
                          <ChevronRight size={14} className="opacity-60" />
                        )}
                      </button>
                    </div>

                    {openSecciones.includes(sec.slug) && (
                      <ul className="pl-3 mt-0.5 text-sm space-y-0.5 animate-slideDown">
                        {sec.subtemas.map((sub) => (
                          <li key={sub.slug}>
                            <Link
                              href={sub.enlace}
                              className={`sidebar-link block px-2.5 py-1.5 rounded-lg transition text-left text-[0.82rem] ${
                                isActive(sub.enlace) ? 'sidebar-link-active' : ''
                              }`}
                            >
                              {sub.titulo}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <Link
                    href={sec.enlace}
                    className={`sidebar-link block w-full text-sm py-1.5 px-2.5 rounded-lg transition text-left ${
                      isActive(sec.enlace) ? 'sidebar-link-active' : ''
                    }`}
                  >
                    {sec.titulo}
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <aside
      className={`sidebar fixed top-0 left-0 h-screen transition-all duration-300 shadow-lg overflow-y-auto z-40 ${
        isCollapsed ? "w-20" : "w-80"
      }`}
    >
      {/* Header */}
      <div className="sidebar-header flex items-center justify-between px-4 py-4 font-bold text-lg border-b border-white/10">
        {!isCollapsed && (
          <span className="flex items-center gap-2">
            <BookOpen size={22} /> Curso
          </span>
        )}
        <button
          onClick={toggleSidebar}
          className="ml-auto p-1.5 rounded-lg hover:bg-white/10 transition"
          aria-label="Toggle sidebar"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Navegación */}
      <nav className="px-3 py-4 text-[0.9rem] text-left space-y-1">
        {/* Accesos rápidos */}
        <div className="space-y-1 mb-4">
          <Link
            href="/"
            className={`sidebar-link flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${
              isActive('/') ? 'sidebar-link-active' : ''
            }`}
          >
            <Home size={20} />
            {!isCollapsed && <span>Inicio</span>}
          </Link>
        </div>

        {/* Dark mode toggle */}
        {!isCollapsed && (
          <button
            onClick={toggleDarkMode}
            className="sidebar-link flex items-center gap-3 px-3 py-2.5 rounded-lg transition w-full text-left mb-4"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            <span>{darkMode ? 'Modo claro' : 'Modo oscuro'}</span>
          </button>
        )}

        {/* Divider */}
        {!isCollapsed && <div className="border-t border-white/10 my-3" />}

        {/* Estructura dinámica */}
        {!isCollapsed && loading && (
          <div className="space-y-3 px-2">
            {[1,2,3].map(i => (
              <div key={i} className="skeleton h-8 rounded-lg" />
            ))}
          </div>
        )}

        {!isCollapsed &&
          !loading &&
          !showAsignaturas &&
          structure.flatMap((asig) => asig.partes.map((parte) => renderParte(asig, parte)))}

        {!isCollapsed &&
          !loading &&
          showAsignaturas &&
          structure.map((asig) => {
            const aKey = asignaturaKey(asig)
            const open = !closedAsignaturas.includes(aKey)
            return (
              <div key={aKey} className="mb-3 text-left">
                {/* Asignatura */}
                <button
                  type="button"
                  onClick={() => toggleAsignatura(aKey)}
                  aria-expanded={open}
                  className="sidebar-link flex w-full items-center justify-between gap-2 py-2 px-3 rounded-lg transition text-left font-bold uppercase tracking-wide text-xs"
                >
                  <span className="flex items-center gap-2 leading-snug">
                    <GraduationCap size={16} className="flex-shrink-0 opacity-80" />
                    {asig.titulo}
                  </span>
                  {open ? (
                    <ChevronDown size={16} className="flex-shrink-0 opacity-60" />
                  ) : (
                    <ChevronRight size={16} className="flex-shrink-0 opacity-60" />
                  )}
                </button>

                {/* Partes */}
                {open && (
                  <div className="pl-2 mt-1 animate-slideDown">
                    {asig.partes.map((parte) => renderParte(asig, parte))}
                  </div>
                )}
              </div>
            )
          })}
      </nav>
    </aside>
  )
}