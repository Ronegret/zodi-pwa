import { describe, expect, it } from 'vitest';
import { computeNatalChart } from '@/lib/astro-engine';
import { SIGNS } from '@/lib/astro-engine/types';
import { chartMeaning } from '@/lib/chart/meaning';
import {
  bestAndWorst,
  chineseElement,
  chineseKnowledge,
  numberKnowledge,
  oracleSnippet,
  pairKnowledge,
  planetKnowledge,
  type PlanetKey,
} from '@/lib/knowledge';

const ANIMALS = [
  'Rata',
  'Buey',
  'Tigre',
  'Conejo',
  'Dragón',
  'Serpiente',
  'Caballo',
  'Cabra',
  'Mono',
  'Gallo',
  'Perro',
  'Cerdo',
];
const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33];
const PLANETS: PlanetKey[] = ['sol', 'luna', 'ascendente', 'mercurio', 'venus', 'marte'];
const clean = (t: string) => expect(t).not.toMatch(/undefined|NaN|\[object|null/);

describe('base de conocimiento', () => {
  it('numerología: los 12 números, completos y con compatibles válidos', () => {
    for (const n of NUMBERS) {
      const k = numberKnowledge(n)!;
      expect(k, `número ${n}`).toBeTruthy();
      for (const f of [
        'titulo',
        'frase',
        'esencia',
        'amor',
        'trabajo',
        'dinero',
        'salud',
        'sombra',
        'reto',
        'consejo',
        'compat_texto',
      ] as const) {
        expect(k[f].length, `${n}.${f}`).toBeGreaterThan(15);
        clean(k[f]);
      }
      expect(k.compatibles.length).toBeGreaterThan(0);
      expect([...k.compatibles, ...k.choca].every((x) => x >= 1 && x <= 9)).toBe(true);
    }
  });

  it('horóscopo chino: los 12 animales y los 5 elementos', () => {
    for (const a of ANIMALS) {
      const k = chineseKnowledge(a)!;
      expect(k, a).toBeTruthy();
      expect(k.aliados.length, a).toBe(2);
      expect(ANIMALS).toContain(k.amigo_secreto);
      expect(ANIMALS).toContain(k.choque);
      expect(k.suerte.numeros.length).toBeGreaterThan(0);
      for (const f of ['titulo', 'esencia', 'amor', 'trabajo', 'sombra', 'consejo'] as const) {
        expect(k[f].length, `${a}.${f}`).toBeGreaterThan(15);
        clean(k[f]);
      }
    }
    for (const e of ['Madera', 'Fuego', 'Tierra', 'Metal', 'Agua']) {
      expect(chineseElement(e)!.length, e).toBeGreaterThan(20);
    }
  });

  it('el amigo secreto y el choque chinos son simétricos', () => {
    for (const a of ANIMALS) {
      const k = chineseKnowledge(a)!;
      expect(chineseKnowledge(k.amigo_secreto)!.amigo_secreto, a).toBe(a);
      expect(chineseKnowledge(k.choque)!.choque, a).toBe(a);
    }
  });

  it('compatibilidad: las 78 parejas, en cualquier orden', () => {
    for (const a of SIGNS) {
      for (const b of SIGNS) {
        const k = pairKnowledge(a, b)!;
        expect(k, `${a}-${b}`).toBeTruthy();
        expect(pairKnowledge(b, a)).toBe(k);
        for (const f of [
          'resumen',
          'por_que',
          'amor',
          'amistad',
          'trabajo',
          'choque',
          'truco',
        ] as const) {
          expect(k[f].length, `${a}-${b}.${f}`).toBeGreaterThan(15);
          clean(k[f]);
        }
      }
    }
  });

  it('planetas: seis puntos por doce signos', () => {
    for (const planet of PLANETS) {
      for (const sign of SIGNS) {
        const k = planetKnowledge(planet, sign)!;
        expect(k, `${planet}-${sign}`).toBeTruthy();
        expect(k.texto.length, `${planet}-${sign}`).toBeGreaterThan(80);
        clean(`${k.texto} ${k.en_el_dia_a_dia} ${k.luz} ${k.sombra} ${k.tip}`);
      }
    }
  });

  it('las mejores y peores parejas de cada signo', () => {
    for (const s of SIGNS) {
      const { best, worst } = bestAndWorst(s);
      expect(best).toHaveLength(3);
      expect(worst).toHaveLength(2);
      expect(best).not.toContain(s);
    }
  });

  it('el fragmento del oráculo es corto', () => {
    const t = oracleSnippet({ lifePath: 11, chinese: 'Caballo', sunSign: 'Aries' });
    expect(t).toContain('Camino de vida 11');
    expect(t).toContain('Caballo');
    expect(t.length).toBeLessThan(1400);
  });

  it('el significado usa la base: facts en planetas, números, chino y compatibilidades', () => {
    const chart = computeNatalChart({
      date: '1990-04-15',
      time: '10:30',
      timeZone: 'Europe/Madrid',
      latitude: 40.4168,
      longitude: -3.7038,
    });
    const sections = chartMeaning({
      chart,
      timeKnown: true,
      birthDate: '1990-04-15',
      displayName: 'Rodrigo Negrete Aros',
      today: '2026-10-13',
    });
    const ids = sections.map((s) => s.id);
    expect(ids).toContain('compat');
    expect(ids.indexOf('compat')).toBeLessThan(ids.indexOf('numeros'));
    for (const id of ['sol', 'moon', 'venus', 'numeros', 'chino', 'compat']) {
      expect(sections.find((s) => s.id === id)!.facts?.length, id).toBeGreaterThan(2);
    }
    const compat = sections.find((s) => s.id === 'compat')!;
    expect(compat.facts![0]!.href).toMatch(/^\/compatibilidad\/[a-z]+-y-[a-z]+$/);
    for (const s of sections) {
      for (const f of s.facts ?? []) clean(`${f.label} ${f.text}`);
    }
  });
});
