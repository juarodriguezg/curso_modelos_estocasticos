"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  Calendar,
  ChevronDown,
  ChevronRight,
  BookOpen,
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

export default function Sidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [openPartes, setOpenPartes] = useState<string[]>([])
  const [openSecciones, setOpenSecciones] = useState<string[]>([])
  const [structure, setStructure] = useState<Parte[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(false)

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

  // Auto-expand the parte that contains the current page
  useEffect(() => {
    if (!pathname || structure.length === 0) return
    for (const parte of structure) {
      for (const sec of parte.secciones) {
        if (pathname === sec.enlace || sec.subtemas.some(s => pathname === s.enlace)) {
          if (!openPartes.includes(parte.titulo)) {
            setOpenPartes(prev => [...prev, parte.titulo])
          }
          if (sec.subtemas.length > 0 && !openSecciones.includes(sec.titulo)) {
            setOpenSecciones(prev => [...prev, sec.titulo])
          }
          return
        }
      }
    }
  }, [pathname, structure])

  const isActive = (enlace: string) => pathname === enlace

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
          <Link
            href="/calendario"
            className={`sidebar-link flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${
              isActive('/calendario') ? 'sidebar-link-active' : ''
            }`}
          >
            <Calendar size={20} />
            {!isCollapsed && <span>Calendario</span>}
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
          structure.map((parte, i) => (
            <div key={i} className="mb-2 text-left">
              {/* Parte */}
              <button
                onClick={() => toggleParte(parte.titulo)}
                className="sidebar-link flex w-full items-start justify-between font-semibold py-2.5 px-3 rounded-lg transition text-left"
              >
                <span className="text-left leading-snug text-sm">
                  {parte.titulo}
                </span>
                {openPartes.includes(parte.titulo) ? (
                  <ChevronDown size={16} className="mt-0.5 flex-shrink-0 opacity-60" />
                ) : (
                  <ChevronRight size={16} className="mt-0.5 flex-shrink-0 opacity-60" />
                )}
              </button>

              {/* Secciones */}
              {openPartes.includes(parte.titulo) && (
                <div className="pl-3 space-y-0.5 mt-1 animate-slideDown">
                  {parte.secciones.map((sec, j) => (
                    <div key={j}>
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
                                toggleSeccion(sec.titulo)
                              }}
                              className="p-1 rounded-lg hover:bg-white/10 transition"
                            >
                              {openSecciones.includes(sec.titulo) ? (
                                <ChevronDown size={14} className="opacity-60" />
                              ) : (
                                <ChevronRight size={14} className="opacity-60" />
                              )}
                            </button>
                          </div>

                          {openSecciones.includes(sec.titulo) && (
                            <ul className="pl-3 mt-0.5 text-sm space-y-0.5 animate-slideDown">
                              {sec.subtemas.map((sub, k) => (
                                <li key={k}>
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
          ))}
      </nav>
    </aside>
  )
}