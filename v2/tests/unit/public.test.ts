import { describe, expect, it } from 'vitest';
import { signDay } from '@/lib/public/sign-day';
import { SIGN_BY_SLUG, SIGN_INFO } from '@/lib/public/signs';
import { publicCacheControl, secondsUntilTomorrow } from '@/lib/public/today';

describe('horóscopo público por signo', () => {
  it('doce signos con su ficha', () => {
    expect(SIGN_INFO).toHaveLength(12);
    expect(SIGN_BY_SLUG.get('escorpio')).toMatchObject({ name: 'Escorpio', index: 7 });
  });

  it('determinista: mismo signo y día, mismo texto', () => {
    expect(signDay(4, '2026-10-12')).toEqual(signDay(4, '2026-10-12'));
    expect(signDay(4, '2026-10-12').advice).toBeTypeOf('string');
  });

  it('casas solares: el Sol en Libra cae en la casa 7 de Aries y en la 1 de Libra', () => {
    expect(signDay(0, '2026-10-12').houses.sun).toBe(7);
    expect(signDay(6, '2026-10-12').houses.sun).toBe(1);
  });

  it('todas las áreas con texto y puntuaciones de 1 a 5', () => {
    for (let i = 0; i < 12; i++) {
      const d = signDay(i, '2026-10-12');
      for (const text of [d.headline, d.love, d.work, d.energy, d.advice]) {
        expect(text.length).toBeGreaterThan(20);
      }
      for (const v of Object.values(d.scores)) expect(v).toBeGreaterThanOrEqual(1);
      for (const v of Object.values(d.scores)) expect(v).toBeLessThanOrEqual(5);
      expect(d.luckyNumber).toBeGreaterThanOrEqual(1);
      expect(d.luckyNumber).toBeLessThanOrEqual(99);
    }
  });
});

describe('caché de las páginas públicas', () => {
  it('nunca dura más allá de la medianoche de Madrid', () => {
    // 23:59:30 en Madrid (verano, UTC+2) → quedan 30 s, se redondea a 60.
    expect(secondsUntilTomorrow(new Date('2026-07-01T21:59:30Z'))).toBe(60);
    // Mediodía → como mucho una hora.
    expect(secondsUntilTomorrow(new Date('2026-07-01T10:00:00Z'))).toBe(3600);
    expect(publicCacheControl(new Date('2026-07-01T10:00:00Z'))).toContain('s-maxage=3600');
  });
});
