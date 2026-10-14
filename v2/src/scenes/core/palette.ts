import type { Palette } from './types';

/** Valores por defecto = tokens.css (por si se lee fuera del navegador). */
export const DEFAULT_PALETTE: Palette = {
  acid: 0xb8ff17,
  violet: 0x9b4dff,
  violetText: 0xb98aff,
  hot: 0xff2bd6,
  cyan: 0x33f7ff,
  gold: 0xf5c842,
  ink: 0xf0f0eb,
  bg: 0x060608,
  surface: 0x0e0e14,
};

const VARS: Record<keyof Palette, string> = {
  acid: '--acid',
  violet: '--violet',
  violetText: '--violet-text',
  hot: '--hot',
  cyan: '--cyan',
  gold: '--gold',
  ink: '--ink',
  bg: '--bg',
  surface: '--surface',
};

export function parseHex(value: string): number | null {
  const m = /^#([0-9a-f]{6})$/i.exec(value.trim());
  return m ? parseInt(m[1]!, 16) : null;
}

/** Paleta de la escena leída de las variables CSS: una sola fuente de color. */
export function readPalette(el: Element = document.documentElement): Palette {
  const style = getComputedStyle(el);
  const out = { ...DEFAULT_PALETTE };
  for (const key of Object.keys(VARS) as (keyof Palette)[]) {
    const hex = parseHex(style.getPropertyValue(VARS[key]));
    if (hex !== null) out[key] = hex;
  }
  return out;
}
