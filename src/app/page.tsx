export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-indigo-100 to-indigo-300 text-gray-800">
      {/* Encabezado */}
      <header className="text-center mb-10">
        <h1 className="text-4xl md:text-6xl font-bold text-indigo-800">
          Curso de Modelos Estocásticos
        </h1>
        <p className="mt-4 text-lg md:text-xl text-gray-700">
          Bienvenido al curso — Aprende probabilidad, procesos aleatorios y aplicaciones reales.
        </p>
      </header>

      {/* Botón de acción */}
      <a
        href="/temas"
        className="px-6 py-3 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition"
      >
        Ver Temas
      </a>

      {/* Sección de temas */}
      <section id="temas" className="mt-20 max-w-3xl text-center">
        <h2 className="text-3xl font-semibold text-indigo-700 mb-6">Temas principales</h2>
        <ul className="space-y-4 text-lg">
          <li>✔️ Variables aleatorias y distribuciones</li>
          <li>✔️ Cadenas de Markov</li>
          <li>✔️ Procesos de Poisson</li>
          <li>✔️ Colas y simulación</li>
        </ul>
      </section>

      {/* Footer */}
      <footer className="mt-20 text-sm text-gray-600">
        © {new Date().getFullYear()} Universidad Nacional — Curso Modelos Estocásticos
      </footer>
    </main>
  );
}
