import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Token faltante' }, { status: 401 });

    // Buscar sesión válida usando el token
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!session) {
      return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 });
    }

    // Verificar expiración
    if (new Date() > session.expiresAt) {
      await prisma.session.delete({ where: { id: session.id } });
      return NextResponse.json({ error: 'Sesión expirada' }, { status: 401 });
    }

    // Verificar que sea admin
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado - Se requiere rol de administrador' }, { status: 403 });
    }

    // Obtener todos los usuarios
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, grupo: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error listando usuarios:', error);
    return NextResponse.json({ error: 'Error listando usuarios' }, { status: 500 });
  }
}