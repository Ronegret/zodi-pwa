import { readFileSync } from 'node:fs';
import { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { SIGNS } from '@/lib/astro-engine/types';
import { MAJOR_ARCANA, dailyCard } from '@/lib/tarot/daily';
import { SIGN_INFO } from '@/lib/zodiac/signs';
import { DEFAULT_PALETTE, parseHex } from '@/scenes/core/palette';
import {
  angleOfXZ,
  eclipticToXZ,
  nearestTurn,
  normalizeAngle,
  ringPositions,
  rotationToFront,
} from '@/scenes/math';

const R = 3;
const Y = new Vector3(0, 1, 0);

describe('geometría de las escenas', () => {
  it('el Ascendente queda a la izquierda y el zodiaco gira antihorario (IC abajo = +z)', () => {
    expect(eclipticToXZ(100, R, 100)).toEqual({ x: -R, z: 0 });
    // 90° después del Ascendente: fondo del cielo, hacia la cámara.
    expect(eclipticToXZ(190, R, 100)).toEqual({ x: 0, z: R });
    expect(eclipticToXZ(280, R, 100)).toEqual({ x: R, z: 0 });
  });

  it('angleOfXZ invierte eclipticToXZ', () => {
    for (const lon of [0, 33.3, 145, 271.9]) {
      const p = eclipticToXZ(lon, R);
      // Sin Ascendente, la longitud 0 está a la izquierda (180°). Se comparan
      // seno y coseno: π y −π son el mismo ángulo.
      const expected = ((180 + lon) * Math.PI) / 180;
      expect(Math.cos(angleOfXZ(p))).toBeCloseTo(Math.cos(expected));
      expect(Math.sin(angleOfXZ(p))).toBeCloseTo(Math.sin(expected));
      expect(Math.hypot(p.x, p.z)).toBeCloseTo(R);
    }
  });

  it('rotationToFront lleva cualquier punto al frente (+z) al girar en Y', () => {
    for (const lon of [0, 45, 123.4, 200, 359]) {
      const p = eclipticToXZ(lon, R, 17);
      const v = new Vector3(p.x, 0, p.z).applyAxisAngle(Y, rotationToFront(angleOfXZ(p)));
      expect(v.x).toBeCloseTo(0, 6);
      expect(v.z).toBeCloseTo(R, 6);
    }
  });

  it('normalizeAngle y nearestTurn toman el camino corto', () => {
    expect(normalizeAngle(3 * Math.PI)).toBeCloseTo(Math.PI);
    expect(normalizeAngle(-Math.PI / 2)).toBeCloseTo(-Math.PI / 2);
    expect(normalizeAngle(5 * Math.PI)).toBeCloseTo(Math.PI);
    // De 6 rad a 0: mejor seguir hasta 2π que volver 6 rad atrás.
    expect(nearestTurn(6, 0)).toBeCloseTo(2 * Math.PI);
    expect(nearestTurn(-0.1, 0.2)).toBeCloseTo(0.2);
  });

  it('ringPositions empieza arriba (−z) y reparte a radio constante', () => {
    const ring = ringPositions(12, R);
    expect(ring).toHaveLength(12);
    expect(ring[0]).toEqual({ x: 0, z: -R });
    for (const p of ring) expect(Math.hypot(p.x, p.z)).toBeCloseTo(R);
  });
});

describe('paleta 3D', () => {
  it('parseHex solo acepta #rrggbb', () => {
    expect(parseHex('#b8ff17')).toBe(0xb8ff17);
    expect(parseHex('  #B8FF17 ')).toBe(0xb8ff17);
    expect(parseHex('#fff')).toBeNull();
    expect(parseHex('rgb(0 0 0)')).toBeNull();
    expect(parseHex('')).toBeNull();
  });

  it('la paleta por defecto coincide con tokens.css', () => {
    const css = readFileSync(new URL('../../src/styles/tokens.css', import.meta.url), 'utf8');
    const token = (name: string) =>
      parseHex(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, 'i').exec(css)?.[1] ?? '');
    expect(token('acid')).toBe(DEFAULT_PALETTE.acid);
    expect(token('violet')).toBe(DEFAULT_PALETTE.violet);
    expect(token('violet-text')).toBe(DEFAULT_PALETTE.violetText);
    expect(token('hot')).toBe(DEFAULT_PALETTE.hot);
    expect(token('cyan')).toBe(DEFAULT_PALETTE.cyan);
    expect(token('gold')).toBe(DEFAULT_PALETTE.gold);
    expect(token('ink')).toBe(DEFAULT_PALETTE.ink);
    expect(token('bg')).toBe(DEFAULT_PALETTE.bg);
    expect(token('surface')).toBe(DEFAULT_PALETTE.surface);
  });
});

describe('carta del día', () => {
  it('los 22 arcanos mayores, sin repetir', () => {
    expect(MAJOR_ARCANA).toHaveLength(22);
    expect(new Set(MAJOR_ARCANA.map((c) => c.name)).size).toBe(22);
    expect(new Set(MAJOR_ARCANA.map((c) => c.numeral)).size).toBe(22);
  });

  it('es estable durante el día y cambia entre días', () => {
    const id = '7d3f8a52-0c1e-4b7a-9f00-1234567890ab';
    expect(dailyCard(id, '2026-10-11')).toEqual(dailyCard(id, '2026-10-11'));
    const month = Array.from({ length: 30 }, (_, i) =>
      dailyCard(id, `2026-11-${String(i + 1).padStart(2, '0')}`),
    );
    expect(new Set(month.map((c) => c.name)).size).toBeGreaterThan(10);
  });

  it('reparte todas las cartas entre personas', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 2000; i++) seen.add(dailyCard(`user-${i}`, '2026-10-11').name);
    expect(seen.size).toBe(22);
  });

  it('cada signo tiene fechas y frase', () => {
    for (const sign of SIGNS) {
      expect(SIGN_INFO[sign].dates).toMatch(/\d/);
      expect(SIGN_INFO[sign].blurb.length).toBeGreaterThan(10);
    }
  });
});
