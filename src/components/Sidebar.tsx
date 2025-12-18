"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Home,
  Calendar,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Menu,
} from "lucide-react"

interface Subtema {
  titulo: string
  enlace: string
  visible?: boolean
}

interface Seccion {
  titulo: string
  enlace: string
  subtemas?: Subtema[]
  visible?: boolean
}

interface Parte {
  titulo: string
  secciones: Seccion[]
}

interface Topic {
  slug: string
  visible: boolean
}

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [openPartes, setOpenPartes] = useState<string[]>([])
  const [openSecciones, setOpenSecciones] = useState<string[]>([])
  const [visibleTopics, setVisibleTopics] = useState<Map<string, boolean>>(new Map())
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  const toggleParte = (parte: string) => {
    setOpenPartes((prev) =>
      prev.includes(parte)
        ? prev.filter((p) => p !== parte)
        : [...prev, parte]
    )
  }

  const toggleSeccion = (seccion: string) => {
    setOpenSecciones((prev) =>
      prev.includes(seccion)
        ? prev.filter((s) => s !== seccion)
        : [...prev, seccion]
    )
  }

  const toggleSidebar = () => setIsCollapsed(!isCollapsed)

  // Verificar si el usuario es admin y cargar visibilidad de temas
  useEffect(() => {
    const loadTopicVisibility = async () => {
      try {
        // Obtener información del usuario
        const userData = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        let userRole = null;
        let userGroup = null;
        
        if (userData) {
          const user = JSON.parse(userData);
          userRole = user.role;
          userGroup = user.grupo;
          setIsAdmin(userRole === 'admin');
        }

        // Obtener visibilidad de temas (ahora requiere auth para saber el grupo)
        const res = await fetch('/api/topics/visible', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        
        if (res.ok) {
          const data = await res.json();
          const topicMap = new Map<string, boolean>();
          
          data.topics.forEach((topic: any) => {
            // Para admins/teachers, todos son visibles
            if (userRole === 'admin' || userRole === 'teacher') {
              topicMap.set(topic.slug, true);
            } else {
              // Para estudiantes, usar la visibilidad de su grupo
              topicMap.set(topic.slug, topic.visible);
            }
          });
          
          setVisibleTopics(topicMap);
        }
      } catch (error) {
        console.error('Error cargando visibilidad de temas:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTopicVisibility();
  }, [])

  // Función auxiliar para generar enlaces
  const generarEnlace = (texto: string) => {
    return "/temas/" + texto
      .normalize("NFD")                     // separa acentos
      .replace(/[\u0300-\u036f]/g, "")      // elimina acentos
      .toLowerCase()
      .replace(/:/g, "")                    // elimina los dos puntos
      .replace(/[()–.]/g, "")               // igual que antes
      .replace(/\s+/g, "-")                 // espacios → guiones
  }


  // Función para verificar si un tema es visible
  const esVisible = (titulo: string): boolean => {
    if (isAdmin) return true // Los admins ven todo
    if (loading) return true // Mientras carga, mostrar todo
    
    const slug = titulo
      .toLowerCase()
      .replaceAll(/[()–.]/g, "")
      .replaceAll(/\s+/g, "-")
    
    return visibleTopics.get(slug) !== false // Por defecto visible si no está en la BD
  }

  // Estructura del curso
  const contenido: Parte[] = [
    {
      titulo: "Preliminares",
      secciones: [
        { titulo: "Prólogo", enlace: generarEnlace("Prólogo") },
        {titulo: "Reglas de uso del curso", enlace: generarEnlace("Reglas de uso del curso")},
        { titulo: "Prefacio", enlace: generarEnlace("Prefacio") },
        { titulo: "Agradecimientos", enlace: generarEnlace("Agradecimientos") },
        { titulo: "Introducción", enlace: generarEnlace("Introducción") },
      ],
    },
    {
      titulo: "Parte 1: Vectores Aleatorios",
      secciones: [
        {
          titulo: "Capítulo 1: Experimentos aleatorios y espacios de probabilidad",
          enlace: generarEnlace("Capítulo 1: Experimentos aleatorios y espacios de probabilidad"),
          subtemas: [
            { titulo: "Sección 1.1 Mundo, universo, cosmos y naturaleza", enlace: generarEnlace("Sección 1.1 Mundo, universo, cosmos y naturaleza") },
            { titulo: "Sección 1.2 Experimento aleatorio", enlace: generarEnlace("Sección 1.2 Experimento aleatorio") },
            { titulo: "Sección 1.3 Espacio de probabilidad incondicional", enlace: generarEnlace("Sección 1.3 Espacio de probabilidad incondicional") },
            { titulo: "Sección 1.4 Espacio de probabilidad condicionales", enlace: generarEnlace("Sección 1.4 Espacio de probabilidad condicionales") },
          ],
        },
        {
          titulo: "Capítulo 2: Variables aleatorias y sus estructuras probabilísticas",
          enlace: generarEnlace("Capítulo 2: Variables aleatorias y sus estructuras probabilísticas"),
          subtemas: [
            { titulo: "Sección 2.1 Definición y propiedades", enlace: generarEnlace("Sección 2.1 Definición y propiedades") },
            { titulo: "Sección 2.2 Variables aleatorias discretas", enlace: generarEnlace("Sección 2.2 Variables aleatorias discretas") },
            { titulo: "Sección 2.3 Variables aleatorias continuas", enlace: generarEnlace("Sección 2.3 Variables aleatorias continuas") },
            { titulo: "Sección 2.4 Esperanza matemática y momentos", enlace: generarEnlace("Sección 2.4 Esperanza matemática y momentos") },
          ],
        },
        {
          titulo: "Capítulo 3: Algunas familias paramétricas unidimensionales clásicas",
          enlace: generarEnlace("Capítulo 3: Algunas familias paramétricas unidimensionales clásicas"),
          subtemas: [
            { titulo: "Sección 3.1 Introducción y resumen", enlace: generarEnlace("Sección 3.1 Introducción y resumen") },
            { titulo: "Sección 3.2 Familias discretas", enlace: generarEnlace("Sección 3.2 Familias discretas") },
            { titulo: "Sección 3.3 Familias continuas", enlace: generarEnlace("Sección 3.3 Familias continuas") },
          ],
        },
        {
          titulo: "Capítulo 4: Vectores aleatorios",
          enlace: generarEnlace("Capítulo 4: Vectores aleatorios"),
          subtemas: [
            { titulo: "Sección 4.1 Estructura probabilística conjunta", enlace: generarEnlace("Sección 4.1 Estructura probabilística conjunta") },
            { titulo: "Sección 4.2 Independencia de variables aleatorias", enlace: generarEnlace("Sección 4.2 Independencia de variables aleatorias") },
            { titulo: "Sección 4.3 Covarianza y coeficiente de correlación", enlace: generarEnlace("Sección 4.3 Covarianza y coeficiente de correlación") },
            { titulo: "Sección 4.4 Esperanza matemática de vectores aleatorios", enlace: generarEnlace("Sección 4.4 Esperanza matemática de vectores aleatorios") },
            { titulo: "Sección 4.5 Función generadora de momentos conjunta", enlace: generarEnlace("Sección 4.5 Función generadora de momentos conjunta") },
            { titulo: "Sección 4.6 Familias paramétricas conjuntas", enlace: generarEnlace("Sección 4.6 Familias paramétricas conjuntas") },
          ],
        },
        {
          titulo: "Capítulo 5: Transformaciones de vectores aleatorios",
          enlace: generarEnlace("Capítulo 5: Transformaciones de vectores aleatorios"),
          subtemas: [
            { titulo: "Sección 5.1 Introducción y resumen", enlace: generarEnlace("Sección 5.1 Introducción y resumen") },
            { titulo: "Sección 5.2 Técnicas univariadas", enlace: generarEnlace("Sección 5.2 Técnicas univariadas") },
            { titulo: "Sección 5.3 Transformación de vectores aleatorios discretos", enlace: generarEnlace("Sección 5.3 Transformación de vectores aleatorios discretos") },
            { titulo: "Sección 5.4 Transformación de vectores aleatorios continuos", enlace: generarEnlace("Sección 5.4 Transformación de vectores aleatorios continuos") },
          ],
        },
      ],
    },
    {
      titulo: "Parte 2: Procesos Estocásticos",
      secciones: [
        {
          titulo: "Procesos estocásticos",
          enlace: generarEnlace("Procesos estocásticos"),
          subtemas: [
            {
              titulo: "Definición de serie de tiempo y de proceso estocástico",
              enlace: generarEnlace("Definición de serie de tiempo y de proceso estocástico")
            },
          ],
        },
        {
          titulo: "Series de tiempo",
          enlace: generarEnlace("Series de tiempo"),
          subtemas: [
            { 
              titulo: "Funciones de autocovarianza y autocorrelación",
              enlace: generarEnlace("Funciones de autocovarianza y autocorrelación")
            },
            { 
              titulo: "Procesos de ruido blanco",
              enlace: generarEnlace("Procesos de ruido blanco")
            },
            {
              titulo: "Estimación de funciones de la media, autocovarianza y autocorrelación",
              enlace: generarEnlace("Estimación de funciones de la media, autocovarianza y autocorrelación")
            },
            { 
              titulo: "Modelos de series de tiempo estacionarios",
              enlace: generarEnlace("Modelos de series de tiempo estacionarios")
            },
          ],
        },
        {
          titulo: "Razonamiento probabilístico",
          enlace: generarEnlace("Razonamiento probabilístico"),
          subtemas: [
            { 
              titulo: "Cadenas de Markov",
              enlace: generarEnlace("Cadenas de Markov")
            }
          ],
        },
      ],
    },{
  titulo: "Parte 3: Teoría del Teletráfico",
  secciones: [

    {
      titulo: "Capítulo 1: Sistema de colas simples",
      enlace: generarEnlace("Capítulo 1: Sistema de colas simples"),
      subtemas: [
        { titulo: "Sección 1.1 Introducción", enlace: generarEnlace("Sección 1.1 Introducción") },
      ]
    },

    {
      titulo: "Capítulo 2: Expresión de Kendall y Medidas de Desempeño",
      enlace: generarEnlace("Capítulo 2: Expresión de Kendall y Medidas de Desempeño"),
      subtemas: [
        { titulo: "Sección 2.1 Notación", enlace: generarEnlace("Sección 2.1 Notación") },
        { titulo: "Sección 2.2 Medidas de desempeño", enlace: generarEnlace("Sección 2.2 Medidas de desempeño") },
      ]
    },

    {
      titulo: "Capítulo 3: Sistema de Colas M/M/1",
      enlace: generarEnlace("Capítulo 3: Sistema de Colas M/M/1"),
      subtemas: [
        { titulo: "Sección 3.1 Procesos binomiales y de Poisson", enlace: generarEnlace("Sección 3.1 Procesos binomiales y de Poisson") },
        { titulo: "Sección 3.2 Propiedades de los procesos de Poisson", enlace: generarEnlace("Sección 3.2 Propiedades de los procesos de Poisson") },
        { titulo: "Sección 3.3 Fundamentos del proceso de Poisson", enlace: generarEnlace("Sección 3.3 Fundamentos del proceso de Poisson") },
        { titulo: "Sección 3.4 Media y varianza del proceso de Poisson", enlace: generarEnlace("Sección 3.4 Media y varianza del proceso de Poisson") },
        { titulo: "Sección 3.5 Tiempo entre llegadas", enlace: generarEnlace("Sección 3.5 Tiempo entre llegadas") },
        { titulo: "Sección 3.6 Propiedad de pérdida de la memoria", enlace: generarEnlace("Sección 3.6 Propiedad de pérdida de la memoria") },
        { titulo: "Sección 3.7 Propiedad de Markov", enlace: generarEnlace("Sección 3.7 Propiedad de Markov") },
        { titulo: "Sección 3.8 Tiempos de servicio exponencial", enlace: generarEnlace("Sección 3.8 Tiempos de servicio exponencial") },
        { titulo: "Sección 3.9 Fundamentos del sistema M/M/1", enlace: generarEnlace("Sección 3.9 Fundamentos del sistema M/M/1") },
      ]
    },

    {
      titulo: "Capítulo 4: Sistema de Filas M/M/1 en Detalle",
      enlace: generarEnlace("Capítulo 4: Sistema de Filas M/M/1 en Detalle"),
      subtemas: [
        { titulo: "Sección 4.1 Función de densidad", enlace: generarEnlace("Sección 4.1 Función de densidad") },
        { titulo: "Sección 4.2 Utilización del servidor", enlace: generarEnlace("Sección 4.2 Utilización del servidor") },
        { titulo: "Sección 4.3 Número medio de clientes en el sistema", enlace: generarEnlace("Sección 4.3 Número medio de clientes en el sistema") },
        { titulo: "Sección 4.4 Varianza del número de clientes en el sistema", enlace: generarEnlace("Sección 4.4 Varianza del número de clientes en el sistema") },
      ]
    },

    {
      titulo: "Capítulo 5: Ley de Little",
      enlace: generarEnlace("Capítulo 5: Ley de Little"),
      subtemas: []
    },

    {
      titulo: "Capítulo 6: Teorema de Burke",
      enlace: generarEnlace("Capítulo 6: Teorema de Burke"),
      subtemas: []
    },

    {
      titulo: "Capítulo 7: Sistemas de colas dependientes del estado",
      enlace: generarEnlace("Capítulo 7: Sistemas de colas dependientes del estado"),
      subtemas: [
        { titulo: "Sección 7.1 Introducción", enlace: generarEnlace("Sección 7.1 Introducción") },
      ]
    },

    {
      titulo: "Capítulo 8: Sistema M/M/1 de estado dependiente",
      enlace: generarEnlace("Capítulo 8: Sistema M/M/1 de estado dependiente"),
      subtemas: [
        { titulo: "Sección 8.1 Solución general", enlace: generarEnlace("Sección 8.1 Solución general") },
        { titulo: "Sección 8.2 Medidas de desempeño", enlace: generarEnlace("Sección 8.2 Medidas de desempeño") },
      ]
    },

    {
      titulo: "Capítulo 9: Sistema M/M/1 con búfer finito",
      enlace: generarEnlace("Capítulo 9: Sistema M/M/1 con búfer finito"),
      subtemas: []
    },

    {
      titulo: "Capítulo 10: Sistema M/M con infinito número de servidores",
      enlace: generarEnlace("Capítulo 10: Sistema M/M con infinito número de servidores"),
      subtemas: []
    },

    {
      titulo: "Capítulo 11: Sistema M/M/m con servidores paralelos",
      enlace: generarEnlace("Capítulo 11: Sistema M/M/m con servidores paralelos"),
      subtemas: []
    },

    {
      titulo: "Capítulo 12: Sistema M/M/m/m con pérdida",
      enlace: generarEnlace("Capítulo 12: Sistema M/M/m/m con pérdida"),
      subtemas: []
    },

  ]
}
,
    {
      titulo: "Parte 4: Simulación de Redes de Telecomunicaciones",
      secciones: [
        {
          titulo: "Teorema fundamental unidimensional",
          enlace: generarEnlace("Teorema fundamental unidimensional"),
          subtemas: [
            {
              titulo: "Funciones percentiles conjuntas y teorema fundamental de la simulación",
              enlace: generarEnlace("Funciones percentiles conjuntas y teorema fundamental de la simulación")
            },
            {
              titulo: "Arquitectura general de un simulador de sistemas complejos",
              enlace: generarEnlace("Arquitectura general de un simulador de sistemas complejos")
            },
            {
              titulo: "Funciones percentiles truncadas y contaminadas conjuntas",
              enlace: generarEnlace("Funciones percentiles truncadas y contaminadas conjuntas")
            },
          ],
        },
        {
          titulo: "Teorema fundamental multidimensional",
          enlace: generarEnlace("Teorema fundamental multidimensional"),
          subtemas: [
            { 
              titulo: "Modelos de movilidad",
              enlace: generarEnlace("Modelos de movilidad")
            },
            {
              titulo: "Lenguajes de programación para simulación de redes",
              enlace: generarEnlace("Lenguajes de programación para simulación de redes")
            },
          ],
        },
        {
          titulo: "Funciones percentiles generalizadas",
          enlace: generarEnlace("Funciones percentiles generalizadas"),
          subtemas: [
            { 
              titulo: "Funciones percentiles generalizadas (DLG)",
              enlace: generarEnlace("Funciones percentiles generalizadas (DLG)")
            },
          ],
        },
      ],
    },
    {
  titulo: "Parte 5: Teoría de la Decisión",
  secciones: [
    {
      titulo: "Capítulo 1: Teoría de la utilidad",
      enlace: generarEnlace("Capítulo 1: Teoría de la utilidad"),
      subtemas: [
        { 
          titulo: "Sección 1.1: Introducción", 
          enlace: generarEnlace("Sección 1.1: Introducción") 
        },
        { 
          titulo: "Sección 1.2: Loterías", 
          enlace: generarEnlace("Sección 1.2: Loterías") 
        },
        { 
          titulo: "Sección 1.3: Axiomática de Luce Raiffa", 
          enlace: generarEnlace("Sección 1.3: Axiomática de Luce Raiffa") 
        },
        { 
          titulo: "Sección 1.4: Actitud del decisor frente al riesgo", 
          enlace: generarEnlace("Sección 1.4: Actitud del decisor frente al riesgo") 
        },
      ],
    },
    {
      titulo: "Capítulo 2: Decisiones en ambientes de certeza",
      enlace: generarEnlace("Capítulo 2: Decisiones en ambientes de certeza"),
      subtemas: [
        { 
          titulo: "Sección 2.1: Planteamiento del problema", 
          enlace: generarEnlace("Sección 2.1: Planteamiento del problema") 
        },
        { 
          titulo: "Sección 2.2: Concepto de óptimo", 
          enlace: generarEnlace("Sección 2.2: Concepto de óptimo") 
        },
        { 
          titulo: "Sección 2.3: Conjunto de alternativas limitado e ilimitado", 
          enlace: generarEnlace("Sección 2.3: Conjunto de alternativas limitado e ilimitado") 
        },
        { 
          titulo: "Sección 2.4: Modelos de optimización", 
          enlace: generarEnlace("Sección 2.4: Modelos de optimización") 
        },
      ],
    },
    {
      titulo: "Capítulo 3: Decisiones bajo riesgo",
      enlace: generarEnlace("Capítulo 3: Decisiones bajo riesgo"),
      subtemas: [
        { 
          titulo: "Sección 3.1: Modelo del problema", 
          enlace: generarEnlace("Sección 3.1: Modelo del problema") 
        },
        { 
          titulo: "Sección 3.2: Dominación simple y estocástica", 
          enlace: generarEnlace("Sección 3.2: Dominación simple y estocástica") 
        },
        { 
          titulo: "Sección 3.3: Criterios de decisión", 
          enlace: generarEnlace("Sección 3.3: Criterios de decisión") 
        },
      ],
    },
    {
      titulo: "Capítulo 4: Decisiones bajo incertidumbre",
      enlace: generarEnlace("Capítulo 4: Decisiones bajo incertidumbre"),
      subtemas: [
        { 
          titulo: "Sección 4.1: Modelo del problema", 
          enlace: generarEnlace("Sección 4.1: Modelo del problema") 
        },
        { 
          titulo: "Sección 4.2: Criterio de Wald", 
          enlace: generarEnlace("Sección 4.2: Criterio de Wald") 
        },
        { 
          titulo: "Sección 4.3: Criterio Maximax", 
          enlace: generarEnlace("Sección 4.3: Criterio Maximax") 
        },
        { 
          titulo: "Sección 4.4: Criterio de decisión de Hurwicz", 
          enlace: generarEnlace("Sección 4.4: Criterio de decisión de Hurwicz") 
        },
        { 
          titulo: "Sección 4.5: Criterio de Savage", 
          enlace: generarEnlace("Sección 4.5: Criterio de Savage") 
        },
        { 
          titulo: "Sección 4.6: Criterio de Laplace", 
          enlace: generarEnlace("Sección 4.6: Criterio de Laplace") 
        },
      ],
    },
    {
      titulo: "Capítulo 5: Análisis pre a posteriori",
      enlace: generarEnlace("Capítulo 5: Análisis pre a posteriori"),
      subtemas: [
        { 
          titulo: "Sección 5.1: Modelo del problema", 
          enlace: generarEnlace("Sección 5.1: Modelo del problema") 
        },
        { 
          titulo: "Sección 5.2: Información adicional", 
          enlace: generarEnlace("Sección 5.2: Información adicional") 
        },
        { 
          titulo: "Sección 5.3: Distribución a posterior", 
          enlace: generarEnlace("Sección 5.3: Distribución a posterior") 
        },
        { 
          titulo: "Sección 5.4: Valor de la información adicional", 
          enlace: generarEnlace("Sección 5.4: Valor de la información adicional") 
        },
        { 
          titulo: "Sección 5.5: Problema de decisión secuencial", 
          enlace: generarEnlace("Sección 5.5: Problema de decisión secuencial") 
        },
        { 
          titulo: "Sección 5.6: Eficiencia de la información", 
          enlace: generarEnlace("Sección 5.6: Eficiencia de la información") 
        },
      ],
    },
    {
      titulo: "Capítulo 6: Teoría de juegos",
      enlace: generarEnlace("Capítulo 6: Teoría de juegos"),
      subtemas: [
        { 
          titulo: "Sección 6.1: Modelo del problema", 
          enlace: generarEnlace("Sección 6.1: Modelo del problema") 
        },
        { 
          titulo: "Sección 6.2: Clasificación de los juegos de estrategia", 
          enlace: generarEnlace("Sección 6.2: Clasificación de los juegos de estrategia") 
        },
        { 
          titulo: "Sección 6.3: Juegos de suma cero entre dos agentes", 
          enlace: generarEnlace("Sección 6.3: Juegos de suma cero entre dos agentes") 
        },
        { 
          titulo: "Sección 6.4: Juegos de suma no constante entre dos agentes", 
          enlace: generarEnlace("Sección 6.4: Juegos de suma no constante entre dos agentes") 
        },
      ],
    },
  ],
},
    {
      titulo: "Parte 6: Convergencia en Probabilidad y Distribución",
      secciones: [
        {
          titulo: "Convergencia en variables aleatorias",
          enlace: generarEnlace("Convergencia en variables aleatorias"),
          subtemas: [
            { 
              titulo: "Muestreo y distribuciones muestrales",
              enlace: generarEnlace("Muestreo y distribuciones muestrales")
            },
            { 
              titulo: "Estimación puntual y por intervalos",
              enlace: generarEnlace("Estimación puntual y por intervalos")
            },
            { 
              titulo: "Prueba de hipótesis",
              enlace: generarEnlace("Prueba de hipótesis")
            },
            { 
              titulo: "Convergencia y teoremas límite",
              enlace: generarEnlace("Convergencia y teoremas límite")
            },
          ],
        },
        {
          titulo: "Convergencia en vectores aleatorios",
          enlace: generarEnlace("Convergencia en vectores aleatorios"),
          subtemas: [
            { 
              titulo: "Ley de los grandes números para vectores",
              enlace: generarEnlace("Ley de los grandes números para vectores")
            },
            { 
              titulo: "Teorema del límite central",
              enlace: generarEnlace("Teorema del límite central")
            },
          ],
        },
      ],
    },
  ];

  // Filtrar contenido basado en visibilidad
  const contenidoFiltrado = contenido.map(parte => ({
    ...parte,
    secciones: parte.secciones
      .filter(sec => esVisible(sec.titulo))
      .map(sec => ({
        ...sec,
        subtemas: sec.subtemas?.filter(sub => esVisible(sub.titulo))
      }))
  })).filter(parte => parte.secciones.length > 0)

  return (
    <aside
      className={`fixed top-0 left-0 h-screen transition-all duration-300 shadow-lg overflow-y-auto ${
        isCollapsed ? "w-20" : "w-80"
      }`}
      style={{
        backgroundColor: "var(--color-section)",
        color: "var(--color-text-light)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-4 font-bold text-lg border-b"
        style={{
          backgroundColor: "var(--color-header)",
          borderColor: "var(--color-button)",
        }}
      >
        {!isCollapsed && (
          <span className="flex items-center gap-2">
            <BookOpen size={22} /> Curso
          </span>
        )}
        <button
          onClick={toggleSidebar}
          className="ml-auto p-1 rounded hover:bg-[color:var(--color-button)] transition"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Navegación */}
      <nav className="px-4 py-4 text-[1rem] text-left space-y-2">
        {/* Accesos rápidos */}
        <div className="space-y-2 mb-4">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[color:var(--color-button)] transition"
          >
            <Home size={20} />
            {!isCollapsed && <span>Inicio</span>}
          </Link>
          <Link
            href="/calendario"
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[color:var(--color-button)] transition"
          >
            <Calendar size={20} />
            {!isCollapsed && <span>Calendario</span>}
          </Link>
        </div>

        {/* Estructura */}
        {!isCollapsed &&
          contenidoFiltrado.map((parte, i) => (
            <div key={i} className="mb-3 text-left">
              {/* Parte */}
              <button
                onClick={() => toggleParte(parte.titulo)}
                className="flex w-full items-start justify-between font-semibold py-2 px-2 rounded-md hover:bg-[color:var(--color-button)] transition text-left"
              >
                <span className="text-left leading-snug">
                  {parte.titulo}
                </span>
                {openPartes.includes(parte.titulo) ? (
                  <ChevronDown
                    size={18}
                    className="mt-1 flex-shrink-0"
                  />
                ) : (
                  <ChevronRight
                    size={18}
                    className="mt-1 flex-shrink-0"
                  />
                )}
              </button>

              {/* Secciones */}
              {openPartes.includes(parte.titulo) && (
                <div className="pl-4 space-y-1 mt-1">
                  {parte.secciones.map((sec, j) => {
                    return (
                      <div key={j}>
                        {sec.subtemas && sec.subtemas.length > 0 ? (
                          <>
                            {/* Sección con subtemas - Clickeable con flecha */}
                            <div className="flex items-center gap-1">
                              <Link
                                href={sec.enlace}
                                className="flex-1 text-sm font-medium py-1 px-2 rounded-md hover:bg-[color:var(--color-button)] transition text-left"
                              >
                                {sec.titulo}
                                {isAdmin && !esVisible(sec.titulo) && (
                                  <span className="ml-2 text-xs opacity-50">(Oculto)</span>
                                )}
                              </Link>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleSeccion(sec.titulo)
                                }}
                                className="p-1 rounded hover:bg-[color:var(--color-button)] transition"
                              >
                                {openSecciones.includes(sec.titulo) ? (
                                  <ChevronDown size={14} />
                                ) : (
                                  <ChevronRight size={14} />
                                )}
                              </button>
                            </div>

                            {openSecciones.includes(sec.titulo) && (
                              <ul className="pl-4 mt-1 text-sm space-y-1">
                                {sec.subtemas.map((sub, k) => (
                                  <li key={k}>
                                    <Link
                                      href={sub.enlace}
                                      className="block px-2 py-1 rounded hover:bg-[color:var(--color-button)] transition text-left"
                                    >
                                      {sub.titulo}
                                      {isAdmin && !esVisible(sub.titulo) && (
                                        <span className="ml-2 text-xs opacity-50">(Oculto)</span>
                                      )}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </>
                        ) : (
                          <Link
                            href={sec.enlace}
                            className="block w-full text-sm font-medium py-1 px-2 rounded-md hover:bg-[color:var(--color-button)] transition text-left"
                          >
                            {sec.titulo}
                            {isAdmin && !esVisible(sec.titulo) && (
                              <span className="ml-2 text-xs opacity-50">(Oculto)</span>
                            )}
                          </Link>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
      </nav>
    </aside>
  )
}