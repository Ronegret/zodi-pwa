import type { APIRoute } from 'astro';
import { fail, internal, ok, unauthorized } from '@/lib/api/http';
import { deleteComment } from '@/lib/server/community';

const UUID = /^[0-9a-f-]{36}$/i;

/** Borra un comentario propio, o uno en un post propio (moderación del autor). */
export const DELETE: APIRoute = async ({ params, locals }) => {
  const { supabase, user } = locals;
  if (!supabase || !user) return unauthorized();
  if (!UUID.test(params.id ?? '')) return fail(404, 'not_found', 'Ese comentario no existe.');
  try {
    return (await deleteComment(supabase, params.id!))
      ? ok({ deleted: true })
      : fail(404, 'not_found', 'Ese comentario no existe o no puedes borrarlo.');
  } catch (error) {
    return internal('DELETE /api/comunidad/comentarios/[id]', error);
  }
};
