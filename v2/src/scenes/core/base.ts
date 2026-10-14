import {
  AmbientLight,
  DirectionalLight,
  Raycaster,
  Scene,
  type Object3D,
  type PerspectiveCamera,
  type Vector2,
} from 'three';
import { createGradientMap } from '../materials/toon';
import { disposeTree } from './dispose';
import { DEFAULT_PALETTE, readPalette } from './palette';
import { Stage } from './stage';
import type { Palette, SceneStats, ZodiScene } from './types';

/**
 * Base común: paleta desde CSS, luces toon, Stage, raycasting y liberación
 * completa. Cada escena implementa build() y update().
 */
export abstract class BaseScene implements ZodiScene {
  protected readonly scene = new Scene();
  protected abstract readonly camera: PerspectiveCamera;
  protected readonly gradient = createGradientMap(4);
  protected palette: Palette = DEFAULT_PALETTE;
  protected stage: Stage | null = null;
  protected elapsed = 0;
  private readonly raycaster = new Raycaster();
  /** Recursos que no cuelgan de la escena (p. ej. un material alternativo). */
  private readonly extras: { dispose(): void }[] = [];
  /** Lo que quedó en GPU tras dispose(); los tests de fugas esperan 0. */
  lastDisposeLeftover: SceneStats | null = null;

  mount(canvas: HTMLCanvasElement) {
    this.palette = readPalette();
    const key = new DirectionalLight(0xffffff, 2.2);
    key.position.set(4, 6, 5);
    this.scene.add(key, new AmbientLight(0xffffff, 0.55));
    this.build();
    this.stage = new Stage(canvas, { scene: this.scene, camera: this.camera });
  }

  protected abstract build(): void;
  abstract update(dt: number): void;

  render() {
    this.stage?.render();
  }

  stats(): SceneStats | null {
    return this.stage?.stats() ?? null;
  }

  protected track<T extends { dispose(): void }>(resource: T): T {
    this.extras.push(resource);
    return resource;
  }

  /** Primer objeto (de la lista) bajo el puntero. */
  protected hit<T extends Object3D>(ndc: Vector2, objects: T[]): T | null {
    this.raycaster.setFromCamera(ndc, this.camera);
    const [first] = this.raycaster.intersectObjects(objects, false);
    return (first?.object as T | undefined) ?? null;
  }

  dispose() {
    disposeTree(this.scene);
    this.extras.forEach((r) => r.dispose());
    this.gradient.dispose();
    this.scene.clear();
    if (this.stage) {
      this.lastDisposeLeftover = this.stage.stats();
      this.stage.dispose();
    }
    this.stage = null;
  }
}

/** Interpolación exponencial independiente de los fps. */
export const damp = (current: number, target: number, lambda: number, dt: number) =>
  current + (target - current) * (1 - Math.exp(-lambda * dt));
