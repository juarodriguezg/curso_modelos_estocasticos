import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { isSafeLinkUrl, isSafeVideoUrl } from '@/lib/url';

const CONTENT_TYPES = ['TEXT', 'VIDEO', 'MATERIAL'];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAdmin(req);
    if ('error' in auth) return auth.error;

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
    const auth = await requireAdmin(req);
    if ('error' in auth) return auth.error;

    const { title, contents, links } = await req.json();

    // Validar todo antes de tocar la base de datos
    if (contents) {
      for (const content of contents) {
        if (!CONTENT_TYPES.includes(content.type)) {
          return NextResponse.json({ error: `Tipo de contenido inválido: ${content.type}` }, { status: 400 });
        }
        // Un bloque vacío se permite (borrador); si trae valor debe ser una URL segura
        if (content.type === 'VIDEO' && content.content && !isSafeVideoUrl(content.content)) {
          return NextResponse.json({ error: 'La URL del video debe comenzar con https://' }, { status: 400 });
        }
        if (content.type === 'MATERIAL' && content.content && !isSafeLinkUrl(content.content)) {
          return NextResponse.json({ error: 'La URL del material debe ser http(s) o una ruta del sitio' }, { status: 400 });
        }
      }
    }
    if (links) {
      for (const link of links) {
        if (link.url && !isSafeLinkUrl(link.url)) {
          return NextResponse.json({ error: `URL inválida en el enlace "${link.title}"` }, { status: 400 });
        }
      }
    }

    // Todo en una transacción: si algo falla, el tema conserva su contenido anterior
    const operations: Prisma.PrismaPromise<unknown>[] = [];

    if (title) {
      operations.push(prisma.topic.update({ where: { id }, data: { title } }));
    }

    // Contenidos y links se borran y recrean para simplificar el ordenado
    if (contents) {
      operations.push(prisma.content.deleteMany({ where: { topicId: id } }));
      operations.push(
        prisma.content.createMany({
          data: contents.map((content: { type: string; content: string }, index: number) => ({
            topicId: id,
            type: content.type,
            content: content.content,
            order: index
          }))
        })
      );
    }

    if (links) {
      operations.push(prisma.link.deleteMany({ where: { topicId: id } }));
      operations.push(
        prisma.link.createMany({
          data: links.map((link: { title: string; url: string }, index: number) => ({
            topicId: id,
            title: link.title,
            url: link.url,
            order: index
          }))
        })
      );
    }

    await prisma.$transaction(operations);

    return NextResponse.json({ message: 'Tema actualizado exitosamente' });

  } catch (error) {
    console.error('Error actualizando tema:', error);
    return NextResponse.json({ error: 'Error actualizando tema' }, { status: 500 });
  }
}
