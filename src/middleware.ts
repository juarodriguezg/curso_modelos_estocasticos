import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rutas que requieren autenticación
const protectedPaths = ['/temas', '/perfil'];

// Rutas que solo pueden acceder usuarios NO autenticados
const authPaths = ['/login'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Obtener token de cookie
  const token = req.cookies.get('token')?.value;
  console.log('Middleware - Path:', pathname);
  console.log('Middleware - Token:', token ? 'presente' : 'ausente');

  // Verificar si la ruta está protegida
  const isProtected = protectedPaths.some(path => pathname.startsWith(path));
  const isAuthPath = authPaths.some(path => pathname.startsWith(path));
  console.log('Middleware - isProtected:', isProtected, 'isAuthPath:', isAuthPath);

  // Si el usuario autenticado intenta ir a /login, redirigir a home
  if (isAuthPath && token) {
    console.log('Middleware - Usuario autenticado intentando acceder a login, redirigiendo a home');
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Si es una ruta protegida y no hay token
  if (isProtected && !token) {
    console.log('Middleware - Acceso denegado a ruta protegida, redirigiendo a login');
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  console.log('Middleware - Acceso permitido');
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/temas/:path*',
    '/perfil',
    '/login'
  ]
};