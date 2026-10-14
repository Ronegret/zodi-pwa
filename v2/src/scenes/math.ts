/**
 * Geometría de las escenas (pura, testeada). Plano XZ visto desde arriba:
 * mismo convenio que la rueda SVG (Ascendente a la izquierda, zodiaco
 * antihorario), con z = −sen(θ) para que "arriba" en pantalla sea −z.
 */
import { lonToAngle } from '@/lib/chart/wheel';

const DEG = Math.PI / 180;

export interface XZ {
  x: number;
  z: number;
}

/** Posición en el plano de un punto de longitud eclíptica `lon`. */
export function eclipticToXZ(lon: number, radius: number, ascendant = 0): XZ {
  const a = lonToAngle(lon, ascendant) * DEG;
  return { x: round(radius * Math.cos(a)), z: round(-radius * Math.sin(a)) };
}

const round = (n: number) => Math.round(n * 1e6) / 1e6 || 0;

/** Ángulo (rad) de un punto del plano medido como en eclipticToXZ. */
export function angleOfXZ({ x, z }: XZ): number {
  return Math.atan2(-z, x);
}

/**
 * Rotación del grupo en Y para traer al frente (hacia la cámara, +z) el
 * punto de ángulo `angle` (rad). En three, rotation.y = r lleva el ángulo
 * θ a θ + r; el frente es θ = −π/2.
 */
export function rotationToFront(angle: number): number {
  return normalizeAngle(-Math.PI / 2 - angle);
}

/** Ángulo en (−π, π]. */
export function normalizeAngle(a: number): number {
  const t = (((a + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  return t === 0 ? Math.PI : t - Math.PI;
}

/** Valor de destino equivalente a `target` más cercano a `current` (camino corto). */
export function nearestTurn(current: number, target: number): number {
  return current + normalizeAngle(target - current);
}

/** Posiciones repartidas en anillo (n elementos, empezando arriba). */
export function ringPositions(n: number, radius: number): XZ[] {
  return Array.from({ length: n }, (_, i) => {
    const a = Math.PI / 2 + (i * 2 * Math.PI) / n;
    return { x: round(radius * Math.cos(a)), z: round(-radius * Math.sin(a)) };
  });
}
