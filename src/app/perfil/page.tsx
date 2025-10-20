"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut, User, Mail, Calendar, Shield, Loader2 } from "lucide-react"
import Footer from "@/components/Footer"

interface UserData {
  id: string
  email: string
  name: string
  role: string
  createdAt?: string
}

export default function PerfilPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token")

        if (!token) {
          router.push("/login")
          return
        }

        const response = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) throw new Error("No autorizado")

        const data = await response.json()
        setUser(data.user)
      } catch (error) {
        console.error("Error de autenticación:", error)
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const handleLogout = async () => {
    const token = localStorage.getItem("token")
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    } catch (error) {
      console.error("Error en logout:", error)
    } finally {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      router.push("/")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center [background:var(--color-background)]">
        <Loader2 className="w-10 h-10 animate-spin [color:var(--color-header)]" />
      </div>
    )
  }

  const getRoleBadge = (role: string) => {
    const badges = {
      student: { text: "Estudiante", color: "bg-blue-100 text-blue-800" },
      teacher: { text: "Profesor", color: "bg-purple-100 text-purple-800" },
      admin: { text: "Administrador", color: "bg-red-100 text-red-800" },
    }
    return badges[role as keyof typeof badges] || badges.student
  }

  const roleBadge = getRoleBadge(user?.role || "student")

  return (
    <main className="min-h-screen flex flex-col [background:var(--color-background)]">
      {/* Header */}
      <header className="flex justify-between items-center px-8 py-4 shadow-md [background:var(--color-header)]">
        <button
          onClick={() => router.push("/")}
          className="[color:var(--color-text-light)] hover:underline transition"
        >
          ← Volver al curso
        </button>

        <h1 className="text-3xl font-bold text-center [color:var(--color-text-light)]">
          Mi Perfil
        </h1>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-md [background:var(--color-button)] [color:var(--color-text-light)] hover:[background:var(--color-section)] transition"
        >
          <LogOut className="w-4 h-4" />
          Cerrar Sesión
        </button>
      </header>

      {/* Contenido */}
      <section className="flex-grow max-w-4xl mx-auto p-8 w-full">
        <div className="[background:var(--color-section)] p-8 rounded-2xl shadow-lg space-y-8">
          {/* Cabecera de usuario */}
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full flex items-center justify-center [background:var(--color-header)] shadow-lg">
              <User className="w-10 h-10 [color:var(--color-text-light)]" />
            </div>
            <div>
              <h2 className="text-3xl font-bold [color:var(--color-text-dark)]">
                {user?.name}
              </h2>
              <span
                className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${roleBadge.color}`}
              >
                {roleBadge.text}
              </span>
            </div>
          </div>

          {/* Datos del usuario */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Correo */}
            <div className="[background:var(--color-background)] p-6 rounded-xl border border-[color:var(--color-header)]">
              <div className="flex items-center gap-3 mb-2">
                <Mail className="w-5 h-5 [color:var(--color-header)]" />
                <h3 className="text-lg font-semibold [color:var(--color-text-dark)]">
                  Correo electrónico
                </h3>
              </div>
              <p className="[color:var(--color-text-medium)] font-mono">
                {user?.email}
              </p>
            </div>

            {/* Rol */}
            <div className="[background:var(--color-background)] p-6 rounded-xl border border-[color:var(--color-header)]">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-5 h-5 [color:var(--color-header)]" />
                <h3 className="text-lg font-semibold [color:var(--color-text-dark)]">
                  Rol del usuario
                </h3>
              </div>
              <p className="[color:var(--color-text-medium)]">{roleBadge.text}</p>
            </div>

            {/* ID */}
            <div className="[background:var(--color-background)] p-6 rounded-xl border border-[color:var(--color-header)]">
              <div className="flex items-center gap-3 mb-2">
                <User className="w-5 h-5 [color:var(--color-header)]" />
                <h3 className="text-lg font-semibold [color:var(--color-text-dark)]">
                  ID de Usuario
                </h3>
              </div>
              <p className="[color:var(--color-text-medium)] font-mono text-sm break-all">
                {user?.id}
              </p>
            </div>

            {/* Fecha de creación */}
            {user?.createdAt && (
              <div className="[background:var(--color-background)] p-6 rounded-xl border border-[color:var(--color-header)]">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="w-5 h-5 [color:var(--color-header)]" />
                  <h3 className="text-lg font-semibold [color:var(--color-text-dark)]">
                    Miembro desde
                  </h3>
                </div>
                <p className="[color:var(--color-text-medium)]">
                  {new Date(user.createdAt).toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            )}
          </div>

          {/* Mensaje de bienvenida */}
          <div className="text-center [background:var(--color-header)] p-6 rounded-xl shadow-md">
            <h3 className="text-xl font-bold [color:var(--color-text-light)] mb-2">
              
            </h3>
            <p className="[color:var(--color-text-light)]">
              Tu cuenta está activa y puedes acceder al material de estudio.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </main>
  )
}
