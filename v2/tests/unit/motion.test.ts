import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DURATION, EASING, PRESETS, play, reducedMotion } from '@/lib/motion';

// Sin espacios: Prettier puede partir valores largos (linear()) en varias líneas.
const squash = (s: string) => s.replace(/\s+/g, '');
const tokensCss = squash(
  readFileSync(fileURLToPath(new URL('../../src/styles/tokens.css', import.meta.url)), 'utf8'),
);

function fakeDom(systemReduce: boolean, stored?: string) {
  const dataset: Record<string, string> = stored ? { motion: stored } : {};
  vi.stubGlobal('window', {
    matchMedia: (q: string) => ({ matches: q.includes('reduce') ? systemReduce : true }),
  });
  vi.stubGlobal('document', { documentElement: { dataset } });
}

afterEach(() => vi.unstubAllGlobals());

describe('tokens de movimiento', () => {
  it('coinciden con las variables CSS', () => {
    expect(tokensCss).toContain(squash(`--dur-fast: ${DURATION.fast}ms`));
    expect(tokensCss).toContain(squash(`--dur: ${DURATION.base}ms`));
    expect(tokensCss).toContain(squash(`--dur-slow: ${DURATION.slow}ms`));
    expect(tokensCss).toContain(squash(`--ease: ${EASING.out}`));
    expect(tokensCss).toContain(squash(`--ease-spring: ${EASING.spring}`));
  });

  it('solo animan transform y opacity, y las entradas acaban en reposo', () => {
    for (const preset of Object.values(PRESETS)) {
      for (const frame of preset.keyframes) {
        expect(Object.keys(frame).every((k) => k === 'opacity' || k === 'transform')).toBe(true);
      }
    }
    expect(PRESETS.enter.keyframes.at(-1)).toEqual({ opacity: 1, transform: 'none' });
    expect(PRESETS.spring.keyframes.at(-1)).toEqual({ transform: 'scale(1)' });
  });

  it('ninguna animación dura más de un segundo', () => {
    for (const preset of Object.values(PRESETS)) {
      expect(Number(preset.options.duration)).toBeLessThanOrEqual(1000);
    }
  });
});

describe('movimiento reducido', () => {
  it('lo respeta si lo pide el sistema', () => {
    fakeDom(true);
    expect(reducedMotion()).toBe(true);
  });

  it('lo respeta si se eligió en Ajustes aunque el sistema no lo pida', () => {
    fakeDom(false, 'reduce');
    expect(reducedMotion()).toBe(true);
    fakeDom(false);
    expect(reducedMotion()).toBe(false);
  });

  it('play() no anima con movimiento reducido', () => {
    fakeDom(true);
    const el = { animate: vi.fn() } as unknown as Element;
    expect(play(el, 'enter')).toBeNull();
    expect((el as unknown as { animate: ReturnType<typeof vi.fn> }).animate).not.toHaveBeenCalled();
  });

  it('play() usa el preset si hay movimiento', () => {
    fakeDom(false);
    const animation = {} as Animation;
    const animate = vi.fn(() => animation);
    expect(play({ animate } as unknown as Element, 'emphasis')).toBe(animation);
    expect(animate).toHaveBeenCalledWith(PRESETS.emphasis.keyframes, PRESETS.emphasis.options);
  });
});
