import { diff180 } from './math';
import type { Aspect, AspectType, PlanetId } from './types';

const ANGLES: Array<[AspectType, number]> = [
  ['conjunction', 0],
  ['sextile', 60],
  ['square', 90],
  ['trine', 120],
  ['opposition', 180],
];
const LUMINARIES = new Set<PlanetId>(['sun', 'moon']);

/** Orbes por tipo; +2° si interviene un luminar. */
const BASE_ORB: Record<AspectType, number> = {
  conjunction: 8,
  opposition: 8,
  trine: 7,
  square: 7,
  sextile: 5,
};

export function computeAspects(lons: Array<{ id: PlanetId; lon: number }>): Aspect[] {
  const out: Aspect[] = [];
  for (let i = 0; i < lons.length; i++) {
    for (let j = i + 1; j < lons.length; j++) {
      const A = lons[i]!;
      const B = lons[j]!;
      const sep = Math.abs(diff180(A.lon, B.lon));
      const bonus = LUMINARIES.has(A.id) || LUMINARIES.has(B.id) ? 2 : 0;
      for (const [type, angle] of ANGLES) {
        const orb = Math.abs(sep - angle);
        if (orb <= BASE_ORB[type] + bonus) {
          out.push({ a: A.id, b: B.id, type, orb: Math.round(orb * 100) / 100 });
          break;
        }
      }
    }
  }
  return out.sort((x, y) => x.orb - y.orb);
}
