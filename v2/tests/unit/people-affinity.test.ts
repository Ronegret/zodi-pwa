import { describe, expect, it } from 'vitest';
import { SIGNS } from '@/lib/astro-engine/types';
import {
  affinity,
  chineseMatch,
  dayWith,
  numberMatch,
  personSky,
  RELATION_IDS,
  signDistance,
  signMatch,
} from '@/lib/people/affinity';
import { personSchema } from '@/lib/validation/people';

describe('signo con signo', () => {
  it('distancia en la rueda y nombre del vínculo', () => {
    expect(signDistance('Aries', 'Aries')).toBe(0);
    expect(signDistance('Aries', 'Leo')).toBe(4);
    expect(signDistance('Piscis', 'Aries')).toBe(1);
    expect(signDistance('Aries', 'Libra')).toBe(6);
    expect(signMatch('Aries', 'Leo').name).toMatch(/Trígono/);
    expect(signMatch('Aries', 'Cáncer').name).toMatch(/Cuadratura/);
  });

  it('las 144 combinaciones tienen texto y puntuación', () => {
    for (const a of SIGNS) {
      for (const b of SIGNS) {
        const m = signMatch(a, b);
        expect(m.text.length).toBeGreaterThan(20);
        expect(m.elements.length).toBeGreaterThan(20);
        expect(m.score).toBeGreaterThanOrEqual(40);
        expect(m.score).toBeLessThanOrEqual(95);
        expect(signMatch(b, a).score).toBe(m.score);
      }
    }
  });
});

describe('chino y números', () => {
  it('aliados, amigos secretos y choque', () => {
    // 1990 Caballo, 1994 Perro (aliados), 1991 Cabra (amigos secretos), 1996 Rata (choque).
    expect(chineseMatch('1990-06-01', '1994-06-01').name).toBe('Aliados');
    expect(chineseMatch('1990-06-01', '1991-06-01').name).toBe('Amigos secretos');
    expect(chineseMatch('1990-06-01', '1996-06-01').name).toBe('Choque');
    expect(chineseMatch('1990-06-01', '2002-06-01').text).toMatch(/Los dos son Caballo/);
  });

  it('camino de vida: mismo, misma familia o complementarios', () => {
    expect(numberMatch('1990-04-15', '1990-04-15').name).toBe('Mismo camino');
    const m = numberMatch('1990-04-15', '1985-03-03');
    expect(m.text).not.toMatch(/undefined/);
  });
});

describe('afinidad completa y el día entre los dos', () => {
  const you = { birthDate: '1990-04-15', sky: personSky('1990-04-15', '10:30', 'Europe/Madrid') };
  const them = { birthDate: '1992-08-03', sky: personSky('1992-08-03', null, 'Europe/Madrid') };

  it('el cielo sin lugar: Sol, y Luna solo si es segura', () => {
    expect(you.sky.sun).toBe('Aries');
    expect(you.sky.moon).toBe('Sagitario');
    expect(them.sky.sun).toBe('Leo');
    expect(them.sky.moonOptions.length).toBeGreaterThanOrEqual(1);
  });

  it('da puntuación, veredicto y cada parte explicada', () => {
    for (const relation of RELATION_IDS) {
      const a = affinity(you, them, relation);
      expect(a.score).toBeGreaterThan(30);
      expect(a.score).toBeLessThan(100);
      expect(a.verdict).toMatch(/afinidad/i);
      expect(a.parts.map((p) => p.id)).toContain('sol');
      for (const p of a.parts) expect(`${p.text} ${p.what}`).not.toMatch(/undefined|NaN/);
    }
    expect(affinity(you, them, 'pareja').parts.find((p) => p.id === 'quimica')!.title).toBe(
      'Atracción y química',
    );
  });

  it('cómo está el día: tono, consejo y cumpleaños cercano', () => {
    const d = dayWith({
      you: { birthDate: you.birthDate, sun: 'Aries' },
      them: { birthDate: '1992-10-20', sun: 'Libra', name: 'Mamá' },
      relation: 'familia',
      today: '2026-10-12',
      now: new Date('2026-10-12T12:00:00Z'),
    });
    expect(['fluye', 'normal', 'cuidado']).toContain(d.tone);
    expect(d.text).toMatch(/Luna/);
    expect(d.tip.length).toBeGreaterThan(10);
    expect(d.birthdayIn).toBe(8);
    const far = dayWith({
      you: { birthDate: you.birthDate, sun: 'Aries' },
      them: { birthDate: '1992-02-29', sun: 'Piscis', name: 'X' },
      relation: 'pareja',
      today: '2026-10-12',
      now: new Date('2026-10-12T12:00:00Z'),
    });
    expect(far.birthdayIn).toBeNull();
  });
});

describe('formulario de una persona', () => {
  it('valida nombre, relación y fecha; la hora es opcional', () => {
    expect(
      personSchema.safeParse({
        name: ' Mamá ',
        relation: 'familia',
        birth_date: '1965-05-02',
        birth_time: '',
      }).data,
    ).toEqual({ name: 'Mamá', relation: 'familia', birth_date: '1965-05-02' });
    expect(
      personSchema.safeParse({ name: '', relation: 'ex', birth_date: '3000-01-01' }).success,
    ).toBe(false);
  });
});
