import type { WebGLRenderer } from 'three';
import { OutlineEffect } from 'three/addons/effects/OutlineEffect.js';

/**
 * Contorno negro de cómic para los materiales toon. Cada material puede
 * ajustar grosor o desactivarlo con userData.outlineParameters (ver
 * materials/toon.ts). Duplica las draw calls de lo que tiene contorno.
 */
export function createOutline(renderer: WebGLRenderer): OutlineEffect {
  return new OutlineEffect(renderer, {
    defaultThickness: 0.006,
    defaultColor: [0, 0, 0],
    defaultAlpha: 1,
  });
}
