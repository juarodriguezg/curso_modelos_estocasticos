import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { filterVisibleTopics, isAdminRole } from '@/lib/courses';
import { getBearerToken, getUserFromToken } from '@/lib/session';

// GET - Obtener temas visibles según los cursos del usuario
export async function GET(req: NextRequest) {
  try {
    // Sin sesión válida, devolver array vacío (no autenticado)
    const user = await getUserFromToken(getBearerToken(req));
    if (!user) {
      return NextResponse.json({ topics: [] });
    }

    const topics = await prisma.topic.findMany({
      select: {
        id: true,
        subjectId: true,
        slug: true,
        visibleGroup1: true,
        visibleGroup2: true
      },
      orderBy: { order: 'asc' }
    });

    // Admins/teachers ven todo; los estudiantes, lo que permiten sus cursos
    const visible = new Set((await filterVisibleTopics(user, topics)).map(t => t.id));

    return NextResponse.json({
      topics: topics.map(t => ({
        slug: t.slug,
        visible: isAdminRole(user.role) || visible.has(t.id),
        visibleGroup1: t.visibleGroup1,
        visibleGroup2: t.visibleGroup2
      }))
    });
  } catch (error) {
    console.error('Error obteniendo visibilidad de temas:', error);
    return NextResponse.json({ topics: [] });
  }
}
