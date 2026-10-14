import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { NatalChart } from '@/lib/astro-engine';
import type { ProfileForReading } from '@/lib/ai/context';
import { tarotText } from '@/lib/ai/extras';
import { KINDS } from '@/lib/ai/kinds';
import { GUIDES } from '@/lib/ai/guides';
import { expressionNumber } from '@/lib/ai/numerology';
import { CRYSTALS, INTENT_IDS, pickCrystal } from '@/lib/divination/crystals';
import { mayanSign } from '@/lib/divination/maya';
import { nameNumbers } from '@/lib/divination/name';
import { palmText } from '@/lib/divination/palm';
import { RUNES, drawRunes } from '@/lib/divination/runes';
import { prepareReading } from '@/lib/server/readings';
import { DECK, ZODI_ARCANA, drawCards } from '@/lib/tarot/deck';
import { readingRequestSchema } from '@/lib/validation/reading';

const FIXTURE = JSON.parse(
  readFileSync(new URL('../e2e/support/fixture-chart.json', import.meta.url), 'utf8'),
) as { chart: NatalChart };
const STORED = { chart: FIXTURE.chart, timeKnown: true };

const PROFILE: ProfileForReading = {
  display_name: 'Ana Estrella',
  birth_date: '1990-04-15',
  birth_time: '10:30',
  birth_time_known: true,
  birth_place: 'Madrid, España',
  time_zone: 'Europe/Madrid',
  reading_tone: 'sarcastico',
  favorite_topics: [],
  relationship_status: null,
  partner_name: null,
  has_kids: false,
  kids_count: null,
  personal_bio: null,
};
const NOW = new Date('2026-10-11T08:00:00Z');

/** Secuencia fija de "azar" para que las tiradas sean reproducibles. */
const seq = (...values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length]!;
};

const prepare = (body: Record<string, unknown>) => {
  const parsed = readingRequestSchema.parse(body);
  return prepareReading(parsed, PROFILE, STORED, NOW, seq(0.1, 0.9, 0.5, 0.95));
};

const issues = (body: Record<string, unknown>) => {
  const r = readingRequestSchema.safeParse(body);
  return r.success ? [] : r.error.issues.map((i) => i.path.join('.'));
};

describe('tarot: mazo y tiradas', () => {
  it('22 arcanos mayores más 9 Arcanos ZODI con arte', () => {
    expect(DECK).toHaveLength(31);
    expect(ZODI_ARCANA.every((c) => c.art?.startsWith('/tarot/') && c.meaning)).toBe(true);
  });

  it('cada tirada tiene sus posiciones y cartas distintas', () => {
    expect(drawCards('una', seq(0.5))).toHaveLength(1);
    const celta = drawCards('celta', seq(0.99, 0.2, 0.01, 0.7));
    expect(celta).toHaveLength(10);
    expect(new Set(celta.map((c) => c.name)).size).toBe(10);
    expect(celta[9]!.position).toBe('El desenlace');
  });

  it('un Arcano ZODI llega a la IA con su significado', () => {
    // El último del mazo es un Arcano ZODI (El Destino).
    const [card] = drawCards('una', seq(0.999, 0.9));
    expect(card!.name).toBe('El Destino');
    expect(tarotText([card!], '¿Me mudo?')).toContain('Arcano ZODI: Un giro inesperado');
  });
});

describe('horóscopo maya (13 Lunas)', () => {
  it('fechas de referencia conocidas', () => {
    expect(mayanSign('1987-07-26')).toMatchObject({ kin: 34, name: 'Mago Blanco Galáctico' });
    expect(mayanSign('2013-07-26')).toMatchObject({ kin: 164, name: 'Semilla Amarilla Galáctica' });
    expect(mayanSign('2012-12-21')).toMatchObject({ kin: 207, name: 'Mano Azul Cristal' });
  });

  it('el 29 de febrero comparte kin con el 28', () => {
    expect(mayanSign('2000-02-29').kin).toBe(mayanSign('2000-02-28').kin);
    expect(mayanSign('2000-03-01').kin).toBe((mayanSign('2000-02-28').kin % 260) + 1);
  });
});

describe('runas', () => {
  it('tres runas distintas; las simétricas nunca salen invertidas', () => {
    const runes = drawRunes(3, seq(0.27, 0.1));
    expect(runes.map((r) => r.position)).toEqual(['Lo que fue', 'Lo que es', 'Lo que viene']);
    expect(new Set(runes.map((r) => r.name)).size).toBe(3);
    for (const r of runes) expect(r.reversed).toBe(r.reversible);
    expect(RUNES.find((r) => r.name === 'Gebo')!.reversible).toBe(false);
  });
});

describe('cristales', () => {
  it('cada intención tiene cristal y se prefiere el del elemento', () => {
    for (const intent of INTENT_IDS) {
      expect(pickCrystal(intent, null, '2026-10-12').intents).toContain(intent);
    }
    const water = pickCrystal('intuicion', 'agua', '2026-10-12');
    expect(water.elements).toContain('agua');
    expect(CRYSTALS.length).toBeGreaterThanOrEqual(10);
  });
});

describe('numerología del nombre', () => {
  it('por partes, expresión, alma y personalidad (tildes y maestros)', () => {
    const n = nameNumbers({ first: 'Ana', last1: 'Estrella' })!;
    expect(n.parts).toEqual([
      { label: 'Nombre', text: 'Ana', value: 7 },
      { label: 'Primer apellido', text: 'Estrella', value: 11 },
    ]);
    expect(n.expression).toBe(9);
    expect(n.expression).toBe(expressionNumber('Ana Estrella'));
    expect(n.soul).toBe(4);
    expect(n.personality).toBe(5);
    expect(nameNumbers({ first: 'José' })!.expression).toBe(4);
    expect(nameNumbers({ first: '123' })).toBeNull();
  });
});

describe('mano', () => {
  it('describe cada línea con lo elegido', () => {
    const text = palmText(
      { shape: 'agua', life: 'larga', heart: 'curva', head: 'inclinada', fate: 'no' },
      undefined,
    );
    expect(text).toContain('Línea del corazón: Sube curvada hacia los dedos');
    expect(text).toContain('Línea del destino: No la veo');
  });
});

describe('validación de las lecturas nuevas', () => {
  it('cada una exige lo suyo', () => {
    expect(issues({ slug: 'runas' })).toEqual([]);
    expect(issues({ slug: 'cristales' })).toContain('intent');
    expect(issues({ slug: 'nombre' })).toContain('name.first');
    expect(issues({ slug: 'mano', palm: { shape: 'agua' } })).toContain('palm.life');
    expect(issues({ slug: 'tarot', question: '¿Me mudo?', spread: 'celta' })).toContain('spread');
    expect(issues({ slug: 'tarot', question: '¿Me mudo?', spread: 'una' })).toEqual([]);
  });
});

describe('preparar las lecturas nuevas', () => {
  it('cruz celta: diez cartas a la IA y a la pantalla', () => {
    const p = prepare({ slug: 'tirada-celta', question: '¿Dejo el trabajo?' });
    expect(p.kind).toBe('celtic-tarot');
    expect(p.visuals.cards).toHaveLength(10);
    expect(p.messages[0]!.content).toContain('cruz celta');
    expect(p.input.spread).toBe('celta');
  });

  it('tarot de una carta', () => {
    const p = prepare({ slug: 'tarot', question: '¿Le escribo?', spread: 'una' });
    expect(p.visuals.cards).toHaveLength(1);
    expect(p.messages[0]!.content).toContain('una carta');
  });

  it('runas, cristal, nombre, mano y sello maya', () => {
    expect(prepare({ slug: 'runas', runes: 1 }).visuals.runes).toHaveLength(1);

    const crystal = prepare({ slug: 'cristales', intent: 'calma' });
    expect(crystal.visuals.crystal?.intents).toContain('calma');
    expect(crystal.messages[0]!.content).toContain('Cristal elegido para hoy');

    const name = prepare({ slug: 'nombre', name: { first: 'Ana', last1: 'Estrella' } });
    expect(name.visuals.numbers?.expression).toBe(9);
    expect(name.messages[0]!.content).toContain('Número del alma (vocales): 4');

    const palm = prepare({
      slug: 'mano',
      palm: { shape: 'fuego', life: 'curva', heart: 'recta', head: 'unida', fate: 'marcada' },
      notes: 'Una estrella bajo el anular',
    });
    expect(palm.kind).toBe('palm-reading');
    expect(palm.messages[0]!.content).toContain('Una estrella bajo el anular');

    const maya = prepare({ slug: 'horoscopo-maya' });
    expect(maya.visuals.maya?.kin).toBe(mayanSign('1990-04-15').kin);
    expect(maya.messages[0]!.content).toContain(`Kin ${maya.visuals.maya!.kin}`);
  });
});

describe('guías', () => {
  it('todas las lecturas tienen su "¿Qué es esto?"', () => {
    for (const k of KINDS) {
      expect(GUIDES[k.slug], k.slug).toBeDefined();
      expect(GUIDES[k.slug]!.explainer.length).toBeGreaterThan(80);
    }
  });
});
