import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { generarSlug } from "@/lib/slug";

// Devuelve un slug único para Subject a partir de una base, añadiendo sufijo
// numérico si ya existe.
async function uniqueSubjectSlug(base: string): Promise<string> {
  const baseSlug = generarSlug(base) || "asignatura";
  let slug = baseSlug;
  let suffix = 1;
  while (
    await prisma.subject.findUnique({ where: { slug }, select: { id: true } })
  ) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }
  return slug;
}

// Normaliza el arreglo de objetivos específicos: solo strings no vacíos.
function sanitizeSpecificObjectives(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((o): o is string => typeof o === "string")
    .map((o) => o.trim())
    .filter((o) => o.length > 0);
}

// GET - Lista todas las asignaturas con el conteo de temas asociados
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if ("error" in auth) return auth.error;

    const subjects = await prisma.subject.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { topics: true } },
      },
    });

    return NextResponse.json({
      subjects: subjects.map((s) => ({
        id: s.id,
        code: s.code,
        slug: s.slug,
        name: s.name,
        credits: s.credits,
        objective: s.objective,
        specificObjectives: s.specificObjectives,
        topicCount: s._count.topics,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Error listando asignaturas:", error);
    return NextResponse.json(
      { error: "Error listando asignaturas" },
      { status: 500 },
    );
  }
}

// POST - Crea una asignatura (RF-ASG-01)
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if ("error" in auth) return auth.error;

    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const code = typeof body.code === "string" ? body.code.trim() : "";
    const objective =
      typeof body.objective === "string" ? body.objective.trim() : "";
    const specificObjectives = sanitizeSpecificObjectives(
      body.specificObjectives,
    );

    // Validaciones
    if (!name || !code) {
      return NextResponse.json(
        { error: "El nombre y el código son obligatorios" },
        { status: 400 },
      );
    }

    const credits = Number.parseInt(String(body.credits), 10);
    if (Number.isNaN(credits) || credits < 0) {
      return NextResponse.json(
        { error: "Los créditos deben ser un entero mayor o igual a 0" },
        { status: 400 },
      );
    }

    // Código único en la plataforma
    const existing = await prisma.subject.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json(
        { error: `Ya existe una asignatura con el código "${code}"` },
        { status: 400 },
      );
    }

    // Slug: se usa el provisto por el formulario (normalizado) o, si no viene,
    // se deriva del nombre. Siempre se garantiza único.
    const slugBase =
      typeof body.slug === "string" && body.slug.trim() ? body.slug : name;
    const slug = await uniqueSubjectSlug(slugBase);

    const subject = await prisma.subject.create({
      data: { name, code, slug, credits, objective, specificObjectives },
    });

    return NextResponse.json({
      message: "Asignatura creada exitosamente",
      subject,
    });
  } catch (error) {
    console.error("Error creando asignatura:", error);
    return NextResponse.json(
      { error: "Error creando asignatura" },
      { status: 500 },
    );
  }
}
