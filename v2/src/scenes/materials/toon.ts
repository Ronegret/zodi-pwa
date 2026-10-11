import {
  DataTexture,
  MeshToonMaterial,
  NearestFilter,
  RedFormat,
  type ColorRepresentation,
} from 'three';

/**
 * Gradiente de 3–4 tonos para el sombreado toon (bandas duras, sin
 * degradado). Se crea por escena y se libera con ella.
 */
export function createGradientMap(tones: 3 | 4 = 4): DataTexture {
  const steps = tones === 4 ? [70, 130, 195, 255] : [90, 175, 255];
  const tex = new DataTexture(new Uint8Array(steps), steps.length, 1, RedFormat);
  tex.minFilter = NearestFilter;
  tex.magFilter = NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

interface ToonOptions {
  gradientMap: DataTexture;
  emissive?: ColorRepresentation;
  emissiveIntensity?: number;
  /** Grosor del contorno (OutlineEffect); 0 lo oculta. */
  outline?: number;
}

export function toonMaterial(color: ColorRepresentation, opts: ToonOptions): MeshToonMaterial {
  const material = new MeshToonMaterial({
    color,
    gradientMap: opts.gradientMap,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 0,
  });
  material.userData.outlineParameters =
    opts.outline === 0
      ? { visible: false }
      : { thickness: opts.outline ?? 0.006, color: [0, 0, 0] };
  return material;
}
