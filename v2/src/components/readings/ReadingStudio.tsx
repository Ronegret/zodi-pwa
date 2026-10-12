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
import { INTENTS, INTENT_IDS } from '@/lib/divination/crystals';
import { nameNumbers } from '@/lib/divination/name';
import { PALM_FIELDS, PALM_FIELD_IDS } from '@/lib/divination/palm';
import type { ReadingVisuals } from '@/lib/server/readings';
import { SPREADS } from '@/lib/tarot/deck';
import { toast } from '@/components/ui/toast';
import { ACHIEVEMENT_BY_ID } from '@/lib/progress/achievements';
import { FavoriteButton } from './FavoriteButton';
import { RichText } from './RichText';
import { CrystalCard, MayaCard, NameNumbersCard, RuneCast } from './ReadingVisuals';
import { TarotSpread } from './TarotSpread';

type Phase = 'idle' | 'loading' | 'streaming' | 'done' | 'error';

interface Props {
  def: Pick<KindDef, 'slug' | 'title' | 'input' | 'cta' | 'spreads' | 'art'>;
  defaultTone: Tone;
  /** Para rellenar la lectura del nombre (display_name del perfil). */
  defaultName?: string;
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
  defaultName = '',
  remaining: initialRemaining,
  compact = false,
}: Props) {
  const uid = useId();
  const [phase, setPhase] = useState<Phase>('idle');
  const [text, setText] = useState('');
  const [visuals, setVisuals] = useState<ReadingVisuals | null>(null);
  const [nameParts, setNameParts] = useState(() => {
    const [first = '', last1 = '', ...rest] = defaultName.trim().split(/\s+/);
    return { first, last1, last2: rest.join(' ') };
  });
  const preview = def.input === 'name' ? nameNumbers(nameParts) : null;
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [readingId, setReadingId] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(initialRemaining);
  const [status, setStatus] = useState('');
  const [copied, setCopied] = useState(false);
  const resultRef = useRef<HTMLElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  // Si la lectura ya estaba guardada (no gasta), se puede pedir otra a propósito.
  const forceNew = useRef(false);
  const [reused, setReused] = useState(false);
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
    if (forceNew.current) {
      payload.nueva = true;
      forceNew.current = false;
    }
    const optional = (k: string) => get(k) || undefined;
    if (def.input === 'question') {
      payload.question = get('question');
      if (def.spreads) payload.spread = get('spread') || def.spreads[0];
    }
    if (def.input === 'dream') payload.dream = get('dream');
    if (def.input === 'runes') {
      payload.runes = Number(get('runes') || 3);
      payload.question = optional('question');
    }
    if (def.input === 'crystal') {
      payload.intent = optional('intent');
      payload.question = optional('question');
    }
    if (def.input === 'name') {
      payload.name = {
        first: get('name_first'),
        last1: optional('name_last1'),
        last2: optional('name_last2'),
      };
    }
    if (def.input === 'palm') {
      payload.palm = Object.fromEntries(PALM_FIELD_IDS.map((f) => [f, optional(`palm_${f}`)]));
      payload.notes = optional('notes');
    }
    if (def.input === 'partner') {
      payload.partner = {
        name: get('partner_name'),
        date: get('partner_date'),
        time: get('partner_time') || undefined,
      };
    }

    setPhase('loading');
    setText('');
    setVisuals(null);
    setError(null);
    setFieldErrors({});
    setReadingId(null);
    setReused(false);
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
        if (event.type === 'meta') setVisuals(event);
        if (event.type === 'text') {
          full += event.text;
          setText(full);
        }
        if (event.type === 'done') {
          setReadingId(event.id);
          setRemaining(event.remaining);
          setPhase('done');
          setReused(Boolean(event.reused));
          setStatus(
            event.reused
              ? 'Ya la tenías: te la enseño sin gastar lectura.'
              : 'Lectura lista. Guardada en tu historial.',
          );
          for (const a of event.unlocked ?? []) {
            toast(`Logro desbloqueado: ${ACHIEVEMENT_BY_ID.get(a)?.title ?? a}. +5 gemas.`);
          }
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
      <form
        ref={formRef}
        className="studio-form card"
        onSubmit={submit}
        noValidate
        aria-busy={busy}
      >
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

        {def.spreads && def.spreads.length > 1 && (
          <fieldset>
            <legend className="field-label">Tirada</legend>
            <div className="choice-grid">
              {def.spreads.map((id, i) => (
                <label key={id} className="choice">
                  <input type="radio" name="spread" value={id} defaultChecked={i === 0} />
                  <span className="choice-title">{SPREADS[id].label}</span>
                  <small>{SPREADS[id].hint}</small>
                </label>
              ))}
            </div>
          </fieldset>
        )}
        {def.input === 'runes' && (
          <>
            <fieldset>
              <legend className="field-label">¿Cuántas runas?</legend>
              <div className="chip-group">
                <label className="chip">
                  <input type="radio" name="runes" value="1" />
                  Una runa
                </label>
                <label className="chip">
                  <input type="radio" name="runes" value="3" defaultChecked />
                  Tres runas
                </label>
              </div>
            </fieldset>
            <div className="field">
              <label className="field-label" htmlFor={`${uid}-rq`}>
                Tu pregunta <span className="field-req">(opcional)</span>
              </label>
              {fieldError('question')}
              <textarea
                id={`${uid}-rq`}
                name="question"
                className="input"
                rows={2}
                maxLength={500}
                aria-invalid={fieldErrors.question ? true : undefined}
                aria-describedby={describedBy('question')}
                placeholder="¿Le digo lo que siento o me callo?"
              />
            </div>
          </>
        )}
        {def.input === 'crystal' && (
          <>
            <fieldset aria-describedby={describedBy('intent')}>
              <legend className="field-label">Tu intención</legend>
              {fieldError('intent')}
              <div className="chip-group">
                {INTENT_IDS.map((id) => (
                  <label key={id} className="chip">
                    <input type="radio" name="intent" value={id} required />
                    {INTENTS[id]}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="field">
              <label className="field-label" htmlFor={`${uid}-cq`}>
                ¿Qué te ronda? <span className="field-req">(opcional)</span>
              </label>
              {fieldError('question')}
              <textarea
                id={`${uid}-cq`}
                name="question"
                className="input"
                rows={2}
                maxLength={500}
                aria-invalid={fieldErrors.question ? true : undefined}
                aria-describedby={describedBy('question')}
                placeholder="Mañana tengo la entrevista y no duermo."
              />
            </div>
          </>
        )}
        {def.input === 'name' && (
          <fieldset className="studio-partner">
            <legend className="field-label">Tu nombre completo</legend>
            {(
              [
                ['first', 'Nombre', true],
                ['last1', 'Primer apellido', false],
                ['last2', 'Segundo apellido', false],
              ] as const
            ).map(([key, label, required]) => (
              <div className="field" key={key}>
                <label className="field-label" htmlFor={`${uid}-n-${key}`}>
                  {label} {!required && <span className="field-req">(opcional)</span>}
                </label>
                {fieldError(`name.${key}`)}
                <input
                  id={`${uid}-n-${key}`}
                  name={`name_${key}`}
                  className="input"
                  maxLength={60}
                  required={required}
                  autoComplete={key === 'first' ? 'given-name' : 'family-name'}
                  value={nameParts[key]}
                  onChange={(e) => setNameParts((p) => ({ ...p, [key]: e.target.value }))}
                  aria-invalid={fieldErrors[`name.${key}`] ? true : undefined}
                  aria-describedby={describedBy(`name.${key}`)}
                />
              </div>
            ))}
            {preview && (
              <p className="name-preview" aria-live="polite">
                {preview.parts.map((p) => (
                  <span key={p.label} className="badge badge-violet">
                    {p.text} → {p.value}
                  </span>
                ))}
                <span className="badge badge-acid">Vibración total: {preview.expression}</span>
              </p>
            )}
          </fieldset>
        )}
        {def.input === 'palm' && (
          <>
            <p className="field-hint">
              Mira tu mano dominante (con la que escribes) con buena luz y elige lo que más se
              parezca. No hay respuestas malas: hay manos.
            </p>
            {PALM_FIELD_IDS.map((f) => (
              <fieldset key={f} aria-describedby={describedBy(`palm.${f}`)}>
                <legend className="field-label">{PALM_FIELDS[f].label}</legend>
                <p className="field-hint">{PALM_FIELDS[f].hint}</p>
                {fieldError(`palm.${f}`)}
                <div className="chip-group">
                  {Object.entries(PALM_FIELDS[f].options).map(([value, label]) => (
                    <label key={value} className="chip">
                      <input type="radio" name={`palm_${f}`} value={value} required />
                      {label}
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
            <div className="field">
              <label className="field-label" htmlFor={`${uid}-pn2`}>
                Algo más que veas <span className="field-req">(opcional)</span>
              </label>
              {fieldError('notes')}
              <textarea
                id={`${uid}-pn2`}
                name="notes"
                className="input"
                rows={2}
                maxLength={500}
                aria-invalid={fieldErrors.notes ? true : undefined}
                aria-describedby={describedBy('notes')}
                placeholder="Una estrella bajo el dedo anular, una línea que se parte en dos…"
              />
            </div>
          </>
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
        {visuals?.cards && <TarotSpread cards={visuals.cards} />}
        {visuals?.runes && <RuneCast runes={visuals.runes} />}
        {visuals?.crystal && <CrystalCard crystal={visuals.crystal} />}
        {visuals?.maya && <MayaCard maya={visuals.maya} />}
        {visuals?.numbers && <NameNumbersCard numbers={visuals.numbers} />}
        {phase === 'loading' && (
          <div className="studio-loading">
            <img
              className="studio-zodi"
              src={
                def.input === 'question'
                  ? '/art/zodi-lanzando-cartas-640.webp'
                  : '/art/zodi-bola-640.webp'
              }
              alt=""
              width="640"
              height="640"
            />
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
        {phase === 'done' && reused && (
          <p className="notice reused-note">
            Ya la tenías de hace poco: te la enseño sin gastar lectura.{' '}
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={outOfQuota}
              onClick={() => {
                forceNew.current = true;
                formRef.current?.requestSubmit();
              }}
            >
              <Icon name="rotate" />
              <span className="btn-label">Hacer una nueva</span>
            </button>
          </p>
        )}
        {phase === 'done' && readingId && (
          <div className="studio-actions">
            <button type="button" className="btn btn-secondary" onClick={copy}>
              <Icon name={copied ? 'check' : 'copy'} />
              <span className="btn-label">{copied ? 'Copiada' : 'Copiar'}</span>
            </button>
            <FavoriteButton id={readingId} />
            <a className="btn btn-ghost" href={`/app/lecturas/guardadas/${readingId}`}>
              <Icon name="history" />
              <span className="btn-label">Ver guardada</span>
            </a>
          </div>
        )}
        {phase === 'idle' && (
          <figure className="studio-empty">
            <img
              src={def.art}
              alt="ZODI, listo para tu lectura"
              width="640"
              height="640"
              loading="lazy"
              decoding="async"
            />
            <figcaption>
              ZODI ya tiene la bola de cristal encendida. Tu lectura aparecerá aquí, escrita en
              directo para ti.
            </figcaption>
          </figure>
        )}
      </section>
      <p className="visually-hidden" role="status">
        {status}
      </p>
    </div>
  );
}
