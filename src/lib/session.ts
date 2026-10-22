import { NextRequest, NextResponse } from 'next/server';
import type { User } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export function getBearerToken(req: NextRequest): string | undefined {
  return req.headers.get('authorization')?.replace('Bearer ', '') || undefined;
}

// Devuelve el usuario dueño del token, o null si la sesión no existe o expiró.
// Las sesiones expiradas se eliminan de la base de datos.
export async function getUserFromToken(token: string | undefined | null): Promise<User | null> {
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true }
  });
  if (!session) return null;

  if (new Date() > session.expiresAt) {
    await prisma.session.delete({ where: { id: session.id } });
    return null;
  }

  return session.user;
}

type AuthResult = { user: User } | { error: NextResponse };

// Valida el Bearer token y exige rol admin. Uso:
//   const auth = await requireAdmin(req);
//   if ('error' in auth) return auth.error;
export async function requireAdmin(req: NextRequest): Promise<AuthResult> {
  const token = getBearerToken(req);
  if (!token) {
    return { error: NextResponse.json({ error: 'Token faltante' }, { status: 401 }) };
  }

  const user = await getUserFromToken(token);
  if (!user) {
    return { error: NextResponse.json({ error: 'Sesión inválida o expirada' }, { status: 401 }) };
  }

  if (user.role !== 'admin') {
    return {
      error: NextResponse.json(
        { error: 'No autorizado - Se requiere rol de administrador' },
        { status: 403 }
      )
    };
  }

  return { user };
}
