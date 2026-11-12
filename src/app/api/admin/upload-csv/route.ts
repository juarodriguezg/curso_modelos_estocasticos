import { NextResponse } from 'next/server';

// Obsoleto (módulo 4.3): la carga de estudiantes por CSV ahora se hace por
// curso, en POST /api/admin/courses/{id}/students/import (columnas Correo,
// Documento, Nombre, Apellidos; el grupo es el curso).
export async function POST() {
  return NextResponse.json(
    { error: 'Esta carga ya no se usa. Importa los estudiantes desde el curso en el panel de administración.' },
    { status: 410 }
  );
}
