/**
 * Biorritmo clásico: sin(2π·t/periodo) con t = días desde el nacimiento.
 * Físico 23, emocional 28, intelectual 33 días. Fechas como YYYY-MM-DD
 * (día civil del usuario), sin horas, para que no baile con la zona.
 */
export const CYCLES = { fisico: 23, emocional: 28, intelectual: 33 } as const;
export type Cycle = keyof typeof CYCLES;

const DAY = 86_400_000;
const toDay = (iso: string) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((toDay(toIso) - toDay(fromIso)) / DAY);
}

export function addDays(iso: string, n: number): string {
  return new Date(toDay(iso) + n * DAY).toISOString().slice(0, 10);
}

export type BiorhythmPoint = { date: string } & Record<Cycle, number>;

/** Valores en [-1, 1] redondeados a 3 decimales. */
export function biorhythmOn(birthIso: string, dateIso: string): BiorhythmPoint {
  const t = daysBetween(birthIso, dateIso);
  const value = (period: number) => Math.round(Math.sin((2 * Math.PI * t) / period) * 1000) / 1000;
  return {
    date: dateIso,
    fisico: value(CYCLES.fisico),
    emocional: value(CYCLES.emocional),
    intelectual: value(CYCLES.intelectual),
  };
}

export function biorhythmSeries(
  birthIso: string,
  startIso: string,
  days: number,
): BiorhythmPoint[] {
  return Array.from({ length: days }, (_, i) => biorhythmOn(birthIso, addDays(startIso, i)));
}

/** Fecha civil (YYYY-MM-DD) de un instante en una zona IANA. */
export function civilDate(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}
