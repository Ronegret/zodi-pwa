/**
 * "El día que naciste": el cielo sobre tu lugar de nacimiento en ese
 * instante, la Luna, si era de día o de noche, la estación (según el
 * hemisferio), tu vida en números y tus próximas citas con el cielo
 * (retorno solar, de Júpiter y de Saturno). Puro.
 */
import * as Astronomy from 'astronomy-engine';
import { PLANET_NAMES } from '@/lib/astro-engine/labels';
import { diff180 } from '@/lib/astro-engine/math';
import { longitudeOf } from '@/lib/astro-engine/planets';
import { moonInfo, type MoonPhaseName } from '@/lib/astro-engine/sky';
import { localToUtc } from '@/lib/astro-engine/time';
import type { NatalChart, PlanetId } from '@/lib/astro-engine/types';
import { daysBetween } from '@/lib/daily/biorhythm';

const BODY: Partial<Record<PlanetId, Astronomy.Body>> = {
  sun: Astronomy.Body.Sun,
  moon: Astronomy.Body.Moon,
  mercury: Astronomy.Body.Mercury,
  venus: Astronomy.Body.Venus,
  mars: Astronomy.Body.Mars,
  jupiter: Astronomy.Body.Jupiter,
  saturn: Astronomy.Body.Saturn,
  uranus: Astronomy.Body.Uranus,
  neptune: Astronomy.Body.Neptune,
  pluto: Astronomy.Body.Pluto,
};
/** Los que se ven a simple vista. */
const NAKED_EYE = new Set<PlanetId>([
  'sun',
  'moon',
  'mercury',
  'venus',
  'mars',
  'jupiter',
  'saturn',
]);

const WEEKDAY: { day: string; ruler: string; text: string }[] = [
  {
    day: 'domingo',
    ruler: 'el Sol',
    text: 'el día del Sol: llegaste con luz propia y ganas de que se te vea',
  },
  {
    day: 'lunes',
    ruler: 'la Luna',
    text: 'el día de la Luna: sientes antes de pensar y lees a la gente como nadie',
  },
  {
    day: 'martes',
    ruler: 'Marte',
    text: 'el día de Marte: viniste con coraje de serie y poca paciencia para esperar',
  },
  {
    day: 'miércoles',
    ruler: 'Mercurio',
    text: 'el día de Mercurio: ingenio, palabra rápida y una cabeza que no para',
  },
  {
    day: 'jueves',
    ruler: 'Júpiter',
    text: 'el día de Júpiter: suerte, optimismo y la manía de verlo todo en grande',
  },
  {
    day: 'viernes',
    ruler: 'Venus',
    text: 'el día de Venus: encanto, buen gusto y facilidad para gustar',
  },
  {
    day: 'sábado',
    ruler: 'Saturno',
    text: 'el día de Saturno: constancia, cabeza fría y metas que se cumplen',
  },
];

export const MOON_BIRTH: Record<MoonPhaseName, string> = {
  'Luna nueva':
    'Naciste en Luna nueva, con el cielo a oscuras y todo por estrenar: eres de comienzos, de intuiciones y de lanzarte sin mapa.',
  Creciente:
    'Naciste con la Luna creciendo: hambre de aprender, de avanzar y de demostrar de lo que eres capaz.',
  'Cuarto creciente':
    'Naciste en cuarto creciente, la Luna de la acción: decides rápido y los retos te hacen crecer.',
  'Gibosa creciente':
    'Naciste con la Luna casi llena: pules, mejoras y afinas. Lo bueno te parece mejorable.',
  'Luna llena':
    'Naciste en Luna llena, con el cielo encendido: emociones a flor de piel y una presencia que no pasa desapercibida.',
  'Gibosa menguante':
    'Naciste con la Luna empezando a menguar: te sale compartir lo que sabes y enseñar sin darte cuenta.',
  'Cuarto menguante':
    'Naciste en cuarto menguante: cuestionas, revisas y sueltas lo que ya no sirve. Alma de reformista.',
  Menguante:
    'Naciste con la Luna a punto de desaparecer: alma vieja, intuición fina y una sabiduría que no necesita hacer ruido.',
};

export interface SkyBody {
  id: PlanetId;
  name: string;
  altitude: number;
  azimuth: number;
  above: boolean;
  nakedEye: boolean;
}

export interface BirthDay {
  weekday: { day: string; ruler: string; text: string };
  moon: { name: MoonPhaseName; illumination: number; angle: number; text: string };
  /** null si no hay hora: sin hora no sabemos si era de día. */
  daylight: {
    isDay: boolean;
    sunAltitude: number;
    sunrise: string | null;
    sunset: string | null;
  } | null;
  season: { name: string; hemisphere: 'norte' | 'sur'; text: string };
  sky: SkyBody[];
  life: {
    days: number;
    fullMoons: number;
    kmAroundSun: number;
    heartbeats: number;
    years: number;
  };
  generation: string;
  nextSolarReturn: Date | null;
  jupiterReturn: Date | null;
  saturn: { first: Date | null; next: Date | null };
}

const fmtTime = (d: Date, timeZone: string) =>
  new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit', timeZone }).format(d);

function generationOf(year: number): string {
  if (year >= 2013) return 'Generación Alfa';
  if (year >= 1997) return 'Generación Z';
  if (year >= 1981) return 'Millennial';
  if (year >= 1965) return 'Generación X';
  if (year >= 1946) return 'Baby boomer';
  return 'Generación silenciosa';
}

function seasonOf(sunLon: number, latitude: number): BirthDay['season'] {
  const north = ['primavera', 'verano', 'otoño', 'invierno'];
  const south = ['otoño', 'invierno', 'primavera', 'verano'];
  const q = Math.floor(sunLon / 90) % 4;
  const hemisphere = latitude < 0 ? 'sur' : 'norte';
  const name = (hemisphere === 'sur' ? south : north)[q]!;
  const TEXT: Record<string, string> = {
    primavera: 'todo despertaba y los días se alargaban',
    verano: 'los días eran largos y el sol mandaba',
    otoño: 'los días se acortaban y las hojas caían',
    invierno: 'las noches eran largas y el frío invitaba a mirar adentro',
  };
  return { name, hemisphere, text: TEXT[name]! };
}

/** Próximo instante (tras `from`) en que el cuerpo vuelve a `target` grados. */
function nextReturn(
  id: PlanetId,
  target: number,
  from: Date,
  stepDays: number,
  maxDays: number,
): Date | null {
  const f = (t: number) => diff180(longitudeOf(id, new Date(t)), target);
  const step = stepDays * 86_400_000;
  let t0 = from.getTime();
  let v0 = f(t0);
  for (let t = t0 + step; t <= from.getTime() + maxDays * 86_400_000; t += step) {
    const v = f(t);
    // Cruce de negativo a positivo cerca del objetivo (no en el salto de ±180).
    if (v0 < 0 && v >= 0 && Math.abs(v - v0) < 90) {
      let a = t0;
      let b = t;
      for (let i = 0; i < 30; i++) {
        const m = (a + b) / 2;
        if (f(m) < 0) a = m;
        else b = m;
      }
      return new Date(b);
    }
    t0 = t;
    v0 = v;
  }
  return null;
}

export function birthDay(input: {
  chart: NatalChart;
  birthDate: string;
  timeKnown: boolean;
  timeZone: string;
  today: string;
  now: Date;
}): BirthDay {
  const { chart, birthDate, timeKnown, timeZone, today, now } = input;
  const at = new Date(chart.utc);
  const time = Astronomy.MakeTime(at);
  const observer = new Astronomy.Observer(chart.latitude, chart.longitude, 0);
  const local = new Date(`${birthDate}T12:00:00Z`);

  const sky: SkyBody[] = (Object.keys(BODY) as PlanetId[]).map((id) => {
    const eq = Astronomy.Equator(BODY[id]!, time, observer, true, true);
    const hor = Astronomy.Horizon(time, observer, eq.ra, eq.dec, 'normal');
    return {
      id,
      name: PLANET_NAMES[id],
      altitude: hor.altitude,
      azimuth: hor.azimuth,
      above: hor.altitude > 0,
      nakedEye: NAKED_EYE.has(id),
    };
  });
  const sun = sky.find((b) => b.id === 'sun')!;

  let daylight: BirthDay['daylight'] = null;
  if (timeKnown) {
    const dayStart = Astronomy.MakeTime(localToUtc(birthDate, '00:00', timeZone));
    const rise = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, +1, dayStart, 1);
    const set = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, -1, dayStart, 1);
    daylight = {
      isDay: sun.altitude > -0.833,
      sunAltitude: Math.round(sun.altitude),
      sunrise: rise ? fmtTime(rise.date, timeZone) : null,
      sunset: set ? fmtTime(set.date, timeZone) : null,
    };
  }

  const m = moonInfo(at);
  const days = Math.max(0, daysBetween(birthDate, today));
  const years = days / 365.2422;
  const natal = (id: PlanetId) => chart.planets.find((p) => p.id === id)!.lon;
  const born = at;
  const year = Number(birthDate.slice(0, 4));

  // La búsqueda de la librería falla con plazos de más de ~365 días: dos tramos de 200.
  const solar =
    Astronomy.SearchSunLongitude(natal('sun'), now, 200) ??
    Astronomy.SearchSunLongitude(natal('sun'), new Date(now.getTime() + 190 * 86_400_000), 200);
  const saturnFirst = nextReturn(
    'saturn',
    natal('saturn'),
    new Date(born.getTime() + 27 * 365.25 * 86_400_000),
    4,
    4 * 365,
  );
  const saturnNext = nextReturn('saturn', natal('saturn'), now, 4, 31 * 365);

  return {
    weekday: WEEKDAY[local.getUTCDay()]!,
    moon: { name: m.name, illumination: m.illumination, angle: m.angle, text: MOON_BIRTH[m.name] },
    daylight,
    season: seasonOf(natal('sun'), chart.latitude),
    sky,
    life: {
      days,
      fullMoons: Math.floor(days / 29.530589),
      kmAroundSun: Math.round(years * 939.9),
      heartbeats: Math.round((days * 24 * 60 * 70) / 1e6),
      years: Math.floor(years),
    },
    generation: generationOf(year),
    nextSolarReturn: solar ? solar.date : null,
    jupiterReturn: nextReturn('jupiter', natal('jupiter'), now, 2, 13 * 365),
    saturn: { first: saturnFirst, next: saturnNext },
  };
}

/** Lo justo para el panel: día de la semana, Luna al nacer y días hasta tu retorno solar. */
export function birthTeaser(chart: NatalChart, birthDate: string, now: Date) {
  const sunLon = chart.planets.find((p) => p.id === 'sun')!.lon;
  const solar =
    Astronomy.SearchSunLongitude(sunLon, now, 200) ??
    Astronomy.SearchSunLongitude(sunLon, new Date(now.getTime() + 190 * 86_400_000), 200);
  return {
    weekday: WEEKDAY[new Date(`${birthDate}T12:00:00Z`).getUTCDay()]!.day,
    moon: moonInfo(new Date(chart.utc)).name,
    daysToSolarReturn: solar
      ? Math.ceil((solar.date.getTime() - now.getTime()) / 86_400_000)
      : null,
  };
}
