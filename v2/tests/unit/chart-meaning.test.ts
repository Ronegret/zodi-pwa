import { describe, expect, it } from 'vitest';
import { computeNatalChart } from '@/lib/astro-engine';
import { SIGNS } from '@/lib/astro-engine/types';
import { chartMeaning, numberImage } from '@/lib/chart/meaning';
import {
  ASC,
  CHINESE,
  LIFE_PATH,
  MARS,
  MERCURY,
  MOON,
  NUMBER_ESSENCE,
  PERSONAL_YEAR,
  SATURN_LESSON,
  SUN,
  VENUS,
} from '@/lib/chart/texts';

const input = {
  date: '1990-04-15',
  time: '10:30',
  timeZone: 'Europe/Madrid',
  latitude: 40.4168,
  longitude: -3.7038,
};
const chart = computeNatalChart(input);
const base = {
  chart,
  timeKnown: true,
  birthDate: '1990-04-15',
  displayName: 'Rodrigo Negrete Aros',
  today: '2026-10-12',
};

describe('textos del significado', () => {
  it('cubren los doce signos en cada planeta', () => {
    for (const bank of [SUN, MOON, ASC, MERCURY, VENUS, MARS, SATURN_LESSON]) {
      for (const sign of SIGNS) expect(bank[sign], sign).toMatch(/\S{3}/);
    }
  });

  it('cubren todos los números, maestros incluidos, y los doce animales', () => {
    for (const n of [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33]) {
      expect(LIFE_PATH[n], `camino ${n}`).toBeTruthy();
      expect(NUMBER_ESSENCE[n], `esencia ${n}`).toBeTruthy();
    }
    for (const n of [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22]) expect(PERSONAL_YEAR[n]).toBeTruthy();
    expect(Object.keys(CHINESE)).toHaveLength(12);
  });
});

describe('chartMeaning', () => {
  it('con hora: todas las secciones, con texto y pregunta para el oráculo', () => {
    const sections = chartMeaning(base);
    expect(sections.map((s) => s.id)).toEqual([
      'sol',
      'moon',
      'ascendente',
      'mercury',
      'venus',
      'mars',
      'suerte',
      'generacion',
      'elementos',
      'modalidad',
      'casas',
      'aspectos',
      'numeros',
      'chino',
      'maya',
      'tarot',
    ]);
    for (const s of sections) {
      expect(s.paragraphs.length, s.id).toBeGreaterThan(0);
      for (const p of s.paragraphs) {
        expect(p, s.id).not.toMatch(/undefined|NaN|null/);
        expect(p.length, s.id).toBeGreaterThan(20);
      }
      expect(s.ask, s.id).toMatch(/\?|\.$/);
      expect(s.image, s.id).toMatch(/^\/(art|signos)\/.+\.webp$/);
    }
    expect(sections[0]!.title).toBe(`Tu Sol en ${chart.planets[0]!.sign}`);
  });

  it('sin hora: sin casas y el ascendente pide la hora', () => {
    const sections = chartMeaning({ ...base, timeKnown: false });
    expect(sections.find((s) => s.id === 'casas')).toBeUndefined();
    const asc = sections.find((s) => s.id === 'ascendente')!;
    expect(asc.paragraphs[0]).toMatch(/hora de nacimiento/);
    expect(sections.flatMap((s) => s.paragraphs).join(' ')).not.toMatch(/casa \d/);
  });

  it('numerología: camino de vida, año personal, día y los tres del nombre', () => {
    const numeros = chartMeaning(base).find((s) => s.id === 'numeros')!;
    // 1+9+9+0+0+4+1+5 = 29 → 11 (maestro).
    expect(numeros.numbers![0]).toMatchObject({ n: 11, label: 'Camino de vida' });
    expect(numeros.numbers).toHaveLength(6);
    for (const n of numeros.numbers!) {
      expect(n.text, n.label).toMatch(/\S{3}/);
      expect(n.text, n.label).not.toMatch(/undefined/);
    }
    expect(numeros.ask).toContain('camino de vida es el 11');
  });

  it('con un solo nombre aún da los números del nombre', () => {
    const numeros = chartMeaning({ ...base, displayName: 'Rodrigo' }).find((s) => s.id === 'numeros')!;
    expect(numeros.numbers).toHaveLength(6);
  });

  it('cada número tiene su ilustración de ZODI', () => {
    expect(numberImage(7)).toBe('/numeros/7-480.webp');
    expect(numberImage(33)).toBe('/numeros/33-480.webp');
    expect(numberImage(44)).toBe('/art/numerologia-card-640.webp');
  });
});
