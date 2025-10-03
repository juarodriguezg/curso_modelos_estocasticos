import Footer from "@/components/Footer"
import Sidebar from "@/components/Sidebar"
import "katex/dist/katex.min.css"

interface ClassLayoutProps {
  title: string
  resumen: React.ReactNode
  videoUrl: string
  materialUrl?: string
  tareas?: { nombre: string; enlace: string }[]
}

export default function ClassLayout({
  title,
  resumen,
  videoUrl,
  materialUrl,
  tareas = [],
}: ClassLayoutProps) {
  return (
    <div className="flex min-h-screen [background:var(--color-background)]">
      {/* Sidebar fijo */}
      <Sidebar />

      {/* Contenido principal */}
      <div className="flex flex-col flex-grow">
        {/* Encabezado */}
        <header className="flex justify-between items-center [background:var(--color-header)] px-8 py-4 shadow-md">
          <div className="flex-1"></div>
          <h1 className="text-3xl font-bold [color:var(--color-text-light)] text-center flex-1">
            {title}
          </h1>
          <div className="flex-1 text-right">
            <a
              href="/temas"
              className="px-4 py-2 [background:var(--color-button)] [color:var(--color-text-light)] rounded-md hover:[background:var(--color-section)] transition"
            >
              Volver a Temas
            </a>
          </div>
        </header>

        {/* Contenido */}
        <main className="flex-grow max-w-4xl mx-auto p-8 space-y-12">
          {/* Resumen */}
          <section className="[background:var(--color-section)] p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold [color:var(--color-text-dark)] mb-3">
              Resumen
            </h2>
            <div className="[color:var(--color-text-light)] leading-relaxed space-y-4">
              {resumen}
            </div>
          </section>

          {/* Video */}
          <section className="[background:var(--color-section)] p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold [color:var(--color-text-dark)] mb-3">
              Video sobre el tema
            </h2>
            <div className="aspect-video">
              <iframe
                className="w-full h-full rounded-lg shadow-md"
                src={videoUrl}
                title={`Video sobre ${title}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
              ></iframe>
            </div>
          </section>

          {/* Material complementario */}
          {materialUrl && (
            <section className="[background:var(--color-section)] p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold [color:var(--color-text-dark)] mb-3">
                Material complementario
              </h2>
              <a
                href={materialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 [background:var(--color-button)] [color:var(--color-text-light)] rounded-lg shadow hover:[background:var(--color-section)] transition"
              >
                Descargar PDF
              </a>
            </section>
          )}

          {/* Tareas */}
          {tareas.length > 0 && (
            <section className="[background:var(--color-section)] p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold [color:var(--color-text-dark)] mb-3">
                Tareas relacionadas
              </h2>
              <ul className="list-disc list-inside space-y-2 [color:var(--color-background)]">
                {tareas.map((t, i) => (
                  <li key={i}>
                    <a
                      href={t.enlace}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[color:var(--color-background)] hover:underline"
                    >
                      {t.nombre}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </main>

        <Footer />
      </div>
    </div>
  )
}
