import Footer from "../components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col [background:var(--color-background)] [color:var(--color-text-dark)]">
      {/* Contenido envuelto en flex-grow */}
      <div className="flex-grow flex flex-col items-center justify-center">
        {/* Encabezado */}
        <header className="text-center mb-10">
          <h1 className="text-4xl md:text-6xl font-bold [color:var(--color-header)]">
            Curso de Modelos Estocásticos
          </h1>
          <p className="mt-4 text-lg md:text-xl [color:var(--color-text-medium)]">
            Bienvenido al curso — Aprende probabilidad, procesos aleatorios y aplicaciones reales.
          </p>
        </header>

        {/* Botón de acción */}
        <a
          href="/temas"
          className="px-6 py-3 [background:var(--color-button)] [color:var(--color-text-light)] rounded-full shadow-lg hover:[background:var(--color-section)] transition"
        >
          Ver Temas
        </a>

        {/* Sección de temas */}
        <section id="temas" className="mt-20 max-w-3xl text-center">
          <h2 className="text-3xl font-semibold [color:var(--color-header)] mb-6">
            Temas principales
          </h2>
          <ul className="space-y-4 text-lg">
            <li>✔️ Variables aleatorias y distribuciones</li>
            <li>✔️ Cadenas de Markov</li>
            <li>✔️ Procesos de Poisson</li>
            <li>✔️ Colas y simulación</li>
          </ul>
        </section>
      </div>

      {/* Footer siempre abajo */}
      <Footer />
    </main>
  );
}
