import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Lista de todos los temas del curso
const allTopics = [
  // Parte 1
  { slug: "experimentos-aleatorios-y-espacios-de-probabilidad", title: "Experimentos aleatorios y espacios de probabilidad", order: 1 },
  { slug: "variables-y-vectores-aleatorios", title: "Variables y vectores aleatorios", order: 2 },
  { slug: "esperanza-matematica", title: "Esperanza matemática", order: 3 },
  { slug: "transformaciones-de-vectores-aleatorios", title: "Transformaciones de vectores aleatorios", order: 4 },
  
  // Parte 2
  { slug: "procesos-estocasticos", title: "Procesos estocásticos", order: 5 },
  { slug: "definicion-de-serie-de-tiempo-y-de-proceso-estocastico", title: "Definición de serie de tiempo y de proceso estocástico", order: 6 },
  { slug: "series-de-tiempo", title: "Series de tiempo", order: 7 },
  { slug: "funciones-de-autocovarianza-y-autocorrelacion", title: "Funciones de autocovarianza y autocorrelación", order: 8 },
  { slug: "procesos-de-ruido-blanco", title: "Procesos de ruido blanco", order: 9 },
  { slug: "estimacion-de-funciones-de-la-media-autocovarianza-y-autocorrelacion", title: "Estimación de funciones de la media, autocovarianza y autocorrelación", order: 10 },
  { slug: "modelos-de-series-de-tiempo-estacionarios", title: "Modelos de series de tiempo estacionarios", order: 11 },
  { slug: "razonamiento-probabilistico", title: "Razonamiento probabilístico", order: 12 },
  { slug: "cadenas-de-markov", title: "Cadenas de Markov", order: 13 },
  
  // Parte 3
  { slug: "modelo-mm1-en-detalle", title: "Modelo M/M/1 en detalle", order: 14 },
  { slug: "notacion-de-kendall-y-medidas-de-desempeno", title: "Notación de Kendall y medidas de desempeño", order: 15 },
  { slug: "sistemas-de-lineas-de-espera-mm1", title: "Sistemas de líneas de espera (M/M/1)", order: 16 },
  { slug: "ley-de-little-y-teorema-de-burke", title: "Ley de Little y teorema de Burke", order: 17 },
  { slug: "modelo-mm1-de-estado-dependiente", title: "Modelo M/M/1 de estado dependiente", order: 18 },
  { slug: "sistema-general-de-estado-dependiente", title: "Sistema general de estado dependiente", order: 19 },
  { slug: "formulas-b-b-extendida-y-c", title: "Fórmulas B, B extendida y C", order: 20 },
  { slug: "sistemas-de-linea-de-espera-gg1", title: "Sistemas de línea de espera (G/G/1)", order: 21 },
  
  // Parte 4
  { slug: "teorema-fundamental-unidimensional", title: "Teorema fundamental unidimensional", order: 22 },
  { slug: "funciones-percentiles-conjuntas-y-teorema-fundamental-de-la-simulacion", title: "Funciones percentiles conjuntas y teorema fundamental de la simulación", order: 23 },
  { slug: "arquitectura-general-de-un-simulador-de-sistemas-complejos", title: "Arquitectura general de un simulador de sistemas complejos", order: 24 },
  { slug: "funciones-percentiles-truncadas-y-contaminadas-conjuntas", title: "Funciones percentiles truncadas y contaminadas conjuntas", order: 25 },
  { slug: "teorema-fundamental-multidimensional", title: "Teorema fundamental multidimensional", order: 26 },
  { slug: "modelos-de-movilidad", title: "Modelos de movilidad", order: 27 },
  { slug: "lenguajes-de-programacion-para-simulacion-de-redes", title: "Lenguajes de programación para simulación de redes", order: 28 },
  { slug: "funciones-percentiles-generalizadas", title: "Funciones percentiles generalizadas", order: 29 },
  { slug: "funciones-percentiles-generalizadas-dlg", title: "Funciones percentiles generalizadas (DLG)", order: 30 },
  
  // Parte 5
  { slug: "decisiones-bajo-incertidumbre", title: "Decisiones bajo incertidumbre", order: 31 },
  { slug: "teoria-de-la-utilidad", title: "Teoría de la utilidad", order: 32 },
  { slug: "teoria-del-riesgo-y-arboles-de-decision", title: "Teoría del riesgo y árboles de decisión", order: 33 },
  { slug: "entropia-y-valor-de-la-informacion", title: "Entropía y valor de la información", order: 34 },
  { slug: "decisiones-en-comunidades-de-agentes", title: "Decisiones en comunidades de agentes", order: 35 },
  { slug: "decisiones-multiobjetivo", title: "Decisiones multiobjetivo", order: 36 },
  
  // Parte 6
  { slug: "convergencia-en-variables-aleatorias", title: "Convergencia en variables aleatorias", order: 37 },
  { slug: "muestreo-y-distribuciones-muestrales", title: "Muestreo y distribuciones muestrales", order: 38 },
  { slug: "estimacion-puntual-y-por-intervalos", title: "Estimación puntual y por intervalos", order: 39 },
  { slug: "prueba-de-hipotesis", title: "Prueba de hipótesis", order: 40 },
  { slug: "convergencia-y-teoremas-limite", title: "Convergencia y teoremas límite", order: 41 },
  { slug: "convergencia-en-vectores-aleatorios", title: "Convergencia en vectores aleatorios", order: 42 },
  { slug: "ley-de-los-grandes-numeros-para-vectores", title: "Ley de los grandes números para vectores", order: 43 },
  { slug: "teorema-del-limite-central", title: "Teorema del límite central", order: 44 },
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