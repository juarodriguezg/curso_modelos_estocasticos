import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value || req.headers.get('authorization')?.replace('Bearer ', '');

    if (token) {
      // Eliminar sesión de la base de datos
      await prisma.session.deleteMany({
        where: { token }
      });
    }

    // Eliminar cookie
    const cookieStore = await cookies();
    cookieStore.delete('token');

    return NextResponse.json({
      message: 'Logout exitoso'
    });
  } catch (error) {
    console.error('Error en logout:', error);
    return NextResponse.json(
      { error: 'Error al cerrar sesión' },
      { status: 500 }
    );
  }
}