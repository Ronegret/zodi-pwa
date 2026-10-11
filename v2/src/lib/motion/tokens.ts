/**
 * Sistema de movimiento de Zodi. Mismos valores que las variables CSS
 * (--dur-*, --ease-*) de tokens.css: si cambias uno, cambia el otro.
 * Solo se animan transform y opacity.
 */
export const DURATION = { fast: 160, base: 320, slow: 640 } as const;

export const EASING = {
  /** Salida suave (entradas, revelados). */
  out: 'cubic-bezier(0.22, 1, 0.36, 1)',
  /** Aceleración (salidas). */
  in: 'cubic-bezier(0.64, 0, 0.78, 0)',
  /** Énfasis ida y vuelta. */
  inOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
  /** Resorte con un rebote corto (CSS linear()). */
  spring: 'linear(0, 0.18 7%, 0.6 18%, 0.94 30%, 1.06 40%, 1.08 46%, 1.03 58%, 0.99 70%, 1 100%)',
} as const;

export interface Preset {
  keyframes: Keyframe[];
  options: KeyframeAnimationOptions;
}

export const PRESETS = {
  enter: {
    keyframes: [
      { opacity: 0, transform: 'translateY(12px)' },
      { opacity: 1, transform: 'none' },
    ],
    options: { duration: DURATION.base, easing: EASING.out, fill: 'both' },
  },
  exit: {
    keyframes: [
      { opacity: 1, transform: 'none' },
      { opacity: 0, transform: 'translateY(8px) scale(0.98)' },
    ],
    options: { duration: DURATION.fast, easing: EASING.in, fill: 'forwards' },
  },
  emphasis: {
    keyframes: [{ transform: 'scale(1)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }],
    options: { duration: DURATION.base, easing: EASING.inOut },
  },
  spring: {
    keyframes: [{ transform: 'scale(0.6)' }, { transform: 'scale(1)' }],
    options: { duration: DURATION.slow, easing: EASING.spring, fill: 'both' },
  },
} as const satisfies Record<string, Preset>;

export type PresetName = keyof typeof PRESETS;
