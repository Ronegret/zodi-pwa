import * as Astronomy from 'astronomy-engine';
import { DEG, norm360 } from './math';

/** Oblicuidad verdadera y ascensión recta del MC, ambas en grados. */
export function frame(date: Date, longitude: number) {
  const t = Astronomy.MakeTime(date);
  const gast = Astronomy.SiderealTime(t) * 15;
  return { ramc: norm360(gast + longitude), eps: Astronomy.e_tilt(t).tobl };
}

export function midheaven(ramc: number, eps: number): number {
  const th = ramc * DEG;
  return norm360(Math.atan2(Math.sin(th), Math.cos(th) * Math.cos(eps * DEG)) / DEG);
}

export function ascendant(ramc: number, eps: number, lat: number): number {
  const th = ramc * DEG;
  const e = eps * DEG;
  const phi = lat * DEG;
  const asc =
    Math.atan2(Math.cos(th), -(Math.sin(th) * Math.cos(e) + Math.tan(phi) * Math.sin(e))) / DEG;
  return norm360(asc);
}

/** Longitud eclíptica y declinación del punto de la eclíptica con AR dada. */
function eclipticPointFromRA(ra: number, eps: number) {
  const r = ra * DEG;
  const e = eps * DEG;
  const lon = Math.atan2(Math.sin(r), Math.cos(r) * Math.cos(e));
  return { lon: norm360(lon / DEG), dec: Math.asin(Math.sin(e) * Math.sin(lon)) };
}

/**
 * Cúspide Placidus por iteración. Casas 11 y 12 usan el arco diurno desde el MC;
 * casas 2 y 3 usan el arco nocturno desde el IC.
 */
function placidusCusp(ramc: number, eps: number, lat: number, house: 11 | 12 | 2 | 3): number {
  const phi = lat * DEG;
  const frac = house === 11 || house === 3 ? 1 / 3 : 2 / 3;
  const upper = house === 11 || house === 12;
  let ra = upper ? ramc + frac * 90 : ramc + 180 - frac * 90;
  for (let i = 0; i < 50; i++) {
    const { dec } = eclipticPointFromRA(ra, eps);
    const ad = Math.asin(Math.max(-1, Math.min(1, Math.tan(phi) * Math.tan(dec)))) / DEG;
    const dsa = 90 + ad;
    const next = upper ? ramc + frac * dsa : ramc + 180 - frac * (180 - dsa);
    const done = Math.abs(next - ra) < 1e-10;
    ra = next;
    if (done) break;
  }
  return eclipticPointFromRA(ra, eps).lon;
}

export interface HouseResult {
  cusps: number[];
  system: 'placidus' | 'whole-sign';
  note?: string;
}

export function computeHouses(
  ramc: number,
  eps: number,
  lat: number,
  requested: 'placidus' | 'whole-sign',
): HouseResult {
  const asc = ascendant(ramc, eps, lat);
  const mc = midheaven(ramc, eps);
  const wholeSign = (note?: string): HouseResult => {
    const start = Math.floor(asc / 30) * 30;
    return {
      cusps: Array.from({ length: 12 }, (_, i) => norm360(start + i * 30)),
      system: 'whole-sign',
      ...(note ? { note } : {}),
    };
  };
  if (requested === 'whole-sign') return wholeSign();
  if (Math.abs(lat) > 66) {
    return wholeSign('Latitud polar: Placidus no está definido, se usan signos enteros.');
  }
  const c = new Array<number>(12).fill(0);
  c[0] = asc;
  c[9] = mc;
  c[10] = placidusCusp(ramc, eps, lat, 11);
  c[11] = placidusCusp(ramc, eps, lat, 12);
  c[1] = placidusCusp(ramc, eps, lat, 2);
  c[2] = placidusCusp(ramc, eps, lat, 3);
  for (const [i, j] of [
    [0, 6],
    [1, 7],
    [2, 8],
    [9, 3],
    [10, 4],
    [11, 5],
  ] as const) {
    c[j] = norm360(c[i]! + 180);
  }
  return { cusps: c, system: 'placidus' };
}

/** Casa (1–12) que contiene la longitud dada. */
export function houseOf(lon: number, cusps: number[]): number {
  for (let i = 0; i < 12; i++) {
    const start = cusps[i]!;
    const end = cusps[(i + 1) % 12]!;
    if (norm360(lon - start) < norm360(end - start)) return i + 1;
  }
  return 1;
}
