/**
 * Lo que algunas lecturas añaden a la consulta: cartas de tarot tiradas en el
 * servidor y la sinastría con otra persona. Puro y testeado.
 */
import {
  computeNatalChartAt,
  localToUtc,
  type NatalChart,
  type PlanetId,
} from '@/lib/astro-engine';
import { ASPECT_NAMES, PLANET_NAMES, formatPosition } from '@/lib/astro-engine/labels';
import { diff180 } from '@/lib/astro-engine/math';
import type { AspectType } from '@/lib/astro-engine/types';
import { drawCards, type DrawnCard, type SpreadId } from '@/lib/tarot/deck';

export type { DrawnCard } from '@/lib/tarot/deck';

/** Tira las cartas de la tirada; `random` devuelve [0, 1) (inyectable en tests). */
export function drawTarot(spread: SpreadId = 'tres', random?: () => number): DrawnCard[] {
  return drawCards(spread, random);
}

export function tarotText(cards: DrawnCard[], question: string): string {
  return [
    `Pregunta: "${question}"`,
    `Cartas tiradas (${cards.length === 1 ? 'una carta' : cards.length === 3 ? 'tres cartas' : 'cruz celta'}):`,
    ...cards.map(
      (c, i) =>
        `${i + 1}. ${c.position}: ${c.numeral} · ${c.name}${c.reversed ? ' (invertida)' : ''}${c.meaning ? ` — Arcano ZODI: ${c.meaning}` : ''}`,
    ),
  ].join('\n');
}

export interface PartnerInput {
  name: string;
  date: string;
  time?: string | undefined;
}

const SYNASTRY_BODIES: PlanetId[] = ['sun', 'moon', 'mercury', 'venus', 'mars'];
const SYN_ANGLES: Array<[AspectType, number, number]> = [
  ['conjunction', 0, 7],
  ['opposition', 180, 7],
  ['trine', 120, 6],
  ['square', 90, 6],
  ['sextile', 60, 4],
];

export interface SynastryAspect {
  mine: PlanetId;
  theirs: PlanetId;
  type: AspectType;
  orb: number;
}

/** Carta de la otra persona: sin lugar, al mediodía (o a su hora) en la zona de quien consulta. */
export function partnerChart(partner: PartnerInput, timeZone: string): NatalChart {
  const utc = localToUtc(partner.date, partner.time ?? '12:00', timeZone);
  return computeNatalChartAt(utc, 0, 0, 'whole-sign');
}

export function synastry(mine: NatalChart, theirs: NatalChart): SynastryAspect[] {
  const out: SynastryAspect[] = [];
  for (const a of mine.planets.filter((p) => SYNASTRY_BODIES.includes(p.id))) {
    for (const b of theirs.planets.filter((p) => SYNASTRY_BODIES.includes(p.id))) {
      const sep = Math.abs(diff180(a.lon, b.lon));
      for (const [type, angle, maxOrb] of SYN_ANGLES) {
        const orb = Math.abs(sep - angle);
        if (orb <= maxOrb) {
          out.push({ mine: a.id, theirs: b.id, type, orb: Math.round(orb * 10) / 10 });
          break;
        }
      }
    }
  }
  return out.sort((x, y) => x.orb - y.orb);
}

export function partnerText(
  partner: PartnerInput,
  theirs: NatalChart,
  aspects: SynastryAspect[],
): string {
  const pos = (id: PlanetId) => formatPosition(theirs.planets.find((p) => p.id === id)!);
  const moonNote = partner.time
    ? ''
    : ' (aprox.: sin hora de nacimiento la Luna puede variar unos grados)';
  return [
    `La otra persona: ${partner.name}, nacida el ${partner.date}${partner.time ? ` a las ${partner.time}` : ''}.`,
    `Su carta: Sol en ${pos('sun')}, Luna en ${pos('moon')}${moonNote}, Mercurio en ${pos('mercury')}, Venus en ${pos('venus')}, Marte en ${pos('mars')}.`,
    'Aspectos entre las dos cartas (tu planeta → el suyo), del más exacto al menos:',
    ...(aspects.length
      ? aspects
          .slice(0, 10)
          .map(
            (s) =>
              `- Tu ${PLANET_NAMES[s.mine]} ${ASPECT_NAMES[s.type].toLowerCase()} su ${PLANET_NAMES[s.theirs]} (orbe ${s.orb}°)`,
          )
      : ['- Ningún aspecto cercano entre planetas personales.']),
  ].join('\n');
}
