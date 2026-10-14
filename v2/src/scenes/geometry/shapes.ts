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

/**
 * Medallón de un signo: su ilustración de ZODI recortada en círculo con un
 * aro de neón del color de su elemento. Mientras la imagen carga se ve el
 * glifo (nunca un hueco). `cancel()` evita pintar si la escena ya se cerró.
 */
export function medallionTexture(src: string, glyph: string, ring: string, bg: string) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  const c = size / 2;
  const r = size * 0.41;

  const draw = (img?: HTMLImageElement) => {
    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.beginPath();
    ctx.arc(c, c, r, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, size, size);
    if (img) {
      // Las ilustraciones son oscuras: un poco más de luz para que se lean en pequeño.
      ctx.filter = 'brightness(1.45) contrast(1.1) saturate(1.15)';
      ctx.drawImage(img, c - r, c - r, r * 2, r * 2);
      ctx.filter = 'none';
    } else {
      ctx.fillStyle = ring;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `700 ${Math.round(size * 0.4)}px ${GLYPH_FONT}`;
      ctx.fillText(glyph, c, c + size * 0.03);
    }
    ctx.restore();
    // Aro de neón con halo.
    ctx.lineWidth = size * 0.05;
    ctx.strokeStyle = ring;
    ctx.shadowColor = ring;
    ctx.shadowBlur = size * 0.07;
    ctx.beginPath();
    ctx.arc(c, c, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    texture.needsUpdate = true;
  };

  draw();
  let cancelled = false;
  const img = new Image();
  img.decoding = 'async';
  img.onload = () => {
    if (!cancelled) draw(img);
  };
  img.src = src;
  return { texture, cancel: () => (cancelled = true) };
}
