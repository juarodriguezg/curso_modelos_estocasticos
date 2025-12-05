'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User, Mail, Shield, Users, Upload, Trash2, Eye, Settings, ChevronDown, ChevronRight } from 'lucide-react';
import Footer from '@/components/Footer';

interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
  grupo: number;
  createdAt?: string;
}

interface Topic {
  id: string;
  slug: string;
  title: string;
  visibleGroup1: boolean;
  visibleGroup2: boolean;
  order: number;
}

interface Subtema {
  titulo: string;
  slug: string;
}

interface Seccion {
  titulo: string;
  slug: string;
  subtemas?: Subtema[];
}

interface Parte {
  titulo: string;
  secciones: Seccion[];
}

type AdminTab = 'upload' | 'users' | 'topics';

export default function PerfilPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserData[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [activeTab, setActiveTab] = useState<AdminTab>('upload');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [openPartes, setOpenPartes] = useState<string[]>([]);
  const [openSecciones, setOpenSecciones] = useState<string[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        const response = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('No autorizado');
        const data = await response.json();
        setUser(data.user);
      } catch (error) {
        console.error('Error de autenticación:', error);
        localStorage.removeItem('token');
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

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
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      window.location.href = '/';
    }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/list-users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users);
      } else {
        alert('Error al cargar usuarios');
      }
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      alert('Error al cargar usuarios');
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadTopics = async () => {
    setLoadingTopics(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/topics', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setTopics(data.topics);
      } else {
        alert('Error al cargar temas');
      }
    } catch (error) {
      console.error('Error cargando temas:', error);
      alert('Error al cargar temas');
    } finally {
      setLoadingTopics(false);
    }
  };

  const syncTopics = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/topics/sync', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        alert(`✅ ${data.message}`);
        loadTopics();
      } else {
        alert('Error sincronizando temas');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error sincronizando temas');
    }
  };

  const toggleTopicVisibility = async (topicId: string, group: number, currentVisible: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/topics', {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          topicId, 
          group,
          visible: !currentVisible 
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setTopics(prev => prev.map(t => {
          if (t.id === topicId) {
            if (group === 1) {
              return { ...t, visibleGroup1: !currentVisible };
            } else {
              return { ...t, visibleGroup2: !currentVisible };
            }
          }
          return t;
        }));
      } else {
        alert(`Error: ${data.error || 'No se pudo actualizar'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error actualizando visibilidad del tema');
    }
  };

  const toggleParte = (parte: string) => {
    setOpenPartes(prev =>
      prev.includes(parte) ? prev.filter(p => p !== parte) : [...prev, parte]
    );
  };

  const toggleSeccion = (seccion: string) => {
    setOpenSecciones(prev =>
      prev.includes(seccion) ? prev.filter(s => s !== seccion) : [...prev, seccion]
    );
  };

  useEffect(() => {
    if (activeTab === 'users' && users.length === 0) {
      loadUsers();
    }
    if (activeTab === 'topics' && topics.length === 0) {
      loadTopics();
    }
  }, [activeTab]);

 const generarSlug = (texto: string) => {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")       
    .toLowerCase()
    .replace(/ñ/g, "n")                    
    .replace(/[^\w\s-]/g, "")              
    .replace(/\s+/g, "-")                  
    .replace(/-+/g, "-")                   
    .replace(/^-+|-+$/g, "");              
}; 

  const getTopicVisibility = (slug: string, group: number) => {
    const topic = topics.find(t => t.slug === slug);
    if (!topic) return false;
    return group === 1 ? topic.visibleGroup1 : topic.visibleGroup2;
  };

  const contenido: Parte[] = [
    {
      titulo: "Preliminares",
      secciones: [
        { titulo: "Prólogo", slug: generarSlug("Prólogo") },
        { titulo: "Prefacio", slug: generarSlug("Prefacio") },
        { titulo: "Agradecimientos", slug: generarSlug("Agradecimientos") },
        { titulo: "Introducción", slug: generarSlug("Introducción") },
      ],
    },
    {
      titulo: "Parte 1: Vectores Aleatorios",
      secciones: [
        {
          titulo: "Capítulo 1: Experimentos aleatorios y espacios de probabilidad",
          slug: generarSlug("Capítulo 1: Experimentos aleatorios y espacios de probabilidad"),
          subtemas: [
            { titulo: "Sección 1.1 Mundo, universo, cosmos y naturaleza", slug: generarSlug("Sección 1.1 Mundo, universo, cosmos y naturaleza") },
            { titulo: "Sección 1.2 Experimento aleatorio", slug: generarSlug("Sección 1.2 Experimento aleatorio") },
            { titulo: "Sección 1.3 Espacio de probabilidad incondicional", slug: generarSlug("Sección 1.3 Espacio de probabilidad incondicional") },
            { titulo: "Sección 1.4 Espacio de probabilidad condicionales", slug: generarSlug("Sección 1.4 Espacio de probabilidad condicionales") },
          ],
        },
        {
          titulo: "Capítulo 2: Variables aleatorias y sus estructuras probabilísticas",
          slug: generarSlug("Capítulo 2: Variables aleatorias y sus estructuras probabilísticas"),
          subtemas: [
            { titulo: "Sección 2.1 Definición y propiedades", slug: generarSlug("Sección 2.1 Definición y propiedades") },
            { titulo: "Sección 2.2 Variables aleatorias discretas", slug: generarSlug("Sección 2.2 Variables aleatorias discretas") },
            { titulo: "Sección 2.3 Variables aleatorias continuas", slug: generarSlug("Sección 2.3 Variables aleatorias continuas") },
            { titulo: "Sección 2.4 Esperanza matemática y momentos", slug: generarSlug("Sección 2.4 Esperanza matemática y momentos") },
          ],
        },
        {
          titulo: "Capítulo 3: Algunas familias paramétricas unidimensionales clásicas",
          slug: generarSlug("Capítulo 3: Algunas familias paramétricas unidimensionales clásicas"),
          subtemas: [
            { titulo: "Sección 3.1 Introducción y resumen", slug: generarSlug("Sección 3.1 Introducción y resumen") },
            { titulo: "Sección 3.2 Familias discretas", slug: generarSlug("Sección 3.2 Familias discretas") },
            { titulo: "Sección 3.3 Familias continuas", slug: generarSlug("Sección 3.3 Familias continuas") },
          ],
        },
        {
          titulo: "Capítulo 4: Vectores aleatorios",
          slug: generarSlug("Capítulo 4: Vectores aleatorios"),
          subtemas: [
            { titulo: "Sección 4.1 Estructura probabilística conjunta", slug: generarSlug("Sección 4.1 Estructura probabilística conjunta") },
            { titulo: "Sección 4.2 Independencia de variables aleatorias", slug: generarSlug("Sección 4.2 Independencia de variables aleatorias") },
            { titulo: "Sección 4.3 Covarianza y coeficiente de correlación", slug: generarSlug("Sección 4.3 Covarianza y coeficiente de correlación") },
            { titulo: "Sección 4.4 Esperanza matemática de vectores aleatorios", slug: generarSlug("Sección 4.4 Esperanza matemática de vectores aleatorios") },
            { titulo: "Sección 4.5 Función generadora de momentos conjunta", slug: generarSlug("Sección 4.5 Función generadora de momentos conjunta") },
            { titulo: "Sección 4.6 Familias paramétricas conjuntas", slug: generarSlug("Sección 4.6 Familias paramétricas conjuntas") },
          ],
        },
        {
          titulo: "Capítulo 5: Transformaciones de vectores aleatorios",
          slug: generarSlug("Capítulo 5: Transformaciones de vectores aleatorios"),
          subtemas: [
            { titulo: "Sección 5.1 Introducción y resumen", slug: generarSlug("Sección 5.1 Introducción y resumen") },
            { titulo: "Sección 5.2 Técnicas univariadas", slug: generarSlug("Sección 5.2 Técnicas univariadas") },
            { titulo: "Sección 5.3 Transformación de vectores aleatorios discretos", slug: generarSlug("Sección 5.3 Transformación de vectores aleatorios discretos") },
            { titulo: "Sección 5.4 Transformación de vectores aleatorios continuos", slug: generarSlug("Sección 5.4 Transformación de vectores aleatorios continuos") },
          ],
        },
      ],
    },
    {
      titulo: "Parte 2: Procesos Estocásticos",
      secciones: [
        {
          titulo: "Procesos estocásticos",
          slug: generarSlug("Procesos estocásticos"),
          subtemas: [
            { titulo: "Definición de serie de tiempo y de proceso estocástico", slug: generarSlug("Definición de serie de tiempo y de proceso estocástico") },
          ],
        },
        {
          titulo: "Series de tiempo",
          slug: generarSlug("Series de tiempo"),
          subtemas: [
            { titulo: "Funciones de autocovarianza y autocorrelación", slug: generarSlug("Funciones de autocovarianza y autocorrelación") },
            { titulo: "Procesos de ruido blanco", slug: generarSlug("Procesos de ruido blanco") },
            { titulo: "Estimación de funciones de la media, autocovarianza y autocorrelación", slug: generarSlug("Estimación de funciones de la media, autocovarianza y autocorrelación") },
            { titulo: "Modelos de series de tiempo estacionarios", slug: generarSlug("Modelos de series de tiempo estacionarios") },
          ],
        },
        {
          titulo: "Razonamiento probabilístico",
          slug: generarSlug("Razonamiento probabilístico"),
          subtemas: [
            { titulo: "Cadenas de Markov", slug: generarSlug("Cadenas de Markov") }
          ],
        },
      ],
    },
    {
      titulo: "Parte 3: Teoría del Teletráfico",
      secciones: [
        {
          titulo: "Modelo M/M/1 en detalle",
          slug: generarSlug("Modelo M/M/1 en detalle"),
          subtemas: [
            { titulo: "Notación de Kendall y medidas de desempeño", slug: generarSlug("Notación de Kendall y medidas de desempeño") },
            { titulo: "Sistemas de líneas de espera (M/M/1)", slug: generarSlug("Sistemas de líneas de espera (M/M/1)") },
            { titulo: "Ley de Little y teorema de Burke", slug: generarSlug("Ley de Little y teorema de Burke") },
          ],
        },
        {
          titulo: "Modelo M/M/1 de estado dependiente",
          slug: generarSlug("Modelo M/M/1 de estado dependiente"),
          subtemas: [
            { titulo: "Sistema general de estado dependiente", slug: generarSlug("Sistema general de estado dependiente") },
            { titulo: "Fórmulas B, B extendida y C", slug: generarSlug("Fórmulas B, B extendida y C") },
            { titulo: "Sistemas de línea de espera (G/G/1)", slug: generarSlug("Sistemas de línea de espera (G/G/1)") },
          ],
        },
      ],
    },
    {
      titulo: "Parte 4: Simulación de Redes de Telecomunicaciones",
      secciones: [
        {
          titulo: "Teorema fundamental unidimensional",
          slug: generarSlug("Teorema fundamental unidimensional"),
          subtemas: [
            { titulo: "Funciones percentiles conjuntas y teorema fundamental de la simulación", slug: generarSlug("Funciones percentiles conjuntas y teorema fundamental de la simulación") },
            { titulo: "Arquitectura general de un simulador de sistemas complejos", slug: generarSlug("Arquitectura general de un simulador de sistemas complejos") },
            { titulo: "Funciones percentiles truncadas y contaminadas conjuntas", slug: generarSlug("Funciones percentiles truncadas y contaminadas conjuntas") },
          ],
        },
        {
          titulo: "Teorema fundamental multidimensional",
          slug: generarSlug("Teorema fundamental multidimensional"),
          subtemas: [
            { titulo: "Modelos de movilidad", slug: generarSlug("Modelos de movilidad") },
            { titulo: "Lenguajes de programación para simulación de redes", slug: generarSlug("Lenguajes de programación para simulación de redes") },
          ],
        },
        {
          titulo: "Funciones percentiles generalizadas",
          slug: generarSlug("Funciones percentiles generalizadas"),
          subtemas: [
            { titulo: "Funciones percentiles generalizadas (DLG)", slug: generarSlug("Funciones percentiles generalizadas (DLG)") },
          ],
        },
      ],
    },
    {
  titulo: "Parte 5: Teoría de la Decisión",
  secciones: [
    {
      titulo: "Capítulo 1: Teoría de la utilidad",
      slug: generarSlug("Capítulo 1: Teoría de la utilidad"),
      subtemas: [
        { titulo: "Sección 1.1 Introducción", slug: generarSlug("Sección 1.1 Introducción") },
        { titulo: "Sección 1.2 Loterías", slug: generarSlug("Sección 1.2 Loterías") },
        { titulo: "Sección 1.3 Axiomática de Luce-Raiffa", slug: generarSlug("Sección 1.3 Axiomática de Luce-Raiffa") },
        { titulo: "Sección 1.4 Actitud del decisor frente al riesgo", slug: generarSlug("Sección 1.4 Actitud del decisor frente al riesgo") },
      ],
    },

    {
      titulo: "Capítulo 2: Decisiones en ambientes de certeza",
      slug: generarSlug("Capítulo 2: Decisiones en ambientes de certeza"),
      subtemas: [
        { titulo: "Sección 2.1 Planteamiento del problema", slug: generarSlug("Sección 2.1 Planteamiento del problema") },
        { titulo: "Sección 2.2 Concepto de óptimo", slug: generarSlug("Sección 2.2 Concepto de óptimo") },
        { titulo: "Sección 2.3 Conjunto de alternativas limitado e ilimitado", slug: generarSlug("Sección 2.3 Conjunto de alternativas limitado e ilimitado") },
        { titulo: "Sección 2.4 Modelos de optimización", slug: generarSlug("Sección 2.4 Modelos de optimización") },
      ],
    },

    {
      titulo: "Capítulo 3: Decisiones bajo riesgo",
      slug: generarSlug("Capítulo 3: Decisiones bajo riesgo"),
      subtemas: [
        { titulo: "Sección 3.1 Modelo del problema", slug: generarSlug("Sección 3.1 Modelo del problema") },
        { titulo: "Sección 3.2 Dominación simple y estocástica", slug: generarSlug("Sección 3.2 Dominación simple y estocástica") },
        { titulo: "Sección 3.3 Criterios de decisión", slug: generarSlug("Sección 3.3 Criterios de decisión") },
      ],
    },

    {
      titulo: "Capítulo 4: Decisiones bajo incertidumbre",
      slug: generarSlug("Capítulo 4: Decisiones bajo incertidumbre"),
      subtemas: [
        { titulo: "Sección 4.1 Modelo del problema", slug: generarSlug("Sección 4.1 Modelo del problema") },
        { titulo: "Sección 4.2 Criterio de Wald", slug: generarSlug("Sección 4.2 Criterio de Wald") },
        { titulo: "Sección 4.3 Criterio maximax", slug: generarSlug("Sección 4.3 Criterio maximax") },
        { titulo: "Sección 4.4 Criterio de decisión de Hurwicz", slug: generarSlug("Sección 4.4 Criterio de decisión de Hurwicz") },
        { titulo: "Sección 4.5 Criterio de Savage", slug: generarSlug("Sección 4.5 Criterio de Savage") },
        { titulo: "Sección 4.6 Criterio de Laplace", slug: generarSlug("Sección 4.6 Criterio de Laplace") },
      ],
    },

    {
      titulo: "Capítulo 5: Análisis pre / a posteriori",
      slug: generarSlug("Capítulo 5: Análisis pre / a posteriori"),
      subtemas: [
        { titulo: "Sección 5.1 Modelo del problema", slug: generarSlug("Sección 5.1 Modelo del problema") },
        { titulo: "Sección 5.2 Información adicional", slug: generarSlug("Sección 5.2 Información adicional") },
        { titulo: "Sección 5.3 Distribución a posteriori", slug: generarSlug("Sección 5.3 Distribución a posteriori") },
        { titulo: "Sección 5.4 Valor de la información adicional", slug: generarSlug("Sección 5.4 Valor de la información adicional") },
        { titulo: "Sección 5.5 Problema de decisión secuencial", slug: generarSlug("Sección 5.5 Problema de decisión secuencial") },
        { titulo: "Sección 5.6 Eficiencia de la información", slug: generarSlug("Sección 5.6 Eficiencia de la información") },
      ],
    },

    {
      titulo: "Capítulo 6: Teoría de juegos",
      slug: generarSlug("Capítulo 6: Teoría de juegos"),
      subtemas: [
        { titulo: "Sección 6.1 Modelo del problema", slug: generarSlug("Sección 6.1 Modelo del problema") },
        { titulo: "Sección 6.2 Clasificación de los juegos de estrategia", slug: generarSlug("Sección 6.2 Clasificación de los juegos de estrategia") },
        { titulo: "Sección 6.3 Juegos de suma cero entre dos agentes", slug: generarSlug("Sección 6.3 Juegos de suma cero entre dos agentes") },
        { titulo: "Sección 6.4 Juegos de suma no constante entre dos agentes", slug: generarSlug("Sección 6.4 Juegos de suma no constante entre dos agentes") },
      ],
    },
  ],
},
    {
      titulo: "Parte 6: Convergencia en Probabilidad y Distribución",
      secciones: [
        {
          titulo: "Convergencia en variables aleatorias",
          slug: generarSlug("Convergencia en variables aleatorias"),
          subtemas: [
            { titulo: "Muestreo y distribuciones muestrales", slug: generarSlug("Muestreo y distribuciones muestrales") },
            { titulo: "Estimación puntual y por intervalos", slug: generarSlug("Estimación puntual y por intervalos") },
            { titulo: "Prueba de hipótesis", slug: generarSlug("Prueba de hipótesis") },
            { titulo: "Convergencia y teoremas límite", slug: generarSlug("Convergencia y teoremas límite") },
          ],
        },
        {
          titulo: "Convergencia en vectores aleatorios",
          slug: generarSlug("Convergencia en vectores aleatorios"),
          subtemas: [
            { titulo: "Ley de los grandes números para vectores", slug: generarSlug("Ley de los grandes números para vectores") },
            { titulo: "Teorema del límite central", slug: generarSlug("Teorema del límite central") },
          ],
        },
      ],
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[var(--color-button)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--color-text-medium)]">Cargando...</p>
        </div>
      </div>
    );
  }

  const getRoleBadge = (role: string) => {
    const badges = {
      student: { text: 'Estudiante', color: 'bg-[var(--color-section)]' },
      teacher: { text: 'Profesor', color: 'bg-[var(--color-button)]' },
      admin: { text: 'Administrador', color: 'bg-[var(--color-header)]' },
    };
    return badges[role as keyof typeof badges] || badges.student;
  };

  const getGrupoBadge = (grupo: number) => {
    if (grupo === 0) return { text: 'Admin/Profesor', color: 'bg-gray-500' };
    return { text: `Grupo ${grupo}`, color: grupo === 1 ? 'bg-blue-500' : 'bg-green-500' };
  };

  const roleBadge = getRoleBadge(user?.role || 'student');
  const grupoBadge = getGrupoBadge(user?.grupo || 0);

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col">
      {/* Header minimalista */}
      <header className="bg-[var(--color-header)] text-[var(--color-text-light)] shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="hover:underline text-sm"
          >
            ← Volver
          </button>
          <h1 className="text-xl font-semibold">Perfil</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-[var(--color-button)] hover:opacity-90 transition"
          >
            <LogOut className="w-4 h-4" />
            Salir
          </button>
        </div>
      </header>

      {/* Contenido */}
      <main className="flex-grow max-w-5xl mx-auto px-6 py-8 w-full">
        {/* Info de usuario - minimalista */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-[var(--color-section)] rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[var(--color-text-dark)]">{user?.name}</h2>
              <div className="flex gap-2 mt-1">
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium text-white ${roleBadge.color}`}>
                  {roleBadge.text}
                </span>
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium text-white ${grupoBadge.color}`}>
                  {grupoBadge.text}
                </span>
              </div>
            </div>
          </div>
          <div className="text-sm text-[var(--color-text-medium)]">
            <Mail className="w-4 h-4 inline mr-2" />
            {user?.email}
          </div>
        </div>

        {/* Panel de administración */}
        {user?.role === 'admin' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-[var(--color-text-dark)] mb-4">
              Panel de Administración
            </h2>

            {/* Pestañas minimalistas */}
            <div className="flex gap-1 mb-6 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('upload')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition ${
                  activeTab === 'upload'
                    ? 'text-[var(--color-header)] border-b-2 border-[var(--color-header)]'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Upload className="w-4 h-4" />
                Cargar
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition ${
                  activeTab === 'users'
                    ? 'text-[var(--color-header)] border-b-2 border-[var(--color-header)]'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                Usuarios
              </button>
              <button
                onClick={() => setActiveTab('topics')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition ${
                  activeTab === 'topics'
                    ? 'text-[var(--color-header)] border-b-2 border-[var(--color-header)]'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Eye className="w-4 h-4" />
                Visibilidad
              </button>
            </div>

            {/* Contenido de pestañas */}
            <div>
              {/* Pestaña: Cargar Usuarios */}
              {activeTab === 'upload' && (
                <div>
                  <h3 className="text-base font-semibold text-[var(--color-text-dark)] mb-3">
                    Subir lista de estudiantes (CSV)
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Formato requerido:
                  </p>
                  <div className="bg-gray-50 p-3 rounded text-xs font-mono mb-4 border border-gray-200">
                    No, Apellidos, Nombre, Documento, Correo, Grupo
                  </div>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const fileInput = (e.target as HTMLFormElement).elements.namedItem('csv') as HTMLInputElement;
                      const file = fileInput.files?.[0];
                      if (!file) return alert('Por favor selecciona un archivo CSV.');

                      const formData = new FormData();
                      formData.append('file', file);

                      try {
                        const token = localStorage.getItem('token');
                        const res = await fetch('/api/admin/upload-csv', {
                          method: 'POST',
                          body: formData,
                          headers: { Authorization: `Bearer ${token}` },
                        });

                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error || 'Error al subir CSV');
                        
                        let message = `✅ ${data.message}\n`;
                        if (data.errors && data.errors.length > 0) {
                          message += `\n⚠️ Errores:\n${data.errors.join('\n')}`;
                        }
                        alert(message);
                        
                        fileInput.value = '';
                      } catch (err: any) {
                        alert(`❌ Error: ${err.message}`);
                      }
                    }}
                  >
                    <input
                      type="file"
                      name="csv"
                      accept=".csv"
                      className="block w-full text-sm mb-4 border border-gray-300 rounded-lg p-2 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-[var(--color-button)] file:text-white hover:file:opacity-90"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[var(--color-button)] text-white rounded-lg text-sm font-medium hover:opacity-90"
                    >
                      Procesar CSV
                    </button>
                  </form>
                </div>
              )}

              {/* Pestaña: Gestionar Usuarios */}
              {activeTab === 'users' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-base font-semibold text-[var(--color-text-dark)]">
                      Gestionar Usuarios
                    </h3>
                    <button
                      onClick={loadUsers}
                      disabled={loadingUsers}
                      className="px-3 py-1.5 bg-[var(--color-button)] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
                    >
                      {loadingUsers ? 'Cargando...' : 'Actualizar'}
                    </button>
                  </div>

                  {users.length > 0 ? (
                    <div className="space-y-2">
                      {users.map((u) => {
                        const userGrupoBadge = getGrupoBadge(u.grupo || 0);
                        const userRoleBadge = getRoleBadge(u.role);
                        return (
                          <div key={u.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{u.name || '(Sin nombre)'}</p>
                              <p className="text-xs text-gray-500">{u.email}</p>
                              <div className="flex gap-1 mt-1">
                                <span className={`inline-block px-2 py-0.5 rounded text-xs text-white ${userRoleBadge.color}`}>
                                  {userRoleBadge.text}
                                </span>
                                <span className={`inline-block px-2 py-0.5 rounded text-xs text-white ${userGrupoBadge.color}`}>
                                  {userGrupoBadge.text}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={async () => {
                                const token = localStorage.getItem('token');
                                if (!confirm(`¿Eliminar usuario ${u.email}?`)) return;

                                const res = await fetch(`/api/admin/delete-user?id=${u.id}`, {
                                  method: 'DELETE',
                                  headers: { Authorization: `Bearer ${token}` },
                                });

                                if (res.ok) {
                                  alert('✅ Usuario eliminado');
                                  setUsers((prev) => prev.filter((x) => x.id !== u.id));
                                } else {
                                  const data = await res.json();
                                  alert(`❌ ${data.error || 'Error al eliminar'}`);
                                }
                              }}
                              className="px-3 py-1.5 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg transition flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              Eliminar
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8 text-sm">
                      No hay usuarios. Haz clic en "Actualizar".
                    </p>
                  )}
                </div>
              )}

              {/* Pestaña: Visibilidad de Temas - Cascada */}
              {activeTab === 'topics' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-base font-semibold text-[var(--color-text-dark)]">
                      Gestionar Visibilidad por Grupos
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={syncTopics}
                        className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm font-medium hover:opacity-90 flex items-center gap-1"
                      >
                        <Settings className="w-3 h-3" />
                        Sincronizar
                      </button>
                      <button
                        onClick={loadTopics}
                        disabled={loadingTopics}
                        className="px-3 py-1.5 bg-[var(--color-button)] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
                      >
                        {loadingTopics ? 'Cargando...' : 'Actualizar'}
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mb-4">
                    Los temas ocultos no aparecerán en el menú lateral para ese grupo.
                  </p>

                  {/* Leyenda */}
                  <div className="mb-4 flex gap-4 p-2 bg-gray-50 rounded-lg text-xs border border-gray-200">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span>Grupo 1</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span>Grupo 2</span>
                    </div>
                  </div>

                  {/* Estructura en cascada */}
                  {topics.length > 0 ? (
                    <div className="space-y-2">
                      {contenido.map((parte, i) => (
                        <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
                          {/* Parte */}
                          <button
                            onClick={() => toggleParte(parte.titulo)}
                            className="flex w-full items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition text-left"
                          >
                            <span className="text-sm font-semibold text-[var(--color-text-dark)]">
                              {parte.titulo}
                            </span>
                            {openPartes.includes(parte.titulo) ? (
                              <ChevronDown className="w-4 h-4 text-gray-500" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-500" />
                            )}
                          </button>

                          {/* Secciones */}
                          {openPartes.includes(parte.titulo) && (
                            <div className="bg-white">
                              {parte.secciones.map((sec, j) => {
                                const secVisible1 = getTopicVisibility(sec.slug, 1);
                                const secVisible2 = getTopicVisibility(sec.slug, 2);
                                
                                return (
                                  <div key={j} className="border-t border-gray-100">
                                    {/* Sección con controles */}
                                    <div className="flex items-center justify-between p-3 pl-6 hover:bg-gray-50">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm text-[var(--color-text-dark)]">
                                            {sec.titulo}
                                          </span>
                                          {sec.subtemas && sec.subtemas.length > 0 && (
                                            <button
                                              onClick={() => toggleSeccion(sec.titulo)}
                                              className="p-0.5 rounded hover:bg-gray-200 transition"
                                            >
                                              {openSecciones.includes(sec.titulo) ? (
                                                <ChevronDown className="w-3 h-3 text-gray-500" />
                                              ) : (
                                                <ChevronRight className="w-3 h-3 text-gray-500" />
                                              )}
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                      
                                      <div className="flex gap-2">
                                        {/* Botón Grupo 1 */}
                                        <button
                                          onClick={() => {
                                            const topic = topics.find(t => t.slug === sec.slug);
                                            if (topic) toggleTopicVisibility(topic.id, 1, secVisible1);
                                          }}
                                          className={`px-3 py-1 rounded text-xs font-medium transition ${
                                            secVisible1
                                              ? 'bg-blue-500 hover:bg-blue-600 text-white'
                                              : 'bg-gray-300 hover:bg-gray-400 text-gray-600'
                                          }`}
                                          title={`${secVisible1 ? 'Ocultar' : 'Mostrar'} para Grupo 1`}
                                        >
                                          G1
                                        </button>
                                        
                                        {/* Botón Grupo 2 */}
                                        <button
                                          onClick={() => {
                                            const topic = topics.find(t => t.slug === sec.slug);
                                            if (topic) toggleTopicVisibility(topic.id, 2, secVisible2);
                                          }}
                                          className={`px-3 py-1 rounded text-xs font-medium transition ${
                                            secVisible2
                                              ? 'bg-green-500 hover:bg-green-600 text-white'
                                              : 'bg-gray-300 hover:bg-gray-400 text-gray-600'
                                          }`}
                                          title={`${secVisible2 ? 'Ocultar' : 'Mostrar'} para Grupo 2`}
                                        >
                                          G2
                                        </button>
                                      </div>
                                    </div>

                                    {/* Subtemas */}
                                    {sec.subtemas && sec.subtemas.length > 0 && openSecciones.includes(sec.titulo) && (
                                      <div className="bg-gray-50">
                                        {sec.subtemas.map((sub, k) => {
                                          const subVisible1 = getTopicVisibility(sub.slug, 1);
                                          const subVisible2 = getTopicVisibility(sub.slug, 2);
                                          
                                          return (
                                            <div key={k} className="flex items-center justify-between p-2 pl-12 hover:bg-gray-100 border-t border-gray-200">
                                              <span className="text-xs text-gray-700 flex-1">
                                                {sub.titulo}
                                              </span>
                                              
                                              <div className="flex gap-2">
                                                {/* Botón Grupo 1 */}
                                                <button
                                                  onClick={() => {
                                                    const topic = topics.find(t => t.slug === sub.slug);
                                                    if (topic) toggleTopicVisibility(topic.id, 1, subVisible1);
                                                  }}
                                                  className={`px-2 py-0.5 rounded text-xs font-medium transition ${
                                                    subVisible1
                                                      ? 'bg-blue-500 hover:bg-blue-600 text-white'
                                                      : 'bg-gray-300 hover:bg-gray-400 text-gray-600'
                                                  }`}
                                                  title={`${subVisible1 ? 'Ocultar' : 'Mostrar'} para Grupo 1`}
                                                >
                                                  G1
                                                </button>
                                                
                                                {/* Botón Grupo 2 */}
                                                <button
                                                  onClick={() => {
                                                    const topic = topics.find(t => t.slug === sub.slug);
                                                    if (topic) toggleTopicVisibility(topic.id, 2, subVisible2);
                                                  }}
                                                  className={`px-2 py-0.5 rounded text-xs font-medium transition ${
                                                    subVisible2
                                                      ? 'bg-green-500 hover:bg-green-600 text-white'
                                                      : 'bg-gray-300 hover:bg-gray-400 text-gray-600'
                                                  }`}
                                                  title={`${subVisible2 ? 'Ocultar' : 'Mostrar'} para Grupo 2`}
                                                >
                                                  G2
                                                </button>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8 text-sm">
                      No hay temas. Haz clic en "Sincronizar Temas".
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}