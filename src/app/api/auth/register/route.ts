import { NextResponse } from 'next/server';

// El registro público está deshabilitado: las cuentas las crea un administrador
// desde el panel de perfil (/api/admin/create-user o /api/admin/upload-csv).
export async function POST() {
  return NextResponse.json(
    { error: 'El registro público está deshabilitado. Contacta al administrador del curso.' },
    { status: 403 }
  );
}
