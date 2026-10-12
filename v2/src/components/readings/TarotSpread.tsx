import { useEffect, useState, type CSSProperties } from 'react';
import { TAROT_BACK, type DrawnCard } from '@/lib/tarot/deck';

interface Props {
  cards: DrawnCard[];
  /** Repartir boca abajo y voltear una a una (en una lectura guardada, no). */
  animate?: boolean;
}

const LAYOUT = (n: number) => (n === 1 ? 'una' : n === 3 ? 'tres' : 'celta');

/**
 * La tirada: las cartas caen boca abajo con el reverso de Zodi y se voltean
 * en 3D una detrás de otra. Los Arcanos ZODI enseñan su arte; los clásicos,
 * su número y su nombre. Las invertidas salen giradas (y el texto lo dice).
 */
export function TarotSpread({ cards, animate = true }: Props) {
  const [shown, setShown] = useState(animate ? 0 : cards.length);

  useEffect(() => {
    if (!animate) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(cards.length);
      return;
    }
    const step = cards.length > 3 ? 320 : 650;
    const timers = cards.map((_, i) =>
      window.setTimeout(() => setShown((n) => Math.max(n, i + 1)), 750 + i * step),
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [cards, animate]);

  return (
    <ol
      className="tarot-spread"
      data-layout={LAYOUT(cards.length)}
      data-animate={animate ? '' : undefined}
      aria-label="Cartas tiradas"
    >
      {cards.map((c, i) => {
        const revealed = i < shown;
        return (
          <li key={c.position} className="tarot-slot" style={{ '--i': i } as CSSProperties}>
            <p className="kicker">{c.position}</p>
            <div
              className="tarot-card3d"
              data-revealed={revealed ? '' : undefined}
              data-zodi={c.art ? '' : undefined}
              aria-hidden="true"
            >
              <div className="tarot-inner">
                <div className="tarot-face tarot-back">
                  <img src={TAROT_BACK} alt="" width="480" height="720" decoding="async" />
                </div>
                <div className="tarot-face tarot-front" data-reversed={c.reversed ? '' : undefined}>
                  {c.art ? (
                    <img src={c.art} alt="" width="480" height="720" decoding="async" />
                  ) : (
                    <div className="tarot-classic">
                      <span className="tarot-card-numeral">{c.numeral}</span>
                      <span className="tarot-card-sigil">✦</span>
                      <span className="tarot-card-name">{c.name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <p className="tarot-slot-name" data-revealed={revealed ? '' : undefined}>
              {c.name}
              {c.reversed && <span className="muted"> · invertida</span>}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
