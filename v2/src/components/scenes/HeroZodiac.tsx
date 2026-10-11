import { useState, type ReactNode } from 'react';
import { SIGN_GLYPHS, elementOf } from '@/lib/astro-engine/labels';
import { SIGNS, type Sign } from '@/lib/astro-engine/types';
import { SIGN_INFO } from '@/lib/zodiac/signs';
import type { HeroScene } from '@/scenes/hero';
import { SceneFrame } from './SceneFrame';
import { useScene } from './useScene';

/**
 * Anillo zodiacal 3D de la portada. Los 12 botones son el equivalente de
 * teclado del clic en 3D y funcionan también sin 3D (muestran la ficha).
 */
export function HeroZodiac({ children }: { children?: ReactNode }) {
  const [selected, setSelected] = useState<Sign | null>(null);
  const s = useScene<HeroScene>('hero', () =>
    import('@/scenes/hero').then((m) => m.createHeroScene()),
  );

  const choose = (sign: Sign) => {
    setSelected(sign);
    s.sceneRef.current?.focusSign(sign);
  };

  return (
    <div className="scene-block">
      <SceneFrame
        label="Anillo en 3D con los doce signos del zodiaco girando alrededor de un núcleo violeta"
        state={s.state}
        paused={s.paused}
        onTogglePause={s.togglePause}
        canvasRef={s.canvasRef}
        generation={s.generation}
        handlers={s.handlers}
        onPick={(e) => {
          const sign = s.pick(e);
          if (sign) setSelected(sign as Sign);
        }}
        fallback={children}
      />
      <div className="chip-group scene-controls js-only" role="group" aria-label="Elige un signo">
        {SIGNS.map((sign) => (
          <button
            key={sign}
            type="button"
            className="chip chip-button"
            aria-pressed={selected === sign}
            onClick={() => choose(sign)}
          >
            <span aria-hidden="true">{SIGN_GLYPHS[sign]}</span>
            {sign}
          </button>
        ))}
      </div>
      <p className="scene-status js-only" role="status">
        {selected
          ? `${selected} (${SIGN_INFO[selected].dates}, ${elementOf(selected).toLowerCase()}): ${SIGN_INFO[selected].blurb}`
          : ''}
      </p>
    </div>
  );
}
