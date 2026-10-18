/**
 * Contexto personal de cada lectura: lo que Zodi sabe de la persona y del
 * cielo de hoy, calculado de verdad (carta natal, tránsitos, Luna,
 * biorritmo, numerología). Puro: recibe los datos y la fecha, devuelve
 * texto para el prompt. Sin esto, una lectura es un horóscopo de revista.
 */
import type { NatalChart, Sign } from '@/lib/astro-engine';
import { PLANET_NAMES, elementBalance, formatPosition } from '@/lib/astro-engine/labels';
import { moonInfo, skyAt, transitsToNatal } from '@/lib/astro-engine/sky';
import { biorhythmOn, civilDate } from '@/lib/daily/biorhythm';
import { librarySnippet } from '@/lib/knowledge';
import { plainAspect, plainTransit, transitStrength } from '@/lib/daily/today';
import { chineseZodiac, lifePathNumber, personalYear } from './numerology';

export interface ProfileForReading {
  display_name: string;
  birth_date: string | null;
  birth_time: string | null;
  birth_time_known: boolean | null;
  birth_place: string | null;
  time_zone: string | null;
  reading_tone: 'suave' | 'directo' | 'brutal' | 'sarcastico';
  favorite_topics: string[];
  relationship_status: string | null;
  partner_name: string | null;
  has_kids: boolean | null;
  kids_count: number | null;
  personal_bio: string | null;
}

export interface ReadingContext {
  firstName: string;
  today: string;
  timeZone: string;
  /** Bloque de texto para el prompt. */
  text: string;
  sunSign: string | null;
}

const RELATIONSHIP: Record<string, string> = {
  single: 'soltero/a',
  relationship: 'en pareja',
  married: 'casado/a',
  complicated: 'en algo complicado',
  divorced: 'divorciado/a o separado/a',
};

/** País donde vive la persona, por su zona horaria ACTUAL (para elegir la jerga). */
export function countryFromTimeZone(tz: string): string | null {
  if (tz.startsWith('Europe/Madrid') || tz === 'Atlantic/Canary' || tz === 'Africa/Ceuta')
    return 'España';
  const byZone: Record<string, string> = {
    'America/Santiago': 'Chile',
    'America/Mexico_City': 'México',
    'America/Bogota': 'Colombia',
    'America/Lima': 'Perú',
    'America/Caracas': 'Venezuela',
    'America/Guayaquil': 'Ecuador',
    'America/Montevideo': 'Uruguay',
    'America/Asuncion': 'Paraguay',
    'America/La_Paz': 'Bolivia',
    'America/Costa_Rica': 'Costa Rica',
    'America/Panama': 'Panamá',
    'America/Santo_Domingo': 'República Dominicana',
    'America/Puerto_Rico': 'Puerto Rico',
    'America/Havana': 'Cuba',
  };
  if (tz.startsWith('America/Argentina/') || tz === 'America/Buenos_Aires') return 'Argentina';
  return byZone[tz] ?? null;
}

function timeOfDay(hour: number): string {
  if (hour < 5)
    return 'de madrugada (no puede dormir: trátalo con verdad, no con positividad vacía)';
  if (hour < 12) return 'por la mañana';
  if (hour < 20) return 'por la tarde';
  return 'por la noche';
}

function localParts(now: Date, timeZone: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour) };
}

function age(birthDate: string, today: string): number {
  const [by, bm, bd] = birthDate.split('-').map(Number) as [number, number, number];
  const [ty, tm, td] = today.split('-').map(Number) as [number, number, number];
  return ty - by - (tm < bm || (tm === bm && td < bd) ? 1 : 0);
}

/** Biorritmo [-1, 1] en palabras (el modelo no repite porcentajes). */
const energyWord = (v: number) =>
  v > 0.5 ? 'arriba' : v > 0 ? 'normal' : v > -0.5 ? 'justa' : 'por los suelos';
const pct = (v: number) => `${Math.round(v * 100)} %`;

export function buildReadingContext(
  profile: ProfileForReading,
  stored: { chart: NatalChart; timeKnown: boolean } | null,
  now: Date,
): ReadingContext {
  const timeZone = profile.time_zone ?? 'Europe/Madrid';
  const { date: today, hour } = localParts(now, timeZone);
  const firstName = profile.display_name.trim().split(/\s+/)[0] || 'tú';
  const longDate = new Intl.DateTimeFormat('es-ES', { dateStyle: 'full', timeZone }).format(now);
  const lines: string[] = [];

  lines.push('## Quién es');
  const country = countryFromTimeZone(timeZone);
  if (country)
    lines.push(`- Vive en: ${country}. Usa la jerga de ahí, no la del lugar donde nació.`);
  lines.push(`- Nombre: ${firstName} (llámalo por su nombre al menos una vez).`);
  if (profile.birth_date) {
    const birthday = profile.birth_date.slice(5) === today.slice(5);
    lines.push(
      `- Nació el ${profile.birth_date}${profile.birth_place ? ` en ${profile.birth_place}` : ''}; tiene ${age(profile.birth_date, today)} años.${birthday ? ' **HOY ES SU CUMPLEAÑOS**: celébralo de verdad.' : ''}`,
    );
  }
  if (profile.relationship_status) {
    const rel = RELATIONSHIP[profile.relationship_status] ?? profile.relationship_status;
    lines.push(
      `- Situación sentimental: ${rel}${profile.partner_name ? ` (pareja: ${profile.partner_name})` : ''}.`,
    );
  }
  if (profile.has_kids)
    lines.push(`- Tiene hijos${profile.kids_count ? ` (${profile.kids_count})` : ''}.`);
  if (profile.favorite_topics.length)
    lines.push(`- Le importa sobre todo: ${profile.favorite_topics.join(', ')}.`);
  if (profile.personal_bio)
    lines.push(`- Lo que cuenta de sí: "${profile.personal_bio.slice(0, 400)}"`);

  let sunSign: string | null = null;
  if (stored) {
    const { chart, timeKnown } = stored;
    const sun = chart.planets.find((p) => p.id === 'sun')!;
    const moon = chart.planets.find((p) => p.id === 'moon')!;
    sunSign = sun.sign;
    lines.push('', '## Su carta natal (calculada con efemérides reales)');
    lines.push(`- Sol en ${formatPosition(sun)}${timeKnown ? `, casa ${sun.house}` : ''}.`);
    lines.push(`- Luna en ${formatPosition(moon)}${timeKnown ? `, casa ${moon.house}` : ''}.`);
    if (timeKnown) {
      lines.push(
        `- Ascendente en ${formatPosition(chart.ascendant)}; Medio Cielo en ${formatPosition(chart.midheaven)}.`,
      );
    } else {
      lines.push(
        '- Sin hora de nacimiento: no hay Ascendente ni casas fiables. No te los inventes.',
      );
    }
    const others = chart.planets
      .filter((p) => !['sun', 'moon', 'northNode'].includes(p.id))
      .map((p) => `${PLANET_NAMES[p.id]} en ${p.sign}${p.retrograde ? ' (R)' : ''}`);
    lines.push(`- Resto: ${others.join(', ')}.`);
    const elements = elementBalance(chart.planets).sort((a, b) => b.count - a.count);
    lines.push(
      `- Elemento dominante: ${elements[0]!.element}; el más flojo: ${elements.at(-1)!.element}.`,
    );
    const tight = chart.aspects
      .filter((a) => a.orb <= 3)
      .slice(0, 5)
      .map((a) => plainAspect(a));
    if (tight.length)
      lines.push(`- Rasgos que más pesan en su carta (en palabras llanas): ${tight.join('; ')}.`);

    const transits = transitsToNatal(chart, now, { maxOrb: 4, includeAscendant: timeKnown }).slice(
      0,
      6,
    );
    lines.push(
      '',
      '## Lo que pasa hoy en el cielo, ya traducido (úsalo tal cual, sin términos técnicos)',
    );
    lines.push(
      transits.length
        ? transits
            .map((t) => `- ${plainTransit(t)} (${transitStrength(t.orb).toLowerCase()})`)
            .join('\n')
        : '- Ningún tránsito cercano: día de calma en su carta.',
    );
  } else {
    lines.push(
      '',
      '## Su carta natal',
      '- Aún no ha completado sus datos de nacimiento: no inventes posiciones.',
    );
  }

  const moon = moonInfo(now);
  const sky = skyAt(now);
  const retro = sky
    .filter((p) => !['sun', 'moon'].includes(p.id))
    .filter((p) => {
      const later = skyAt(new Date(now.getTime() + 86_400_000)).find((q) => q.id === p.id)!;
      const delta = ((later.lon - p.lon + 540) % 360) - 180;
      return delta < 0;
    })
    .map((p) => PLANET_NAMES[p.id]);
  lines.push('', '## El cielo de hoy');
  lines.push(`- Fecha local: ${longDate}; consulta ${timeOfDay(hour)}.`);
  lines.push(`- Luna: ${moon.name} en ${moon.sign} (${pct(moon.illumination)} iluminada).`);
  lines.push(`- Sol en ${sky.find((p) => p.id === 'sun')!.sign} (temporada de ese signo).`);
  if (retro.length) lines.push(`- Retrógrados ahora: ${retro.join(', ')}.`);

  if (profile.birth_date) {
    const bio = biorhythmOn(profile.birth_date, today);
    const cz = chineseZodiac(profile.birth_date);
    lines.push('', '## Números y otros sistemas');
    lines.push(
      `- Camino de vida: ${lifePathNumber(profile.birth_date)}; año personal: ${personalYear(profile.birth_date, today)}.`,
    );
    lines.push(`- Zodiaco chino: ${cz.animal} de ${cz.element} (año lunar ${cz.year}).`);
    lines.push(
      `- Energía hoy (cuerpo, corazón, cabeza): ${energyWord(bio.fisico)}, ${energyWord(bio.emocional)}, ${energyWord(bio.intelectual)}. Cuéntalo con esas palabras, sin porcentajes.`,
    );
  }

  if (profile.birth_date) {
    const library = librarySnippet({
      sunSign: sunSign as Sign | null,
      lifePath: lifePathNumber(profile.birth_date),
      personalYear: personalYear(profile.birth_date, today),
    });
    if (library)
      lines.push(
        '',
        '## Biblioteca de ZODI (base fiable: tradúcela a su vida, no la copies)',
        library,
      );
  }

  return { firstName, today, timeZone, text: lines.join('\n'), sunSign };
}

/** Fecha civil de hoy en la zona de la persona (para cachear el horóscopo del día). */
export const todayFor = (now: Date, timeZone: string | null) =>
  civilDate(now, timeZone ?? 'Europe/Madrid');
