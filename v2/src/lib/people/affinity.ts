/**
 * Afinidad entre dos personas y "cómo está el día" entre ellas. Por signos
 * (lo que se puede saber solo con la fecha) más chino y numerología. Puro.
 *
 * Los textos hablan de los signos en tercera persona ("Aries y Leo se
 * entienden"), que se lee igual en España y en Latinoamérica.
 */
import { computeNatalChart } from '@/lib/astro-engine';
import { elementOf, type Element } from '@/lib/astro-engine/labels';
import { skyAt } from '@/lib/astro-engine/sky';
import { SIGNS, type PlanetId, type Sign } from '@/lib/astro-engine/types';
import { CHINESE_ANIMALS, chineseZodiac, lifePathNumber } from '@/lib/ai/numerology';
import { biorhythmOn, daysBetween } from '@/lib/daily/biorhythm';
import type { Relation } from './relations';

export { RELATION_IDS, RELATIONS, type Relation } from './relations';

// ---------- El cielo de una persona (sin lugar: solo planetas) ----------

export interface PersonSky {
  sun: Sign;
  /** null si ese día la Luna cambió de signo y no sabemos la hora. */
  moon: Sign | null;
  /** Los signos posibles de la Luna (uno o dos). */
  moonOptions: Sign[];
  mercury: Sign;
  venus: Sign;
  mars: Sign;
}

/**
 * Sin lugar de nacimiento los planetas salen igual (las casas no). Sin hora se
 * mira la Luna al empezar y al acabar el día: si no cambió de signo, es fiable.
 */
export function personSky(
  birthDate: string,
  birthTime: string | null,
  timeZone: string,
): PersonSky {
  const at = (time: string) => {
    const chart = computeNatalChart({ date: birthDate, time, timeZone, latitude: 0, longitude: 0 });
    return (id: PlanetId) => chart.planets.find((p) => p.id === id)!.sign;
  };
  const main = at(birthTime ?? '12:00');
  const moonOptions = birthTime
    ? [main('moon')]
    : [...new Set([at('00:00')('moon'), at('23:59')('moon')])];
  return {
    sun: main('sun'),
    moon: moonOptions.length === 1 ? moonOptions[0]! : null,
    moonOptions,
    mercury: main('mercury'),
    venus: main('venus'),
    mars: main('mars'),
  };
}

// ---------- Signo con signo ----------

export interface SignMatch {
  /** Distancia en la rueda (0 = mismo signo … 6 = opuestos). */
  distance: number;
  score: number;
  /** Nombre del vínculo ("Trígono"…), para enseñar. */
  name: string;
  text: string;
  elements: string;
}

const DISTANCE: { score: number; name: string; text: string }[] = [
  {
    score: 82,
    name: 'Mismo signo',
    text: 'Funcionan igual: se entienden sin hablar y chocan justo en lo mismo. Un espejo, para lo bueno y para lo malo.',
  },
  {
    score: 58,
    name: 'Signos vecinos',
    text: 'Están al lado en la rueda pero son muy distintos: lo que a uno le sobra al otro le falta. Se aprende mucho si hay paciencia.',
  },
  {
    score: 80,
    name: 'Sextil (se ayudan)',
    text: 'Buena química y conversación fácil. Se animan mutuamente, y funciona mejor cuantas más cosas hacen juntos.',
  },
  {
    score: 48,
    name: 'Cuadratura (fricción)',
    text: 'Quieren cosas diferentes y lo dicen. Mucha chispa y alguna bronca; con respeto, se hacen crecer el uno al otro.',
  },
  {
    score: 92,
    name: 'Trígono (armonía)',
    text: 'Mismo elemento, misma onda: armonía natural. Lo difícil aquí es no acomodarse.',
  },
  {
    score: 52,
    name: 'Quincuncio (ajuste)',
    text: 'No acaban de pillarse el punto: hay que ajustar mucho. Con humor y sin dar nada por hecho, funciona.',
  },
  {
    score: 72,
    name: 'Opuestos (atracción)',
    text: 'Los polos opuestos se atraen: lo que uno no tiene, lo tiene el otro. Mucha atracción y mucha negociación.',
  },
];

const ELEMENT_PAIR: Record<string, string> = {
  'Fuego-Fuego': 'Dos hogueras: energía, pasión y algo de competencia. Nadie se aburre.',
  'Tierra-Tierra': 'Dos pies en el suelo: estabilidad, planes y lealtad. Ojo con la rutina.',
  'Aire-Aire': 'Dos cabezas a mil: conversación infinita. Ojo con hablarlo todo y no hacer nada.',
  'Agua-Agua': 'Dos océanos: se sienten sin hablar. Ojo con ahogarse en emociones.',
  'Aire-Fuego': 'El aire aviva el fuego: se inspiran y se animan a lanzarse.',
  'Agua-Tierra': 'El agua riega la tierra: uno da seguridad y el otro ternura. Muy buena base.',
  'Agua-Fuego':
    'Fuego y agua hacen vapor: pasión intensa o se apagan las ganas. La clave es no herir.',
  'Fuego-Tierra':
    'El fuego quiere ir ya; la tierra, ir bien. Si se escuchan, convierten ideas en hechos.',
  'Agua-Aire':
    'Uno piensa y el otro siente: a veces no se entienden. Hablar de emociones sin analizarlas ayuda.',
  'Aire-Tierra': 'Uno sueña y el otro aterriza. Juntos, ideas que funcionan (si no se desesperan).',
};

const pairKey = (a: Element, b: Element) => [a, b].sort().join('-');

export function signDistance(a: Sign, b: Sign): number {
  const d = Math.abs(SIGNS.indexOf(a) - SIGNS.indexOf(b));
  return Math.min(d, 12 - d);
}

export function signMatch(a: Sign, b: Sign): SignMatch {
  const distance = signDistance(a, b);
  const base = DISTANCE[distance]!;
  return {
    distance,
    ...base,
    elements: ELEMENT_PAIR[pairKey(elementOf(a), elementOf(b))]!,
  };
}

// ---------- Horóscopo chino y números ----------

export interface SimpleMatch {
  score: number;
  name: string;
  text: string;
}

export function chineseMatch(
  birthA: string,
  birthB: string,
): SimpleMatch & { a: string; b: string } {
  const a = chineseZodiac(birthA).animal;
  const b = chineseZodiac(birthB).animal;
  const i = CHINESE_ANIMALS.indexOf(a);
  const j = CHINESE_ANIMALS.indexOf(b);
  const d = Math.abs(i - j);
  const base = { a, b };
  if (d === 0)
    return {
      ...base,
      score: 70,
      name: 'Mismo animal',
      text: `Los dos son ${a}: se entienden y compiten a partes iguales.`,
    };
  if ((i + j) % 12 === 1)
    return {
      ...base,
      score: 88,
      name: 'Amigos secretos',
      text: `${a} y ${b} son "amigos secretos" en el zodiaco chino: se cubren las espaldas sin decirlo.`,
    };
  if (d % 4 === 0)
    return {
      ...base,
      score: 90,
      name: 'Aliados',
      text: `${a} y ${b} están en el mismo triángulo de aliados: se entienden y se potencian.`,
    };
  if (d === 6)
    return {
      ...base,
      score: 40,
      name: 'Choque',
      text: `${a} y ${b} están enfrentados en la rueda china: ritmos opuestos. Toca ceder por turnos.`,
    };
  return {
    ...base,
    score: 62,
    name: 'Neutro',
    text: `${a} y ${b} ni se atraen ni se repelen: la relación depende de lo que construyan.`,
  };
}

const NUMBER_FAMILY: Record<number, { name: string; text: string }> = {};
for (const n of [1, 5, 7])
  NUMBER_FAMILY[n] = { name: 'independientes', text: 'necesitan su espacio y su libertad' };
for (const n of [2, 4, 8])
  NUMBER_FAMILY[n] = { name: 'constructores', text: 'buscan seguridad y cosas que duren' };
for (const n of [3, 6, 9])
  NUMBER_FAMILY[n] = { name: 'corazones creativos', text: 'viven para la gente y la expresión' };
const base9 = (n: number) => (n === 11 ? 2 : n === 22 ? 4 : n === 33 ? 6 : n);

export function numberMatch(
  birthA: string,
  birthB: string,
): SimpleMatch & { a: number; b: number } {
  const a = lifePathNumber(birthA);
  const b = lifePathNumber(birthB);
  const fa = NUMBER_FAMILY[base9(a)]!;
  const fb = NUMBER_FAMILY[base9(b)]!;
  if (a === b)
    return {
      a,
      b,
      score: 85,
      name: 'Mismo camino',
      text: `Los dos tienen camino de vida ${a}: van en la misma dirección, aunque a veces se pisan.`,
    };
  if (fa === fb)
    return {
      a,
      b,
      score: 80,
      name: 'Misma familia',
      text: `El ${a} y el ${b} son números ${fa.name}: los dos ${fa.text}. Se entienden en lo práctico.`,
    };
  return {
    a,
    b,
    score: 65,
    name: 'Complementarios',
    text: `El ${a} (${fa.name}) y el ${b} (${fb.name}) se enseñan cosas distintas: uno ${fa.text} y el otro ${fb.text}.`,
  };
}

// ---------- Afinidad completa ----------

export interface AffinityPart {
  id: 'sol' | 'luna' | 'quimica' | 'mente' | 'chino' | 'numeros';
  title: string;
  /** Qué compara, en palabras normales. */
  what: string;
  pair: string;
  score: number;
  name: string;
  text: string;
}

export interface Affinity {
  score: number;
  verdict: string;
  parts: AffinityPart[];
}

const WEIGHTS: Record<AffinityPart['id'], number> = {
  sol: 0.28,
  luna: 0.22,
  quimica: 0.18,
  mente: 0.14,
  chino: 0.09,
  numeros: 0.09,
};

function verdictFor(score: number, relation: Relation): string {
  const who =
    relation === 'pareja' ? 'como pareja' : relation === 'trabajo' ? 'trabajando' : 'juntos';
  if (score >= 80) return `Afinidad muy alta: ${who} fluyen casi sin esfuerzo.`;
  if (score >= 68) return `Buena afinidad: ${who} se entienden, con algún roce que da vidilla.`;
  if (score >= 56) return `Afinidad media: ${who} funcionan si cada uno pone de su parte.`;
  return `Afinidad con retos: ${who} chocan, y por eso mismo aprenden mucho.`;
}

export function affinity(
  you: { birthDate: string; sky: PersonSky },
  them: { birthDate: string; sky: PersonSky },
  relation: Relation,
): Affinity {
  const parts: AffinityPart[] = [];
  const signPart = (
    id: AffinityPart['id'],
    title: string,
    what: string,
    a: Sign,
    b: Sign,
  ): AffinityPart => {
    const m = signMatch(a, b);
    return {
      id,
      title,
      what,
      pair: `${a} + ${b}`,
      score: m.score,
      name: m.name,
      text: `${m.text} ${m.elements}`,
    };
  };
  parts.push(
    signPart(
      'sol',
      'Tu esencia y la suya',
      'Sol con Sol: cómo encajan las dos personalidades.',
      you.sky.sun,
      them.sky.sun,
    ),
  );
  if (you.sky.moon && them.sky.moon) {
    parts.push(
      signPart(
        'luna',
        'Lo que sienten',
        'Luna con Luna: emociones, convivencia y lo que necesita cada cual.',
        you.sky.moon,
        them.sky.moon,
      ),
    );
  }
  // Química: Venus de uno con Marte del otro, en los dos sentidos.
  const q1 = signMatch(you.sky.venus, them.sky.mars);
  const q2 = signMatch(them.sky.venus, you.sky.mars);
  const best = q1.score >= q2.score ? q1 : q2;
  parts.push({
    id: 'quimica',
    title: relation === 'pareja' ? 'Atracción y química' : 'Cómo se mueven juntos',
    what:
      relation === 'pareja'
        ? 'Venus (lo que te atrae) con Marte (cómo va a por ello), cruzados.'
        : 'Venus (lo que se disfruta) con Marte (cómo se actúa), cruzados.',
    pair: `${you.sky.venus}/${them.sky.mars} · ${them.sky.venus}/${you.sky.mars}`,
    score: Math.round((q1.score + q2.score) / 2),
    name: best.name,
    text: best.text,
  });
  parts.push(
    signPart(
      'mente',
      'Cómo se hablan',
      'Mercurio con Mercurio: comunicación y forma de pensar.',
      you.sky.mercury,
      them.sky.mercury,
    ),
  );
  const ch = chineseMatch(you.birthDate, them.birthDate);
  parts.push({
    id: 'chino',
    title: 'Horóscopo chino',
    what: 'Los animales del zodiaco chino de cada cual.',
    pair: `${ch.a} + ${ch.b}`,
    score: ch.score,
    name: ch.name,
    text: ch.text,
  });
  const nu = numberMatch(you.birthDate, them.birthDate);
  parts.push({
    id: 'numeros',
    title: 'Numerología',
    what: 'Los números de camino de vida.',
    pair: `${nu.a} + ${nu.b}`,
    score: nu.score,
    name: nu.name,
    text: nu.text,
  });

  const total = parts.reduce((s, p) => s + WEIGHTS[p.id], 0);
  const score = Math.round(parts.reduce((s, p) => s + p.score * WEIGHTS[p.id], 0) / total);
  return { score, verdict: verdictFor(score, relation), parts };
}

// ---------- Cómo está el día entre los dos ----------

export interface DayWith {
  tone: 'fluye' | 'normal' | 'cuidado';
  label: string;
  text: string;
  tip: string;
  /** Días hasta su cumpleaños (0 = hoy), si es en menos de un mes. */
  birthdayIn: number | null;
}

const HARMONY: Record<string, number> = {
  'Fuego-Fuego': 1,
  'Tierra-Tierra': 1,
  'Aire-Aire': 1,
  'Agua-Agua': 1,
  'Aire-Fuego': 1,
  'Agua-Tierra': 1,
};

const TIPS: Record<Relation, Record<DayWith['tone'], string>> = {
  pareja: {
    fluye: 'Buen día para un plan a dos o esa conversación pendiente.',
    normal: 'Un detalle pequeño hoy luce más que uno grande otro día.',
    cuidado: 'Hoy no es día de discutir lo importante: escucha primero.',
  },
  familia: {
    fluye: 'Buen día para llamar, quedar o pedir ese favor.',
    normal: 'Un mensaje corto basta para que se sienta en tu radar.',
    cuidado: 'Hoy la paciencia vale oro: evita los temas de siempre.',
  },
  amistad: {
    fluye: 'Día ideal para un plan improvisado.',
    normal: 'Mándale ese meme: mantiene viva la amistad.',
    cuidado: 'Si hay tensión, mejor en persona que por chat.',
  },
  trabajo: {
    fluye: 'Buen momento para proponer ideas o cerrar algo juntos.',
    normal: 'Al grano y por escrito: hoy evita malentendidos.',
    cuidado: 'Hoy mejor no pedir cambios: deja el tema para otro día.',
  },
  otra: {
    fluye: 'La energía acompaña: aprovecha para acercarte.',
    normal: 'Día tranquilo: sin grandes expectativas, sin sustos.',
    cuidado: 'Hoy mejor ir con calma y sin dar nada por hecho.',
  },
};

function nextBirthdayIn(birthDate: string, today: string): number {
  const md = birthDate.slice(5);
  const year = Number(today.slice(0, 4));
  const at = (y: number) => {
    const iso = `${y}-${md}`;
    // 29 de febrero en año no bisiesto: se celebra el 28.
    return new Date(`${iso}T00:00:00Z`).toISOString().startsWith(iso) ? iso : `${y}-02-28`;
  };
  const thisYear = at(year);
  return thisYear >= today ? daysBetween(today, thisYear) : daysBetween(today, at(year + 1));
}

export function dayWith(input: {
  you: { birthDate: string; sun: Sign };
  them: { birthDate: string; sun: Sign; name: string };
  relation: Relation;
  /** Fecha civil de hoy (AAAA-MM-DD). */
  today: string;
  now: Date;
}): DayWith {
  const { you, them, relation, today, now } = input;
  const moon = skyAt(now).find((p) => p.id === 'moon')!.sign;
  const moonEl = elementOf(moon);
  const h = (sun: Sign) => HARMONY[pairKey(moonEl, elementOf(sun))] ?? -0.5;
  const e1 = biorhythmOn(you.birthDate, today).emocional;
  const e2 = biorhythmOn(them.birthDate, today).emocional;
  const score = h(you.sun) + h(them.sun) + (e1 > 0 ? 0.5 : -0.5) + (e2 > 0 ? 0.5 : -0.5);
  const tone: DayWith['tone'] = score >= 1.5 ? 'fluye' : score <= -0.5 ? 'cuidado' : 'normal';
  const label = { fluye: 'Hoy fluye', normal: 'Día normal', cuidado: 'Hoy, con tacto' }[tone];

  const lines: string[] = [];
  if (moon === them.sun) {
    lines.push(
      `La Luna pasa hoy por ${moon}, su signo: está más a flor de piel y un gesto bonito vale el doble.`,
    );
  } else {
    lines.push(
      `La Luna está en ${moon} (${moonEl.toLowerCase()}): ${h(them.sun) > 0 ? `le sienta bien a su ${them.sun}` : `a su ${them.sun} le pide más calma`}.`,
    );
  }
  if (e2 < -0.5)
    lines.push(`${them.name} anda hoy con el ánimo más bajo de lo normal (biorritmo emocional).`);
  else if (e2 > 0.5) lines.push(`${them.name} tiene hoy el ánimo arriba.`);
  if (e1 > 0 === e2 > 0) lines.push('Tu ánimo y el suyo van hoy en la misma onda.');

  const days = nextBirthdayIn(them.birthDate, today);
  return {
    tone,
    label,
    text: lines.join(' '),
    tip: TIPS[relation][tone],
    birthdayIn: days <= 30 ? days : null,
  };
}
