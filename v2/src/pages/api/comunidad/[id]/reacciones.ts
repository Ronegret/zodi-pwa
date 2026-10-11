import type { APIRoute } from 'astro';
import { fail, internal, ok, readJson, unauthorized } from '@/lib/api/http';
import { setReaction } from '@/lib/server/community';
import { reactionSchema } from '@/lib/validation/community';

const UUID = /^[0-9a-f-]{36}$/i;

/** POST añade la reacción; DELETE la quita. Idempotentes. */
function handler(on: boolean): APIRoute {
  return async ({ params, request, locals }) => {
    const { supabase, user } = locals;
    if (!supabase || !user) return unauthorized();
    if (!UUID.test(params.id ?? '')) return fail(404, 'not_found', 'Ese post no existe.');
    const body = await readJson(request, reactionSchema);
    if (!body.ok) return body.response;
    try {
      await setReaction(supabase, params.id!, user.id, body.data.kind, on);
      return ok({ kind: body.data.kind, on });
    } catch (error) {
      return internal(`${on ? 'POST' : 'DELETE'} /api/comunidad/[id]/reacciones`, error);
    }
  };
}

export const POST = handler(true);
export const DELETE = handler(false);
