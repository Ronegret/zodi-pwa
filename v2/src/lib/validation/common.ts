import { z } from 'zod';

/** Primer mensaje de error por campo, listo para pintar junto a cada input. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.length ? issue.path.join('.') : '_form';
    out[key] ??= issue.message;
  }
  return out;
}

/** FormData → objeto plano. Las claves de `arrays` conservan todos sus valores. */
export function formToObject(
  form: FormData,
  arrays: readonly string[] = [],
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of new Set(form.keys())) {
    const values = form.getAll(key).filter((v): v is string => typeof v === 'string');
    out[key] = arrays.includes(key) ? values : values[0];
  }
  return out;
}

/** '' y null de formulario → undefined, para que "opcional" signifique opcional. */
export const emptyToUndefined = (v: unknown) => (v === '' || v === null ? undefined : v);

export const emailSchema = z
  .string({ error: 'Escribe tu correo.' })
  .trim()
  .toLowerCase()
  .min(1, 'Escribe tu correo.')
  .max(254, 'Ese correo es demasiado largo.')
  .pipe(z.email('Ese correo no tiene pinta de correo. Revisa la @ y el dominio.'));

/** Número desde input de texto o JSON; acepta coma decimal. */
export function numberInRange(min: number, max: number, message: string) {
  return z.preprocess(
    (v) => {
      if (v === '' || v === null || v === undefined) return undefined;
      return typeof v === 'string' ? Number(v.trim().replace(',', '.')) : v;
    },
    z.number({ error: message }).min(min, message).max(max, message),
  );
}
