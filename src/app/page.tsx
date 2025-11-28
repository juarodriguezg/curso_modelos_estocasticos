"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Footer from "../components/Footer"
import Sidebar from "../components/Sidebar"
import { Menu, X, User, LogIn, LogOut } from "lucide-react"

export default function Home() {
  const router = useRouter()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [user, setUser] = useState<{name: string; email: string} | null>(null)

  // Verificar si hay usuario autenticado
  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        setUser(JSON.parse(userData))
      } catch (e) {
        console.error('Error parsing user data')
      }
    }
  }, [])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      router.refresh();
    }
  };

  return (
    <main
      className="relative min-h-screen flex flex-col bg-center bg-no-repeat bg-contain"
      style={{
        backgroundImage: "url('/Orbis_Tertius.webp')",
        backgroundColor: "var(--color-background)",
        color: "var(--color-text-dark)",
      }}
    >
      {/* Sidebar (desplegable) */}
      {isSidebarOpen && (
        <div className="fixed top-0 left-0 z-40 h-full">
          <Sidebar />
        </div>
      )}

      {/* Botones flotantes (arriba a la derecha) */}
      <div className="fixed top-6 right-6 z-49 flex gap-3">
        {user ? (
          <>
            <button
              onClick={() => router.push('/perfil')}
              className="flex items-center gap-2 px-4 py-2 rounded-full shadow-lg transition hover:scale-105"
              style={{
                backgroundColor: "var(--color-button)",
                color: "var(--color-text-light)",
              }}
              aria-label="Ver perfil"
            >
              <User size={20} />
              <span className="hidden sm:inline">{user.name}</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-full shadow-lg transition hover:scale-105"
              style={{
                backgroundColor: "var(--color-header)",
                color: "var(--color-text-light)",
              }}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              <LogOut size={20} />
            </button>
          </>
        ) : (
          <button
            onClick={() => router.push('/login')}
            className="flex items-center gap-2 px-4 py-2 rounded-full shadow-lg transition hover:scale-105"
            style={{
              backgroundColor: "var(--color-button)",
              color: "var(--color-text-light)",
            }}
            aria-label="Iniciar sesión"
          >
            <LogIn size={20} />
            <span className="hidden sm:inline">Iniciar sesión</span>
          </button>
        )}
      </div>

      {/* Botón flotante para abrir/cerrar sidebar */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed bottom-6 left-6 z-51 p-4 rounded-full shadow-lg transition hover:scale-105"
        style={{
          backgroundColor: "var(--color-button)",
          color: "var(--color-text-light)",
        }}
        aria-label="Abrir menú lateral"
      >
        {isSidebarOpen ? <X size={28} /> : <Menu size={28} />}
      </button>

      {/* Contenido central */}
      <div className="flex-grow flex flex-col items-center justify-center backdrop-brightness-95 px-6">
        {/* Encabezado */}
        <header className="text-center mb-5 mt-15">
          <h1 className="text-4xl md:text-6xl font-bold [color:var(--color-header)] drop-shadow-lg">
            Modelos estocásticos y simulación en computación y comunicaciones
          </h1>
        </header>

        {/* Video embebido */}
        <section className="mt-16 max-w-4xl w-full px-4">
          <div className="aspect-video rounded-xl overflow-hidden shadow-lg border border-[color:var(--color-header)]">
            <iframe
              className="w-full h-full"
              src="https://www.youtube.com/embed/U33OftLWdu4"
              title="Introducción al Curso de Modelos Estocásticos"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            ></iframe>
          </div>
        </section>

        {/* Objetivo del curso */}
        <section className="max-w-4xl mt-12 text-left [background:var(--color-background)] p-6 rounded-lg shadow-md border border-[color:var(--color-section)]">
          <h2 className="text-2xl font-semibold [color:var(--color-header)] mb-3">
            Objetivo del curso
          </h2>
          <p className="[color:var(--color-header)] leading-relaxed">
            Generar en los estudiantes un manejo formal de la probabilidad, estadística y los procesos
            estocásticos, que les permita a través del estudio de distintas estructuras probabilísticas y sistemas
            computacionales, adquirir las habilidades necesarias para identificar, analizar, modelar y solucionar
            problemas asociados con sistemas de cómputo y de telecomunicaciones de naturaleza estocástica y
            dinámica.
          </p>
        </section>

        {/* Objetivos específicos */}
        <section className="max-w-4xl mt-8 text-left [background:var(--color-background)] p-6 rounded-lg shadow-md border border-[color:var(--color-section)] mb-12">
          <h2 className="text-2xl font-semibold [color:var(--color-header)] mb-3">
            Objetivos específicos
          </h2>
          <ul className="list-disc list-inside [color:var(--color-header)] leading-relaxed space-y-2">
            <li>
              Estudiar modelos matemáticos y probabilísticos complejos que permitan describir
              comportamientos en sistemas de cómputo y telecomunicaciones.
            </li>
            <li>
              Diseñar experimentos basados en simulación de eventos discretos para estimar medidas
              de desempeño en sistemas de cómputo y telecomunicaciones.
            </li>
            <li>
              Proponer metodologías para el análisis de sistemas de cómputo complejos.
            </li>
          </ul>
        </section>
      </div>

      {/* Footer */}
      <Footer />
    </main>
  )
}