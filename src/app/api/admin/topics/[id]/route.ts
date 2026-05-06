import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Token faltante' }, { status: 401 });

    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const topic = await prisma.topic.findUnique({
      where: { id },
      include: {
        contents: { orderBy: { order: 'asc' } },
        links: { orderBy: { order: 'asc' } }
      }
    });

    if (!topic) {
      return NextResponse.json({ error: 'Tema no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ topic });

  } catch (error) {
    console.error('Error obteniendo tema:', error);
    return NextResponse.json({ error: 'Error obteniendo tema' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Token faltante' }, { status: 401 });

    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { title, contents, links } = await req.json();

    // Actualizar el título del tema
    if (title) {
      await prisma.topic.update({
        where: { id },
        data: { title }
      });
    }

    // Actualizar contenidos (borrar y recrear para simplificar el ordenado)
    if (contents) {
      await prisma.content.deleteMany({ where: { topicId: id } });
      for (const [index, content] of contents.entries()) {
        await prisma.content.create({
          data: {
            topicId: id,
            type: content.type,
            content: content.content,
            order: index
          }
        });
      }
    }

    // Actualizar links
    if (links) {
      await prisma.link.deleteMany({ where: { topicId: id } });
      for (const [index, link] of links.entries()) {
        await prisma.link.create({
          data: {
            topicId: id,
            title: link.title,
            url: link.url,
            order: index
          }
        });
      }
    }

    return NextResponse.json({ message: 'Tema actualizado exitosamente' });

  } catch (error) {
    console.error('Error actualizando tema:', error);
    return NextResponse.json({ error: 'Error actualizando tema' }, { status: 500 });
  }
}
