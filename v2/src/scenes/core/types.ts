import type { Camera, Scene, Vector2 } from 'three';

/**
 * Interfaz común de las escenas 3D de Zodi. `mount` monta en un canvas,
 * `update` avanza un frame (dt en segundos) y `dispose` libera todo (GPU).
 */
export interface ZodiScene {
  mount(canvas: HTMLCanvasElement): void;
  update(dt: number): void;
  dispose(): void;
  /** Puntero en coordenadas normalizadas (-1..1) o null si sale. */
  pointer?(ndc: Vector2 | null): void;
  /** Clic/tap en coordenadas normalizadas; devuelve el id elegido o null. */
  select?(ndc: Vector2): string | null;
}

/** Lo que cada escena construye y la Stage pinta. */
export interface SceneGraph {
  scene: Scene;
  camera: Camera;
}

export interface Palette {
  acid: number;
  violet: number;
  violetText: number;
  hot: number;
  cyan: number;
  gold: number;
  ink: number;
  bg: number;
  surface: number;
}

/** Cifras de renderer.info para presupuesto y detección de fugas. */
export interface SceneStats {
  calls: number;
  triangles: number;
  geometries: number;
  textures: number;
}
