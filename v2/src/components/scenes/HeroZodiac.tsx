import { useState, type ReactNode } from 'react';
import { SIGN_GLYPHS, elementOf, signSlug } from '@/lib/astro-engine/labels';
import { SIGNS, type Sign } from '@/lib/astro-engine/types';
import { SIGN_INFO } from '@/lib/zodiac/signs';
import type { HeroScene } from '@/scenes/hero';
import { SceneFrame } from './SceneFrame';
import { useScene } from './useScene';

/**
 * Portada: el personaje ZODI delante (siempre visible, es el protagonista) y
 * una corona de 12 medallones con la ilustración de cada signo flotando sobre
 * su cabeza. Los 12 botones (con su imagen) son el equivalente de teclado del
 * clic en 3D y funcionan sin 3D.
 */
const avatar = (sign: Sign) => `/signos/${signSlug(sign)}-avatar-240.webp`;
export function HeroZodiac({ children }: { children?: ReactNode }) {
  const [selected, setSelected] = useState<Sign | null>(null);
  const s = useScene<HeroScene>('hero', () =>
    import('@/scenes/hero').then((m) => m.createHeroScene({ crown: true })),
  );

  const choose = (sign: Sign) => {
    setSelected(sign);
    s.sceneRef.current?.focusSign(sign);
  };

  return (
    <div className="scene-block">
      <SceneFrame
        label="Corona en 3D con los doce signos del zodiaco, cada uno con su ilustración, girando sobre la cabeza de ZODI"
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
        overlay={children}
        shape="portrait"
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
            <img
              className="chip-avatar"
              src={avatar(sign)}
              alt=""
              width="240"
              height="240"
              loading="lazy"
              decoding="async"
            />
            <span aria-hidden="true">{SIGN_GLYPHS[sign]}</span>
            {sign}
          </button>
        ))}
      </div>
      <div className="scene-status-row js-only">
        {selected && (
          <img
            className="scene-status-avatar"
            src={avatar(selected)}
            alt=""
            width="240"
            height="240"
          />
        )}
        <p className="scene-status" role="status">
          {selected
            ? `${selected} (${SIGN_INFO[selected].dates}, ${elementOf(selected).toLowerCase()}): ${SIGN_INFO[selected].blurb}`
            : ''}
        </p>
      </div>
    </div>
  );
}
