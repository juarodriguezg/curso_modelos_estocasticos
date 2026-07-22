import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Obtener estructura jerárquica del curso para el sidebar
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');

    let userRole: string | null = null;
    let userGroup: number | null = null;

    if (token) {
      const session = await prisma.session.findUnique({
        where: { token },
        include: { user: true }
      });
      if (session && session.user) {
        userRole = session.user.role;
        userGroup = session.user.grupo;
      }
    }

    const isAdmin = userRole === 'admin' || userRole === 'teacher';

    const topics = await prisma.topic.findMany({
      orderBy: { order: 'asc' },
      select: {
        slug: true,
        title: true,
        order: true,
        parte: true,
        parentSlug: true,
        visibleGroup1: true,
        visibleGroup2: true,
      }
    });

    // Filtrar por visibilidad según grupo
    const filtered = topics.filter(t => {
      if (isAdmin) return true;
      if (!userGroup || (userGroup !== 1 && userGroup !== 2)) return true;
      return userGroup === 1 ? t.visibleGroup1 : t.visibleGroup2;
    });

    // Construir estructura jerárquica: partes -> secciones -> subtemas
    const partesMap = new Map<string, {
      titulo: string;
      secciones: { slug: string; titulo: string; enlace: string; subtemas: { slug: string; titulo: string; enlace: string; }[] }[];
    }>();

    // Primero, separar padres y hijos
    const parents = filtered.filter(t => !t.parentSlug);
    const children = filtered.filter(t => t.parentSlug);

    for (const topic of parents) {
      const parte = topic.parte || 'Otros';
      if (!partesMap.has(parte)) {
        partesMap.set(parte, { titulo: parte, secciones: [] });
      }

      const subs = children
        .filter(c => c.parentSlug === topic.slug)
        .map(c => ({
          slug: c.slug,
          titulo: c.title,
          enlace: `/temas/${c.slug}`
        }));

      partesMap.get(parte)!.secciones.push({
        slug: topic.slug,
        titulo: topic.title,
        enlace: `/temas/${topic.slug}`,
        subtemas: subs
      });
    }

    // También agregar hijos huérfanos (cuyo padre no existe o fue filtrado)
    const parentSlugs = new Set(parents.map(p => p.slug));
    const orphans = children.filter(c => !parentSlugs.has(c.parentSlug!));
    for (const orphan of orphans) {
      const parte = orphan.parte || 'Otros';
      if (!partesMap.has(parte)) {
        partesMap.set(parte, { titulo: parte, secciones: [] });
      }
      partesMap.get(parte)!.secciones.push({
        slug: orphan.slug,
        titulo: orphan.title,
        enlace: `/temas/${orphan.slug}`,
        subtemas: []
      });
    }

    const structure = Array.from(partesMap.values());

    return NextResponse.json({ structure, isAdmin });
  } catch (error) {
    console.error('Error obteniendo estructura:', error);
    return NextResponse.json({ structure: [], isAdmin: false });
  }
}
