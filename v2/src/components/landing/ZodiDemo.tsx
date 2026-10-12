import { useEffect, useState } from 'react';
import { Tabs } from '@/components/ui/Tabs';
import { TAROT_BACK, ZODI_ARCANA, type DeckCard } from '@/lib/tarot/deck';

/**
 * Demo de la portada: cómo habla ZODI según el tono, un ejemplo de oráculo y
 * una carta del Tarot ZODI. Todo es contenido de ejemplo (sin IA ni cuenta):
 * dentro, ZODI usa la carta real de cada persona.
 */
const TONES = [
  {
    id: 'suave',
    label: 'Suave',
    text: 'Hoy tu corazón pide calma, Leo. Si esa persona no responde, no es por ti: date un respiro, mira una peli y deja que las cosas lleguen a su ritmo.',
  },
  {
    id: 'directo',
    label: 'Directo',
    text: 'Leo, deja de mirar el móvil esperando ese mensaje. Si te importa, escribe tú. Si no contesta, ya tienes tu respuesta.',
  },
  {
    id: 'brutal',
    label: 'Brutal',
    text: 'Tres días esperando a que te escriba. Spoiler: no lo va a hacer. Tu Venus merece a alguien que conteste antes que tu banco.',
  },
  {
    id: 'sarcastico',
    label: 'Sarcástico',
    text: 'Venus se ha puesto en modo ahorro y tú en modo detective de "última conexión". Gran plan, Leo. Muy maduro todo.',
  },
] as const;

const QUESTIONS = [
  {
    q: '¿Le escribo o no le escribo?',
    a: 'Con la Luna pasando por tu zona de la comunicación, hoy las palabras te salen bien. Escríbele si es para decir algo claro, no para tantear. Una frase. Sin audios de cuatro minutos.',
  },
  {
    q: '¿Cambio de trabajo este año?',
    a: 'Júpiter está empujando tu zona de carrera: es buen año para moverte. Pero no saltes sin red: apunta tres sitios donde te gustaría estar y escribe a uno esta semana.',
  },
  {
    q: '¿Por qué estoy sin energía?',
    a: 'Tu biorritmo físico está en fase baja y la Luna menguante pide soltar. No es flojera: es temporada de recargar. Acuéstate antes tres noches seguidas y vuelve a preguntarme.',
  },
] as const;

const prefersReduced = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function ToneDemo() {
  const [tone, setTone] = useState<(typeof TONES)[number]['id']>('directo');
  const current = TONES.find((t) => t.id === tone)!;
  return (
    <div className="demo-tone">
      <fieldset className="demo-fieldset">
        <legend className="field-label">Elige cómo quieres que te hable</legend>
        <div className="chip-group">
          {TONES.map((t) => (
            <label key={t.id} className="chip">
              <input
                type="radio"
                name="demo-tone"
                value={t.id}
                checked={tone === t.id}
                onChange={() => setTone(t.id)}
              />
              {t.label}
            </label>
          ))}
        </div>
      </fieldset>
      <figure className="demo-bubble" aria-live="polite">
        <img src="/brand/isotipo-96.webp" alt="" width="48" height="48" />
        <blockquote>
          <p className="demo-who">ZODI · Leo · amor, hoy</p>
          <p>{current.text}</p>
        </blockquote>
      </figure>
      <p className="muted small">
        Mismo mensaje, cuatro maneras de decirlo. Tú eliges el tono (y lo cambias cuando quieras).
      </p>
    </div>
  );
}

function OracleDemo() {
  const [index, setIndex] = useState<number | null>(null);
  const [shown, setShown] = useState('');
  useEffect(() => {
    if (index === null) return;
    const full = QUESTIONS[index]!.a;
    if (prefersReduced()) {
      setShown(full);
      return;
    }
    setShown('');
    let i = 0;
    const timer = window.setInterval(() => {
      i += 3;
      setShown(full.slice(0, i));
      if (i >= full.length) window.clearInterval(timer);
    }, 18);
    return () => window.clearInterval(timer);
  }, [index]);

  return (
    <div className="demo-oracle">
      <p className="field-label" id="demo-oracle-q">
        Toca una pregunta
      </p>
      <div className="chip-group" role="group" aria-labelledby="demo-oracle-q">
        {QUESTIONS.map((item, i) => (
          <button
            key={item.q}
            type="button"
            className="chip"
            aria-pressed={index === i}
            onClick={() => setIndex(i)}
          >
            {item.q}
          </button>
        ))}
      </div>
      {index !== null && (
        <ol className="demo-chat" aria-label="Ejemplo de conversación">
          <li className="demo-me">{QUESTIONS[index]!.q}</li>
          <li className="demo-zodi">
            <img src="/brand/isotipo-96.webp" alt="" width="36" height="36" />
            <span>
              <span className="visually-hidden">ZODI: </span>
              {shown}
            </span>
          </li>
        </ol>
      )}
      <p className="visually-hidden" aria-live="polite">
        {index !== null ? `ZODI responde: ${QUESTIONS[index]!.a}` : ''}
      </p>
      <p className="muted small">
        Es un ejemplo. Dentro, el oráculo te contesta con tu carta real y el cielo de hoy.
      </p>
    </div>
  );
}

function CardDemo() {
  const [card, setCard] = useState<DeckCard | null>(null);
  const draw = () => {
    const pool = ZODI_ARCANA.filter((c) => c.name !== card?.name);
    setCard(pool[Math.floor(Math.random() * pool.length)]!);
  };
  return (
    <div className="demo-card">
      <div className="demo-card-flip" data-revealed={card ? '' : undefined} aria-hidden="true">
        <div className="demo-card-inner">
          <img className="demo-face demo-back" src={TAROT_BACK} alt="" width="480" height="720" />
          {card?.art && (
            <img className="demo-face demo-front" src={card.art} alt="" width="480" height="720" />
          )}
        </div>
      </div>
      <div className="demo-card-text">
        <p className="field-label">Arcanos ZODI</p>
        {card ? (
          <>
            <p className="demo-card-name">{card.name}</p>
            <p>{card.message}</p>
          </>
        ) : (
          <p>
            Nueve cartas propias, como La Red Flag o El Ex que Vuelve, junto a los 22 arcanos de
            siempre. Dale la vuelta a una.
          </p>
        )}
        <button type="button" className="btn btn-primary" onClick={draw}>
          <span className="btn-label">{card ? 'Otra carta' : 'Dar la vuelta'}</span>
        </button>
        <p className="visually-hidden" aria-live="polite">
          {card ? `Ha salido ${card.name}: ${card.message}` : ''}
        </p>
      </div>
    </div>
  );
}

export function ZodiDemo() {
  return (
    <Tabs
      label="Prueba ZODI"
      items={[
        { id: 'tono', label: 'Cómo te habla', content: <ToneDemo /> },
        { id: 'oraculo', label: 'Pregúntale', content: <OracleDemo /> },
        { id: 'carta', label: 'Tira una carta', content: <CardDemo /> },
      ]}
    />
  );
}
