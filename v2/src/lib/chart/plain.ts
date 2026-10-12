/**
 * La carta natal en palabras normales, para quien nunca ha visto una:
 * qué es cada planeta, qué área de la vida es cada casa y una frase por
 * planeta ("Piensas y hablas de forma original, sobre todo con los amigos").
 */
import type { PlanetId, Sign } from '@/lib/astro-engine/types';

/** Qué representa cada planeta, en dos palabras y en una frase. */
export const PLANET_ROLE: Record<PlanetId, { short: string; verb: string }> = {
  sun: { short: 'Tu esencia', verb: 'Brillas' },
  moon: { short: 'Tus emociones', verb: 'Sientes' },
  mercury: { short: 'Tu mente y tu forma de hablar', verb: 'Piensas y hablas' },
  venus: { short: 'Cómo amas y qué te gusta', verb: 'Amas y disfrutas' },
  mars: { short: 'Tu energía y tu genio', verb: 'Actúas y te defiendes' },
  jupiter: { short: 'Tu suerte y dónde creces', verb: 'Creces y tienes suerte' },
  saturn: { short: 'Tus lecciones y responsabilidades', verb: 'Te exiges y maduras' },
  uranus: { short: 'Tu rebeldía', verb: 'Rompes moldes' },
  neptune: { short: 'Tus sueños e intuición', verb: 'Sueñas e intuyes' },
  pluto: { short: 'Tu poder de transformación', verb: 'Te transformas' },
  northNode: { short: 'Tu camino de crecimiento', verb: 'Creces' },
};

/** Cómo actúa cada signo, para completar la frase. */
export const SIGN_HOW: Record<Sign, string> = {
  Aries: 'con valentía y a lo loco',
  Tauro: 'con calma y sin prisas',
  Géminis: 'con curiosidad y mucha palabra',
  Cáncer: 'con sensibilidad y ganas de cuidar',
  Leo: 'con brillo y mucho corazón',
  Virgo: 'con orden y atención al detalle',
  Libra: 'buscando equilibrio y armonía',
  Escorpio: 'con intensidad y sin medias tintas',
  Sagitario: 'con libertad y optimismo',
  Capricornio: 'con ambición y paciencia',
  Acuario: 'de forma original e independiente',
  Piscis: 'con sensibilidad e imaginación',
};

/** Las 12 casas: nombre corto y área de la vida. */
export const HOUSES: { name: string; area: string }[] = [
  { name: 'Tú', area: 'tu imagen y tu forma de empezar las cosas' },
  { name: 'Dinero', area: 'el dinero y lo que valoras' },
  { name: 'Comunicación', area: 'cómo te comunicas y tu entorno cercano' },
  { name: 'Hogar', area: 'tu casa y tu familia' },
  { name: 'Amor y creatividad', area: 'el amor, la diversión y lo que creas' },
  { name: 'Rutina y salud', area: 'el trabajo del día a día y tu salud' },
  { name: 'Pareja', area: 'la pareja y los socios' },
  { name: 'Intimidad', area: 'la intimidad, lo compartido y las crisis' },
  { name: 'Viajes y estudios', area: 'los viajes, los estudios y lo que crees' },
  { name: 'Carrera', area: 'tu carrera y tu reputación' },
  { name: 'Amistades', area: 'los amigos y los proyectos en grupo' },
  { name: 'Mundo interior', area: 'tu mundo interior y el descanso' },
];

export const ELEMENT_COLOR_NAME = {
  Fuego: 'rosa',
  Tierra: 'verde',
  Aire: 'azul',
  Agua: 'violeta',
} as const;

/** "Piensas y hablas de forma original e independiente, sobre todo en los amigos…" */
export function plainPlanet(id: PlanetId, sign: Sign, house: number | null): string {
  const where = house ? `, sobre todo en ${HOUSES[house - 1]!.area}` : '';
  return `${PLANET_ROLE[id].verb} ${SIGN_HOW[sign]}${where}.`;
}
