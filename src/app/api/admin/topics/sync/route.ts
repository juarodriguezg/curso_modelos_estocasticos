import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Lista completa de todos los temas del curso actualizada
const allTopics = [
  // Preliminares
  { slug: "prologo", title: "Prólogo", order: 1 },
  { slug: "prefacio", title: "Prefacio", order: 2 },
  { slug: "agradecimientos", title: "Agradecimientos", order: 3 },
  { slug: "introduccion", title: "Introducción", order: 4 },
  
  // Parte 1: Vectores Aleatorios
  // Capítulo 1
  { slug: "capitulo-1-experimentos-aleatorios-y-espacios-de-probabilidad", title: "Capítulo 1: Experimentos aleatorios y espacios de probabilidad", order: 5 },
  { slug: "seccion-11-mundo-universo-cosmos-y-naturaleza", title: "Sección 1.1 Mundo, universo, cosmos y naturaleza", order: 6 },
  { slug: "seccion-12-experimento-aleatorio", title: "Sección 1.2 Experimento aleatorio", order: 7 },
  { slug: "seccion-13-espacio-de-probabilidad-incondicional", title: "Sección 1.3 Espacio de probabilidad incondicional", order: 8 },
  { slug: "seccion-14-espacio-de-probabilidad-condicionales", title: "Sección 1.4 Espacio de probabilidad condicionales", order: 9 },
  
  // Capítulo 2
  { slug: "capitulo-2-variables-aleatorias-y-sus-estructuras-probabilisticas", title: "Capítulo 2: Variables aleatorias y sus estructuras probabilísticas", order: 10 },
  { slug: "seccion-21-definicion-y-propiedades", title: "Sección 2.1 Definición y propiedades", order: 11 },
  { slug: "seccion-22-variables-aleatorias-discretas", title: "Sección 2.2 Variables aleatorias discretas", order: 12 },
  { slug: "seccion-23-variables-aleatorias-continuas", title: "Sección 2.3 Variables aleatorias continuas", order: 13 },
  { slug: "seccion-24-esperanza-matematica-y-momentos", title: "Sección 2.4 Esperanza matemática y momentos", order: 14 },
  
  // Capítulo 3
  { slug: "capitulo-3-algunas-familias-parametricas-unidimensionales-clasicas", title: "Capítulo 3: Algunas familias paramétricas unidimensionales clásicas", order: 15 },
  { slug: "seccion-31-introduccion-y-resumen", title: "Sección 3.1 Introducción y resumen", order: 16 },
  { slug: "seccion-32-familias-discretas", title: "Sección 3.2 Familias discretas", order: 17 },
  { slug: "seccion-33-familias-continuas", title: "Sección 3.3 Familias continuas", order: 18 },
  
  // Capítulo 4
  { slug: "capitulo-4-vectores-aleatorios", title: "Capítulo 4: Vectores aleatorios", order: 19 },
  { slug: "seccion-41-estructura-probabilistica-conjunta", title: "Sección 4.1 Estructura probabilística conjunta", order: 20 },
  { slug: "seccion-42-independencia-de-variables-aleatorias", title: "Sección 4.2 Independencia de variables aleatorias", order: 21 },
  { slug: "seccion-43-covarianza-y-coeficiente-de-correlacion", title: "Sección 4.3 Covarianza y coeficiente de correlación", order: 22 },
  { slug: "seccion-44-esperanza-matematica-de-vectores-aleatorios", title: "Sección 4.4 Esperanza matemática de vectores aleatorios", order: 23 },
  { slug: "seccion-45-funcion-generadora-de-momentos-conjunta", title: "Sección 4.5 Función generadora de momentos conjunta", order: 24 },
  { slug: "seccion-46-familias-parametricas-conjuntas", title: "Sección 4.6 Familias paramétricas conjuntas", order: 25 },
  
  // Capítulo 5
  { slug: "capitulo-5-transformaciones-de-vectores-aleatorios", title: "Capítulo 5: Transformaciones de vectores aleatorios", order: 26 },
  { slug: "seccion-51-introduccion-y-resumen", title: "Sección 5.1 Introducción y resumen", order: 27 },
  { slug: "seccion-52-tecnicas-univariadas", title: "Sección 5.2 Técnicas univariadas", order: 28 },
  { slug: "seccion-53-transformacion-de-vectores-aleatorios-discretos", title: "Sección 5.3 Transformación de vectores aleatorios discretos", order: 29 },
  { slug: "seccion-54-transformacion-de-vectores-aleatorios-continuos", title: "Sección 5.4 Transformación de vectores aleatorios continuos", order: 30 },
  
  // Parte 2: Procesos Estocásticos
  { slug: "procesos-estocasticos", title: "Procesos estocásticos", order: 31 },
  { slug: "definicion-de-serie-de-tiempo-y-de-proceso-estocastico", title: "Definición de serie de tiempo y de proceso estocástico", order: 32 },
  { slug: "series-de-tiempo", title: "Series de tiempo", order: 33 },
  { slug: "funciones-de-autocovarianza-y-autocorrelacion", title: "Funciones de autocovarianza y autocorrelación", order: 34 },
  { slug: "procesos-de-ruido-blanco", title: "Procesos de ruido blanco", order: 35 },
  { slug: "estimacion-de-funciones-de-la-media-autocovarianza-y-autocorrelacion", title: "Estimación de funciones de la media, autocovarianza y autocorrelación", order: 36 },
  { slug: "modelos-de-series-de-tiempo-estacionarios", title: "Modelos de series de tiempo estacionarios", order: 37 },
  { slug: "razonamiento-probabilistico", title: "Razonamiento probabilístico", order: 38 },
  { slug: "cadenas-de-markov", title: "Cadenas de Markov", order: 39 },
  
  // Parte 3: Teoría del Teletráfico
  { slug: "modelo-mm1-en-detalle", title: "Modelo M/M/1 en detalle", order: 40 },
  { slug: "notacion-de-kendall-y-medidas-de-desempeno", title: "Notación de Kendall y medidas de desempeño", order: 41 },
  { slug: "sistemas-de-lineas-de-espera-mm1", title: "Sistemas de líneas de espera (M/M/1)", order: 42 },
  { slug: "ley-de-little-y-teorema-de-burke", title: "Ley de Little y teorema de Burke", order: 43 },
  { slug: "modelo-mm1-de-estado-dependiente", title: "Modelo M/M/1 de estado dependiente", order: 44 },
  { slug: "sistema-general-de-estado-dependiente", title: "Sistema general de estado dependiente", order: 45 },
  { slug: "formulas-b-b-extendida-y-c", title: "Fórmulas B, B extendida y C", order: 46 },
  { slug: "sistemas-de-linea-de-espera-gg1", title: "Sistemas de línea de espera (G/G/1)", order: 47 },
  
  // Parte 4: Simulación de Redes de Telecomunicaciones
  { slug: "teorema-fundamental-unidimensional", title: "Teorema fundamental unidimensional", order: 48 },
  { slug: "funciones-percentiles-conjuntas-y-teorema-fundamental-de-la-simulacion", title: "Funciones percentiles conjuntas y teorema fundamental de la simulación", order: 49 },
  { slug: "arquitectura-general-de-un-simulador-de-sistemas-complejos", title: "Arquitectura general de un simulador de sistemas complejos", order: 50 },
  { slug: "funciones-percentiles-truncadas-y-contaminadas-conjuntas", title: "Funciones percentiles truncadas y contaminadas conjuntas", order: 51 },
  { slug: "teorema-fundamental-multidimensional", title: "Teorema fundamental multidimensional", order: 52 },
  { slug: "modelos-de-movilidad", title: "Modelos de movilidad", order: 53 },
  { slug: "lenguajes-de-programacion-para-simulacion-de-redes", title: "Lenguajes de programación para simulación de redes", order: 54 },
  { slug: "funciones-percentiles-generalizadas", title: "Funciones percentiles generalizadas", order: 55 },
  { slug: "funciones-percentiles-generalizadas-dlg", title: "Funciones percentiles generalizadas (DLG)", order: 56 },
  
  // Parte 5: Teoría de la Decisión
  // Capítulo 1
  { slug: "capitulo-1-teoria-de-la-utilidad", title: "Capítulo 1: Teoría de la utilidad", order: 57 },
  { slug: "seccion-11-introduccion", title: "Sección 1.1 Introducción", order: 58 },
  { slug: "seccion-12-loterias", title: "Sección 1.2 Loterías", order: 59 },
  { slug: "seccion-13-axiomatica-de-luce-raiffa", title: "Sección 1.3 Axiomática de Luce Raiffa", order: 60 },
  { slug: "seccion-14-actitud-del-decisor-frente-al-riesgo", title: "Sección 1.4 Actitud del decisor frente al riesgo", order: 61 },

  // Capítulo 2
  { slug: "capitulo-2-decisiones-en-ambientes-de-certeza", title: "Capítulo 2: Decisiones en ambientes de certeza", order: 62 },
  { slug: "seccion-21-planteamiento-del-problema", title: "Sección 2.1 Planteamiento del problema", order: 63 },
  { slug: "seccion-22-concepto-de-optimo", title: "Sección 2.2 Concepto de óptimo", order: 64 },
  { slug: "seccion-23-conjunto-de-alternativas-limitado-e-ilimitado", title: "Sección 2.3 Conjunto de alternativas limitado e ilimitado", order: 65 },
  { slug: "seccion-24-modelos-de-optimizacion", title: "Sección 2.4 Modelos de optimización", order: 66 },

  // Capítulo 3
  { slug: "capitulo-3-decisiones-bajo-riesgo", title: "Capítulo 3: Decisiones bajo riesgo", order: 67 },
  { slug: "seccion-31-modelo-del-problema", title: "Sección 3.1 Modelo del problema", order: 68 },
  { slug: "seccion-32-dominacion-simple-y-estocastica", title: "Sección 3.2 Dominación simple y estocástica", order: 69 },
  { slug: "seccion-33-criterios-de-decision", title: "Sección 3.3 Criterios de decisión", order: 70 },

  // Capítulo 4
  { slug: "capitulo-4-decisiones-bajo-incertidumbre", title: "Capítulo 4: Decisiones bajo incertidumbre", order: 71 },
  { slug: "seccion-41-modelo-del-problema", title: "Sección 4.1 Modelo del problema", order: 72 },
  { slug: "seccion-42-criterio-de-wald", title: "Sección 4.2 Criterio de Wald", order: 73 },
  { slug: "seccion-43-criterio-maximax", title: "Sección 4.3 Criterio Maximax", order: 74 },
  { slug: "seccion-44-criterio-de-decision-de-hurwicz", title: "Sección 4.4 Criterio de decisión de Hurwicz", order: 75 },
  { slug: "seccion-45-criterio-de-savage", title: "Sección 4.5 Criterio de Savage", order: 76 },
  { slug: "seccion-46-criterio-de-laplace", title: "Sección 4.6 Criterio de Laplace", order: 77 },

  // Capítulo 5
  { slug: "capitulo-5-analisis-pre-a-posteriori", title: "Capítulo 5: Análisis pre a posteriori", order: 78 },
  { slug: "seccion-51-modelo-del-problema", title: "Sección 5.1 Modelo del problema", order: 79 },
  { slug: "seccion-52-informacion-adicional", title: "Sección 5.2 Información adicional", order: 80 },
  { slug: "seccion-53-distribucion-a-posterior", title: "Sección 5.3 Distribución a posterior", order: 81 },
  { slug: "seccion-54-valor-de-la-informacion-adicional", title: "Sección 5.4 Valor de la información adicional", order: 82 },
  { slug: "seccion-55-problema-de-decision-secuencial", title: "Sección 5.5 Problema de decisión secuencial", order: 83 },
  { slug: "seccion-56-eficiencia-de-la-informacion", title: "Sección 5.6 Eficiencia de la información", order: 84 },

  // Capítulo 6
  { slug: "capitulo-6-teoria-de-juegos", title: "Capítulo 6: Teoría de juegos", order: 85 },
  { slug: "seccion-61-modelo-del-problema", title: "Sección 6.1 Modelo del problema", order: 86 },
  { slug: "seccion-62-clasificacion-de-los-juegos-de-estrategia", title: "Sección 6.2 Clasificación de los juegos de estrategia", order: 87 },
  { slug: "seccion-63-juegos-de-suma-cero-entre-dos-agentes", title: "Sección 6.3 Juegos de suma cero entre dos agentes", order: 88 },
  { slug: "seccion-64-juegos-de-suma-no-constante-entre-dos-agentes", title: "Sección 6.4 Juegos de suma no constante entre dos agentes", order: 89 },

  // Parte 6: Convergencia en Probabilidad y Distribución
  { slug: "convergencia-en-variables-aleatorias", title: "Convergencia en variables aleatorias", order: 90 },
  { slug: "muestreo-y-distribuciones-muestrales", title: "Muestreo y distribuciones muestrales", order: 91 },
  { slug: "estimacion-puntual-y-por-intervalos", title: "Estimación puntual y por intervalos", order: 92 },
  { slug: "prueba-de-hipotesis", title: "Prueba de hipótesis", order: 93 },
  { slug: "convergencia-y-teoremas-limite", title: "Convergencia y teoremas límite", order: 94 },
  { slug: "convergencia-en-vectores-aleatorios", title: "Convergencia en vectores aleatorios", order: 95 },
  { slug: "ley-de-los-grandes-numeros-para-vectores", title: "Ley de los grandes números para vectores", order: 96 },
  { slug: "teorema-del-limite-central", title: "Teorema del límite central", order: 97 },
];


export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Token faltante' }, { status: 401 });

    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Sincronizar temas
    let created = 0;
    let updated = 0;

    for (const topic of allTopics) {
      const existing = await prisma.topic.findUnique({
        where: { slug: topic.slug }
      });

      if (existing) {
        // Actualizar título y orden si cambió
        await prisma.topic.update({
          where: { slug: topic.slug },
          data: { title: topic.title, order: topic.order }
        });
        updated++;
      } else {
        // Crear nuevo tema
        await prisma.topic.create({
          data: {
            slug: topic.slug,
            title: topic.title,
            order: topic.order,
            visibleGroup1: true, // Visible por defecto para grupo 1
            visibleGroup2: true  // Visible por defecto para grupo 2
          }
        });
        created++;
      }
    }

    return NextResponse.json({ 
      message: `Sincronización completada: ${created} temas creados, ${updated} actualizados`,
      created,
      updated
    });
  } catch (error) {
    console.error('Error sincronizando temas:', error);
    return NextResponse.json({ error: 'Error sincronizando temas' }, { status: 500 });
  }
}