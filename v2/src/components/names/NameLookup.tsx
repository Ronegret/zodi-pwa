import { useEffect, useState } from 'react';

interface Entry {
  origin: string;
  meaning: string;
  note?: string;
}
type Result =
  | { status: 'ok'; entry: Entry; source: 'zodi' | 'ia' }
  | { status: 'unknown' | 'limit' | 'unavailable' };

interface Props {
  word: string;
  kind: 'nombre' | 'apellido';
}

const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/**
 * Un nombre o apellido que ZODI no trae de serie: lo investiga la IA (una
 * sola vez para todo el mundo) y aparece aquí.
 */
export function NameLookup({ word, kind }: Props) {
  const [result, setResult] = useState<Result | 'loading' | 'error'>('loading');

  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`/api/nombre?palabra=${encodeURIComponent(word)}&tipo=${kind}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? (r.json() as Promise<{ data: Result }>) : Promise.reject(new Error())))
      .then((body) => setResult(body.data))
      .catch((e: unknown) => {
        if (!(e instanceof DOMException && e.name === 'AbortError')) setResult('error');
      });
    return () => ctrl.abort();
  }, [word, kind]);

  if (result === 'loading') {
    return (
      <p className="name-loading" aria-live="polite">
        <span className="name-spark" aria-hidden="true">
          ✦
        </span>{' '}
        ZODI está investigando la historia de «{word}»…
      </p>
    );
  }
  if (result === 'error' || result.status !== 'ok') {
    const msg =
      result !== 'error' && result.status === 'limit'
        ? 'Hoy ya has investigado muchos nombres: vuelve mañana y sigo.'
        : 'No encuentro su historia en mis archivos. Pregúntamela en el oráculo y lo hablamos.';
    return (
      <p className="muted" aria-live="polite">
        {msg}
      </p>
    );
  }
  return (
    <div aria-live="polite">
      <p>
        <span className="muted">{result.entry.origin} · </span>
        {cap(result.entry.meaning)}.
      </p>
      {result.entry.note && <p className="muted">{result.entry.note}</p>}
      {result.source === 'ia' && <p className="name-new">✦ Investigado por ZODI</p>}
    </div>
  );
}
