import { useState, type ReactNode } from 'react';
import type { PlanetId } from '@/lib/astro-engine';
import { PLANET_GLYPHS, PLANET_NAMES, formatPosition } from '@/lib/astro-engine/labels';
import type { Sign } from '@/lib/astro-engine/types';
import type { NatalWheelScene, WheelInput } from '@/scenes/natal-wheel';
import { SceneFrame } from './SceneFrame';
import { useScene } from './useScene';

export interface WheelPlanetDetail {
  id: PlanetId;
  lon: number;
  sign: Sign;
  degree: number;
  minute: number;
  house: number | null;
  retrograde: boolean;
}

interface Props {
  planets: WheelPlanetDetail[];
  ascendant: number | null;
  aspects: WheelInput['aspects'];
  children?: ReactNode;
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

/**
 * Rueda natal 3D con los datos reales del motor. La rueda SVG es la
 * alternativa estática; los botones de planeta son el equivalente de
 * teclado del clic en 3D.
 */
export function NatalWheel3D({ planets, ascendant, aspects, children }: Props) {
  const [selected, setSelected] = useState<PlanetId | null>(null);
  const s = useScene<NatalWheelScene>('natal-wheel', () =>
    import('@/scenes/natal-wheel').then((m) =>
      m.createNatalWheelScene({
        planets: planets.map(({ id, lon, sign }) => ({ id, lon, sign })),
        ascendant,
        aspects,
      }),
    ),
  );

  const choose = (id: PlanetId) => {
    const next = selected === id ? null : id;
    setSelected(next);
    s.sceneRef.current?.focusPlanet(next);
  };
  const detail = planets.find((p) => p.id === selected);

  return (
    <div className="scene-block">
      <SceneFrame
        label="Rueda natal en 3D: anillo de signos y planetas en su posición real"
        state={s.state}
        paused={s.paused}
        onTogglePause={s.togglePause}
        canvasRef={s.canvasRef}
        generation={s.generation}
        handlers={s.handlers}
        onPick={(e) => {
          const id = s.pick(e);
          if (id) setSelected(id as PlanetId);
        }}
        fallback={children}
      />
      <div
        className="chip-group scene-controls js-only"
        role="group"
        aria-label="Destacar un planeta"
      >
        {planets.map((p) => (
          <button
            key={p.id}
            type="button"
            className="chip chip-button"
            aria-pressed={selected === p.id}
            onClick={() => choose(p.id)}
          >
            <span aria-hidden="true">{PLANET_GLYPHS[p.id]}</span>
            {PLANET_NAMES[p.id]}
          </button>
        ))}
      </div>
      <p className="scene-status js-only" role="status">
        {detail
          ? `${PLANET_NAMES[detail.id]} en ${formatPosition(detail)}${
              detail.house ? `, casa ${ROMAN[detail.house - 1]}` : ''
            }${detail.retrograde && detail.id !== 'northNode' ? ', retrógrado' : ''}.`
          : ''}
      </p>
    </div>
  );
}
