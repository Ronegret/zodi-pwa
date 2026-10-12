import { z } from 'zod';
import { FOCUS, KIND_BY_SLUG } from '@/lib/ai/kinds';
import { INTENT_IDS } from '@/lib/divination/crystals';
import { PALM_FIELDS } from '@/lib/divination/palm';
import { READING_TONES } from '@/lib/supabase/enums';
import { SPREAD_IDS } from '@/lib/tarot/deck';
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

const namePart = (max: number, tooLong: string) =>
  z.preprocess(emptyToUndefined, z.string().trim().max(max, tooLong).optional());

export const nameSchema = z.object({
  first: z
    .string({ error: 'Dime tu nombre.' })
    .trim()
    .min(1, 'Dime tu nombre.')
    .max(60, 'Con el nombre de pila basta (máximo 60 letras).'),
  last1: namePart(60, 'Ese apellido es más largo que una lista de exes (máximo 60).'),
  last2: namePart(60, 'Ese apellido es más largo que una lista de exes (máximo 60).'),
});

const palmOption = <T extends Record<string, string>>(options: T, message: string) =>
  z.enum(Object.keys(options) as [keyof T & string, ...(keyof T & string)[]], { error: message });

export const palmSchema = z.object({
  shape: palmOption(PALM_FIELDS.shape.options, 'Elige la forma de tu mano.'),
  life: palmOption(PALM_FIELDS.life.options, 'Elige cómo es tu línea de la vida.'),
  heart: palmOption(PALM_FIELDS.heart.options, 'Elige cómo es tu línea del corazón.'),
  head: palmOption(PALM_FIELDS.head.options, 'Elige cómo es tu línea de la cabeza.'),
  fate: palmOption(PALM_FIELDS.fate.options, 'Elige cómo es tu línea del destino.'),
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
    spread: z.preprocess(emptyToUndefined, z.enum(SPREAD_IDS).optional()),
    runes: z.preprocess(
      (v) => (v === '' || v === undefined ? undefined : Number(v)),
      z.union([z.literal(1), z.literal(3)]).optional(),
    ),
    intent: z.preprocess(
      emptyToUndefined,
      z.enum(INTENT_IDS, { error: 'Elige una intención.' }).optional(),
    ),
    name: nameSchema.optional(),
    palm: palmSchema.optional(),
    notes: optionalText(
      3,
      500,
      'Cuéntame algo más (unas palabras).',
      'Resúmelo en menos de 500 caracteres.',
    ),
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
    if (def?.spreads && value.spread && !def.spreads.includes(value.spread)) {
      ctx.addIssue({
        code: 'custom',
        path: ['spread'],
        message: 'Esa tirada no va con esta lectura.',
      });
    }
    if (def?.input === 'crystal' && !value.intent) {
      ctx.addIssue({ code: 'custom', path: ['intent'], message: 'Elige una intención.' });
    }
    if (def?.input === 'name' && !value.name) {
      ctx.addIssue({ code: 'custom', path: ['name.first'], message: 'Dime tu nombre.' });
    }
    if (def?.input === 'palm' && !value.palm) {
      ctx.addIssue({ code: 'custom', path: ['palm.shape'], message: 'Elige la forma de tu mano.' });
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
