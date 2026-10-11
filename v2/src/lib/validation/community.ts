import { z } from 'zod';
import { REACTION_VALUES, TOPIC_VALUES } from '@/lib/community/options';

const text = (max: number, empty: string, long: string) =>
  z.string({ error: empty }).trim().min(1, empty).max(max, long);

export const postSchema = z.object({
  body: text(
    2000,
    'Escribe algo: el silencio cósmico ya lo tenemos.',
    'Máximo 2.000 caracteres. Esto es un post, no tu autobiografía.',
  ),
  topic: z.enum(TOPIC_VALUES, { error: 'Elige un tema.' }).default('general'),
});

export const commentSchema = z.object({
  body: text(1000, 'El comentario está vacío.', 'Máximo 1.000 caracteres.'),
});

export const reactionSchema = z.object({
  kind: z.enum(REACTION_VALUES, { error: 'Esa reacción no existe.' }),
});

export const reportSchema = z
  .object({
    post_id: z.uuid().optional(),
    comment_id: z.uuid().optional(),
    reason: text(300, 'Dinos qué pasa.', 'Máximo 300 caracteres.'),
  })
  .refine((r) => Boolean(r.post_id) !== Boolean(r.comment_id), 'Denuncia un post o un comentario.');

export const feedQuerySchema = z.object({
  tema: z.enum(TOPIC_VALUES).optional(),
  antes: z.iso.datetime({ offset: true }).optional(),
});
