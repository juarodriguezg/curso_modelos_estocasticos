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

// Portero para Server Components de rutas /admin/*.
// Lee la cookie de sesión, valida el token contra la base de datos y exige rol
// admin. Si no hay sesión -> redirige a /login; si no es admin -> redirige a /.
// La verificación ocurre en el servidor, antes de renderizar HTML. Devuelve el
// usuario autenticado cuando la verificación pasa.
export async function requireAdminPage(): Promise<User> {
  // Imports dinámicos: next/headers y next/navigation solo existen en el
  // entorno de servidor de componentes, no en el de las rutas de API.
  const { cookies } = await import('next/headers');
  const { redirect } = await import('next/navigation');

  const cookieStore = await cookies();
  const user = await getUserFromToken(cookieStore.get('token')?.value);

  if (!user) {
    redirect('/login?redirect=/admin/dashboard');
    // redirect() lanza (tipo never en tiempo de ejecución); este throw ayuda al
    // control-flow analysis de TypeScript tras el import dinámico.
    throw new Error('unreachable');
  }
  if (user.role !== 'admin') {
    redirect('/');
    throw new Error('unreachable');
  }

  return user;
}
