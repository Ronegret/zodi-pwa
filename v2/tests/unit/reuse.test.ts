import { describe, expect, it } from 'vitest';
import { REUSE, reuseKey, reuseSince } from '@/lib/ai/reuse';

describe('reutilizar lecturas que no cambian', () => {
  const now = new Date('2026-10-13T15:00:00Z');
  const midnight = new Date('2026-10-12T22:00:00Z');

  it('fijas 30 días, la diaria hasta medianoche y las de azar nunca', () => {
    expect(reuseSince('natal-chart', now, midnight)!.toISOString()).toBe(
      '2026-09-13T15:00:00.000Z',
    );
    expect(reuseSince('daily-horoscope', now, midnight)).toEqual(midnight);
    expect(reuseSince('weekly-horoscope', now, midnight)!.toISOString()).toBe(
      '2026-10-06T15:00:00.000Z',
    );
    for (const kind of [
      'tarot',
      'runes',
      'dream',
      'compatibility',
      'assistant',
      'transits',
    ] as const) {
      expect(reuseSince(kind, now, midnight), kind).toBeNull();
      expect(REUSE[kind]).toBeUndefined();
    }
  });

  it('coinciden tono, extensión, enfoque y nombre; no lo aleatorio', () => {
    expect(
      reuseKey({
        slug: 'nombre',
        tone: 'directo',
        length: 'normal',
        name: { first: 'Ana' },
        cards: [],
      }),
    ).toEqual({ slug: 'nombre', tone: 'directo', length: 'normal', name: { first: 'Ana' } });
    expect(
      reuseKey({ slug: 'numerologia', tone: 'suave', length: 'breve', focus: 'amor' }),
    ).toEqual({
      slug: 'numerologia',
      tone: 'suave',
      length: 'breve',
      focus: 'amor',
    });
  });
});
