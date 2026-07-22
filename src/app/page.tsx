"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Footer from "../components/Footer"
import Sidebar from "../components/Sidebar"
import { Menu, X, User, LogIn, LogOut, BookOpen, Target, Lightbulb } from "lucide-react"

export default function Home() {
  const router = useRouter()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [user, setUser] = useState<{name: string; email: string} | null>(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      try { setUser(JSON.parse(userData)) } catch {}
    }
  }, [])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {} finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      router.refresh();
    }
  };

  return (
    <main className="relative min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--color-background)", color: "var(--color-text-dark)" }}>

      {/* Sidebar */}
      {isSidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-30 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
          <div className="fixed top-0 left-0 z-40 h-full animate-fadeIn">
            <Sidebar />
          </div>
        </>
      )}

      {/* Top bar */}
      <div className="fixed top-0 right-0 left-0 z-20 px-6 py-4 flex justify-end gap-3">
        {user ? (
          <>
            <button onClick={() => router.push('/perfil')}
              className="btn btn-primary shadow-lg"
              aria-label="Ver perfil">
              <User size={18} />
              <span className="hidden sm:inline">{user.name}</span>
            </button>
            <button onClick={handleLogout}
              className="btn btn-ghost shadow-lg"
              style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
              aria-label="Cerrar sesión" title="Cerrar sesión">
              <LogOut size={18} />
            </button>
          </>
        ) : (
          <button onClick={() => router.push('/login')}
            className="btn btn-primary shadow-lg" aria-label="Iniciar sesión">
            <LogIn size={18} />
            <span className="hidden sm:inline">Iniciar sesión</span>
          </button>
        )}
      </div>

      {/* Sidebar toggle */}
      <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="btn btn-primary fixed bottom-6 left-6 z-50 p-4 rounded-full shadow-lg hover:shadow-xl"
        aria-label="Abrir menú lateral">
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Hero */}
      <div className="flex-grow flex flex-col items-center justify-center px-6 relative"
        style={{ backgroundImage: "url('/Orbis_Tertius.webp')", backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>

        <header className="text-center mb-8 mt-20 animate-slideUp">
          <h1 className="text-4xl md:text-6xl font-bold drop-shadow-lg leading-tight"
            style={{ color: "var(--color-header)" }}>
            Modelos estocásticos y simulación en computación y comunicaciones
          </h1>
        </header>

        {/* Video */}
        <section className="mt-8 max-w-4xl w-full px-4 animate-slideUp" style={{ animationDelay: '0.1s' }}>
          <div className="aspect-video rounded-xl overflow-hidden shadow-lg border"
            style={{ borderColor: 'var(--color-border)' }}>
            <iframe className="w-full h-full"
              src="https://www.youtube.com/embed/U33OftLWdu4"
              title="Introducción al Curso de Modelos Estocásticos"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen loading="lazy" />
          </div>
        </section>

        {/* Content cards */}
        <div className="max-w-5xl w-full grid md:grid-cols-2 gap-6 mt-12 mb-12 px-4">
          <section className="card p-6 animate-slideUp" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-lg" style={{ background: 'var(--color-accent-soft)' }}>
                <Target size={22} style={{ color: 'var(--color-accent)' }} />
              </div>
              <h2 className="text-xl font-semibold" style={{ color: "var(--color-header)" }}>
                Objetivo del curso
              </h2>
            </div>
            <p className="leading-relaxed text-sm" style={{ color: "var(--color-text-medium)" }}>
              Generar en los estudiantes un manejo formal de la probabilidad, estadística y los procesos
              estocásticos, que les permita a través del estudio de distintas estructuras probabilísticas y sistemas
              computacionales, adquirir las habilidades necesarias para identificar, analizar, modelar y solucionar
              problemas asociados con sistemas de cómputo y de telecomunicaciones de naturaleza estocástica y dinámica.
            </p>
          </section>

          <section className="card p-6 animate-slideUp" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-lg" style={{ background: 'var(--color-accent-soft)' }}>
                <Lightbulb size={22} style={{ color: 'var(--color-accent)' }} />
              </div>
              <h2 className="text-xl font-semibold" style={{ color: "var(--color-header)" }}>
                Objetivos específicos
              </h2>
            </div>
            <ul className="space-y-3 text-sm" style={{ color: "var(--color-text-medium)" }}>
              <li className="flex gap-2">
                <BookOpen size={16} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--color-accent)' }} />
                <span>Estudiar modelos matemáticos y probabilísticos complejos que permitan describir
                comportamientos en sistemas de cómputo y telecomunicaciones.</span>
              </li>
              <li className="flex gap-2">
                <BookOpen size={16} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--color-accent)' }} />
                <span>Diseñar experimentos basados en simulación de eventos discretos para estimar medidas
                de desempeño en sistemas de cómputo y telecomunicaciones.</span>
              </li>
              <li className="flex gap-2">
                <BookOpen size={16} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--color-accent)' }} />
                <span>Proponer metodologías para el análisis de sistemas de cómputo complejos.</span>
              </li>
            </ul>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  )
}