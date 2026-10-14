import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { splitReading } from '@/lib/readings/cards';
import { RichText, inline } from './RichText';

/**
 * Lectura repartida en tarjetas: frase resumen grande, un bloque por tema y la
 * acción del día. Si el texto no trae esa estructura (lecturas antiguas, chat)
 * se muestra como texto corrido. Sin estilos en línea (CSP): el movimiento
 * escalonado vive en readings.css.
 */
export function ReadingCards({ text }: { text: string }) {
  const cards = splitReading(text);
  const [done, setDone] = useState(false);

  if (!cards.structured) return <RichText text={text} />;

  return (
    <div className="rcards">
      {cards.summary && <p className="rcards-summary">{inline(cards.summary)}</p>}
      {cards.sections.length > 0 && (
        <div className="rcards-grid">
          {cards.sections.map((s, i) => (
            <section className="rcard" key={i}>
              <h3 className="rcard-title">
                <Icon name={s.icon} size={18} />
                {s.title}
              </h3>
              {s.body.map((p, j) => (
                <p key={j}>{inline(p)}</p>
              ))}
            </section>
          ))}
        </div>
      )}
      {cards.action && (
        <div className="rcards-action" data-done={done ? '' : undefined}>
          <p className="rcards-action-label">{cards.action.label}</p>
          <p className="rcards-action-text">{inline(cards.action.text)}</p>
          {cards.action.text && (
            <button
              type="button"
              className="rcards-action-btn"
              aria-pressed={done}
              onClick={() => setDone((d) => !d)}
            >
              <Icon name="check" size={16} />
              {done ? 'Hecho. Qué disciplina.' : 'Lo haré'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
