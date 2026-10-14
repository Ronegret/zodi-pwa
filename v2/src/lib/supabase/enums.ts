/**
 * Valores de enum en tiempo de ejecución (Zod, UI). Fuera de database.types.ts
 * para que regenerar los tipos con la CLI de Supabase no los borre.
 */
import type { Enums } from './database.types';

export const READING_KINDS = [
  'daily-horoscope',
  'weekly-horoscope',
  'monthly-horoscope',
  'natal-chart',
  'tarot',
  'celtic-tarot',
  'compatibility',
  'dream',
  'transits',
  'numerology',
  'name-reading',
  'palm-reading',
  'biorhythm',
  'chinese-horoscope',
  'mayan-horoscope',
  'runes',
  'crystals',
  'roast',
  'assistant',
] as const satisfies readonly Enums<'reading_kind'>[];
export const LANGUAGES = ['es', 'en', 'ca'] as const satisfies readonly Enums<'app_language'>[];
export const READING_TONES = [
  'suave',
  'directo',
  'brutal',
  'sarcastico',
] as const satisfies readonly Enums<'reading_tone'>[];
export const RELATIONSHIP_STATUSES = [
  'single',
  'relationship',
  'married',
  'complicated',
  'divorced',
] as const;
