import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    const { title, slug, parte, parentSlug } = await req.json();

    if (!title || !slug) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    // Comprobar que el slug no exista
    const existing = await prisma.topic.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: 'El slug ya está en uso' }, { status: 400 });
    }

    // Obtener el mayor order
    const maxTopic = await prisma.topic.findFirst({
      orderBy: { order: 'desc' }
    });

    const newOrder = maxTopic ? maxTopic.order + 1 : 1;

    const newTopic = await prisma.topic.create({
      data: {
        title,
        slug,
        order: newOrder,
        parte: parte || null,
        parentSlug: parentSlug || null,
        visibleGroup1: true,
        visibleGroup2: true
      }
    });

    return NextResponse.json({ message: 'Tema creado exitosamente', topic: newTopic });

  } catch (error) {
    console.error('Error creando tema:', error);
    return NextResponse.json({ error: 'Error creando tema' }, { status: 500 });
  }
}
