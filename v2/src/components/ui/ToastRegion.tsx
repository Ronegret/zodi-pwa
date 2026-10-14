import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';
import { DURATION, reducedMotion } from '@/lib/motion';
import { drainToastQueue, TOAST_EVENT, type ToastDetail } from './toast';

interface Item extends ToastDetail {
  id: number;
  leaving?: boolean;
}

const TOAST_MS = 6000;

/**
 * Región de avisos. Existe desde el HTML inicial (aria-live necesita estar
 * en el DOM antes del mensaje). Cada aviso dura 6 s, se pausa con hover o
 * foco y tiene botón de cerrar.
 */
export function ToastRegion({ initial }: { initial?: ToastDetail | undefined }) {
  const [items, setItems] = useState<Item[]>([]);
  const timers = useRef(new Map<number, number>());
  const nextId = useRef(1);

  // Sale con animación (zodi-toast-out) y luego se retira del DOM.
  const dismiss = useCallback((id: number) => {
    window.clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setItems((list) => list.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    window.setTimeout(
      () => setItems((list) => list.filter((t) => t.id !== id)),
      reducedMotion() ? 0 : DURATION.fast,
    );
  }, []);

  const schedule = useCallback(
    (id: number) => {
      timers.current.set(
        id,
        window.setTimeout(() => dismiss(id), TOAST_MS),
      );
    },
    [dismiss],
  );

  const push = useCallback(
    (detail: ToastDetail) => {
      const id = nextId.current++;
      setItems((list) => [...list.slice(-2), { ...detail, id }]);
      schedule(id);
    },
    [schedule],
  );

  useEffect(() => {
    const onToast = (event: Event) => push((event as CustomEvent<ToastDetail>).detail);
    window.addEventListener(TOAST_EVENT, onToast);
    // Aviso que llega del servidor (p. ej. tras guardar un formulario).
    if (initial) push(initial);
    drainToastQueue().forEach(push);
    const map = timers.current;
    return () => {
      window.removeEventListener(TOAST_EVENT, onToast);
      map.forEach((t) => window.clearTimeout(t));
    };
  }, [initial, push]);

  return (
    <div className="toast-region" role="status" aria-live="polite" aria-atomic="false">
      {items.map((item) => (
        <div
          key={item.id}
          className={[
            'toast',
            item.tone === 'error' && 'toast-error',
            item.leaving && 'toast-leaving',
          ]
            .filter(Boolean)
            .join(' ')}
          onMouseEnter={() => window.clearTimeout(timers.current.get(item.id))}
          onMouseLeave={() => schedule(item.id)}
          onFocus={() => window.clearTimeout(timers.current.get(item.id))}
          onBlur={() => schedule(item.id)}
        >
          <span>{item.message}</span>
          <button
            type="button"
            className="btn btn-ghost btn-icon btn-sm"
            aria-label="Cerrar aviso"
            onClick={() => dismiss(item.id)}
          >
            <Icon name="x" size={18} />
          </button>
        </div>
      ))}
    </div>
  );
}
