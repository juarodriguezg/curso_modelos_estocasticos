import { parse } from "csv-parse/sync";
import { type NextRequest, NextResponse } from "next/server";
import { assertCourseWritable } from "@/lib/courses";
import { enrollStudent, parseStudentInput } from "@/lib/enroll";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

// POST - Importa estudiantes al curso desde un CSV con las columnas
// Correo, Documento, Nombre, Apellidos (las mismas de la carga anterior, sin
// Grupo: el curso sale de la URL). Cada fila sigue el flujo de RF-CUR-02.
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const auth = await requireAdmin(req);
    if ("error" in auth) return auth.error;

    const { id } = await params;
    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) {
      return NextResponse.json(
        { error: "Curso no encontrado" },
        { status: 404 },
      );
    }
    const readOnly = assertCourseWritable(course);
    if (readOnly) return readOnly;

    const file = (await req.formData()).get("file");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Archivo no encontrado" },
        { status: 400 },
      );
    }

    let rows: Record<string, string>[];
    try {
      rows = parse(await file.text(), {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
      });
    } catch {
      return NextResponse.json(
        { error: "El CSV no es válido" },
        { status: 400 },
      );
    }

    let created = 0;
    let reused = 0;
    let reactivated = 0;
    const errors: string[] = [];

    for (const [index, row] of rows.entries()) {
      const parsed = parseStudentInput({
        email: row.Correo,
        documentId: row.Documento,
        firstName: row.Nombre,
        lastName: row.Apellidos,
      });
      if (!parsed.ok) {
        errors.push(`Fila ${index + 2}: ${parsed.error}`);
        continue;
      }
      const result = await enrollStudent(id, parsed.data);
      if (!result.ok) {
        errors.push(`Fila ${index + 2}: ${result.error}`);
      } else if (result.reactivated) {
        reactivated++;
      } else if (result.userCreated) {
        created++;
      } else {
        reused++;
      }
    }

    const enrolled = created + reused + reactivated;
    return NextResponse.json({
      message: `${enrolled} estudiantes matriculados (${created} cuentas nuevas, ${reused} existentes, ${reactivated} reactivados). ${errors.length} filas con error.`,
      created,
      reused,
      reactivated,
      errors,
    });
  } catch (error) {
    console.error("Error importando estudiantes:", error);
    return NextResponse.json(
      { error: "Error importando estudiantes" },
      { status: 500 },
    );
  }
}
