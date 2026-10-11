import { CanvasTexture, SRGBColorSpace } from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/** Caja redondeada (la pieza base del estilo lúdico de Zodi). */
export function roundedBox(
  width: number,
  height: number,
  depth: number,
  radius = 0.12,
  segments = 4,
) {
  return new RoundedBoxGeometry(width, height, depth, segments, radius);
}

const GLYPH_FONT =
  "'Segoe UI Symbol', 'Apple Symbols', 'Noto Sans Symbols 2', 'DejaVu Sans', sans-serif";

/**
 * Textura con un glifo o texto centrado (≤ 256 px: presupuesto de
 * texturas). El fondo es transparente.
 */
export function glyphTexture(
  text: string,
  color: string,
  { size = 256, font = GLYPH_FONT, weight = '700', scale = 0.62 } = {},
): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${weight} ${Math.round(size * scale)}px ${font}`;
  ctx.fillText(text, size / 2, size / 2 + size * 0.04);
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

export const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;
