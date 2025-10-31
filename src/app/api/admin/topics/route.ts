import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Listar todos los temas
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Token faltante' }, { status: 401 });

    // Buscar sesión válida
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!session) {
      return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 });
    }

    if (new Date() > session.expiresAt) {
      await prisma.session.delete({ where: { id: session.id } });
      return NextResponse.json({ error: 'Sesión expirada' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Obtener todos los temas ordenados
    const topics = await prisma.topic.findMany({
      orderBy: { order: 'asc' }
    });

    return NextResponse.json({ topics });
  } catch (error) {
    console.error('Error listando temas:', error);
    return NextResponse.json({ error: 'Error listando temas' }, { status: 500 });
  }
}

// POST - Actualizar visibilidad de un tema
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Token faltante' }, { status: 401 });

    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!session) {
      return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 });
    }

    if (new Date() > session.expiresAt) {
      await prisma.session.delete({ where: { id: session.id } });
      return NextResponse.json({ error: 'Sesión expirada' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { topicId, visible } = await req.json();

    if (!topicId) {
      return NextResponse.json({ error: 'ID de tema requerido' }, { status: 400 });
    }

    // Actualizar visibilidad
    const topic = await prisma.topic.update({
      where: { id: topicId },
      data: { visible }
    });

    return NextResponse.json({ topic, message: 'Tema actualizado' });
  } catch (error) {
    console.error('Error actualizando tema:', error);
    return NextResponse.json({ error: 'Error actualizando tema' }, { status: 500 });
  }
}