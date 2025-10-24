import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { parse } from 'csv-parse/sync';
import { Readable } from 'stream';

// Función auxiliar para leer el CSV del body
async function readCSV(req: NextRequest): Promise<any[]> {
  const data = await req.formData();
  const file = data.get('file') as File;
  if (!file) throw new Error('Archivo no encontrado');

  const text = await file.text();
  const records = parse(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  return records;
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    // Validar que el usuario que hace esto es admin
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Leer CSV
    const rows = await readCSV(req);

    let count = 0;
    for (const row of rows) {
      const email = row['Correo']?.trim();
      const documento = row['Documento']?.trim();
      const nombre = `${row['Nombre'] || ''} ${row['Apellidos'] || ''}`.trim();

      if (!email || !documento) continue;

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) continue; // Evita duplicados

      const hashed = await bcrypt.hash(documento, 10);

      await prisma.user.create({
        data: {
          name: nombre,
          email,
          password: hashed,
          role: 'student',
        },
      });

      count++;
    }

    return NextResponse.json({ message: `Se crearon ${count} usuarios nuevos.` });
  } catch (error) {
    console.error('Error al procesar CSV:', error);
    return NextResponse.json({ error: 'Error procesando el archivo CSV' }, { status: 500 });
  }
}
