/**
 * Cúspides Placidus contrastadas con Swiss Ephemeris (valores publicados por
 * Astrotheme, mismos datos de nacimiento que Astro.com). Consultado el
 * 11/10/2026. Tolerancia de 2′: la referencia trunca o redondea al minuto y
 * las coordenadas de la ciudad pueden diferir en centésimas de grado.
 */
import { describe, expect, it } from 'vitest';
import { computeNatalChartAt, SIGNS } from '@/lib/astro-engine';

type Cusp = [sign: (typeof SIGNS)[number], degree: number, minute: number];

const REFERENCES: {
  name: string;
  utc: string;
  lat: number;
  lon: number;
  cusps: Cusp[];
}[] = [
  {
    // 14/03/1879 11:30 LMT, Ulm 48n24 10e00 → 10:50 UT.
    name: 'Albert Einstein',
    utc: '1879-03-14T10:50:00Z',
    lat: 48.4,
    lon: 10,
    cusps: [
      ['Cáncer', 11, 38],
      ['Cáncer', 28, 37],
      ['Leo', 17, 48],
      ['Virgo', 12, 50],
      ['Libra', 18, 20],
      ['Sagitario', 3, 6],
      ['Capricornio', 11, 38],
      ['Capricornio', 28, 37],
      ['Acuario', 17, 48],
      ['Piscis', 12, 50],
      ['Aries', 18, 20],
      ['Géminis', 3, 6],
    ],
  },
  {
    // 01/06/1926 9:30 PST, Los Ángeles 34n03 118w15 → 17:30 UT.
    name: 'Marilyn Monroe',
    utc: '1926-06-01T17:30:00Z',
    lat: 34.05,
    lon: -118.25,
    cusps: [
      ['Leo', 13, 4],
      ['Virgo', 6, 8],
      ['Libra', 3, 40],
      ['Escorpio', 6, 0],
      ['Sagitario', 10, 35],
      ['Capricornio', 13, 31],
      ['Acuario', 13, 4],
      ['Piscis', 6, 8],
      ['Aries', 3, 40],
      ['Tauro', 6, 0],
      ['Géminis', 10, 35],
      ['Cáncer', 13, 31],
    ],
  },
  {
    // 28/05/1968 11:00 AEST, Melbourne 37s49 144e58 → 01:00 UT. Hemisferio sur.
    name: 'Kylie Minogue',
    utc: '1968-05-28T01:00:00Z',
    lat: -37.8167,
    lon: 144.9667,
    cusps: [
      ['Cáncer', 26, 22],
      ['Virgo', 9, 59],
      ['Libra', 19, 1],
      ['Escorpio', 18, 4],
      ['Sagitario', 11, 3],
      ['Capricornio', 2, 18],
      ['Capricornio', 26, 22],
      ['Piscis', 9, 59],
      ['Aries', 19, 1],
      ['Tauro', 18, 4],
      ['Géminis', 11, 3],
      ['Cáncer', 2, 18],
    ],
  },
];

const toLon = ([sign, deg, min]: Cusp) => SIGNS.indexOf(sign) * 30 + deg + min / 60;
const arcMinutes = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360;
  return Math.min(d, 360 - d) * 60;
};

describe('cúspides Placidus frente a Swiss Ephemeris', () => {
  for (const ref of REFERENCES) {
    it(`${ref.name}: las 12 cúspides a menos de 2′`, () => {
      const chart = computeNatalChartAt(new Date(ref.utc), ref.lat, ref.lon, 'placidus');
      expect(chart.houseSystem).toBe('placidus');
      chart.houses.forEach((house, i) => {
        const expected = ref.cusps[i]!;
        expect(house.sign, `casa ${i + 1}`).toBe(expected[0]);
        expect(arcMinutes(house.lon, toLon(expected)), `casa ${i + 1}`).toBeLessThan(2);
      });
    });
  }
});
