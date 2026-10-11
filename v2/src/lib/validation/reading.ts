import { z } from 'zod';
import { FOCUS, KIND_BY_SLUG } from '@/lib/ai/kinds';
import { READING_TONES } from '@/lib/supabase/enums';
import { emptyToUndefined } from './common';
import { birthDateSchema, birthTimeSchema } from './profile';

const optionalText = (min: number, max: number, tooShort: string, tooLong: string) =>
  z.preprocess(emptyToUndefined, z.string().trim().min(min, tooShort).max(max, tooLong).optional());

export const partnerSchema = z.object({
  name: z
    .string({ error: 'Dime cómo se llama (o cómo le llamas).' })
    .trim()
    .min(1, 'Dime cómo se llama (o cómo le llamas).')
    .max(60, 'Con el nombre basta, no el apellido de sus abuelos.'),
  date: birthDateSchema,
  time: z.preprocess(emptyToUndefined, birthTimeSchema.optional()),
});

/** Petición de lectura. Cada tipo exige lo suyo (pregunta, sueño u otra persona). */
export const readingRequestSchema = z
  .object({
    slug: z.string().refine((s) => KIND_BY_SLUG.has(s), 'Esa lectura no existe (todavía).'),
    tone: z.preprocess(emptyToUndefined, z.enum(READING_TONES).optional()),
    length: z.enum(['breve', 'normal', 'extensa']).default('normal'),
    focus: z.preprocess(emptyToUndefined, z.enum(FOCUS).optional()),
    question: optionalText(
      3,
      500,
      'Hazme una pregunta de verdad (al menos unas palabras).',
      'Pregunta en menos de 500 caracteres: el tarot no lee testamentos.',
    ),
    dream: optionalText(
      10,
      1500,
      'Cuéntame un poco más del sueño.',
      'Resúmelo en menos de 1.500 caracteres.',
    ),
    partner: partnerSchema.optional(),
  })
  .superRefine((value, ctx) => {
    const def = KIND_BY_SLUG.get(value.slug);
    if (def?.input === 'question' && !value.question) {
      ctx.addIssue({
        code: 'custom',
        path: ['question'],
        message: 'Las cartas necesitan una pregunta.',
      });
    }
    if (def?.input === 'dream' && !value.dream) {
      ctx.addIssue({ code: 'custom', path: ['dream'], message: 'Cuéntame qué soñaste.' });
    }
    if (def?.input === 'partner' && !value.partner) {
      ctx.addIssue({
        code: 'custom',
        path: ['partner.name'],
        message: 'Dime con quién te comparo.',
      });
    }
  });

export type ReadingRequest = z.infer<typeof readingRequestSchema>;
