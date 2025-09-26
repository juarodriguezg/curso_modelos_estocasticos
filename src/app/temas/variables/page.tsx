export default function Variables() {
  return (
    <main className="min-h-screen bg-gray-50 p-10">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Título */}
        <h1 className="text-4xl font-bold text-indigo-700">
          Variables Aleatorias
        </h1>

        {/* Resumen */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">
            Resumen
          </h2>
          <p className="text-lg text-gray-700 leading-relaxed">
            Una <strong>variable aleatoria</strong> es una función que asigna un valor
            numérico a cada resultado posible de un experimento aleatorio. Existen
            dos tipos principales: <em>discretas</em>, cuando toman valores finitos o
            contables (por ejemplo, el número de caras al lanzar una moneda varias
            veces), y <em>continuas</em>, cuando pueden asumir infinitos valores en un
            intervalo (como la altura o el tiempo de espera). Son esenciales en
            probabilidad y estadística porque permiten modelar la incertidumbre y
            analizar fenómenos en áreas como ingeniería, ciencias sociales y economía.
          </p>
        </section>

        {/* Video embebido */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">
            Video introductorio
          </h2>
          <div className="aspect-video">
            <iframe
              className="w-full h-full rounded-lg shadow-md"
              src="https://www.youtube.com/embed/U33OftLWdu4"
              title="Video sobre Variables Aleatorias"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </section>

        {/* PDF */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">
            Material complementario
          </h2>
          <p className="text-gray-700 mb-4">
            Puedes descargar el siguiente archivo PDF como recurso de apoyo:
          </p>
          <a
            href="/ME01 Enunciado y entrega del Taller No  01 Simulación de MANET.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition"
          >
            📑 Descargar PDF
          </a>
        </section>

        {/* Botón volver */}
        <div className="mt-10">
          <a
            href="/temas"
            className="text-indigo-600 underline hover:text-indigo-800"
          >
            ← Volver al directorio de temas
          </a>
        </div>
      </div>
    </main>
  )
}
