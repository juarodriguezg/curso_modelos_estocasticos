// Fechas de solo día (columnas @db.Date) y zona horaria del sistema (RNF-OPE-01).
// Prisma lee y escribe las columnas DATE como medianoche UTC, por eso todas
// las fechas de solo día se manejan como "YYYY-MM-DD" a medianoche UTC.

export const TIME_ZONE = "America/Bogota";

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

// Fecha de hoy en Bogotá, como "YYYY-MM-DD".
export function todayInBogota(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(now);
}

// Convierte "YYYY-MM-DD" en Date (medianoche UTC). Devuelve null si el valor
// no es una fecha válida (p. ej. "2026-02-30").
export function parseDateOnly(value: unknown): Date | null {
  if (typeof value !== "string" || !DATE_ONLY.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  return formatDateOnly(date) === value ? date : null;
}

export function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function isOutsideRange(date: Date, start: Date, end: Date): boolean {
  return date.getTime() < start.getTime() || date.getTime() > end.getTime();
}
