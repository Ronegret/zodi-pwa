import type { APIRoute } from 'astro';
import { fail, internal, ok, unauthorized } from '@/lib/api/http';
import { deletePost } from '@/lib/server/community';

const UUID = /^[0-9a-f-]{36}$/i;

/** Borra un post propio (la RLS no deja borrar los ajenos). */
export const DELETE: APIRoute = async ({ params, locals }) => {
  const { supabase, user } = locals;
  if (!supabase || !user) return unauthorized();
  if (!UUID.test(params.id ?? '')) return fail(404, 'not_found', 'Ese post no existe.');
  try {
    return (await deletePost(supabase, params.id!))
      ? ok({ deleted: true })
      : fail(404, 'not_found', 'Ese post no existe o no es tuyo.');
  } catch (error) {
    return internal('DELETE /api/comunidad/[id]', error);
  }
};
