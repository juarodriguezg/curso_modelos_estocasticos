import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Obtener temas visibles según el grupo del usuario
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    
    // Si no hay token, devolver array vacío (no autenticado)
    if (!token) {
      return NextResponse.json({ topics: [] });
    }

    // Buscar sesión y usuario
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!session || !session.user) {
      return NextResponse.json({ topics: [] });
    }

    const user = session.user;

    // Si es admin o teacher, devolver todos los temas
    if (user.role === 'admin' || user.role === 'teacher') {
      const topics = await prisma.topic.findMany({
        select: {
          slug: true,
          visibleGroup1: true,
          visibleGroup2: true
        },
        orderBy: { order: 'asc' }
      });

      return NextResponse.json({ 
        topics: topics.map(t => ({
          slug: t.slug,
          visible: true, // Admins/teachers ven todo
          visibleGroup1: t.visibleGroup1,
          visibleGroup2: t.visibleGroup2
        }))
      });
    }

    // Para estudiantes, filtrar según su grupo
    const grupo = user.grupo;
    if (grupo !== 1 && grupo !== 2) {
      return NextResponse.json({ topics: [] });
    }

    const topics = await prisma.topic.findMany({
      select: {
        slug: true,
        visibleGroup1: true,
        visibleGroup2: true
      },
      orderBy: { order: 'asc' }
    });

    // Filtrar según el grupo del estudiante
    return NextResponse.json({ 
      topics: topics.map(t => ({
        slug: t.slug,
        visible: grupo === 1 ? t.visibleGroup1 : t.visibleGroup2,
        visibleGroup1: t.visibleGroup1,
        visibleGroup2: t.visibleGroup2
      }))
    });
  } catch (error) {
    console.error('Error obteniendo visibilidad de temas:', error);
    return NextResponse.json({ topics: [] });
  }
}