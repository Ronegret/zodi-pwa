/**
 * Geometría de la rueda natal en SVG (y hacia abajo). Convención
 * astrológica: Ascendente a la izquierda (9 en punto) y el zodiaco avanza en
 * sentido antihorario. Sin hora de nacimiento, 0° Aries a la izquierda.
 */
import { norm360 } from '@/lib/astro-engine/math';

export interface Point {
  x: number;
  y: number;
}

/** Ángulo de pantalla (grados, antihorario desde el este) de una longitud. */
export function lonToAngle(lon: number, ascendant = 0): number {
  return norm360(180 + lon - ascendant);
}

export function polar(cx: number, cy: number, r: number, angleDeg: number): Point {
  const a = (angleDeg * Math.PI) / 180;
  return { x: round(cx + r * Math.cos(a)), y: round(cy - r * Math.sin(a)) };
}

// || 0 evita -0 en las coordenadas.
const round = (n: number) => Math.round(n * 100) / 100 || 0;

/** Path de un sector de anillo entre dos ángulos (antihorario de a0 a a1). */
export function ringSector(
  cx: number,
  cy: number,
  rIn: number,
  rOut: number,
  a0: number,
  a1: number,
): string {
  const p1 = polar(cx, cy, rOut, a0);
  const p2 = polar(cx, cy, rOut, a1);
  const p3 = polar(cx, cy, rIn, a1);
  const p4 = polar(cx, cy, rIn, a0);
  const large = norm360(a1 - a0) > 180 ? 1 : 0;
  return [
    `M${p1.x} ${p1.y}`,
    `A${rOut} ${rOut} 0 ${large} 0 ${p2.x} ${p2.y}`,
    `L${p3.x} ${p3.y}`,
    `A${rIn} ${rIn} 0 ${large} 1 ${p4.x} ${p4.y}`,
    'Z',
  ].join(' ');
}

/**
 * Separa glifos que caerían encima unos de otros: recorre en orden y empuja
 * cada uno al menos `minGap` grados del anterior, conservando el orden.
 * Empieza tras el mayor hueco para no partir un grupo por el 0°.
 */
export function spreadAngles(angles: number[], minGap = 8): number[] {
  const n = angles.length;
  if (n < 2) return angles.map(norm360);
  const gap = Math.min(minGap, 360 / n);
  const order = angles.map((a, i) => ({ a: norm360(a), i })).sort((x, y) => x.a - y.a);
  let start = 0;
  let widest = -1;
  for (let k = 0; k < n; k++) {
    const next = k + 1 < n ? order[k + 1]!.a : order[0]!.a + 360;
    if (next - order[k]!.a > widest) {
      widest = next - order[k]!.a;
      start = (k + 1) % n;
    }
  }
  const out = new Array<number>(n);
  let prevOrig = -Infinity;
  let prevPlaced = -Infinity;
  for (let k = 0; k < n; k++) {
    const item = order[(start + k) % n]!;
    const orig = item.a < prevOrig ? item.a + 360 : item.a;
    const placed = Math.max(orig, prevPlaced + gap);
    out[item.i] = norm360(placed);
    prevOrig = orig;
    prevPlaced = placed;
  }
  return out;
}

/** Polilínea SVG de una serie de valores en [-1, 1] dentro de un rectángulo. */
export function linePath(values: number[], width: number, height: number, pad = 4): string {
  if (!values.length) return '';
  const step = values.length > 1 ? (width - 2 * pad) / (values.length - 1) : 0;
  return values
    .map((v, i) => {
      const x = round(pad + i * step);
      const y = round(pad + ((1 - v) / 2) * (height - 2 * pad));
      return `${i === 0 ? 'M' : 'L'}${x} ${y}`;
    })
    .join(' ');
}

/** Segmentos de un donut: devuelve paths con su porción (share 0–1). */
export function donutSegments(
  shares: number[],
  cx: number,
  cy: number,
  rIn: number,
  rOut: number,
  gapDeg = 2,
): string[] {
  let angle = 90; // empieza arriba
  return shares.map((share) => {
    const sweep = share * 360;
    if (sweep <= 0) return '';
    const a0 = angle;
    const a1 = angle - sweep + (sweep >= 360 ? 0.01 : Math.min(gapDeg, sweep / 2));
    angle -= sweep;
    // ringSector va antihorario: dibujamos de a1 a a0 (horario visual).
    return ringSector(cx, cy, rIn, rOut, a1, a0);
  });
}
