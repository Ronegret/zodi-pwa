import { computeAspects } from './aspects';
import { computeHouses, frame, houseOf } from './houses';
import { toZodiac } from './math';
import { isRetrograde, longitudeOf } from './planets';
import { localToUtc } from './time';
import type { BirthInput, NatalChart, PlanetId } from './types';

export * from './types';

/** Se guarda con cada carta: si cambia el cálculo, se sabe qué cartas recalcular. */
export const ENGINE_VERSION = '1.0.0';
export { localToUtc } from './time';

const ORDER: PlanetId[] = [
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
  'northNode',
];

export function computeNatalChartAt(
  utc: Date,
  latitude: number,
  longitude: number,
  system: 'placidus' | 'whole-sign' = 'placidus',
): NatalChart {
  const { ramc, eps } = frame(utc, longitude);
  const h = computeHouses(ramc, eps, latitude, system);
  const lons = ORDER.map((id) => ({ id, lon: longitudeOf(id, utc) }));
  return {
    utc: utc.toISOString(),
    latitude,
    longitude,
    houseSystem: h.system,
    ...(h.note ? { houseSystemNote: h.note } : {}),
    planets: lons.map(({ id, lon }) => ({
      id,
      ...toZodiac(lon),
      retrograde: isRetrograde(id, utc),
      house: houseOf(lon, h.cusps),
    })),
    ascendant: toZodiac(h.cusps[0]!),
    midheaven: toZodiac(h.cusps[9]!),
    houses: h.cusps.map(toZodiac),
    aspects: computeAspects(lons),
  };
}

export function computeNatalChart(input: BirthInput): NatalChart {
  const utc = localToUtc(input.date, input.time, input.timeZone);
  return computeNatalChartAt(utc, input.latitude, input.longitude, input.houseSystem);
}
