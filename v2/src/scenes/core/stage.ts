import { SRGBColorSpace, WebGLRenderer, type PerspectiveCamera } from 'three';
import type { OutlineEffect } from 'three/addons/effects/OutlineEffect.js';
import { createOutline } from '../effects/outline';
import type { SceneGraph, SceneStats } from './types';

export const MAX_DPR = 2;

/**
 * Renderer + contorno + tamaño. Cada escena tiene la suya: se crea al
 * montar y se destruye entera al desmontar (incluido el contexto WebGL).
 */
export class Stage {
  readonly renderer: WebGLRenderer;
  private readonly outline: OutlineEffect;
  private readonly resizeObserver: ResizeObserver;

  constructor(
    readonly canvas: HTMLCanvasElement,
    private readonly graph: SceneGraph,
  ) {
    this.renderer = new WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'low-power',
    });
    this.renderer.outputColorSpace = SRGBColorSpace;
    // OutlineEffect pinta dos pasadas; sin esto renderer.info solo ve la última.
    this.renderer.info.autoReset = false;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_DPR));
    this.outline = createOutline(this.renderer);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.resize();
  }

  resize() {
    const { clientWidth: w, clientHeight: h } = this.canvas;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    const camera = this.graph.camera as PerspectiveCamera;
    if (camera.isPerspectiveCamera) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
  }

  render() {
    this.renderer.info.reset();
    this.outline.render(this.graph.scene, this.graph.camera);
  }

  stats(): SceneStats {
    const { render, memory } = this.renderer.info;
    return {
      calls: render.calls,
      triangles: render.triangles,
      geometries: memory.geometries,
      textures: memory.textures,
    };
  }

  dispose() {
    this.resizeObserver.disconnect();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}
