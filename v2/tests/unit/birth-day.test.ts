import { describe, expect, it } from 'vitest';
import { computeNatalChart } from '@/lib/astro-engine';
import { longitudeOf } from '@/lib/astro-engine/planets';
import { birthDay, MOON_BIRTH } from '@/lib/chart/birth-day';

const madrid = computeNatalChart({
  date: '1990-04-15',
  time: '10:30',
  timeZone: 'Europe/Madrid',
  latitude: 40.4168,
  longitude: -3.7038,
});
const NOW = new Date('2026-10-12T12:00:00Z');
const base = {
  chart: madrid,
  birthDate: '1990-04-15',
  timeKnown: true,
  timeZone: 'Europe/Madrid',
  today: '2026-10-12',
  now: NOW,
};

describe('el día que naciste', () => {
  it('día de la semana, Luna y si era de día', () => {
    const b = birthDay(base);
    // El 15/04/1990 fue domingo; había luna menguante (gibosa) en Sagitario.
    expect(b.weekday.day).toBe('domingo');
    expect(b.weekday.ruler).toBe('el Sol');
    expect(b.moon.name).toMatch(/menguante/i);
    expect(b.moon.text).toBe(MOON_BIRTH[b.moon.name]);
    expect(b.daylight?.isDay).toBe(true);
    expect(b.daylight?.sunrise).toMatch(/^0[67]:\d\d$/);
    expect(b.daylight?.sunset).toMatch(/^2[01]:\d\d$/);
    expect(b.season).toMatchObject({ name: 'primavera', hemisphere: 'norte' });
  });

  it('el mismo día en Santiago de Chile es otoño', () => {
    const santiago = computeNatalChart({
      date: '1990-04-15',
      time: '10:30',
      timeZone: 'America/Santiago',
      latitude: -33.45,
      longitude: -70.66,
    });
    expect(
      birthDay({ ...base, chart: santiago, timeZone: 'America/Santiago' }).season,
    ).toMatchObject({
      name: 'otoño',
      hemisphere: 'sur',
    });
  });

  it('el cielo: el Sol por encima del horizonte a media mañana', () => {
    const b = birthDay(base);
    const sun = b.sky.find((x) => x.id === 'sun')!;
    expect(sun.above).toBe(true);
    expect(sun.azimuth).toBeGreaterThan(90);
    expect(sun.azimuth).toBeLessThan(180);
    expect(b.sky).toHaveLength(10);
  });

  it('su vida en números y su generación', () => {
    const b = birthDay(base);
    expect(b.life.years).toBe(36);
    expect(b.life.days).toBeGreaterThan(13_300);
    expect(b.life.fullMoons).toBe(Math.floor(b.life.days / 29.530589));
    expect(b.life.kmAroundSun).toBeGreaterThan(33_000);
    expect(b.generation).toBe('Millennial');
  });

  it('retornos: el Sol, Júpiter y Saturno vuelven a su sitio', () => {
    const b = birthDay(base);
    const sunLon = madrid.planets.find((p) => p.id === 'sun')!.lon;
    expect(b.nextSolarReturn!.getTime()).toBeGreaterThan(NOW.getTime());
    expect(b.nextSolarReturn!.toISOString().slice(0, 7)).toBe('2027-04');
    expect(Math.abs(longitudeOf('sun', b.nextSolarReturn!) - sunLon)).toBeLessThan(0.01);
    const jup = madrid.planets.find((p) => p.id === 'jupiter')!.lon;
    expect(
      Math.abs(((longitudeOf('jupiter', b.jupiterReturn!) - jup + 540) % 360) - 180),
    ).toBeLessThan(0.05);
    // Primer retorno de Saturno hacia 2019 (a los 29); el siguiente, hacia 2049.
    expect(b.saturn.first!.getUTCFullYear()).toBeGreaterThanOrEqual(2018);
    expect(b.saturn.first!.getUTCFullYear()).toBeLessThanOrEqual(2020);
    expect(b.saturn.next!.getUTCFullYear()).toBeGreaterThanOrEqual(2047);
  });

  it('sin hora no dice si era de día', () => {
    expect(birthDay({ ...base, timeKnown: false }).daylight).toBeNull();
  });
});
