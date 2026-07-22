"use client"

import Link from "next/link"

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center text-center p-8 animate-fadeIn"
      style={{ background: 'var(--color-background)', color: 'var(--color-text-dark)' }}>
      <div className="text-8xl mb-6">🔍</div>
      <h1 className="text-5xl font-bold mb-4" style={{ color: 'var(--color-header)' }}>
        Página no encontrada
      </h1>
      <p className="text-lg mb-8 max-w-md" style={{ color: 'var(--color-text-medium)' }}>
        La página que buscas no existe o aún no se encuentra disponible.
      </p>
      <Link
        href="/"
        className="btn btn-primary text-base px-8 py-3"
      >
        ← Volver al inicio
      </Link>
    </main>
  )
}
