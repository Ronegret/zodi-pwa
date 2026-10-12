import { describe, expect, it } from 'vitest';
import { computeNatalChart } from '@/lib/astro-engine';
import { elementBalance, elementOf, formatPosition, signSlug } from '@/lib/astro-engine/labels';
import { moonInfo, skyAt, transitsToNatal } from '@/lib/astro-engine/sky';
import { donutSegments, linePath, lonToAngle, polar, spreadAngles } from '@/lib/chart/wheel';
import {
  addDays,
  biorhythmOn,
  biorhythmSeries,
  civilDate,
  daysBetween,
} from '@/lib/daily/biorhythm';
import { levelFromXp, levelProgress, xpThreshold } from '@/lib/daily/progress';
import { describeTransit, headline, ritualsFor } from '@/lib/daily/today';

const natal = computeNatalChart({
  date: '1990-04-15',
  time: '10:30',
  timeZone: 'Europe/Madrid',
  latitude: 40.4168,
  longitude: -3.7038,
});

describe('biorritmo', () => {
  it('es 0 el día del nacimiento y vuelve a 0 tras cada ciclo', () => {
    expect(biorhythmOn('1990-04-15', '1990-04-15')).toMatchObject({
      fisico: 0,
      emocional: 0,
      intelectual: 0,
    });
    expect(biorhythmOn('1990-04-15', addDays('1990-04-15', 23)).fisico).toBeCloseTo(0, 3);
    expect(biorhythmOn('1990-04-15', addDays('1990-04-15', 7)).emocional).toBe(1);
  });

  it('cuenta días civiles sin depender del cambio de hora', () => {
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2);
    expect(biorhythmSeries('1990-04-15', '2026-10-01', 14)).toHaveLength(14);
  });

  it('civilDate usa la zona del usuario', () => {
    const instant = new Date('2026-10-11T23:30:00Z');
    expect(civilDate(instant, 'Europe/Madrid')).toBe('2026-10-12');
    expect(civilDate(instant, 'America/Santiago')).toBe('2026-10-11');
  });
});

describe('niveles', () => {
  it('umbrales crecientes y progreso dentro del nivel', () => {
    expect([1, 2, 3, 4].map(xpThreshold)).toEqual([0, 100, 300, 600]);
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(99)).toBe(1);
    expect(levelFromXp(100)).toBe(2);
    expect(levelProgress(340)).toEqual({ level: 3, current: 40, needed: 300, ratio: 40 / 300 });
  });
});

describe('cielo y tránsitos', () => {
  it('la Luna llena del 17/04/2022 sale como llena y casi totalmente iluminada', () => {
    const m = moonInfo(new Date('2022-04-16T18:55:00Z'));
    expect(m.name).toBe('Luna llena');
    expect(m.illumination).toBeGreaterThan(0.99);
  });

  it('un tránsito del Sol sobre su propia posición natal es conjunción exacta', () => {
    const sunLon = natal.planets.find((p) => p.id === 'sun')!.lon;
    const returnDate = new Date('2026-04-15T08:30:00Z');
    const sunNow = skyAt(returnDate).find((p) => p.id === 'sun')!.lon;
    expect(Math.abs(sunNow - sunLon)).toBeLessThan(1);
    const transits = transitsToNatal(natal, returnDate);
    expect(transits.find((t) => t.transiting === 'sun' && t.natal === 'sun')?.type).toBe(
      'conjunction',
    );
    expect(transits.every((t) => t.orb <= 3)).toBe(true);
  });

  it('textos del día', () => {
    const t = { transiting: 'mars', natal: 'sun', type: 'trine', orb: 0.5 } as const;
    expect(describeTransit(t)).toBe('Marte en trígono a tu Sol');
    expect(headline(t, moonInfo(new Date()))).toMatch(/^Marte te sopla a favor sobre tu Sol\./);
    expect(ritualsFor(moonInfo(new Date('2022-04-16T18:55:00Z')))).toHaveLength(3);
  });
});

describe('etiquetas', () => {
  it('elementos y formato', () => {
    expect(['Aries', 'Tauro', 'Géminis', 'Cáncer'].map((s) => elementOf(s as never))).toEqual([
      'Fuego',
      'Tierra',
      'Aire',
      'Agua',
    ]);
    const balance = elementBalance(natal.planets);
    expect(balance.reduce((n, e) => n + e.count, 0)).toBe(10);
    expect(formatPosition({ sign: 'Aries', degree: 5, minute: 3 })).toBe('Aries 5°03′');
    expect(signSlug('Géminis')).toBe('geminis');
  });
});

describe('geometría de la rueda', () => {
  it('Ascendente a la izquierda y zodiaco antihorario', () => {
    expect(lonToAngle(100, 100)).toBe(180);
    expect(lonToAngle(190, 100)).toBe(270); // MC aproximado arriba
    expect(polar(0, 0, 10, 180)).toEqual({ x: -10, y: 0 });
    expect(polar(0, 0, 10, 90)).toEqual({ x: 0, y: -10 });
  });

  it('separa glifos amontonados sin cambiar su orden', () => {
    const out = spreadAngles([10, 11, 12, 200], 8);
    expect(out[1]! - out[0]!).toBeGreaterThanOrEqual(8);
    expect(out[2]! - out[1]!).toBeGreaterThanOrEqual(8);
    expect(out[3]).toBe(200);
    // Grupo que cruza el 0°.
    const wrap = spreadAngles([358, 359, 1], 8);
    expect((wrap[1]! - wrap[0]! + 360) % 360).toBeGreaterThanOrEqual(8);
    expect((wrap[2]! - wrap[1]! + 360) % 360).toBeGreaterThanOrEqual(8);
  });

  it('series y donut', () => {
    expect(linePath([1, -1], 100, 50, 0)).toBe('M0 0 L100 50');
    const segs = donutSegments([0.5, 0.5, 0], 50, 50, 30, 40);
    expect(segs[2]).toBe('');
    expect(segs[0]).toMatch(/^M.+Z$/);
  });
});

describe('buildDashboard', () => {
  const profile = {
    display_name: 'Ana Estrella',
    birth_date: '1990-04-15',
    time_zone: 'Europe/Madrid',
    xp: 340,
    streak: 5,
    gems: 12,
  };

  it('sin carta: sin big three ni elementos, pero con biorritmo y nivel', async () => {
    const { buildDashboard } = await import('@/lib/dashboard/build');
    const d = buildDashboard(profile, null, new Date('2026-10-11T10:00:00Z'));
    expect(d.firstName).toBe('Ana');
    expect(d.chart).toBeNull();
    expect(d.energy?.series).toHaveLength(14);
    expect(d.energy?.series[d.energy.todayIndex]?.date).toBe('2026-10-11');
    expect(d.progress).toMatchObject({ level: 3, rank: 'Aprendiz del cosmos' });
  });

  it('con carta sin hora: no hay Ascendente', async () => {
    const { buildDashboard } = await import('@/lib/dashboard/build');
    const d = buildDashboard(
      profile,
      { chart: natal, timeKnown: false },
      new Date('2026-10-11T10:00:00Z'),
    );
    expect(d.chart?.ascendant).toBeNull();
    expect(d.chart?.sunImage).toBe('/signos/aries-640.webp');
    expect(d.transits.every((t) => t.natal !== 'ascendant')).toBe(true);
  });
});
