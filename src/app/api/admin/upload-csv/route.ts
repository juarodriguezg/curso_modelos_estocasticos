import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import bcrypt from 'bcryptjs';
import { parse } from 'csv-parse/sync';

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
    const auth = await requireAdmin(req);
    if ('error' in auth) return auth.error;

    // Leer CSV
    const rows = await readCSV(req);

    let count = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const row of rows) {
      const email = row['Correo']?.trim();
      const documento = row['Documento']?.trim();
      const nombre = `${row['Nombre'] || ''} ${row['Apellidos'] || ''}`.trim();
      const grupoStr = row['Grupo']?.trim();

      // Validaciones
      if (!email || !documento) {
        skipped++;
        errors.push(`Fila sin email o documento: ${nombre || 'N/A'}`);
        continue;
      }

      if (!grupoStr) {
        skipped++;
        errors.push(`Usuario ${email}: Grupo no especificado`);
        continue;
      }

      const grupo = parseInt(grupoStr, 10);

      if (isNaN(grupo) || ![1, 2].includes(grupo)) {
        skipped++;
        errors.push(`Usuario ${email}: Grupo inválido (debe ser 1 o 2), recibido: ${grupoStr}`);
        continue;
      }

      // Verificar si el usuario ya existe
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        skipped++;
        errors.push(`Usuario ${email}: Ya existe en la base de datos`);
        continue;
      }

      // Crear usuario
      const hashed = await bcrypt.hash(documento, 10);

      await prisma.user.create({
        data: {
          name: nombre,
          email,
          password: hashed,
          role: 'student',
          grupo: grupo,
        },
      });

      count++;
    }

    return NextResponse.json({ 
      message: `Se crearon ${count} usuarios nuevos. ${skipped > 0 ? `${skipped} omitidos.` : ''}`,
      created: count,
      skipped: skipped,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error al procesar CSV:', error);
    return NextResponse.json({ error: 'Error procesando el archivo CSV' }, { status: 500 });
  }
}