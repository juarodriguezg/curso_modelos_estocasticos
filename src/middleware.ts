import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rutas que deben requerir autenticación
const protectedPaths = ['/temas', '/perfil']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Verifica si la ruta está protegida
  const isProtected = protectedPaths.some(path => pathname.startsWith(path))

  if (isProtected) {
    const token = req.cookies.get('token')?.value || req.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      // Si no hay token, redirige a login
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('redirect', pathname) // opcional: guardar a dónde iba
      return NextResponse.redirect(loginUrl)
    }
  }

  // Si todo está bien, continúa
  return NextResponse.next()
}

export const config = {
  matcher: ['/temas/:path*', '/perfil'], // aplica solo a estas rutas
}
