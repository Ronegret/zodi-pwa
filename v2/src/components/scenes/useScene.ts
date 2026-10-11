import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import type { Vector2 } from 'three';
import { startLoop, type LoopControl } from '@/scenes/core/loop';
import { sceneSupport, type Unsupported } from '@/scenes/core/support';
import type { SceneStats, ZodiScene } from '@/scenes/core/types';

/** Escena ya cargada (BaseScene): además de ZodiScene sabe pintar y medir. */
export type LoadedScene = ZodiScene & {
  render(): void;
  stats(): SceneStats | null;
  lastDisposeLeftover: SceneStats | null;
};

/** 'static' = alternativa sin 3D; 'loading' = descargando three; 'ready' = pintando. */
export type SceneState = 'static' | 'loading' | 'ready';

interface DebugEntry {
  stats(): SceneStats | null;
  leftover(): SceneStats | null;
  remount(): void;
  state: SceneState;
  reason: Unsupported | null;
}
type DebugWindow = Window & { __zodiScenes?: Record<string, DebugEntry> };

/**
 * Ciclo de vida de una escena: comprueba soporte, importa three en un chunk
 * aparte, monta, arranca el bucle (pausado fuera de pantalla) y lo libera
 * todo al desmontar o al salir de la página.
 */
export function useScene<S extends LoadedScene>(name: string, load: () => Promise<S>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<S | null>(null);
  const loopRef = useRef<LoopControl | null>(null);
  const loadRef = useRef(load);
  const leftover = useRef<SceneStats | null>(null);
  const [state, setState] = useState<SceneState>('static');
  const [reason, setReason] = useState<Unsupported | null>(null);
  const [paused, setPaused] = useState(false);
  const [generation, setGeneration] = useState(0);
  const enabled = state !== 'static';

  useEffect(() => {
    const support = sceneSupport();
    if (support.ok) setState('loading');
    else setReason(support.reason);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!enabled || !canvas) return;
    let cancelled = false;

    const teardown = () => {
      loopRef.current?.stop();
      loopRef.current = null;
      const scene = sceneRef.current;
      if (scene) {
        scene.dispose();
        leftover.current = scene.lastDisposeLeftover;
      }
      sceneRef.current = null;
    };

    loadRef
      .current()
      .then((scene) => {
        if (cancelled) return scene.dispose();
        scene.mount(canvas);
        sceneRef.current = scene;
        loopRef.current = startLoop(scene, canvas);
        setPaused(false);
        setState('ready');
      })
      .catch((error: unknown) => {
        console.error(`[scene:${name}]`, error);
        setReason('no-webgl');
        setState('static');
      });

    window.addEventListener('pagehide', teardown);
    return () => {
      cancelled = true;
      window.removeEventListener('pagehide', teardown);
      teardown();
    };
  }, [enabled, generation, name]);

  // Gancho para los e2e de presupuesto y fugas (solo en desarrollo).
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const w = window as DebugWindow;
    w.__zodiScenes ??= {};
    w.__zodiScenes[name] = {
      stats: () => sceneRef.current?.stats() ?? null,
      leftover: () => leftover.current,
      remount: () => {
        setState('loading');
        setGeneration((g) => g + 1);
      },
      state,
      reason,
    };
  });

  const togglePause = useCallback(() => {
    const loop = loopRef.current;
    if (!loop) return;
    if (loop.paused) loop.resume();
    else loop.pause();
    setPaused(loop.paused);
  }, []);

  const ndc = (e: PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * 2 - 1,
      y: -((e.clientY - r.top) / r.height) * 2 + 1,
    } as Vector2;
  };

  const handlers = {
    onPointerMove: (e: PointerEvent<HTMLCanvasElement>) => sceneRef.current?.pointer?.(ndc(e)),
    onPointerLeave: () => sceneRef.current?.pointer?.(null),
  };
  /** Clic/tap en el canvas: id del objeto elegido o null. */
  const pick = (e: PointerEvent<HTMLCanvasElement>) => sceneRef.current?.select?.(ndc(e)) ?? null;

  return { canvasRef, sceneRef, state, reason, paused, togglePause, handlers, pick, generation };
}
