import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if ('error' in auth) return auth.error;

    // Obtener ID del usuario a eliminar
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('id');
    
    if (!userId) {
      return NextResponse.json({ error: 'Falta el ID de usuario' }, { status: 400 });
    }

    // Verificar que el usuario existe
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!userToDelete) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Prevenir que el admin se elimine a sí mismo
    if (auth.user.id === userId) {
      return NextResponse.json({ error: 'No puedes eliminar tu propia cuenta' }, { status: 400 });
    }

    // RF-CUR-04: no se borra el historial académico. Un estudiante con
    // matrículas se desactiva en el curso en lugar de eliminarse.
    const enrollments = await prisma.courseEnrollment.count({ where: { userId } });
    if (enrollments > 0) {
      return NextResponse.json(
        { error: 'El usuario tiene matrículas en cursos; desactívalo desde el curso en lugar de eliminarlo' },
        { status: 409 }
      );
    }

    // Eliminar usuario (las sesiones se eliminan automáticamente por CASCADE)
    await prisma.user.delete({ where: { id: userId } });

    return NextResponse.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    return NextResponse.json({ error: 'Error eliminando usuario' }, { status: 500 });
  }
}