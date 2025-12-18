"use client"

import { useState } from "react"
import Sidebar from "@/components/Sidebar"
import Footer from "@/components/Footer"
import {
  ChevronDown,
  ChevronRight,
  BookOpen,
  Calendar,
  Award,
  CheckCircle,
  Users,
  FileText,
} from "lucide-react"

export default function ReglasDelCursoPage() {
  const [open, setOpen] = useState<string[]>(["introduccion"])

  const toggle = (id: string) => {
    setOpen(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const Section = ({ id, title, icon: Icon, children }: any) => {
    const isOpen = open.includes(id)
    return (
      <section className="border border-[color:var(--color-section)] rounded-lg shadow-sm">
        <button
          onClick={() => toggle(id)}
          className="w-full flex justify-between items-center px-6 py-4 [background:var(--color-background)] hover:[background:var(--color-section)] transition"
        >
          <div className="flex items-center gap-3">
            <Icon className="w-5 h-5 [color:var(--color-header)]" />
            <h2 className="text-xl font-semibold [color:var(--color-header)]">
              {title}
            </h2>
          </div>
          {isOpen ? <ChevronDown /> : <ChevronRight />}
        </button>

        {isOpen && (
          <div className="px-6 py-4 [color:var(--color-text-dark)] space-y-4">
            {children}
          </div>
        )}
      </section>
    )
  }

  return (
    <div className="flex min-h-screen [background:var(--color-background)]">
      {/* Sidebar fijo */}
      <Sidebar />

      {/* Contenido principal */}
      <div className="flex flex-col flex-grow">
        {/* Navbar / Header */}
        <header className="flex justify-between items-center [background:var(--color-header)] px-8 py-4 shadow-md">
          <div className="flex-1" />
          <h1 className="text-3xl font-bold [color:var(--color-text-light)] text-center flex-1">
            Lineamientos Operativos del Curso
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
        <main className="flex-grow max-w-4xl mx-auto p-8 space-y-6">
          <Section id="introduccion" title="1. Introducción" icon={BookOpen}>
            <p>
              Siempre que se emprende una actividad que involucra grupos de
              personas que desempeñan funciones específicas y trabajan de manera
              coordinada, es necesario establecer reglas, normas y directrices
              que regulen la forma de operar durante el tiempo que dure dicha
              actividad.
            </p>
            <p>
              Este documento presenta los lineamientos que permiten el adecuado
              desarrollo de la asignatura durante el semestre.
            </p>
          </Section>

          <Section id="etica" title="2. Compromiso ético" icon={CheckCircle}>
            <p>
              El comportamiento ético es un requisito <strong>sine qua non</strong>.
              Se espera respeto mutuo, buena fe y confianza entre todos los
              miembros del curso.
            </p>
          </Section>

          <Section
            id="actividades"
            title="3. Actividades del curso"
            icon={Calendar}
          >
            <h3 className="font-semibold">3.1 Actividades obligatorias</h3>
            <ul className="list-disc list-inside">
              <li>Tareas obligatorias</li>
              <li>Parcial (25%)</li>
              <li>Taller (20%)</li>
              <li>Producción audiovisual (20%)</li>
              <li>Proyecto (15%)</li>
              <li>Autoevaluación (20%)</li>
            </ul>

            <h3 className="font-semibold mt-4">
              3.2 Actividades opcionales (bonos)
            </h3>
            <p>
              Actividades voluntarias que otorgan puntos adicionales a la nota
              definitiva, con un máximo de 10 bonos por semestre.
            </p>
          </Section>

          <Section id="metodologia" title="4. Metodología" icon={BookOpen}>
            <ol className="list-decimal list-inside space-y-1">
              <li>Inicio de clase</li>
              <li>Lectura previa (video del estudiante)</li>
              <li>Quiz corto</li>
              <li>Conferencia magistral</li>
              <li>Sección complementaria</li>
            </ol>
          </Section>

          <Section id="evaluacion" title="5. Evaluación" icon={Award}>
            <ul className="list-disc list-inside">
              <li>Parcial: 25%</li>
              <li>Autoevaluación: 20%</li>
              <li>Producción audiovisual: 20%</li>
              <li>Taller: 20%</li>
              <li>Proyecto: 15%</li>
            </ul>
            <p>
              La nota definitiva corresponde a la nota final más los puntos
              adicionales obtenidos por actividades opcionales.
            </p>
          </Section>

          <Section
            id="herramientas"
            title="6. Uso de herramientas"
            icon={FileText}
          >
            <p>
              Para tareas automatizadas solo se permiten herramientas
              convencionales. El uso de motores de inteligencia artificial no
              está permitido por defecto.
            </p>
          </Section>

          <Section id="atencion" title="7. Atención" icon={Users}>
            <p>
              Las reuniones con el profesor pueden realizarse de manera
              presencial o remota, previo acuerdo.
            </p>
            <p>
              <strong>Email:</strong> jeortizt@unal.edu.co
            </p>
          </Section>

          {/* PDF */}
          <div className="text-center pt-4">
            <a
              href="/documents/MEXX_LineamientosOperativosDelCurso_Viernes19DeSeptiembreDe2025_EnviadoAlCurso.pdf"
              target="_blank"
              className="inline-flex items-center gap-2 px-6 py-3 [background:var(--color-button)] [color:var(--color-text-light)] rounded-lg hover:[background:var(--color-section)] transition"
            >
              <FileText className="w-5 h-5" />
              Descargar documento oficial (PDF)
            </a>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  )
}
