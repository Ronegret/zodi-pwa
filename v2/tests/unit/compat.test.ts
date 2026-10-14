import { describe, expect, it } from 'vitest';
import { bestFor, canonicalPair, compatPage, pairSlug, parsePair } from '@/lib/public/compat';
import { SIGN_INFO } from '@/lib/public/signs';

describe('compatibilidad pública', () => {
  it('lee la pareja de la URL y fija la canónica en el orden del zodiaco', () => {
    const [a, b] = parsePair('leo-y-aries')!;
    expect([a.name, b.name]).toEqual(['Leo', 'Aries']);
    expect(canonicalPair(a, b)).toBe('aries-y-leo');
    expect(parsePair('leo-aries')).toBeNull();
    expect(parsePair('leo-y-dragon')).toBeNull();
  });

  it('las 144 combinaciones tienen todos los textos', () => {
    for (const a of SIGN_INFO) {
      for (const b of SIGN_INFO) {
        const c = compatPage(a, b);
        expect(pairSlug(a, b)).toMatch(/^[a-z]+-y-[a-z]+$/);
        for (const t of [c.wheel, c.rhythm, c.match.text, ...c.areas.map((x) => x.text)]) {
          expect(t, `${a.slug}-${b.slug}`).toMatch(/\S{3}/);
        }
        expect(compatPage(b, a).match.score).toBe(c.match.score);
      }
    }
  });

  it('las mejores parejas de cada signo no lo incluyen y son tres', () => {
    for (const s of SIGN_INFO) {
      const best = bestFor(s);
      expect(best).toHaveLength(3);
      expect(best.map((x) => x.slug)).not.toContain(s.slug);
    }
    expect(compatPage(SIGN_INFO[0]!, SIGN_INFO[4]!).match.name).toMatch(/Trígono/);
  });
});
