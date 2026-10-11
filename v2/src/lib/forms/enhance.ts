/**
 * Validación en cliente con los mismos esquemas Zod que el servidor. Pinta
 * el mismo marcado (Field.astro + ErrorSummary.astro), mueve el foco al
 * resumen y no envía. El servidor vuelve a validar siempre.
 */
import type { z } from 'zod';
import { fieldErrors, formToObject } from '@/lib/validation/common';

interface Options {
  arrays?: readonly string[];
  /** Renombra claves de error (p. ej. birth_lat → city_query). */
  alias?: Record<string, string>;
}

export function enhanceForm(
  form: HTMLFormElement | null,
  schema: z.ZodType,
  options: Options = {},
) {
  if (!form) return;
  form.noValidate = true;

  form.addEventListener('submit', (event) => {
    const result = schema.safeParse(formToObject(new FormData(form), options.arrays));
    if (result.success) {
      const submit = form.querySelector<HTMLButtonElement>(
        'button[type="submit"]:not([formaction])',
      );
      submit?.setAttribute('aria-busy', 'true');
      return;
    }
    event.preventDefault();
    const raw = fieldErrors(result.error);
    const errors: Record<string, string> = {};
    for (const [key, message] of Object.entries(raw)) {
      const target = options.alias?.[key] ?? key;
      errors[target] ??= message;
    }
    render(form, errors);
  });

  // Al corregir un campo desaparece su error.
  form.addEventListener('input', (event) => {
    const el = event.target as HTMLInputElement;
    if (el.name) setFieldError(form, options.alias?.[el.name] ?? el.name, undefined);
  });
}

function setFieldError(form: HTMLFormElement, name: string, message: string | undefined) {
  const slot = form.querySelector<HTMLElement>(`[data-error-for="${CSS.escape(name)}"]`);
  const control = form.querySelector<HTMLElement>(`#f-${CSS.escape(name)}`);
  if (slot) {
    slot.replaceChildren();
    if (message) {
      const prefix = document.createElement('span');
      prefix.className = 'visually-hidden';
      prefix.textContent = 'Error: ';
      slot.append(prefix, message);
    }
    slot.hidden = !message;
  }
  if (control) {
    const ids = (control.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
    const errorId = slot?.id;
    const next = ids.filter((id) => id !== errorId);
    if (message && errorId) next.push(errorId);
    if (next.length) control.setAttribute('aria-describedby', next.join(' '));
    else control.removeAttribute('aria-describedby');
    if (message) control.setAttribute('aria-invalid', 'true');
    else control.removeAttribute('aria-invalid');
  }
}

function render(form: HTMLFormElement, errors: Record<string, string>) {
  form.querySelectorAll<HTMLElement>('[data-error-for]').forEach((slot) => {
    setFieldError(form, slot.dataset.errorFor!, errors[slot.dataset.errorFor!]);
  });

  const root = document.querySelector<HTMLElement>('[data-error-summary-root]');
  if (!root) return;
  const { _form: formError, ...fields } = errors;
  const entries = Object.entries(fields);
  const box = document.createElement('div');
  box.className = 'error-summary';
  box.tabIndex = -1;
  box.dataset.errorSummary = '';
  box.setAttribute('aria-labelledby', 'error-summary-title');
  const title = document.createElement('h2');
  title.id = 'error-summary-title';
  title.textContent =
    entries.length === 0
      ? 'No ha funcionado'
      : entries.length === 1
        ? 'Hay 1 cosa que corregir'
        : `Hay ${entries.length} cosas que corregir`;
  box.append(title);
  if (formError) {
    const p = document.createElement('p');
    p.textContent = formError;
    box.append(p);
  }
  if (entries.length) {
    const ul = document.createElement('ul');
    for (const [name, message] of entries) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = `#f-${name}`;
      a.textContent = message;
      li.append(a);
      ul.append(li);
    }
    box.append(ul);
  }
  root.replaceChildren(box);
  box.focus();
}
