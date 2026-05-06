import Footer from "@/components/Footer"

export default function Temas() {
  const temas = [
    {
      titulo: "Variables Aleatorias",
      descripcion: "Definición, funciones de probabilidad y distribuciones clásicas.",
      enlace: "/temas/variables",
    },
    {
      titulo: "Cadenas de Markov",
      descripcion: "Procesos estocásticos con memoria de un paso, aplicaciones y ejemplos.",
      enlace: "/temas/markov",
    },
    {
      titulo: "Procesos de Poisson",
      descripcion: "Modelos de conteo, intervalos entre llegadas y usos en sistemas reales.",
      enlace: "/temas/poisson",
    },
    {
      titulo: "Teoría de Colas",
      descripcion: "Modelos de espera, rendimiento y simulaciones M/M/1, M/M/c.",
      enlace: "/temas/colas",
    },
  ]

  return (
    <main className="min-h-screen flex flex-col [background:var(--color-background)]">
      {/* Contenido principal */}
      <div className="flex-grow max-w-4xl mx-auto p-10">
        {/* Encabezado */}
        <h1 className="text-4xl font-bold [color:var(--color-header)] mb-6 text-center">
          Directorio de Temas
        </h1>
        <p className="text-center text-lg [color:var(--color-text-medium)] mb-10">
          Selecciona un tema para acceder a los contenidos del curso.
        </p>

        {/* Lista de tarjetas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {temas.map((tema, index) => (
            <a
              key={index}
              href={tema.enlace}
              className="[background:var(--color-section)] p-6 rounded-xl shadow-md hover:shadow-lg transition block"
            >
              <h2 className="text-2xl font-semibold [color:var(--color-header)] mb-2">
                {tema.titulo}
              </h2>
              <p className="[color:var(--color-text-light)]">{tema.descripcion}</p>
            </a>
          ))}
        </div>

        {/* Botón de regreso */}
        <div className="text-center mt-12">
          <a
            href="/"
            className="px-6 py-3 [background:var(--color-button)] [color:var(--color-text-light)] rounded-full shadow-lg hover:[background:var(--color-section)] transition"
          >
            ← Volver al inicio
          </a>
        </div>
      </div>

      {/* Footer fijo al fondo */}
      <Footer />
    </main>
  )
}
