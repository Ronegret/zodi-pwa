/**
 * Numerología y zodiaco chino. Puro y testeado.
 * El zodiaco chino usa el Año Nuevo Lunar real (segunda luna nueva tras el
 * solsticio de invierno), no el año natural: quien nace en enero suele ser
 * del animal del año anterior.
 */
import * as Astronomy from 'astronomy-engine';

const MASTER = new Set([11, 22, 33]);

function reduce(n: number): number {
  let x = n;
  while (x > 9 && !MASTER.has(x)) {
    x = String(x)
      .split('')
      .reduce((s, d) => s + Number(d), 0);
  }
  return x;
}

/** Camino de vida: suma de día, mes y año reducidos por separado (se respetan 11, 22 y 33). */
export function lifePathNumber(birthDate: string): number {
  const [y, m, d] = birthDate.split('-').map(Number) as [number, number, number];
  return reduce(reduce(y) + reduce(m) + reduce(d));
}

/** Año personal para la fecha dada: día y mes de nacimiento + año en curso. */
export function personalYear(birthDate: string, today: string): number {
  const [, m, d] = birthDate.split('-').map(Number) as [number, number, number];
  const year = Number(today.slice(0, 4));
  const thisYearBirthday = `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const cycleYear = today < thisYearBirthday ? year - 1 : year;
  return reduce(reduce(m) + reduce(d) + reduce(cycleYear));
}

const PYTHAGOREAN: Record<string, number> = Object.fromEntries(
  'abcdefghijklmnopqrstuvwxyz'.split('').map((c, i) => [c, (i % 9) + 1]),
);

/** Número de expresión (nombre completo, tabla pitagórica, sin tildes). */
export function expressionNumber(name: string): number | null {
  const letters = name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
  if (!letters) return null;
  return reduce(letters.split('').reduce((s, c) => s + (PYTHAGOREAN[c] ?? 0), 0));
}

export { nameNumbers, nameText, type NameNumbers } from '@/lib/divination/name';

export const CHINESE_ANIMALS = [
  'Rata',
  'Buey',
  'Tigre',
  'Conejo',
  'Dragón',
  'Serpiente',
  'Caballo',
  'Cabra',
  'Mono',
  'Gallo',
  'Perro',
  'Cerdo',
] as const;
const CHINESE_ELEMENTS = ['Madera', 'Fuego', 'Tierra', 'Metal', 'Agua'] as const;

export type ChineseAnimal = (typeof CHINESE_ANIMALS)[number];

/** Fecha (UTC) del Año Nuevo Lunar del año gregoriano dado. */
export function lunarNewYear(year: number): Date {
  const solstice = Astronomy.SearchSunLongitude(
    270,
    Astronomy.MakeTime(new Date(Date.UTC(year - 1, 11, 10))),
    30,
  );
  if (!solstice) throw new Error('solsticio no encontrado');
  const first = Astronomy.SearchMoonPhase(0, solstice, 40);
  if (!first) throw new Error('luna nueva no encontrada');
  const second = Astronomy.SearchMoonPhase(0, first.AddDays(1), 40);
  if (!second) throw new Error('luna nueva no encontrada');
  // El calendario chino usa la hora de Pekín (UTC+8) para fijar el día.
  const beijing = new Date(second.date.getTime() + 8 * 3600_000);
  return new Date(Date.UTC(beijing.getUTCFullYear(), beijing.getUTCMonth(), beijing.getUTCDate()));
}

export function chineseZodiac(birthDate: string): {
  animal: ChineseAnimal;
  element: string;
  year: number;
} {
  const [y] = birthDate.split('-').map(Number) as [number];
  const born = new Date(`${birthDate}T00:00:00Z`);
  const year = born < lunarNewYear(y) ? y - 1 : y;
  // 1984 (desde el Año Nuevo Lunar) fue Rata de Madera.
  const offset = (((year - 1984) % 60) + 60) % 60;
  return {
    animal: CHINESE_ANIMALS[offset % 12]!,
    element: CHINESE_ELEMENTS[Math.floor(offset / 2) % 5]!,
    year,
  };
}
