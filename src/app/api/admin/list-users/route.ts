import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { courseLabel } from '@/lib/courses';
import { requireAdmin } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if ('error' in auth) return auth.error;

    // Obtener todos los usuarios
    const users = await prisma.user.findMany({
      select: {
        id: true, email: true, name: true, role: true, grupo: true,
        enrollments: {
          where: { active: true },
          select: {
            course: {
              select: { group: true, subject: { select: { code: true } }, period: { select: { name: true } } }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      users: users.map(({ enrollments, ...u }) => ({
        ...u,
        courses: enrollments.map(e => courseLabel(e.course))
      }))
    });
  } catch (error) {
    console.error('Error listando usuarios:', error);
    return NextResponse.json({ error: 'Error listando usuarios' }, { status: 500 });
  }
}