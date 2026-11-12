import { type NextRequest, NextResponse } from "next/server";
import { parsePeriodInput, serializePeriod } from "@/lib/periods";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

// GET - Lista los periodos académicos con el número de cursos
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if ("error" in auth) return auth.error;

    const periods = await prisma.academicPeriod.findMany({
      orderBy: { startDate: "desc" },
      include: { _count: { select: { courses: true } } },
    });

    return NextResponse.json({
      periods: periods.map((p) => ({
        ...serializePeriod(p),
        courseCount: p._count.courses,
      })),
    });
  } catch (error) {
    console.error("Error listando periodos:", error);
    return NextResponse.json(
      { error: "Error listando periodos" },
      { status: 500 },
    );
  }
}

// POST - Crea un periodo académico (RF-CUR-10)
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if ("error" in auth) return auth.error;

    const parsed = parsePeriodInput(await req.json());
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const existing = await prisma.academicPeriod.findUnique({
      where: { name: parsed.data.name },
    });
    if (existing) {
      return NextResponse.json(
        { error: `Ya existe un periodo llamado "${parsed.data.name}"` },
        { status: 409 },
      );
    }

    const period = await prisma.academicPeriod.create({ data: parsed.data });
    return NextResponse.json({
      message: "Periodo creado",
      period: serializePeriod(period),
    });
  } catch (error) {
    console.error("Error creando periodo:", error);
    return NextResponse.json(
      { error: "Error creando periodo" },
      { status: 500 },
    );
  }
}
