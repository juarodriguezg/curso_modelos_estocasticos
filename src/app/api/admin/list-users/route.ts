import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if ('error' in auth) return auth.error;

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