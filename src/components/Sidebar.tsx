"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Home,
  Calendar,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Menu,
} from "lucide-react"

interface Subtema {
  titulo: string
  enlace?: string
}

interface Seccion {
  titulo: string
  subtemas?: Subtema[]
  enlace?: string
}

interface Parte {
  titulo: string
  secciones: Seccion[]
}

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [openPartes, setOpenPartes] = useState<string[]>([])
  const [openSecciones, setOpenSecciones] = useState<string[]>([])

  const toggleParte = (parte: string) => {
    setOpenPartes((prev) =>
      prev.includes(parte)
        ? prev.filter((p) => p !== parte)
        : [...prev, parte]
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

  // Estructura del curso
  const contenido: Parte[] = [
    {
      titulo: "Parte 1: Vectores Aleatorios",
      secciones: [
        { titulo: "Experimentos aleatorios y espacios de probabilidad" },
        { titulo: "Variables y vectores aleatorios" },
        { titulo: "Esperanza matemática" },
        { titulo: "Transformaciones de vectores aleatorios" },
      ],
    },
    {
      titulo: "Parte 2: Procesos Estocásticos",
      secciones: [
        {
          titulo: "Procesos estocásticos",
          subtemas: [
            {
              titulo:
                "Definición de serie de tiempo y de proceso estocástico",
            },
          ],
        },
        {
          titulo: "Series de tiempo",
          subtemas: [
            { titulo: "Funciones de autocovarianza y autocorrelación" },
            { titulo: "Procesos de ruido blanco" },
            {
              titulo:
                "Estimación de funciones de la media, autocovarianza y autocorrelación",
            },
            { titulo: "Modelos de series de tiempo estacionarios" },
          ],
        },
        {
          titulo: "Razonamiento probabilístico",
          subtemas: [{ titulo: "Cadenas de Markov" }],
        },
      ],
    },
    {
      titulo: "Parte 3: Teoría del Teletráfico",
      secciones: [
        {
          titulo: "Modelo M/M/1 en detalle",
          subtemas: [
            { titulo: "Notación de Kendall y medidas de desempeño" },
            { titulo: "Sistemas de líneas de espera (M/M/1)" },
            { titulo: "Ley de Little y teorema de Burke" },
          ],
        },
        {
          titulo: "Modelo M/M/1 de estado dependiente",
          subtemas: [
            { titulo: "Sistema general de estado dependiente" },
            { titulo: "Fórmulas B, B extendida y C" },
            { titulo: "Sistemas de línea de espera (G/G/1)" },
          ],
        },
      ],
    },
    {
      titulo: "Parte 4: Simulación de Redes de Telecomunicaciones",
      secciones: [
        {
          titulo: "Teorema fundamental unidimensional",
          subtemas: [
            {
              titulo:
                "Funciones percentiles conjuntas y teorema fundamental de la simulación",
            },
            {
              titulo:
                "Arquitectura general de un simulador de sistemas complejos",
            },
            {
              titulo:
                "Funciones percentiles truncadas y contaminadas conjuntas",
            },
          ],
        },
        {
          titulo: "Teorema fundamental multidimensional",
          subtemas: [
            { titulo: "Modelos de movilidad" },
            {
              titulo:
                "Lenguajes de programación para simulación de redes",
            },
          ],
        },
        {
          titulo: "Funciones percentiles generalizadas",
          subtemas: [
            { titulo: "Funciones percentiles generalizadas (DLG)" },
          ],
        },
      ],
    },
    {
      titulo: "Parte 5: Teoría de la Decisión",
      secciones: [
        { titulo: "Decisiones bajo incertidumbre" },
        { titulo: "Teoría de la utilidad" },
        { titulo: "Teoría del riesgo y árboles de decisión" },
        { titulo: "Entropía y valor de la información" },
        { titulo: "Decisiones en comunidades de agentes" },
        { titulo: "Decisiones multiobjetivo" },
      ],
    },
    {
      titulo: "Parte 6: Convergencia en Probabilidad y Distribución",
      secciones: [
        {
          titulo: "Convergencia en variables aleatorias",
          subtemas: [
            { titulo: "Muestreo y distribuciones muestrales" },
            { titulo: "Estimación puntual y por intervalos" },
            { titulo: "Prueba de hipótesis" },
            { titulo: "Convergencia y teoremas límite" },
          ],
        },
        {
          titulo: "Convergencia en vectores aleatorios",
          subtemas: [
            { titulo: "Ley de los grandes números para vectores" },
            { titulo: "Teorema del límite central" },
          ],
        },
      ],
    },
  ]

  return (
    <aside
      className={`fixed top-0 left-0 h-screen transition-all duration-300 shadow-lg overflow-y-auto ${
        isCollapsed ? "w-20" : "w-80"
      }`}
      style={{
        backgroundColor: "var(--color-section)",
        color: "var(--color-text-light)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-4 font-bold text-lg border-b"
        style={{
          backgroundColor: "var(--color-header)",
          borderColor: "var(--color-button)",
        }}
      >
        {!isCollapsed && (
          <span className="flex items-center gap-2">
            <BookOpen size={22} /> Curso
          </span>
        )}
        <button
          onClick={toggleSidebar}
          className="ml-auto p-1 rounded hover:bg-[color:var(--color-button)] transition"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Navegación */}
      <nav className="px-4 py-4 text-[1rem] text-left space-y-2">
        {/* Accesos rápidos */}
        <div className="space-y-2 mb-4">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[color:var(--color-button)] transition"
          >
            <Home size={20} />
            {!isCollapsed && <span>Inicio</span>}
          </Link>
          <Link
            href="/calendario"
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[color:var(--color-button)] transition"
          >
            <Calendar size={20} />
            {!isCollapsed && <span>Calendario</span>}
          </Link>
        </div>

        {/* Estructura */}
        {!isCollapsed &&
          contenido.map((parte, i) => (
            <div key={i} className="mb-3 text-left">
              {/* Parte */}
              <button
                onClick={() => toggleParte(parte.titulo)}
                className="flex w-full items-start justify-between font-semibold py-2 px-2 rounded-md hover:bg-[color:var(--color-button)] transition text-left"
              >
                <span className="text-left leading-snug">
                  {parte.titulo}
                </span>
                {openPartes.includes(parte.titulo) ? (
                  <ChevronDown
                    size={18}
                    className="mt-1 flex-shrink-0"
                  />
                ) : (
                  <ChevronRight
                    size={18}
                    className="mt-1 flex-shrink-0"
                  />
                )}
              </button>

              {/* Secciones */}
              {openPartes.includes(parte.titulo) && (
                <div className="pl-4 space-y-1 mt-1">
                  {parte.secciones.map((sec, j) => {
                    const secLink = `/temas/${sec.titulo
                      .toLowerCase()
                      .replaceAll(/[()–.]/g, "")
                      .replaceAll(/\s+/g, "-")}`

                    return (
                      <div key={j}>
                        {sec.subtemas ? (
                          <>
                            <button
                              onClick={() => toggleSeccion(sec.titulo)}
                              className="flex w-full items-start justify-between text-sm font-medium py-1 px-2 rounded-md hover:bg-[color:var(--color-button)] transition text-left"
                            >
                              <span className="text-left leading-snug">
                                {sec.titulo}
                              </span>
                              {openSecciones.includes(sec.titulo) ? (
                                <ChevronDown
                                  size={14}
                                  className="mt-1 flex-shrink-0"
                                />
                              ) : (
                                <ChevronRight
                                  size={14}
                                  className="mt-1 flex-shrink-0"
                                />
                              )}
                            </button>

                            {openSecciones.includes(sec.titulo) && (
                              <ul className="pl-4 mt-1 text-sm space-y-1">
                                {sec.subtemas.map((sub, k) => (
                                  <li key={k}>
                                    <Link
                                      href={`/temas/${sub.titulo
                                        .toLowerCase()
                                        .replaceAll(/[()–.]/g, "")
                                        .replaceAll(/\s+/g, "-")}`}
                                      className="block px-2 py-1 rounded hover:bg-[color:var(--color-button)] transition text-left"
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
                            href={secLink}
                            className="block w-full text-sm font-medium py-1 px-2 rounded-md hover:bg-[color:var(--color-button)] transition text-left"
                          >
                            {sec.titulo}
                          </Link>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
      </nav>
    </aside>
  )
}
