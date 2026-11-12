import { type NextRequest, NextResponse } from "next/server";
import { courseLabel } from "@/lib/courses";
import { parseDateOnly, todayInBogota } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

// GET - Finaliza los cursos cuyo periodo ya terminó (RF-CUR-05). Lo invoca
// Vercel Cron a diario (vercel.json) con "Authorization: Bearer CRON_SECRET".
// Un curso sigue activo todo el día de la fecha final y se finaliza al día
// siguiente (hora de Bogotá). No se tocan los cursos reactivados a mano después
// del fin del periodo.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const today = parseDateOnly(todayInBogota()) as Date;
    const candidates = await prisma.course.findMany({
      where: { status: "ACTIVE", period: { endDate: { lt: today } } },
      include: {
        subject: { select: { code: true } },
        period: { select: { name: true, endDate: true } },
      },
    });

    // reactivatedAt es un instante; se compara con la medianoche de Bogotá
    // (UTC-5, sin horario de verano) del día siguiente al fin del periodo.
    const toFinalize = candidates.filter((c) => {
      if (!c.reactivatedAt) return true;
      const periodOver = new Date(
        c.period.endDate.getTime() + 24 * 3_600_000 + 5 * 3_600_000,
      );
      return c.reactivatedAt < periodOver;
    });

    if (toFinalize.length > 0) {
      await prisma.course.updateMany({
        where: { id: { in: toFinalize.map((c) => c.id) } },
        data: { status: "FINALIZED", finalizedAt: new Date() },
      });
    }

    return NextResponse.json({
      finalized: toFinalize.map((c) => ({ id: c.id, label: courseLabel(c) })),
    });
  } catch (error) {
    console.error("Error en la finalización automática de cursos:", error);
    return NextResponse.json(
      { error: "Error finalizando cursos" },
      { status: 500 },
    );
  }
}
