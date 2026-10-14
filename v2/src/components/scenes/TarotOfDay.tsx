import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import type { TarotCard } from '@/lib/tarot/daily';
import type { TarotScene } from '@/scenes/tarot';
import { SceneFrame } from './SceneFrame';
import { useScene } from './useScene';

/**
 * Carta del día que se voltea con el botón (o con un clic en la carta 3D) y
 * anuncia el resultado. El botón ya viene en el HTML del servidor: al
 * hidratar es el mismo nodo y no se pierde el foco. Sin JS se oculta y la
 * carta se revela con <details>.
 */
export function TarotOfDay({ card }: { card: TarotCard }) {
  const [revealed, setRevealed] = useState(false);
  const s = useScene<TarotScene>('tarot', () =>
    import('@/scenes/tarot').then((m) => m.createTarotScene(card)),
  );

  const flip = () => {
    const next = !revealed;
    setRevealed(next);
    s.sceneRef.current?.flip(next);
  };

  const fallback = (
    <div className="tarot-flat" data-revealed={revealed ? '' : undefined}>
      <span className="tarot-flat-numeral" aria-hidden="true">
        {revealed ? card.numeral : '✦'}
      </span>
      <span className="tarot-flat-name" aria-hidden="true">
        {revealed ? card.name : 'ZODI'}
      </span>
    </div>
  );

  return (
    <div className="scene-block">
      <SceneFrame
        label="Carta de tarot en 3D flotando; se voltea al pulsarla"
        state={s.state}
        paused={s.paused}
        onTogglePause={s.togglePause}
        canvasRef={s.canvasRef}
        generation={s.generation}
        handlers={s.handlers}
        onPick={(e) => {
          const side = s.pick(e);
          if (side) setRevealed(side === 'front');
        }}
        fallback={fallback}
        shape="portrait"
      />
      <button
        type="button"
        className="btn btn-violet btn-block js-only"
        aria-pressed={revealed}
        onClick={flip}
      >
        <Icon name="rotate" />
        <span className="btn-label">Voltear carta</span>
      </button>
      <p className="scene-status js-only" role="status">
        {revealed ? `${card.numeral} · ${card.name}. ${card.message}` : ''}
      </p>
      <noscript>
        <details className="tarot-details">
          <summary>Ver tu carta del día</summary>
          <p>
            {card.numeral} · {card.name}. {card.message}
          </p>
        </details>
      </noscript>
    </div>
  );
}
