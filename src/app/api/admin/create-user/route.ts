import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if ('error' in auth) return auth.error;

    const { email, password, name, role } = await req.json();

    // Validaciones
    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña son requeridos' }, { status: 400 });
    }

    // Los estudiantes se registran matriculándolos en un curso (RF-CUR-02)
    if (!role || role === 'student') {
      return NextResponse.json(
        { error: 'Los estudiantes se registran desde su curso: POST /api/admin/courses/{id}/students' },
        { status: 400 }
      );
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
        role,
        grupo: 0
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