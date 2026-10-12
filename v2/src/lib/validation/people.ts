import { z } from 'zod';
import { RELATION_IDS } from '@/lib/people/relations';
import { emptyToUndefined } from './common';
import { birthDateSchema, birthTimeSchema } from './profile';

/** Una persona de "Tu gente" (formulario de alta y edición). */
export const personSchema = z.object({
  name: z
    .string({ error: 'Escribe su nombre.' })
    .trim()
    .min(1, 'Escribe su nombre.')
    .max(60, 'Máximo 60 caracteres.'),
  relation: z.enum(RELATION_IDS as [string, ...string[]], { error: 'Elige qué es para ti.' }),
  birth_date: birthDateSchema,
  birth_time: z.preprocess(emptyToUndefined, birthTimeSchema.optional()),
});

export type PersonInput = z.infer<typeof personSchema>;
