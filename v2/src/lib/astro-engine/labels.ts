/** Nombres en español, glifos y elementos para mostrar la carta. */
import { SIGNS, type AspectType, type PlanetId, type Sign, type ZodiacPosition } from './types';

export const PLANET_NAMES: Record<PlanetId, string> = {
  sun: 'Sol',
  moon: 'Luna',
  mercury: 'Mercurio',
  venus: 'Venus',
  mars: 'Marte',
  jupiter: 'Júpiter',
  saturn: 'Saturno',
  uranus: 'Urano',
  neptune: 'Neptuno',
  pluto: 'Plutón',
  northNode: 'Nodo norte',
};

// U+FE0E fuerza presentación de texto (iOS pinta algunos como emoji).
const T = '︎';
export const PLANET_GLYPHS: Record<PlanetId, string> = {
  sun: `☉${T}`,
  moon: `☽${T}`,
  mercury: `☿${T}`,
  venus: `♀${T}`,
  mars: `♂${T}`,
  jupiter: `♃${T}`,
  saturn: `♄${T}`,
  uranus: `♅${T}`,
  neptune: `♆${T}`,
  pluto: `♇${T}`,
  northNode: `☊${T}`,
};

export const SIGN_GLYPHS: Record<Sign, string> = {
  Aries: `♈${T}`,
  Tauro: `♉${T}`,
  Géminis: `♊${T}`,
  Cáncer: `♋${T}`,
  Leo: `♌${T}`,
  Virgo: `♍${T}`,
  Libra: `♎${T}`,
  Escorpio: `♏${T}`,
  Sagitario: `♐${T}`,
  Capricornio: `♑${T}`,
  Acuario: `♒${T}`,
  Piscis: `♓${T}`,
};

export const ASPECT_NAMES: Record<AspectType, string> = {
  conjunction: 'conjunción',
  sextile: 'sextil',
  square: 'cuadratura',
  trine: 'trígono',
  opposition: 'oposición',
};

export type Element = 'Fuego' | 'Tierra' | 'Aire' | 'Agua';
export const ELEMENTS: Element[] = ['Fuego', 'Tierra', 'Aire', 'Agua'];
export const elementOf = (sign: Sign): Element => ELEMENTS[SIGNS.indexOf(sign) % 4]!;

/** Slug sin tildes para rutas e imágenes: "Géminis" → "geminis". */
export const signSlug = (sign: Sign) => sign.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

/** "Aries 25°06′" */
export const formatPosition = (p: Pick<ZodiacPosition, 'sign' | 'degree' | 'minute'>) =>
  `${p.sign} ${p.degree}°${String(p.minute).padStart(2, '0')}′`;

export interface ElementCount {
  element: Element;
  count: number;
  share: number;
}

/** Reparto de los 10 planetas (sin nodo) por elemento. */
export function elementBalance(planets: Array<{ id: PlanetId; sign: Sign }>): ElementCount[] {
  const bodies = planets.filter((p) => p.id !== 'northNode');
  const total = bodies.length || 1;
  return ELEMENTS.map((element) => {
    const count = bodies.filter((p) => elementOf(p.sign) === element).length;
    return { element, count, share: count / total };
  });
}
