import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import type { Place } from '@/lib/geo/places';

interface Props {
  initial?: Place | null;
  initialQuery?: string;
  error?: string | undefined;
}

type Status = 'idle' | 'loading' | 'done' | 'error';

/**
 * Buscador de ciudad (combobox ARIA 1.2 con lista). Al elegir rellena los
 * campos ocultos birth_place / birth_lat / birth_lon / time_zone. Sin JS el
 * input se envía como `city_query` y el servidor ofrece la lista como radios.
 */
export function CityCombobox({ initial = null, initialQuery = '', error }: Props) {
  const [query, setQuery] = useState(initial?.label ?? initialQuery);
  const [selected, setSelected] = useState<Place | null>(initial);
  const [results, setResults] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [status, setStatus] = useState<Status>('idle');
  const abort = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const uid = useId();
  const ids = {
    input: 'f-city_query',
    list: `${uid}-list`,
    hint: 'f-city_query-hint',
    error: 'f-city_query-error',
    status: `${uid}-status`,
  };

  // Si se escribió antes de hidratar (red lenta), React no lo sabe: se recoge.
  useEffect(() => {
    const typed = inputRef.current?.value ?? '';
    if (typed !== query) {
      setQuery(typed);
      setSelected(null);
    }
    // Solo al montar.
  }, []);

  useEffect(() => {
    if (selected || query.trim().length < 2) {
      setResults([]);
      setStatus('idle');
      return;
    }
    const timer = window.setTimeout(async () => {
      abort.current?.abort();
      const controller = new AbortController();
      abort.current = controller;
      setStatus('loading');
      try {
        const res = await fetch(`/api/geocodificar?q=${encodeURIComponent(query.trim())}`, {
          signal: controller.signal,
          headers: { accept: 'application/json' },
        });
        if (!res.ok) throw new Error(String(res.status));
        const body = (await res.json()) as { data: Place[] };
        setResults(body.data);
        setActive(body.data.length ? 0 : -1);
        setOpen(true);
        setStatus('done');
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setStatus('error');
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query, selected]);

  const choose = (place: Place) => {
    setSelected(place);
    setQuery(place.label);
    setOpen(false);
    setActive(-1);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!open && results.length) setOpen(true);
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === 'Enter' && open && active >= 0 && results[active]) {
      event.preventDefault();
      choose(results[active]);
    } else if (event.key === 'Escape' && open) {
      event.preventDefault();
      setOpen(false);
    }
  };

  const statusText =
    status === 'loading'
      ? 'Buscando…'
      : status === 'error'
        ? 'El buscador no responde. Prueba otra vez en un momento.'
        : status === 'done'
          ? results.length
            ? `${results.length} ${results.length === 1 ? 'resultado' : 'resultados'}. Usa las flechas para elegir y Enter para confirmar.`
            : 'Ni rastro de ese sitio. Revisa cómo lo has escrito.'
          : selected
            ? `Elegido: ${selected.label}.`
            : '';

  const describedBy = [ids.hint, error ? ids.error : undefined, ids.status]
    .filter(Boolean)
    .join(' ');
  const expanded = open && results.length > 0;

  return (
    <div className="field combobox">
      <label className="field-label" htmlFor={ids.input}>
        Ciudad de nacimiento <span className="field-req">(obligatorio)</span>
      </label>
      <p id={ids.hint} className="field-hint">
        Escribe y elige de la lista. Con la zona horaria del lugar calculamos la hora exacta.
      </p>
      <p id={ids.error} className="field-error" data-error-for="city_query" hidden={!error}>
        {error && (
          <>
            <span className="visually-hidden">Error: </span>
            {error}
          </>
        )}
      </p>
      <input
        ref={inputRef}
        id={ids.input}
        name="city_query"
        className="input"
        type="text"
        role="combobox"
        autoComplete="off"
        spellCheck={false}
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={ids.list}
        aria-activedescendant={expanded && active >= 0 ? `${ids.list}-${active}` : undefined}
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        aria-required="true"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setSelected(null);
        }}
        onKeyDown={onKeyDown}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        onFocus={() => results.length && !selected && setOpen(true)}
      />
      <ul
        id={ids.list}
        role="listbox"
        aria-label="Ciudades encontradas"
        className="listbox"
        hidden={!expanded}
      >
        {results.map((place, i) => (
          <li
            key={place.id}
            id={`${ids.list}-${i}`}
            role="option"
            aria-selected={i === active}
            className="option"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => choose(place)}
            onMouseEnter={() => setActive(i)}
          >
            <span>{place.name}</span>
            <small>
              {place.label} · {place.timeZone}
            </small>
          </li>
        ))}
      </ul>
      <p id={ids.status} className="field-hint" role="status">
        {statusText}
      </p>
      <input type="hidden" name="birth_place" value={selected?.label ?? ''} />
      <input type="hidden" name="birth_lat" value={selected?.latitude ?? ''} />
      <input type="hidden" name="birth_lon" value={selected?.longitude ?? ''} />
      <input type="hidden" name="time_zone" value={selected?.timeZone ?? ''} />
    </div>
  );
}
