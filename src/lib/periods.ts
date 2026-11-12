import { formatDateOnly, parseDateOnly } from "@/lib/dates";

export interface PeriodInput {
  name: string;
  startDate: Date;
  endDate: Date;
}

// Valida el formulario de periodo académico (RF-CUR-10, RF-CUR-07).
export function parsePeriodInput(
  body: Record<string, unknown>,
): { ok: true; data: PeriodInput } | { ok: false; error: string } {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name)
    return { ok: false, error: "El nombre del periodo es obligatorio" };

  const startDate = parseDateOnly(body.startDate);
  const endDate = parseDateOnly(body.endDate);
  if (!startDate || !endDate) {
    return {
      ok: false,
      error: "Las fechas de inicio y final son obligatorias (AAAA-MM-DD)",
    };
  }
  if (startDate.getTime() >= endDate.getTime()) {
    return {
      ok: false,
      error: "La fecha de inicio debe ser anterior a la fecha final",
    };
  }
  return { ok: true, data: { name, startDate, endDate } };
}

export function serializePeriod(p: {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
}) {
  return {
    id: p.id,
    name: p.name,
    startDate: formatDateOnly(p.startDate),
    endDate: formatDateOnly(p.endDate),
  };
}
