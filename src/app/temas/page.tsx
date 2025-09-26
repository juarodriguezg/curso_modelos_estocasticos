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
      enlace: "/temas/variables",
    },
    {
      titulo: "Procesos de Poisson",
      descripcion: "Modelos de conteo, intervalos entre llegadas y usos en sistemas reales.",
      enlace: "/temas/variables",
    },
    {
      titulo: "Teoría de Colas",
      descripcion: "Modelos de espera, rendimiento y simulaciones M/M/1, M/M/c.",
      enlace: "/temas/variables",
    },
  ]

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-200 p-10">
      <div className="max-w-4xl mx-auto">
        {/* Encabezado */}
        <h1 className="text-4xl font-bold text-indigo-700 mb-6 text-center">
          Directorio de Temas
        </h1>
        <p className="text-center text-lg text-gray-700 mb-10">
          Selecciona un tema para acceder a los contenidos del curso.
        </p>

        {/* Lista de tarjetas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {temas.map((tema, index) => (
            <a
              key={index}
              href={tema.enlace}
              className="block bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition"
            >
              <h2 className="text-2xl font-semibold text-indigo-600 mb-2">
                {tema.titulo}
              </h2>
              <p className="text-gray-700">{tema.descripcion}</p>
            </a>
          ))}
        </div>

        {/* Botón de regreso */}
        <div className="text-center mt-12">
          <a
            href="/"
            className="px-6 py-3 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition"
          >
            ← Volver al inicio
          </a>
        </div>
      </div>
    </main>
  )
}

