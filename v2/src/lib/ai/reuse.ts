/**
 * Lecturas que no cambian de un día para otro: si ya la pediste igual (mismo
 * tono, extensión y enfoque), se enseña la guardada sin gastar IA ni cuota.
 * Siempre se puede pedir una nueva. Puro.
 */
import type { Json } from '@/lib/supabase/database.types';
import type { ReadingKind } from './kinds';

/** Días que vale una lectura guardada ('today' = hasta medianoche de su zona). */
export const REUSE: Partial<Record<ReadingKind, number | 'today'>> = {
  'natal-chart': 30,
  numerology: 30,
  'chinese-horoscope': 30,
  'mayan-horoscope': 30,
  'name-reading': 30,
  'daily-horoscope': 'today',
  'weekly-horoscope': 7,
  'monthly-horoscope': 30,
};

/** Lo que tiene que coincidir para reutilizar (sin lo aleatorio). */
export function reuseKey(input: Record<string, Json>): Record<string, Json> {
  const key: Record<string, Json> = {
    slug: input.slug ?? null,
    tone: input.tone ?? null,
    length: input.length ?? null,
  };
  if (input.focus !== undefined) key.focus = input.focus;
  if (input.name !== undefined) key.name = input.name;
  return key;
}

/** Desde cuándo vale una lectura guardada, o null si este tipo no se reutiliza. */
export function reuseSince(kind: ReadingKind, now: Date, todayStartUtc: Date): Date | null {
  const rule = REUSE[kind];
  if (rule === undefined) return null;
  if (rule === 'today') return todayStartUtc;
  return new Date(now.getTime() - rule * 86_400_000);
}
