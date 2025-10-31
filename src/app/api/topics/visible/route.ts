import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Obtener solo los temas visibles (endpoint público)
export async function GET() {
  try {
    // Obtener todos los temas con su estado de visibilidad
    const topics = await prisma.topic.findMany({
      select: {
        slug: true,
        visible: true
      },
      orderBy: { order: 'asc' }
    });

    return NextResponse.json({ topics });
  } catch (error) {
    console.error('Error obteniendo visibilidad de temas:', error);
    // Si hay error, devolver array vacío (permitirá ver todo por defecto)
    return NextResponse.json({ topics: [] });
  }
}