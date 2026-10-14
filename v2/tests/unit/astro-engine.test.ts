import { describe, expect, test } from 'vitest';
import { computeNatalChart, computeNatalChartAt, localToUtc } from '@/lib/astro-engine';
import { diff180 } from '@/lib/astro-engine/math';

const lonOf = (chart: ReturnType<typeof computeNatalChartAt>, id: string) =>
  chart.planets.find((p) => p.id === id)!.lon;

describe('localToUtc', () => {
  test('Madrid en verano (CEST, +2)', () => {
    expect(localToUtc('1990-07-15', '14:30', 'Europe/Madrid').toISOString()).toBe(
      '1990-07-15T12:30:00.000Z',
    );
  });
  test('Madrid en invierno (CET, +1)', () => {
    expect(localToUtc('1990-01-15', '14:30', 'Europe/Madrid').toISOString()).toBe(
      '1990-01-15T13:30:00.000Z',
    );
  });
  test('UTC puro', () => {
    expect(localToUtc('2000-01-01', '12:00', 'UTC').toISOString()).toBe('2000-01-01T12:00:00.000Z');
  });
  test('rechaza entradas mal formadas', () => {
    expect(() => localToUtc('15/07/1990', '14:30', 'Europe/Madrid')).toThrow();
  });
});

describe('posiciones planetarias (J2000: 2000-01-01 12:00 TT ≈ 11:58:56 UTC)', () => {
  const chart = computeNatalChartAt(new Date('2000-01-01T11:58:56Z'), 0, 0);
  test('Sol ≈ 280.37° (10° Capricornio)', () => {
    expect(Math.abs(diff180(lonOf(chart, 'sun'), 280.37))).toBeLessThan(0.05);
    expect(chart.planets[0]!.sign).toBe('Capricornio');
  });
  test('Luna ≈ 223.3° (Escorpio)', () => {
    expect(Math.abs(diff180(lonOf(chart, 'moon'), 223.32))).toBeLessThan(0.15);
    expect(chart.planets[1]!.sign).toBe('Escorpio');
  });
  test('Mercurio y Venus siguen al Sol (elongación acotada)', () => {
    const sun = lonOf(chart, 'sun');
    expect(Math.abs(diff180(lonOf(chart, 'mercury'), sun))).toBeLessThan(28);
    expect(Math.abs(diff180(lonOf(chart, 'venus'), sun))).toBeLessThan(48);
  });
  test('Júpiter y Saturno en Aries/Tauro en 2000', () => {
    expect(chart.planets.find((p) => p.id === 'jupiter')!.sign).toBe('Aries');
    expect(chart.planets.find((p) => p.id === 'saturn')!.sign).toBe('Tauro');
  });
  test('nodo norte medio ≈ 125.04° en J2000', () => {
    expect(Math.abs(diff180(lonOf(chart, 'northNode'), 125.04))).toBeLessThan(0.05);
  });
});

describe('carta de Albert Einstein (Ulm, 14-mar-1879 ≈ 10:50 UTC, 48.40°N 10.00°E)', () => {
  // Hora local solar 11:30 LMT → UTC 10:50 (Intl no conoce LMT, usamos UTC directo).
  const chart = computeNatalChartAt(new Date('1879-03-14T10:50:00Z'), 48.4, 10.0);
  test('Sol en Piscis ~23°', () => {
    const sun = chart.planets[0]!;
    expect(sun.sign).toBe('Piscis');
    expect(sun.degree).toBeGreaterThanOrEqual(22);
    expect(sun.degree).toBeLessThanOrEqual(24);
  });
  test('Luna en Sagitario ~14°', () => {
    const moon = chart.planets[1]!;
    expect(moon.sign).toBe('Sagitario');
    expect(Math.abs(moon.degree - 14)).toBeLessThanOrEqual(1);
  });
  test('Ascendente en Cáncer ~11°', () => {
    expect(chart.ascendant.sign).toBe('Cáncer');
    expect(Math.abs(chart.ascendant.degree - 11)).toBeLessThanOrEqual(1);
  });
});

describe('invariantes de casas', () => {
  const chart = computeNatalChart({
    date: '1990-07-15',
    time: '14:30',
    timeZone: 'Europe/Madrid',
    latitude: 41.3874,
    longitude: 2.1686,
  });
  test('casa 1 = ascendente y casa 10 = medio cielo', () => {
    expect(chart.houses[0]!.lon).toBeCloseTo(chart.ascendant.lon, 9);
    expect(chart.houses[9]!.lon).toBeCloseTo(chart.midheaven.lon, 9);
  });
  test('cúspides opuestas a 180°', () => {
    for (let i = 0; i < 6; i++) {
      expect(
        Math.abs(Math.abs(diff180(chart.houses[i]!.lon, chart.houses[i + 6]!.lon)) - 180),
      ).toBeLessThan(1e-6);
    }
  });
  test('cúspides crecen en sentido zodiacal y ninguna casa pasa de 180°', () => {
    for (let i = 0; i < 12; i++) {
      const span = (chart.houses[(i + 1) % 12]!.lon - chart.houses[i]!.lon + 360) % 360;
      expect(span).toBeGreaterThan(0);
      expect(span).toBeLessThan(90);
    }
  });
  test('todo planeta cae en una casa 1–12', () => {
    for (const p of chart.planets) expect(p.house).toBeGreaterThanOrEqual(1);
    for (const p of chart.planets) expect(p.house).toBeLessThanOrEqual(12);
  });
  test('en el ecuador Placidus reparte las casas a 30° ± pequeñas desviaciones por la oblicuidad', () => {
    const eq = computeNatalChartAt(new Date('2000-03-20T12:00:00Z'), 0, 0);
    expect(eq.houseSystem).toBe('placidus');
    const mcAscSpan = (eq.houses[0]!.lon - eq.houses[9]!.lon + 360) % 360;
    expect(mcAscSpan).toBeGreaterThan(80);
    expect(mcAscSpan).toBeLessThan(100);
  });
  test('latitud polar cae a signos enteros con nota', () => {
    const polar = computeNatalChartAt(new Date('2000-03-20T12:00:00Z'), 70, 20);
    expect(polar.houseSystem).toBe('whole-sign');
    expect(polar.houseSystemNote).toBeDefined();
  });
  test('signos enteros: cada cúspide cae en 0° de un signo', () => {
    const ws = computeNatalChart({
      date: '1990-07-15',
      time: '14:30',
      timeZone: 'Europe/Madrid',
      latitude: 41.3874,
      longitude: 2.1686,
      houseSystem: 'whole-sign',
    });
    for (const h of ws.houses) {
      expect(h.degree).toBe(0);
      expect(h.minute).toBe(0);
    }
  });
});

describe('aspectos y retrogradación', () => {
  test('el Sol conjunto a sí mismo no existe; todos los aspectos tienen orbe ≤ 10', () => {
    const chart = computeNatalChartAt(new Date('1990-07-15T12:30:00Z'), 41.39, 2.17);
    expect(chart.aspects.length).toBeGreaterThan(0);
    for (const a of chart.aspects) {
      expect(a.a).not.toBe(a.b);
      expect(a.orb).toBeLessThanOrEqual(10);
    }
  });
  test('Mercurio retrógrado el 2000-03-01 (12:00 UTC); directo el 2000-04-15', () => {
    const rx = computeNatalChartAt(new Date('2000-03-01T12:00:00Z'), 0, 0);
    const direct = computeNatalChartAt(new Date('2000-04-15T12:00:00Z'), 0, 0);
    expect(rx.planets.find((p) => p.id === 'mercury')!.retrograde).toBe(true);
    expect(direct.planets.find((p) => p.id === 'mercury')!.retrograde).toBe(false);
  });
});
