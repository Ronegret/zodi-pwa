import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { Button } from './Button';
import { Icon } from './Icon';

interface Props {
  triggerLabel: string;
  title: string;
  children: ReactNode;
  confirmLabel?: string;
  onConfirm?: () => void;
  triggerVariant?: 'primary' | 'secondary' | 'ghost' | 'violet';
}

/**
 * Diálogo modal sobre <dialog> nativo: showModal() atrapa el foco, vuelve
 * inerte el resto de la página y cierra con Esc. Al cerrar, el foco vuelve
 * al botón que lo abrió.
 */
export function Dialog({
  triggerLabel,
  title,
  children,
  confirmLabel,
  onConfirm,
  triggerVariant = 'secondary',
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  const close = () => dialogRef.current?.close();

  // showModal() vuelve inerte la página, pero el Tab tras el último control
  // saldría a la barra del navegador: aquí se cierra el ciclo dentro.
  const trapTab = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key !== 'Tab' || !dialogRef.current) return;
    const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <>
      <Button
        ref={triggerRef}
        variant={triggerVariant}
        aria-haspopup="dialog"
        onClick={() => dialogRef.current?.showModal()}
      >
        {triggerLabel}
      </Button>
      <dialog
        ref={dialogRef}
        className="dialog"
        aria-labelledby={titleId}
        onClose={() => triggerRef.current?.focus()}
        onKeyDown={trapTab}
        onClick={(event) => {
          // Clic en el fondo (fuera del contenido) cierra.
          if (event.target === dialogRef.current) close();
        }}
      >
        <div className="dialog-inner">
          <div className="dialog-header">
            <h2 id={titleId}>{title}</h2>
            <button
              type="button"
              className="btn btn-ghost btn-icon"
              aria-label="Cerrar"
              onClick={close}
            >
              <Icon name="x" />
            </button>
          </div>
          <div>{children}</div>
          <div className="dialog-actions">
            <Button variant="secondary" onClick={close}>
              Cancelar
            </Button>
            {confirmLabel && (
              <Button
                onClick={() => {
                  onConfirm?.();
                  close();
                }}
              >
                {confirmLabel}
              </Button>
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}
