import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Listar todos los temas con visibilidad por grupo
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

    // Obtener todos los temas ordenados con visibilidad por grupo
    const topics = await prisma.topic.findMany({
      orderBy: { order: 'asc' }
    });

    return NextResponse.json({ topics });
  } catch (error) {
    console.error('Error listando temas:', error);
    return NextResponse.json({ error: 'Error listando temas' }, { status: 500 });
  }
}

// POST - Actualizar visibilidad de un tema por grupo
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

    const { topicId, group, visible } = await req.json();

    if (!topicId || !group) {
      return NextResponse.json({ error: 'ID de tema y grupo requeridos' }, { status: 400 });
    }

    if (group !== 1 && group !== 2) {
      return NextResponse.json({ error: 'Grupo debe ser 1 o 2' }, { status: 400 });
    }

    // Actualizar visibilidad para el grupo específico
    const updateData = group === 1 
      ? { visibleGroup1: visible }
      : { visibleGroup2: visible };

    const topic = await prisma.topic.update({
      where: { id: topicId },
      data: updateData
    });

    return NextResponse.json({ 
      topic, 
      message: `Visibilidad actualizada para Grupo ${group}` 
    });
  } catch (error) {
    console.error('Error actualizando tema:', error);
    return NextResponse.json({ error: 'Error actualizando tema' }, { status: 500 });
  }
}