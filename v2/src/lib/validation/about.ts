/**
 * "Sobre ti": contexto opcional que la IA usa para personalizar (situación
 * sentimental, pareja, hijos y lo que cada cual cuenta de sí). Lo comparten
 * el último paso del onboarding y Ajustes. Todo se puede dejar vacío.
 */
import { z } from 'zod';

/** Mismos valores que la columna y que el contexto de la IA (context.ts). */
export const RELATIONSHIP_OPTIONS = [
  { value: 'single', label: 'Sin pareja' },
  { value: 'relationship', label: 'En pareja' },
  { value: 'married', label: 'Casado/a o pareja de hecho' },
  { value: 'complicated', label: 'Es complicado' },
  { value: 'divorced', label: 'Separado/a o divorciado/a' },
] as const;

const RELATIONSHIP_VALUES = RELATIONSHIP_OPTIONS.map((o) => o.value) as [
  (typeof RELATIONSHIP_OPTIONS)[number]['value'],
  ...(typeof RELATIONSHIP_OPTIONS)[number]['value'][],
];

/** '' de formulario → null: vaciar un campo opcional lo borra. */
const emptyToNull = (v: unknown) => (v === '' || v === undefined ? null : v);
const trimmed = (v: unknown) => (typeof v === 'string' ? v.trim() : v);

export const aboutSchema = z.object({
  relationship_status: z.preprocess(
    emptyToNull,
    z.enum(RELATIONSHIP_VALUES, 'Elige una opción de la lista.').nullable(),
  ),
  partner_name: z.preprocess(
    (v) => emptyToNull(trimmed(v)),
    z.string().max(60, 'Con el nombre basta (máximo 60 letras).').nullable(),
  ),
  has_kids: z.preprocess(
    (v) => (v === 'si' ? true : v === 'no' ? false : null),
    z.boolean().nullable(),
  ),
  kids_count: z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? null : Number(v)),
    z
      .number('Escribe un número.')
      .int('Escribe un número entero.')
      .min(0, 'Como mínimo 0.')
      .max(20, 'Como mucho 20 (y mucha paciencia).')
      .nullable(),
  ),
  personal_bio: z.preprocess(
    (v) => emptyToNull(trimmed(v)),
    z.string().max(500, 'Resúmelo en menos de 500 caracteres.').nullable(),
  ),
});

/** El paso del onboarding solo pregunta lo esencial. */
export const aboutStepSchema = aboutSchema.pick({ relationship_status: true, personal_bio: true });
