import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Icon } from '@/components/ui/Icon';
import { toast } from '@/components/ui/toast';
import { errorMessage, readEvents } from '@/lib/ai/stream-client';
import { ACHIEVEMENT_BY_ID } from '@/lib/progress/achievements';
import { RichText } from './RichText';

interface Turn {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  firstName: string;
  /** Mensajes que le quedan hoy al oráculo. */
  remaining: number | null;
  /** Sol, Luna y Ascendente ("Aries"…), para enseñar con qué lee ZODI. */
  bigThree?: { sun: string; moon: string; ascendant?: string | undefined } | undefined;
  /** Tono con el que habla ("Directo"…). */
  toneLabel?: string;
  /** Pregunta que llega escrita (desde "Pregúntale a ZODI"): no se envía sola. */
  initialQuestion?: string | undefined;
}

const STORAGE_KEY = 'zodi:chat';
const SUGGESTIONS = [
  '¿Qué me depara hoy?',
  '¿Le escribo o no le escribo?',
  '¿Es buen momento para cambiar de trabajo?',
  'Explícame mi Luna en palabras sencillas',
  '¿Qué dice mi carta del amor?',
  'Dame un consejo para esta semana',
];
const FOLLOW_UPS = [
  'Cuéntame más',
  '¿Y en el amor?',
  '¿Y en el trabajo?',
  'Dame algo concreto para hoy',
];

function loadTurns(): Turn[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Turn[]) : [];
  } catch {
    return [];
  }
}

/**
 * El oráculo: chat con Zodi. La conversación vive en esta pestaña
 * (sessionStorage): al cerrar, se olvida. Los mensajes tienen su propia cuota
 * diaria (no gastan lecturas). Tras cada respuesta propone cómo seguir.
 */
export function AssistantChat({
  firstName,
  remaining: initialRemaining,
  bigThree,
  toneLabel,
  initialQuestion,
}: Props) {
  const uid = useId();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState(initialQuestion ?? '');
  const [streaming, setStreaming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(initialRemaining);
  const [announce, setAnnounce] = useState('');
  const logRef = useRef<HTMLOListElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const busy = streaming !== null;
  const outOfQuota = remaining !== null && remaining <= 0;

  useEffect(() => setTurns(loadTurns()), []);
  useEffect(() => {
    if (initialQuestion) inputRef.current?.focus();
  }, [initialQuestion]);
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(turns.slice(-30)));
    } catch {
      // Sin almacenamiento: la conversación dura lo que la página.
    }
  }, [turns]);
  useEffect(() => {
    logRef.current?.lastElementChild?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [turns, streaming]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy || outOfQuota) return;
    const next: Turn[] = [...turns, { role: 'user', content }];
    setTurns(next);
    setDraft('');
    setError(null);
    setStreaming('');
    setAnnounce('Zodi está escribiendo…');
    try {
      const res = await fetch('/api/asistente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      });
      if (!res.ok || !res.body) {
        const { message } = await errorMessage(res);
        setError(message);
        setAnnounce(message);
        setStreaming(null);
        return;
      }
      let full = '';
      let failed: string | null = null;
      await readEvents(res, (event) => {
        if (event.type === 'text') {
          full += event.text;
          setStreaming(full);
        }
        if (event.type === 'done') {
          setRemaining(event.remaining);
          for (const a of event.unlocked ?? []) {
            toast(`Logro desbloqueado: ${ACHIEVEMENT_BY_ID.get(a)?.title ?? a}. +5 gemas.`);
          }
        }
        if (event.type === 'error') failed = event.message;
      });
      if (failed) {
        setError(failed);
        setAnnounce(failed);
      } else {
        setTurns((t) => [...t, { role: 'assistant', content: full }]);
        setAnnounce(`Zodi: ${full.replace(/\*/g, '')}`);
      }
    } catch {
      const message = 'Se cortó la conexión con el más allá. Inténtalo otra vez.';
      setError(message);
      setAnnounce(message);
    } finally {
      setStreaming(null);
      inputRef.current?.focus();
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void send(draft);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send(draft);
    }
  }

  function reset() {
    setTurns([]);
    setError(null);
    inputRef.current?.focus();
  }

  return (
    <div className="chat">
      <header className="oracle-head">
        <img
          className="oracle-avatar"
          src="/art/zodi-bola-640.webp"
          alt=""
          width="640"
          height="640"
        />
        <div className="oracle-intro">
          <p className="oracle-title">ZODI tiene tu carta delante</p>
          {bigThree && (
            <ul className="oracle-pillars" aria-label="Con qué lee ZODI">
              <li className="badge badge-acid">☉ Sol en {bigThree.sun}</li>
              <li className="badge badge-violet">☽ Luna en {bigThree.moon}</li>
              {bigThree.ascendant && <li className="badge">↑ Ascendente {bigThree.ascendant}</li>}
            </ul>
          )}
          {toneLabel && (
            <p className="muted small">
              Te habla en tono <strong>{toneLabel.toLowerCase()}</strong> ·{' '}
              <a href="/app/ajustes#tono">Cambiar</a>
            </p>
          )}
        </div>
      </header>
      {turns.length === 0 && (
        <ol className="oracle-how" aria-label="Cómo funciona">
          <li>
            <strong>Pregunta lo que quieras</strong>
            <span>Amor, trabajo, una decisión, un mal día. Como a alguien que te conoce.</span>
          </li>
          <li>
            <strong>Responde con tu cielo</strong>
            <span>
              Usa tu carta real y lo que pasa hoy en el cielo, no frases de sobre de azúcar.
            </span>
          </li>
          <li>
            <strong>Se queda en esta pestaña</strong>
            <span>No guardamos la conversación: al cerrar, se borra.</span>
          </li>
        </ol>
      )}
      <ol ref={logRef} className="chat-log" aria-label="Conversación con Zodi">
        <li className="chat-msg chat-zodi">
          <img src="/brand/isotipo-96.webp" alt="" width="36" height="36" className="chat-avatar" />
          <div className="chat-bubble">
            <p>
              Oye, <strong>{firstName}</strong>. Tengo tu carta abierta y el cielo de hoy delante.
              ¿Qué te ronda la cabeza? Pregunta sin miedo.
            </p>
          </div>
        </li>
        {turns.map((t, i) => (
          <li key={i} className={`chat-msg ${t.role === 'user' ? 'chat-me' : 'chat-zodi'}`}>
            {t.role === 'assistant' && (
              <img
                src="/brand/isotipo-96.webp"
                alt=""
                width="36"
                height="36"
                className="chat-avatar"
              />
            )}
            <div className="chat-bubble">
              <span className="visually-hidden">{t.role === 'user' ? 'Tú: ' : 'Zodi: '}</span>
              <RichText text={t.content} />
            </div>
          </li>
        ))}
        {streaming !== null && (
          <li className="chat-msg chat-zodi" aria-busy="true">
            <img
              src="/brand/isotipo-96.webp"
              alt=""
              width="36"
              height="36"
              className="chat-avatar"
            />
            <div className="chat-bubble">
              {streaming ? (
                <RichText text={streaming} />
              ) : (
                <span className="chat-typing" aria-label="Zodi está escribiendo">
                  <span />
                  <span />
                  <span />
                </span>
              )}
            </div>
          </li>
        )}
      </ol>

      {!busy && (turns.length === 0 || turns.at(-1)?.role === 'assistant') && (
        <div
          className="chip-group chat-suggestions"
          role="group"
          aria-label={turns.length === 0 ? 'Ideas para empezar' : 'Seguir hablando'}
        >
          {(turns.length === 0 ? SUGGESTIONS : FOLLOW_UPS).map((s) => (
            <button
              key={s}
              type="button"
              className="chip"
              onClick={() => void send(s)}
              disabled={busy || outOfQuota}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="notice notice-error" role="alert">
          {error}
        </p>
      )}

      <form className="chat-form" onSubmit={onSubmit}>
        <label className="visually-hidden" htmlFor={`${uid}-msg`}>
          Tu mensaje para Zodi
        </label>
        <textarea
          ref={inputRef}
          id={`${uid}-msg`}
          className="input chat-input"
          rows={2}
          maxLength={1000}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={
            outOfQuota ? 'Sin mensajes por hoy. Vuelve mañana.' : 'Escribe tu pregunta para ZODI…'
          }
          disabled={outOfQuota}
        />
        <button
          type="submit"
          className="btn btn-primary btn-icon"
          aria-label="Enviar"
          disabled={busy || outOfQuota || !draft.trim()}
        >
          {busy ? <span className="spinner" aria-hidden="true" /> : <Icon name="send" />}
        </button>
      </form>
      <div className="chat-foot">
        <p className="muted small">
          {remaining === null
            ? 'Conversar con el oráculo no gasta tus lecturas.'
            : `Te quedan ${remaining} ${remaining === 1 ? 'mensaje' : 'mensajes'} hoy. No gastan tus lecturas.`}
        </p>
        {turns.length > 0 && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={reset}>
            <Icon name="trash" size={16} />
            <span className="btn-label">Empezar de cero</span>
          </button>
        )}
      </div>
      <p className="visually-hidden" role="status">
        {announce}
      </p>
    </div>
  );
}
