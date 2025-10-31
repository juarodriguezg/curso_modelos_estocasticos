import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateToken, getTokenExpiration, isValidEmail, isValidPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, grupo } = await req.json();

    // Validaciones básicas
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    if (!isValidPassword(password)) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Validar grupo (obligatorio para estudiantes)
    if (grupo === undefined || grupo === null) {
      return NextResponse.json(
        { error: 'El grupo es obligatorio (1 o 2)' },
        { status: 400 }
      );
    }

    const grupoNum = parseInt(grupo, 10);
    if (isNaN(grupoNum) || ![1, 2].includes(grupoNum)) {
      return NextResponse.json(
        { error: 'El grupo debe ser 1 o 2' },
        { status: 400 }
      );
    }

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 400 }
      );
    }

    // Crear usuario
    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name: name || email.split('@')[0],
        password: hashedPassword,
        role: 'student',
        grupo: grupoNum
      }
    });

    // Crear sesión
    const token = generateToken();
    const expiresAt = getTokenExpiration();

    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt
      }
    });

    // Guardar token en cookie httpOnly
    const cookieStore = await cookies();
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: '/'
    });

    return NextResponse.json({
      message: 'Usuario registrado exitosamente',
      token, // También lo enviamos para localStorage (compatibilidad)
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        grupo: user.grupo
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    return NextResponse.json(
      { error: 'Error al registrar usuario' },
      { status: 500 }
    );
  }
}