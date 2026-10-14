import type { ReactNode } from 'react';
import type { Sign } from '@/lib/astro-engine/types';
import type { SignOfDayScene } from '@/scenes/sign-of-day';
import { SceneFrame } from './SceneFrame';
import { useScene } from './useScene';

/** Tótem 3D del signo del día. La imagen neón del signo es la alternativa. */
export function SignOfDay3D({ sign, children }: { sign: Sign; children?: ReactNode }) {
  const s = useScene<SignOfDayScene>('sign-of-day', () =>
    import('@/scenes/sign-of-day').then((m) => m.createSignOfDayScene(sign)),
  );

  return (
    <div className="scene-block">
      <SceneFrame
        label={`Tótem en 3D del signo de ${sign} rodeado de chispas de colores`}
        state={s.state}
        paused={s.paused}
        onTogglePause={s.togglePause}
        canvasRef={s.canvasRef}
        generation={s.generation}
        handlers={s.handlers}
        onPick={(e) => s.pick(e)}
        fallback={children}
        actions={
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => s.sceneRef.current?.jump()}
          >
            ¡Que salte!
          </button>
        }
      />
    </div>
  );
}
