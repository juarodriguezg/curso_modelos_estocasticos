"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { rutasValidas } from "@/lib/validRoutes"

export default function NotFound() {
  const [rutaActual, setRutaActual] = useState("")
  const [esRutaValida, setEsRutaValida] = useState(false)

  useEffect(() => {
    const path = window.location.pathname
    setRutaActual(path)
    setEsRutaValida(rutasValidas.includes(path))
  }, [])

  if (!rutaActual) {
    // Mientras se detecta la ruta
    return (
      <main className="min-h-screen flex items-center justify-center [background:var(--color-background)] [color:var(--color-text-dark)]">
        <p>Cargando...</p>
      </main>
    )
  }

  if (esRutaValida) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center [background:var(--color-background)] [color:var(--color-text-dark)] text-center p-8">
        <h1 className="text-5xl font-bold mb-4 [color:var(--color-header)]">
          🚧 Nos encontramos trabajando en esta sección
        </h1>
        <p className="text-lg mb-6 [color:var(--color-text-medium)] max-w-xl">
          Este tema forma parte del contenido del curso, pero aún no se encuentra disponible.
        </p>
        <Link
          href="/"
          className="px-6 py-3 rounded-full [background:var(--color-button)] [color:var(--color-text-light)] hover:[background:var(--color-section)] transition shadow-md"
        >
          Volver al inicio
        </Link>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center [background:var(--color-background)] [color:var(--color-text-dark)] text-center p-8">
      <h1 className="text-6xl font-bold mb-4 [color:var(--color-header)]">
        404
      </h1>
      <p className="text-lg mb-6 [color:var(--color-text-medium)]">
        La página que intentas visitar no existe.
      </p>
      <Link
        href="/"
        className="px-6 py-3 rounded-full [background:var(--color-button)] [color:var(--color-text-light)] hover:[background:var(--color-section)] transition shadow-md"
      >
        Volver al inicio
      </Link>
    </main>
  )
}
