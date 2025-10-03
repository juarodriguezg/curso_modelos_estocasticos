import Footer from "@/components/Footer"
import Sidebar from "@/components/Sidebar"

export default function Variables() {
  return (
    <div className="flex min-h-screen [background:var(--color-background)]">
      {/* Sidebar fijo a la izquierda */}
      <Sidebar />

      {/* Contenedor principal */}
      <div className="flex flex-col flex-grow">
        {/* Encabezado */}
        <header className="flex justify-between items-center [background:var(--color-header)] px-8 py-4 shadow-md">
          <div className="flex-1"></div>

          <h1 className="text-3xl font-bold [color:var(--color-text-light)] text-center flex-1">
            Variables Aleatorias
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
          {/* Recurso 1 */}
          <section className="[background:var(--color-section)] p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold [color:var(--color-text-dark)] mb-3">
              Recurso 1: Resumen
            </h2>
            <p className="[color:var(--color-text-light)] leading-relaxed">
              Una <strong>variable aleatoria</strong> es una función que asigna un valor
              numérico a cada resultado posible de un experimento aleatorio. Existen
              dos tipos principales: <em>discretas</em> y <em>continuas</em>. Son esenciales
              en probabilidad y estadística porque permiten modelar la incertidumbre
              y analizar fenómenos en ingeniería, ciencias sociales y economía.
            </p>
          </section>

          {/* Recurso 2 */}
          <section className="[background:var(--color-section)] p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold [color:var(--color-text-dark)] mb-3">
              Recurso 2: Video introductorio
            </h2>
            <div className="aspect-video">
              <iframe
                className="w-full h-full rounded-lg shadow-md"
                src="https://www.youtube.com/embed/U33OftLWdu4"
                title="Video sobre Variables Aleatorias"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
              ></iframe>
            </div>
          </section>

          {/* Recurso 3 */}
          <section className="[background:var(--color-section)] p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold [color:var(--color-text-dark)] mb-3">
              Recurso 3: Material complementario
            </h2>
            <p className="[color:var(--color-text-medium)] mb-4">
              Puedes descargar el siguiente archivo PDF como recurso de apoyo:
            </p>
            <a
              href="/documents/ME01 Enunciado y entrega del Taller No  01 Simulación de MANET.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 [background:var(--color-button)] [color:var(--color-text-light)] rounded-lg shadow hover:[background:var(--color-section)] transition"
            >
              Descargar PDF
            </a>
          </section>

          {/* Recurso 4 */}
          <section className="[background:var(--color-section)] p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold [color:var(--color-text-dark)] mb-3">
              Recurso 4: Ejercicios y práctica
            </h2>
            <p className="[color:var(--color-text-light)]">
              Aquí se pueden incluir actividades, problemas o un enlace a una plataforma
              externa donde los estudiantes resuelvan ejercicios de práctica.
            </p>
          </section>
        </main>

        {/* Footer (debajo del contenido, no del sidebar) */}
        <Footer />
      </div>
    </div>
  )
}
