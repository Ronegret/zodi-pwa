/**
 * "El significado de tu carta": todo lo que se puede leer con la fecha (y la
 * hora y el lugar) de nacimiento, en secciones con la voz de ZODI y una
 * pregunta lista para el oráculo en cada una. Sin IA: siempre disponible.
 * Puro.
 */
import { elementBalance, PLANET_NAMES, signSlug, type Element } from '@/lib/astro-engine/labels';
import { SIGNS, type AspectType, type NatalChart, type PlanetId } from '@/lib/astro-engine/types';
import { chineseZodiac, lifePathNumber, personalYear } from '@/lib/ai/numerology';
import { mayanSign } from '@/lib/divination/maya';
import { nameNumbers } from '@/lib/divination/name';
import {
  bestAndWorst,
  chineseElement,
  chineseKnowledge,
  numberKnowledge,
  pairKnowledge,
  planetKnowledge,
  type PlanetKey,
} from '@/lib/knowledge';
import { SIGN_BY_SLUG } from '@/lib/public/signs';
import { birthCard } from '@/lib/public/teaser';
import { HOUSES, PLANET_ROLE, SIGN_HOW } from './plain';
import {
  ASC,
  CHINESE,
  ELEMENT_STRONG,
  ELEMENT_WEAK,
  LIFE_PATH,
  MARS,
  MERCURY,
  MODALITY,
  MOON,
  NUMBER_ESSENCE,
  PERSONAL_YEAR,
  SATURN_LESSON,
  SUN,
  VENUS,
} from './texts';

export interface NumberCard {
  n: number;
  label: string;
  text: string;
}

export interface Fact {
  label: string;
  text: string;
  /** Enlace opcional (p. ej. a la página de esa pareja de signos). */
  href?: string;
}

export interface MeaningSection {
  id: string;
  kicker: string;
  title: string;
  /** Imagen de ZODI (de public/). */
  image: string;
  paragraphs: string[];
  /** Números con su imagen (solo en la sección de numerología). */
  numbers?: NumberCard[];
  /** Datos sueltos de la base de conocimiento (amor, trabajo, retos…). */
  facts?: Fact[];
  /** Pregunta lista para el oráculo. */
  ask: string;
}

export interface MeaningInput {
  chart: NatalChart;
  timeKnown: boolean;
  birthDate: string;
  displayName: string;
  /** Fecha civil de hoy (AAAA-MM-DD), para el año personal. */
  today: string;
}

const NUMBER_ART = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33]);
export const numberImage = (n: number) =>
  NUMBER_ART.has(n) ? `/numeros/${n}-480.webp` : '/art/numerologia-card-640.webp';

const ASPECT_PLAIN: Record<AspectType, string> = {
  conjunction: 'van de la mano: se potencian',
  trine: 'fluyen sin esfuerzo: es un talento natural',
  sextile: 'se ayudan si pones de tu parte',
  square: 'chocan y te empujan a crecer',
  opposition: 'tiran en direcciones opuestas: tu reto es equilibrarlos',
};

const MODALITY_OF = ['Cardinal', 'Fijo', 'Mutable'] as const;

// "la tierra" pero "el agua"; "mucha agua", "mucho fuego".
const WITH_ARTICLE: Record<Element, string> = {
  Fuego: 'el fuego',
  Tierra: 'la tierra',
  Aire: 'el aire',
  Agua: 'el agua',
};
const MUCH: Record<Element, string> = {
  Fuego: 'mucho fuego',
  Tierra: 'mucha tierra',
  Aire: 'mucho aire',
  Agua: 'mucha agua',
};
const LITTLE: Record<Element, string> = {
  Fuego: 'poco fuego',
  Tierra: 'poca tierra',
  Aire: 'poco aire',
  Agua: 'poca agua',
};
const list = (items: string[]) =>
  items.length > 1 ? `${items.slice(0, -1).join(', ')} y ${items.at(-1)}` : (items[0] ?? '');

function reduce(n: number): number {
  let x = n;
  while (x > 9 && x !== 11 && x !== 22 && x !== 33) {
    x = String(x)
      .split('')
      .reduce((s, d) => s + Number(d), 0);
  }
  return x;
}

export function chartMeaning(input: MeaningInput): MeaningSection[] {
  const { chart, timeKnown, birthDate, displayName, today } = input;
  const p = (id: PlanetId) => chart.planets.find((x) => x.id === id)!;
  const houseLine = (id: PlanetId) =>
    timeKnown
      ? `Cae en tu casa ${p(id).house} (${HOUSES[p(id).house - 1]!.name.toLowerCase()}): se nota sobre todo en ${HOUSES[p(id).house - 1]!.area}.`
      : '';
  const houseAsk = (id: PlanetId) => (timeKnown ? ` en la casa ${p(id).house}` : '');
  const KEY: Partial<Record<PlanetId, PlanetKey>> = {
    sun: 'sol',
    moon: 'luna',
    mercury: 'mercurio',
    venus: 'venus',
    mars: 'marte',
  };
  /** Texto largo de la base (voz ZODI) y, si falta, el corto de siempre. */
  const body = (id: PlanetId, short: string, sign = p(id).sign) => {
    const k = KEY[id] ? planetKnowledge(KEY[id]!, sign) : null;
    if (!k) return { paragraphs: [short, houseLine(id)].filter(Boolean), facts: undefined };
    return {
      paragraphs: [k.texto, houseLine(id)].filter(Boolean),
      facts: [
        { label: 'En el día a día', text: k.en_el_dia_a_dia },
        { label: 'Tu mejor versión', text: k.luz },
        { label: 'Tu lado difícil', text: k.sombra },
        { label: 'Consejo de ZODI', text: k.tip },
      ],
    };
  };
  const personal = (id: PlanetId, kicker: string, title: string, text: string, image: string) => {
    const b = body(id, text);
    return {
      id,
      kicker,
      title: `${title} en ${p(id).sign}`,
      image,
      paragraphs: b.paragraphs,
      ...(b.facts ? { facts: b.facts } : {}),
      ask: `Explícame mi ${title.replace('Tu ', '')} en ${p(id).sign}${houseAsk(id)} y cómo me afecta en el día a día.`,
    };
  };

  const sections: MeaningSection[] = [];
  const sun = p('sun').sign;
  sections.push({
    id: 'sol',
    kicker: 'Quién eres',
    title: `Tu Sol en ${sun}`,
    image: `/signos/${signSlug(sun)}-640.webp`,
    ...(() => {
      const b = body('sun', SUN[sun]);
      return { paragraphs: b.paragraphs, ...(b.facts ? { facts: b.facts } : {}) };
    })(),
    ask: `Explícame mi Sol en ${sun}${houseAsk('sun')}: cómo se nota en mi personalidad y qué potencia tengo.`,
  });
  sections.push(
    personal(
      'moon',
      'Lo que necesitas',
      'Tu Luna',
      MOON[p('moon').sign],
      '/art/zodi-silencio-640.webp',
    ),
  );
  if (timeKnown) {
    const asc = chart.ascendant.sign;
    sections.push({
      id: 'ascendente',
      kicker: 'Cómo te ven',
      title: `Tu Ascendente en ${asc}`,
      image: '/art/zodi-senalando-640.webp',
      paragraphs: [
        planetKnowledge('ascendente', asc)?.texto ?? ASC[asc],
        'El Ascendente es el signo que asomaba por el horizonte cuando naciste: tu primera impresión y tu forma de empezar las cosas.',
      ],
      ...(planetKnowledge('ascendente', asc)
        ? {
            facts: [
              {
                label: 'En el día a día',
                text: planetKnowledge('ascendente', asc)!.en_el_dia_a_dia,
              },
              { label: 'Lo que ve la gente', text: planetKnowledge('ascendente', asc)!.luz },
              { label: 'Lo que se te escapa', text: planetKnowledge('ascendente', asc)!.sombra },
              { label: 'Consejo de ZODI', text: planetKnowledge('ascendente', asc)!.tip },
            ],
          }
        : {}),
      ask: `¿Qué significa mi Ascendente en ${asc} junto a mi Sol en ${sun}?`,
    });
  } else {
    sections.push({
      id: 'ascendente',
      kicker: 'Cómo te ven',
      title: 'Tu Ascendente',
      image: '/art/zodi-senalando-640.webp',
      paragraphs: [
        'Para saber tu Ascendente (cómo te ven los demás) necesito tu hora de nacimiento: cambia cada dos horas. Mírala en tu partida de nacimiento y añádela en Ajustes.',
      ],
      ask: '¿Por qué es tan importante la hora de nacimiento para mi carta?',
    });
  }
  sections.push(
    personal(
      'mercury',
      'Cómo piensas',
      'Tu Mercurio',
      MERCURY[p('mercury').sign],
      '/art/zodi-movil-640.webp',
    ),
  );
  sections.push(
    personal(
      'venus',
      'Cómo amas',
      'Tu Venus',
      VENUS[p('venus').sign],
      '/art/compatibilidad-640.webp',
    ),
  );
  sections.push(
    personal('mars', 'Cómo actúas', 'Tu Marte', MARS[p('mars').sign], '/art/energia-640.webp'),
  );

  const jup = p('jupiter');
  const sat = p('saturn');
  sections.push({
    id: 'suerte',
    kicker: 'Tu suerte y tus lecciones',
    title: `Júpiter en ${jup.sign} y Saturno en ${sat.sign}`,
    image: '/art/destino-640.webp',
    paragraphs: [
      `Júpiter es tu suerte: te sonríe cuando actúas ${SIGN_HOW[jup.sign]}${timeKnown ? `, sobre todo en ${HOUSES[jup.house - 1]!.area}` : ''}.`,
      `Saturno es tu maestro exigente: tu gran lección es aprender ${SATURN_LESSON[sat.sign]}${timeKnown ? `, y te la pone delante en ${HOUSES[sat.house - 1]!.area}` : ''}. Cuesta, pero lo que construyes aquí dura toda la vida.`,
    ],
    ask: `¿Dónde está mi suerte según mi Júpiter en ${jup.sign} y qué me pide mi Saturno en ${sat.sign}?`,
  });

  const gen = (['uranus', 'neptune', 'pluto'] as const).map((id) => p(id));
  sections.push({
    id: 'generacion',
    kicker: 'Lo que compartes con tu generación',
    title: 'Urano, Neptuno y Plutón',
    image: '/art/zodi-trono-640.webp',
    paragraphs: [
      `Estos planetas se mueven tan despacio que marcan a toda tu generación: Urano en ${gen[0]!.sign} (la rebeldía), Neptuno en ${gen[1]!.sign} (los sueños) y Plutón en ${gen[2]!.sign} (la transformación).`,
      timeKnown
        ? `Lo personal es dónde caen en tu carta: ${gen.map((x) => `${PLANET_ROLE[x.id].short.toLowerCase()} en ${HOUSES[x.house - 1]!.area}`).join('; ')}.`
        : 'Con tu hora de nacimiento sabríamos en qué áreas de tu vida los notas tú en concreto.',
    ],
    ask: '¿Qué dice de mí lo que comparto con mi generación (Urano, Neptuno y Plutón)?',
  });

  // Elementos: el que domina y el que falta (sin contar el nodo).
  const balance = elementBalance(chart.planets.filter((x) => x.id !== 'northNode'));
  const sorted = [...balance].sort((a, b) => b.count - a.count);
  const strong = sorted[0]!;
  const weak = sorted.at(-1)!;
  sections.push({
    id: 'elementos',
    kicker: 'Tu energía de base',
    title: `Domina ${WITH_ARTICLE[strong.element]}`,
    image: '/art/carta-astral-640.webp',
    paragraphs: [
      `Tienes ${strong.count} de tus ${chart.planets.length - 1} planetas en signos de ${strong.element.toLowerCase()}. ${ELEMENT_STRONG[strong.element]}`,
      weak.count <= 1
        ? ELEMENT_WEAK[weak.element]
        : `Tu elemento más flojo es ${WITH_ARTICLE[weak.element]}, pero lo tienes: tu carta está bastante equilibrada.`,
      'Los cuatro elementos son cuatro formas de energía: fuego (acción), tierra (lo práctico), aire (las ideas) y agua (las emociones).',
    ],
    ask: `Tengo ${MUCH[strong.element]} y ${LITTLE[weak.element]} en mi carta: ¿qué significa y cómo lo equilibro?`,
  });

  // Modalidad: cómo actúas (con los planetas personales y sociales).
  const counts = { Cardinal: 0, Fijo: 0, Mutable: 0 };
  for (const x of chart.planets.filter(
    (y) => !['uranus', 'neptune', 'pluto', 'northNode'].includes(y.id),
  )) {
    counts[MODALITY_OF[SIGNS.indexOf(x.sign) % 3]!]++;
  }
  const modality = (Object.entries(counts) as [keyof typeof MODALITY, number][]).sort(
    (a, b) => b[1] - a[1],
  )[0]![0];
  sections.push({
    id: 'modalidad',
    kicker: 'Tu manera de moverte',
    title: `Energía ${modality.toLowerCase()}`,
    image: '/art/consejo-640.webp',
    paragraphs: [MODALITY[modality]],
    ask: `Mi energía es sobre todo ${modality.toLowerCase()}: ¿cómo la aprovecho en el trabajo y en el amor?`,
  });

  if (timeKnown) {
    const byHouse = new Map<number, PlanetId[]>();
    for (const x of chart.planets.filter((y) => y.id !== 'northNode')) {
      byHouse.set(x.house, [...(byHouse.get(x.house) ?? []), x.id]);
    }
    const [top] = [...byHouse.entries()].sort((a, b) => b[1].length - a[1].length);
    const [house, ids] = top!;
    sections.push({
      id: 'casas',
      kicker: 'Dónde se concentra tu vida',
      title: `Casa ${house}: ${HOUSES[house - 1]!.name}`,
      image: '/art/zodi-leyendo-640.webp',
      paragraphs: [
        `Tu carta carga ${ids.length} planetas en la casa ${house}: ${HOUSES[house - 1]!.area} es un tema central en tu vida.`,
        `Ahí están ${list(ids.map((id) => `${PLANET_NAMES[id]} (${PLANET_ROLE[id].short.toLowerCase()})`))}. Lo que pase en esa área te remueve más que a la media.`,
      ],
      ask: `Tengo muchos planetas en la casa ${house} (${HOUSES[house - 1]!.name.toLowerCase()}): ¿qué significa para mí?`,
    });
  }

  const aspects = [...chart.aspects].sort((a, b) => a.orb - b.orb).slice(0, 3);
  if (aspects.length) {
    sections.push({
      id: 'aspectos',
      kicker: 'Cómo se hablan tus planetas',
      title: 'Tus aspectos más fuertes',
      image: '/art/tarot-zodi-640.webp',
      paragraphs: [
        'Un aspecto es el ángulo entre dos planetas: dice si se llevan bien o se pelean. Estos son los tres más exactos de tu carta.',
        ...aspects.map(
          (a) =>
            `${PLANET_NAMES[a.a]} y ${PLANET_NAMES[a.b]} ${ASPECT_PLAIN[a.type]}. En juego: ${PLANET_ROLE[a.a].short.toLowerCase()} + ${PLANET_ROLE[a.b].short.toLowerCase()}.`,
        ),
      ],
      ask: `Explícame el aspecto más fuerte de mi carta y cómo lo uso a mi favor.`,
    });
  }

  // Con quién encajas: del Sol, con la base de compatibilidades.
  {
    const { best, worst } = bestAndWorst(sun);
    const link = (b: string) => {
      const a = SIGN_BY_SLUG.get(signSlug(sun));
      const o = SIGN_BY_SLUG.get(signSlug(b as typeof sun));
      if (!a || !o) return undefined;
      return `/compatibilidad/${a.index <= o.index ? `${a.slug}-y-${o.slug}` : `${o.slug}-y-${a.slug}`}`;
    };
    const facts: Fact[] = [];
    for (const b of best) {
      const k = pairKnowledge(sun, b);
      if (!k) continue;
      const href = link(b);
      facts.push({
        label: `${sun} + ${b}: de lo mejor`,
        text: `${k.resumen} En el amor: ${k.amor} Truco: ${k.truco}`,
        ...(href ? { href } : {}),
      });
    }
    for (const b of worst) {
      const k = pairKnowledge(sun, b);
      if (!k) continue;
      const href = link(b);
      facts.push({
        label: `${sun} + ${b}: con retos`,
        text: `${k.resumen} Dónde chocan: ${k.choque} Truco: ${k.truco}`,
        ...(href ? { href } : {}),
      });
    }
    sections.push({
      id: 'compat',
      kicker: 'Con quién encajas',
      title: `${sun} con el resto del zodiaco`,
      image: '/art/compatibilidad-640.webp',
      paragraphs: [
        `Tus mejores apuestas son ${best.join(', ')}; con ${worst.join(' y ')} toca currárselo un poco más. Ojo: esto es solo el Sol. La química de verdad también depende de la Luna, Venus y Marte, y eso lo ves en «Tu gente», con la fecha de cada persona.`,
      ],
      ...(facts.length ? { facts } : {}),
      ask: `Soy ${sun}: ¿con qué signos me llevo mejor, con cuáles chocaré y cómo lo arreglo?`,
    });
  }

  // Numerología: fecha y nombre.
  const life = lifePathNumber(birthDate);
  const year = personalYear(birthDate, today);
  const day = reduce(Number(birthDate.slice(8, 10)));
  const [first = '', last1, ...rest] = displayName.trim().split(/\s+/);
  const name = first ? nameNumbers({ first, last1, last2: rest.join(' ') || undefined }) : null;
  const numbers: NumberCard[] = [
    { n: life, label: 'Camino de vida', text: LIFE_PATH[life] ?? '' },
    { n: year, label: `Año personal (${today.slice(0, 4)})`, text: PERSONAL_YEAR[year] ?? '' },
    {
      n: day,
      label: 'Número del día en que naciste',
      text: `Tu talento de serie: ${NUMBER_ESSENCE[day] ?? ''}.`,
    },
  ];
  if (name) {
    numbers.push(
      {
        n: name.expression,
        label: 'Expresión (tu nombre completo)',
        text: `Cómo te expresas y qué te sale natural: ${NUMBER_ESSENCE[name.expression] ?? ''}.`,
      },
      {
        n: name.soul,
        label: 'Alma (las vocales)',
        text: `Lo que de verdad quieres por dentro: ${NUMBER_ESSENCE[name.soul] ?? ''}.`,
      },
      {
        n: name.personality,
        label: 'Personalidad (las consonantes)',
        text: `Cómo te ven antes de conocerte: ${NUMBER_ESSENCE[name.personality] ?? ''}.`,
      },
    );
  }
  const lifeK = numberKnowledge(life);
  const nameK = name ? numberKnowledge(name.expression) : null;
  const numFacts: Fact[] = lifeK
    ? [
        { label: 'Tu esencia', text: lifeK.esencia },
        { label: 'En el amor', text: lifeK.amor },
        { label: 'En el trabajo', text: lifeK.trabajo },
        { label: 'Con el dinero', text: lifeK.dinero },
        { label: 'Tu cuerpo', text: lifeK.salud },
        { label: 'Tu lado difícil', text: lifeK.sombra },
        { label: 'Tu lección de vida', text: lifeK.reto },
        {
          label: `Con qué números encajas (${lifeK.compatibles.join(', ')}) y con cuáles chocas (${lifeK.choca.join(', ')})`,
          text: lifeK.compat_texto,
        },
        { label: 'Consejo de ZODI', text: lifeK.consejo },
      ]
    : [];
  if (nameK && name) {
    numFacts.push({
      label: `Tu nombre (${name.expression}): «${nameK.titulo}»`,
      text: `${nameK.esencia} ${nameK.frase}`,
    });
  }
  sections.push({
    id: 'numeros',
    kicker: 'Numerología',
    title: lifeK ? `Tus números: camino ${life}, «${lifeK.titulo}»` : 'Tus números',
    image: '/art/numerologia-card-640.webp',
    paragraphs: [
      'Cada número del 1 al 9 (y los maestros 11, 22 y 33) tiene su vibración. Los tuyos salen de tu fecha de nacimiento y de tu nombre.',
    ],
    numbers,
    ...(numFacts.length ? { facts: numFacts } : {}),
    ask: `Mi camino de vida es el ${life} y estoy en año personal ${year}: ¿qué me toca este año?`,
  });

  const chinese = chineseZodiac(birthDate);
  const cK = chineseKnowledge(chinese.animal);
  const elK = chineseElement(chinese.element);
  const chineseFacts: Fact[] = cK
    ? [
        { label: 'En el amor', text: cK.amor },
        { label: 'En el trabajo', text: cK.trabajo },
        { label: 'Con el dinero', text: cK.dinero },
        { label: 'Tu cuerpo', text: cK.salud },
        { label: 'Tu lado difícil', text: cK.sombra },
        ...(elK ? [{ label: `Tu elemento: ${chinese.element}`, text: elK }] : []),
        {
          label: `Aliados: ${cK.aliados.join(' y ')} · Amigo secreto: ${cK.amigo_secreto} · Choque: ${cK.choque}`,
          text: cK.compat_texto,
        },
        {
          label: 'Suerte tradicional',
          text: `Números ${cK.suerte.numeros.join(', ')} y colores ${cK.suerte.colores.join(' y ')}.`,
        },
        { label: 'Consejo de ZODI', text: cK.consejo },
      ]
    : [];
  sections.push({
    id: 'chino',
    kicker: 'Horóscopo chino',
    title: cK
      ? `${chinese.animal} de ${chinese.element}: «${cK.titulo}»`
      : `${chinese.animal} de ${chinese.element}`,
    image: '/art/chino-640.webp',
    paragraphs: [
      cK?.esencia ?? CHINESE[chinese.animal] ?? '',
      `Tu elemento chino es ${chinese.element.toLowerCase()} (año lunar ${chinese.year}). Si naciste en enero o febrero, tu animal es el del año anterior: lo calculamos con la luna nueva real.`,
    ],
    ...(chineseFacts.length ? { facts: chineseFacts } : {}),
    ask: `Soy ${chinese.animal} de ${chinese.element} en el horóscopo chino: ¿qué me depara este año?`,
  });

  const maya = mayanSign(birthDate);
  sections.push({
    id: 'maya',
    kicker: 'Horóscopo maya',
    title: maya.name,
    image: '/art/zodi-trono-640.webp',
    paragraphs: [
      `En el calendario sagrado maya (Tzolkin) hay 260 días y cada uno tiene un sello y un tono. Tú naciste en el kin ${maya.kin}.`,
      `Tu sello, ${maya.seal.name}, habla de ${maya.seal.essence}. Tu tono es el ${maya.toneNumber} de 13 y marca cómo lo usas: ${maya.tone.power.replace(': ', ' para ')}.`,
    ],
    ask: `Mi sello maya es ${maya.name}: ¿cuál es mi misión?`,
  });

  const card = birthCard(birthDate);
  sections.push({
    id: 'tarot',
    kicker: 'Tu carta del tarot',
    title: `${card.numeral} · ${card.name}`,
    image: '/art/tarot-640.webp',
    paragraphs: [
      `Sumando los dígitos de tu fecha de nacimiento sale ${card.name}: tu arcano de por vida. ${card.message}`,
    ],
    ask: `Mi carta de nacimiento del tarot es ${card.name}: ¿qué significa para mí?`,
  });

  return sections;
}
