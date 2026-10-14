import type { PointerEvent, ReactNode, RefObject } from 'react';
import { Icon } from '@/components/ui/Icon';
import type { SceneState } from './useScene';

interface Props {
  label: string;
  state: SceneState;
  paused: boolean;
  onTogglePause(): void;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  /** Cambia en cada remontaje: un canvas cuyo contexto se liberó no se reutiliza. */
  generation: number;
  handlers: {
    onPointerMove(e: PointerEvent<HTMLCanvasElement>): void;
    onPointerLeave(): void;
  };
  onPick?(e: PointerEvent<HTMLCanvasElement>): void;
  /** Alternativa estática (imagen o SVG): visible hasta que el 3D está listo. */
  fallback?: ReactNode;
  /** Acciones que solo tienen sentido con el 3D pintando (sobre el canvas: sin saltos). */
  actions?: ReactNode;
  /**
   * Capa delantera siempre visible (el personaje ZODI): va encima del canvas
   * y deja pasar el puntero, así la escena 3D queda detrás de él.
   */
  overlay?: ReactNode;
  shape?: 'square' | 'portrait' | 'wide';
}

/**
 * Marco de una escena: tamaño fijo por proporción (sin saltos de diseño),
 * alternativa estática, canvas role="img" y botón de pausa visible.
 * El canvas no atrapa el scroll (touch-action: pan-y).
 */
export function SceneFrame({
  label,
  state,
  paused,
  onTogglePause,
  canvasRef,
  generation,
  handlers,
  onPick,
  fallback,
  actions,
  overlay,
  shape = 'square',
}: Props) {
  return (
    <div className={`scene-frame scene-${shape}`} data-state={state}>
      {state !== 'static' && (
        <canvas
          key={generation}
          ref={canvasRef}
          className="scene-canvas"
          role="img"
          aria-label={label}
          onPointerMove={handlers.onPointerMove}
          onPointerLeave={handlers.onPointerLeave}
          onPointerUp={onPick}
        />
      )}
      <div className="scene-fallback" hidden={state === 'ready'}>
        {fallback}
      </div>
      {state === 'ready' && (
        <button
          type="button"
          className="btn btn-secondary btn-sm scene-pause"
          aria-pressed={paused}
          onClick={onTogglePause}
        >
          <Icon name={paused ? 'play' : 'pause'} size={16} />
          <span className="btn-label">Pausar animación</span>
        </button>
      )}
      {overlay && <div className="scene-overlay">{overlay}</div>}
      {state === 'ready' && actions && <div className="scene-actions">{actions}</div>}
    </div>
  );
}
