import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { filterVisibleTopics, isAdminRole } from '@/lib/courses';
import { getBearerToken, getUserFromToken } from '@/lib/session';

interface TopicRow {
  slug: string;
  title: string;
  parte: string | null;
  parentSlug: string | null;
}

interface Parte {
  titulo: string;
  secciones: { slug: string; titulo: string; enlace: string; subtemas: { slug: string; titulo: string; enlace: string; }[] }[];
}

// Construye partes -> secciones -> subtemas a partir de temas ya ordenados.
function buildPartes(topics: TopicRow[]): Parte[] {
  const partesMap = new Map<string, Parte>();

  // Primero, separar padres y hijos
  const parents = topics.filter(t => !t.parentSlug);
  const children = topics.filter(t => t.parentSlug);

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

  return Array.from(partesMap.values());
}

// GET - Obtener estructura jerárquica del curso para el sidebar:
// asignaturas -> partes -> secciones -> subtemas. Los temas sin asignatura
// van al final en el grupo "Otros temas" (id: null).
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromToken(getBearerToken(req));
    const isAdmin = user ? isAdminRole(user.role) : false;

    const topics = await prisma.topic.findMany({
      orderBy: { order: 'asc' },
      select: {
        id: true,
        subjectId: true,
        slug: true,
        title: true,
        order: true,
        parte: true,
        parentSlug: true,
        visibleGroup1: true,
        visibleGroup2: true,
      }
    });

    // Filtrar por visibilidad según los cursos del usuario. Sin sesión se
    // muestra la estructura completa (solo títulos), como antes.
    const filtered = user ? await filterVisibleTopics(user, topics) : topics;

    const subjectIds = [...new Set(filtered.map(t => t.subjectId).filter((id): id is string => id !== null))];
    const subjects = await prisma.subject.findMany({
      where: { id: { in: subjectIds } },
      orderBy: { name: 'asc' },
      select: { id: true, code: true, name: true }
    });

    const structure: { id: string | null; code: string | null; titulo: string; partes: Parte[] }[] = subjects.map(s => ({
      id: s.id,
      code: s.code,
      titulo: s.name,
      partes: buildPartes(filtered.filter(t => t.subjectId === s.id))
    }));

    const unassigned = filtered.filter(t => !t.subjectId);
    if (unassigned.length > 0) {
      structure.push({ id: null, code: null, titulo: 'Otros temas', partes: buildPartes(unassigned) });
    }

    return NextResponse.json({ structure, isAdmin });
  } catch (error) {
    console.error('Error obteniendo estructura:', error);
    return NextResponse.json({ structure: [], isAdmin: false });
  }
}
