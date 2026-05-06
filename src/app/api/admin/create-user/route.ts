import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
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

    const { email, password, name, role, grupo } = await req.json();

    // Validaciones
    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña son requeridos' }, { status: 400 });
    }

    // Validar grupo para estudiantes
    if (role === 'student') {
      if (grupo === undefined || grupo === null) {
        return NextResponse.json({ error: 'El grupo es obligatorio para estudiantes' }, { status: 400 });
      }

      const grupoNum = parseInt(grupo, 10);
      if (isNaN(grupoNum) || ![1, 2].includes(grupoNum)) {
        return NextResponse.json({ error: 'El grupo debe ser 1 o 2' }, { status: 400 });
      }
    }

    // Verificar si el usuario ya existe
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: 'El email ya está registrado' }, { status: 400 });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name: name || email.split('@')[0],
        password: hashedPassword,
        role: role || 'student',
        grupo: role === 'student' ? parseInt(grupo, 10) : 0
      }
    });

    return NextResponse.json({ 
      message: 'Usuario creado exitosamente',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        grupo: user.grupo
      }
    });
  } catch (error) {
    console.error('Error creando usuario:', error);
    return NextResponse.json({ error: 'Error creando usuario' }, { status: 500 });
  }
}