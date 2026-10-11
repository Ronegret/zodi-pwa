import type { DrawnCard } from '@/lib/ai/extras';

/** Las tres cartas tiradas. Las invertidas se giran; el texto lo dice. */
export function TarotSpread({ cards }: { cards: DrawnCard[] }) {
  return (
    <ol className="tarot-spread" aria-label="Cartas tiradas">
      {cards.map((c) => (
        <li key={c.position} className="tarot-slot">
          <p className="kicker">{c.position}</p>
          <div
            className="tarot-card"
            data-reversed={c.reversed ? '' : undefined}
            aria-hidden="true"
          >
            <span className="tarot-card-numeral">{c.numeral}</span>
            <span className="tarot-card-sigil">✦</span>
            <span className="tarot-card-name">{c.name}</span>
          </div>
          <p className="tarot-slot-name">
            {c.name}
            {c.reversed && <span className="muted"> · invertida</span>}
          </p>
        </li>
      ))}
    </ol>
  );
}
