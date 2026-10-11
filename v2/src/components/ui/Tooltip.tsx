import { cloneElement, useEffect, useId, useState, type ReactElement } from 'react';

/**
 * Tooltip accesible (WCAG 1.4.13): aparece con hover o foco, se puede
 * recorrer con el puntero sin que desaparezca y se cierra con Esc. El texto
 * describe al disparador (un único elemento enfocable) vía aria-describedby.
 */
export function Tooltip({
  text,
  children,
}: {
  text: string;
  children: ReactElement<{ 'aria-describedby'?: string }>;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <span
      className="tooltip-wrap"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {cloneElement(children, { 'aria-describedby': id })}
      <span id={id} role="tooltip" className="tooltip" hidden={!open}>
        {text}
      </span>
    </span>
  );
}
