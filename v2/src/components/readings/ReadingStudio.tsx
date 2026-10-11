import { useId, useRef, useState, type FormEvent } from 'react';
import { Icon } from '@/components/ui/Icon';
import type { KindDef } from '@/lib/ai/kinds';
import {
  FOCUS,
  FOCUS_LABELS,
  LENGTHS,
  TONE_LABELS,
  type ReadingFocus,
  type ReadingLength,
  type Tone,
} from '@/lib/ai/options';
import { errorMessage, readEvents } from '@/lib/ai/stream-client';
import type { DrawnCard } from '@/lib/ai/extras';
import { RichText } from './RichText';
import { TarotSpread } from './TarotSpread';

type Phase = 'idle' | 'loading' | 'streaming' | 'done' | 'error';

interface Props {
  def: Pick<KindDef, 'slug' | 'title' | 'input' | 'cta'>;
  defaultTone: Tone;
  remaining: number | null;
  /** Una sola columna (cuando el estudio va dentro de otra columna). */
  compact?: boolean;
}

const LOADING_LINES = [
  'Consultando a los astros (y a su abogado)…',
  'Alineando planetas. Mercurio se resiste.',
  'Leyendo tu carta con las gafas de cerca…',
];

/**
 * Formulario + lectura en directo. Sin JS no hay lectura (necesita IA): el
 * formulario se pinta igualmente para que se vea qué se va a pedir.
 */
export function ReadingStudio({
  def,
  defaultTone,
  remaining: initialRemaining,
  compact = false,
}: Props) {
  const uid = useId();
  const [phase, setPhase] = useState<Phase>('idle');
  const [text, setText] = useState('');
  const [cards, setCards] = useState<DrawnCard[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [readingId, setReadingId] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(initialRemaining);
  const [status, setStatus] = useState('');
  const [copied, setCopied] = useState(false);
  const resultRef = useRef<HTMLElement>(null);
  const busy = phase === 'loading' || phase === 'streaming';
  const outOfQuota = remaining !== null && remaining <= 0;

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const form = new FormData(e.currentTarget);
    const get = (k: string) => String(form.get(k) ?? '').trim();
    const payload: Record<string, unknown> = {
      slug: def.slug,
      tone: get('tone') || undefined,
      length: get('length') || 'normal',
      focus: get('focus') || undefined,
    };
    if (def.input === 'question') payload.question = get('question');
    if (def.input === 'dream') payload.dream = get('dream');
    if (def.input === 'partner') {
      payload.partner = {
        name: get('partner_name'),
        date: get('partner_date'),
        time: get('partner_time') || undefined,
      };
    }

    setPhase('loading');
    setText('');
    setCards(null);
    setError(null);
    setFieldErrors({});
    setReadingId(null);
    setStatus('Generando tu lectura…');
    resultRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });

    try {
      const res = await fetch('/api/lecturas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok || !res.body) {
        const { message, fields } = await errorMessage(res);
        setError(message);
        setFieldErrors(fields ?? {});
        setPhase('error');
        setStatus(message);
        return;
      }
      setPhase('streaming');
      let full = '';
      await readEvents(res, (event) => {
        if (event.type === 'meta' && event.cards) setCards(event.cards);
        if (event.type === 'text') {
          full += event.text;
          setText(full);
        }
        if (event.type === 'done') {
          setReadingId(event.id);
          setRemaining(event.remaining);
          setPhase('done');
          setStatus('Lectura lista. Guardada en tu historial.');
        }
        if (event.type === 'error') {
          setError(event.message);
          setPhase('error');
          setStatus(event.message);
        }
      });
    } catch {
      const message = 'Se cortó la conexión con el más allá. Inténtalo otra vez.';
      setError(message);
      setPhase('error');
      setStatus(message);
    }
  }

  async function copy() {
    await navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const fieldError = (name: string) =>
    fieldErrors[name] ? (
      <p id={`${uid}-${name}-err`} className="field-error">
        <span className="visually-hidden">Error: </span>
        {fieldErrors[name]}
      </p>
    ) : null;
  const describedBy = (name: string) => (fieldErrors[name] ? `${uid}-${name}-err` : undefined);

  return (
    <div className={compact ? 'studio studio-compact' : 'studio'}>
      <form className="studio-form card" onSubmit={submit} noValidate aria-busy={busy}>
        {def.input === 'question' && (
          <div className="field">
            <label className="field-label" htmlFor={`${uid}-q`}>
              Tu pregunta
            </label>
            <p className="field-hint">
              Concreta. "¿Me va a ir bien?" no es una pregunta, es un deseo.
            </p>
            {fieldError('question')}
            <textarea
              id={`${uid}-q`}
              name="question"
              className="input"
              rows={3}
              maxLength={500}
              required
              aria-invalid={fieldErrors.question ? true : undefined}
              aria-describedby={describedBy('question')}
              placeholder="¿Debería aceptar el trabajo nuevo aunque me dé miedo?"
            />
          </div>
        )}
        {def.input === 'dream' && (
          <div className="field">
            <label className="field-label" htmlFor={`${uid}-d`}>
              Tu sueño
            </label>
            <p className="field-hint">
              Con detalles: dónde, quién salía, qué sentiste al despertar.
            </p>
            {fieldError('dream')}
            <textarea
              id={`${uid}-d`}
              name="dream"
              className="input"
              rows={5}
              maxLength={1500}
              required
              aria-invalid={fieldErrors.dream ? true : undefined}
              aria-describedby={describedBy('dream')}
              placeholder="Estaba en mi antiguo colegio, pero las escaleras no acababan nunca…"
            />
          </div>
        )}
        {def.input === 'partner' && (
          <fieldset className="studio-partner">
            <legend className="field-label">La otra persona</legend>
            <div className="field">
              <label className="field-label" htmlFor={`${uid}-pn`}>
                Nombre
              </label>
              {fieldError('partner.name')}
              <input
                id={`${uid}-pn`}
                name="partner_name"
                className="input"
                maxLength={60}
                required
                autoComplete="off"
                aria-invalid={fieldErrors['partner.name'] ? true : undefined}
                aria-describedby={describedBy('partner.name')}
              />
            </div>
            <div className="studio-row">
              <div className="field">
                <label className="field-label" htmlFor={`${uid}-pd`}>
                  Fecha de nacimiento
                </label>
                {fieldError('partner.date')}
                <input
                  id={`${uid}-pd`}
                  name="partner_date"
                  type="date"
                  className="input"
                  required
                  aria-invalid={fieldErrors['partner.date'] ? true : undefined}
                  aria-describedby={describedBy('partner.date')}
                />
              </div>
              <div className="field">
                <label className="field-label" htmlFor={`${uid}-pt`}>
                  Hora <span className="field-req">(si la sabes)</span>
                </label>
                {fieldError('partner.time')}
                <input
                  id={`${uid}-pt`}
                  name="partner_time"
                  type="time"
                  className="input"
                  aria-invalid={fieldErrors['partner.time'] ? true : undefined}
                  aria-describedby={describedBy('partner.time')}
                />
              </div>
            </div>
          </fieldset>
        )}

        <details className="studio-options" open={def.input === 'none'}>
          <summary>Ajustes de la lectura</summary>
          <fieldset>
            <legend className="field-label">Tono</legend>
            <div className="chip-group">
              {(Object.keys(TONE_LABELS) as Tone[]).map((t) => (
                <label key={t} className="chip">
                  <input type="radio" name="tone" value={t} defaultChecked={t === defaultTone} />
                  {TONE_LABELS[t]}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="field-label">Extensión</legend>
            <div className="chip-group">
              {(Object.keys(LENGTHS) as ReadingLength[]).map((l) => (
                <label key={l} className="chip">
                  <input type="radio" name="length" value={l} defaultChecked={l === 'normal'} />
                  {LENGTHS[l].label}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="field">
            <label className="field-label" htmlFor={`${uid}-f`}>
              Enfoque <span className="field-req">(opcional)</span>
            </label>
            <select id={`${uid}-f`} name="focus" className="select" defaultValue="">
              <option value="">De todo un poco</option>
              {FOCUS.map((f: ReadingFocus) => (
                <option key={f} value={f}>
                  {FOCUS_LABELS[f][0]!.toUpperCase() + FOCUS_LABELS[f].slice(1)}
                </option>
              ))}
            </select>
          </div>
        </details>

        <div className="studio-submit">
          <button type="submit" className="btn btn-primary btn-lg" disabled={busy || outOfQuota}>
            {busy ? <span className="spinner" aria-hidden="true" /> : <Icon name="sparkles" />}
            <span className="btn-label">{busy ? 'Leyendo…' : def.cta}</span>
          </button>
          {remaining !== null && (
            <p className="muted small">
              {outOfQuota
                ? 'Sin lecturas por hoy. Vuelve mañana o pásate a Premium.'
                : `Te quedan ${remaining} ${remaining === 1 ? 'lectura' : 'lecturas'} hoy.`}
            </p>
          )}
        </div>
      </form>

      <section ref={resultRef} className="studio-result" aria-label="Tu lectura" aria-busy={busy}>
        {cards && <TarotSpread cards={cards} />}
        {phase === 'loading' && (
          <div className="studio-loading">
            <span className="studio-orb" aria-hidden="true" />
            <p>{LOADING_LINES[Math.floor(Date.now() / 1000) % LOADING_LINES.length]}</p>
          </div>
        )}
        {text && (
          <article
            className="reading-paper"
            data-streaming={phase === 'streaming' ? '' : undefined}
          >
            <RichText text={text} />
          </article>
        )}
        {error && (
          <p className="notice notice-error" role="alert">
            {error}
          </p>
        )}
        {phase === 'done' && readingId && (
          <div className="studio-actions">
            <button type="button" className="btn btn-secondary" onClick={copy}>
              <Icon name={copied ? 'check' : 'copy'} />
              <span className="btn-label">{copied ? 'Copiada' : 'Copiar'}</span>
            </button>
            <a className="btn btn-ghost" href={`/app/lecturas/guardadas/${readingId}`}>
              <Icon name="history" />
              <span className="btn-label">Ver guardada</span>
            </a>
          </div>
        )}
        {phase === 'idle' && (
          <p className="studio-empty muted">
            Tu lectura aparecerá aquí, escrita en directo para ti.
          </p>
        )}
      </section>
      <p className="visually-hidden" role="status">
        {status}
      </p>
    </div>
  );
}
