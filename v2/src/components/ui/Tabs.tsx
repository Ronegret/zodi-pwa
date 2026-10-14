import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
}

/**
 * Pestañas (patrón APG): tabindex itinerante, flechas/Inicio/Fin y
 * activación automática. Los paneles ocultos usan `hidden`.
 */
export function Tabs({ items, label }: { items: TabItem[]; label: string }) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const base = useId();

  const focusTab = (index: number) => {
    const next = (index + items.length) % items.length;
    setActive(next);
    refs.current[next]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const keys: Record<string, () => void> = {
      ArrowRight: () => focusTab(active + 1),
      ArrowLeft: () => focusTab(active - 1),
      Home: () => focusTab(0),
      End: () => focusTab(items.length - 1),
    };
    const handler = keys[event.key];
    if (handler) {
      event.preventDefault();
      handler();
    }
  };

  return (
    <div>
      <div className="tabs-list" role="tablist" aria-label={label}>
        {items.map((item, i) => (
          <button
            key={item.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            id={`${base}-tab-${item.id}`}
            className="tab"
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-controls={`${base}-panel-${item.id}`}
            tabIndex={i === active ? 0 : -1}
            onClick={() => setActive(i)}
            onKeyDown={onKeyDown}
          >
            {item.label}
          </button>
        ))}
      </div>
      {items.map((item, i) => (
        <div
          key={item.id}
          id={`${base}-panel-${item.id}`}
          className="tab-panel"
          role="tabpanel"
          aria-labelledby={`${base}-tab-${item.id}`}
          tabIndex={0}
          hidden={i !== active}
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
