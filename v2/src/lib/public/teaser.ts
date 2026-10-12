/**
 * "Mira lo que ZODI sabe de ti": lo que se puede calcular solo con la fecha
 * de nacimiento, sin cuenta ni IA. La Luna y el ascendente piden hora y lugar
 * (eso ya es la carta completa). Puro.
 */
import { SIGN_GLYPHS } from '@/lib/astro-engine/labels';
import { toZodiac } from '@/lib/astro-engine/math';
import { longitudeOf } from '@/lib/astro-engine/planets';
import type { Sign } from '@/lib/astro-engine/types';
import { chineseZodiac, lifePathNumber } from '@/lib/ai/numerology';
import { mayanSign, type MayanSign } from '@/lib/divination/maya';
import { MAJOR_ARCANA, type TarotCard } from '@/lib/tarot/daily';
import { SIGN_INFO } from './signs';

/** AAAA-MM-DD válida, entre 1900 y hoy; si no, null. */
export function parseBirthDate(value: string | null, today: string): string | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== value) return null;
  return value >= '1900-01-01' && value <= today ? value : null;
}

/** Carta de nacimiento: los dígitos de la fecha sumados hasta 22 o menos (22 = El Loco). */
export function birthCard(date: string): TarotCard {
  let n = date
    .replaceAll('-', '')
    .split('')
    .reduce((s, d) => s + Number(d), 0);
  while (n > 22) {
    n = String(n)
      .split('')
      .reduce((s, d) => s + Number(d), 0);
  }
  return MAJOR_ARCANA[n % 22]!;
}

export interface Teaser {
  date: string;
  sun: { sign: Sign; glyph: string; slug: string; desc: string };
  lifePath: number;
  chinese: { animal: string; element: string };
  maya: MayanSign;
  card: TarotCard;
}

export function birthTeaser(date: string): Teaser {
  // A mediodía: en los días de cambio de signo puede variar con la hora (se avisa).
  const sign = toZodiac(longitudeOf('sun', new Date(`${date}T12:00:00Z`))).sign;
  const info = SIGN_INFO.find((s) => s.name === sign)!;
  const chinese = chineseZodiac(date);
  return {
    date,
    sun: { sign, glyph: SIGN_GLYPHS[sign], slug: info.slug, desc: info.desc },
    lifePath: lifePathNumber(date),
    chinese: { animal: chinese.animal, element: chinese.element },
    maya: mayanSign(date),
    card: birthCard(date),
  };
}
