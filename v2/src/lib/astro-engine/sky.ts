/**
 * Cielo del momento: tránsitos sobre la carta natal y fase lunar.
 * Puro y testeable, igual que el resto del motor.
 */
import * as Astronomy from 'astronomy-engine';
import { diff180, toZodiac } from './math';
import { longitudeOf } from './planets';
import type { AspectType, NatalChart, PlanetId, Sign, ZodiacPosition } from './types';

export const TRANSIT_BODIES: PlanetId[] = [
  'sun',
  'moon',
  'mercury',
  'venus',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
  'pluto',
];

export interface SkyPosition extends ZodiacPosition {
  id: PlanetId;
}

export function skyAt(date: Date): SkyPosition[] {
  return TRANSIT_BODIES.map((id) => ({ id, ...toZodiac(longitudeOf(id, date)) }));
}

export interface Transit {
  transiting: PlanetId;
  natal: PlanetId | 'ascendant';
  type: AspectType;
  orb: number;
}

const ANGLES: Array<[AspectType, number]> = [
  ['conjunction', 0],
  ['sextile', 60],
  ['square', 90],
  ['trine', 120],
  ['opposition', 180],
];

/**
 * Aspectos del cielo actual a la carta natal, orbe máximo `maxOrb` (3° por
 * defecto: solo lo que se nota hoy). Ordenados por exactitud.
 */
export function transitsToNatal(
  natal: NatalChart,
  date: Date,
  { maxOrb = 3, includeAscendant = true } = {},
): Transit[] {
  const sky = skyAt(date);
  const targets: Array<{ id: PlanetId | 'ascendant'; lon: number }> = natal.planets
    .filter((p) => p.id !== 'northNode')
    .map((p) => ({ id: p.id, lon: p.lon }));
  if (includeAscendant) targets.push({ id: 'ascendant', lon: natal.ascendant.lon });

  const out: Transit[] = [];
  for (const t of sky) {
    for (const n of targets) {
      const sep = Math.abs(diff180(t.lon, n.lon));
      for (const [type, angle] of ANGLES) {
        const orb = Math.abs(sep - angle);
        if (orb <= maxOrb) {
          out.push({ transiting: t.id, natal: n.id, type, orb: Math.round(orb * 100) / 100 });
          break;
        }
      }
    }
  }
  // La Luna se mueve ~13°/día: sus tránsitos son del día; el resto, de semanas.
  return out.sort((a, b) => a.orb - b.orb);
}

export type MoonPhaseName =
  | 'Luna nueva'
  | 'Creciente'
  | 'Cuarto creciente'
  | 'Gibosa creciente'
  | 'Luna llena'
  | 'Gibosa menguante'
  | 'Cuarto menguante'
  | 'Menguante';

const PHASES: MoonPhaseName[] = [
  'Luna nueva',
  'Creciente',
  'Cuarto creciente',
  'Gibosa creciente',
  'Luna llena',
  'Gibosa menguante',
  'Cuarto menguante',
  'Menguante',
];

export interface MoonInfo {
  /** Elongación Sol-Luna en grados [0, 360). 0 = nueva, 180 = llena. */
  angle: number;
  name: MoonPhaseName;
  /** Fracción iluminada 0–1. */
  illumination: number;
  waxing: boolean;
  sign: Sign;
}

export function moonInfo(date: Date): MoonInfo {
  const angle = Astronomy.MoonPhase(date);
  const index = Math.floor(((angle + 22.5) % 360) / 45);
  return {
    angle,
    name: PHASES[index]!,
    illumination: Math.round(((1 - Math.cos((angle * Math.PI) / 180)) / 2) * 100) / 100,
    waxing: angle < 180,
    sign: toZodiac(longitudeOf('moon', date)).sign,
  };
}
