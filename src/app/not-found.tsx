import Link from "next/link"

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center text-center px-6"
      style={{
        backgroundColor: "var(--color-background)",
        color: "var(--color-header)",
      }}
    >
      <h1 className="text-5xl font-bold mb-4">🚧 Nos encontramos trabajando 🚧</h1>
      <p className="text-lg max-w-xl mb-8 [color:var(--color-text-medium)]">
        Esta sección del curso todavía está en construcción o siendo actualizada.
        Pronto podrás acceder al contenido completo.
      </p>
      <Link
        href="/"
        className="px-6 py-3 rounded-md shadow-md [background:var(--color-button)] [color:var(--color-text-light)] hover:[background:var(--color-section)] transition"
      >
        Volver al inicio
      </Link>
    </main>
  )
}
