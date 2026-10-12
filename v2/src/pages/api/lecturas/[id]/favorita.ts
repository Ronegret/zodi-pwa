import type { APIRoute } from 'astro';
import { fail, internal, ok, unauthorized } from '@/lib/api/http';
import { recordActivity } from '@/lib/server/activity';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Marca o desmarca una lectura propia como favorita. */
export const POST: APIRoute = async ({ params, locals }) => {
  const { supabase, user } = locals;
  if (!supabase || !user) return unauthorized();
  if (!UUID.test(params.id ?? '')) return fail(404, 'not_found', 'Esa lectura no existe.');
  try {
    const { data, error } = await supabase.rpc('toggle_favorite', { p_reading: params.id! });
    if (error?.code === 'P0002') return fail(404, 'not_found', 'Esa lectura no existe.');
    if (error) throw new Error(`toggle_favorite: ${error.message}`);
    const favorite = data === true;
    const activity = favorite ? await recordActivity(supabase, 'favorite') : null;
    return ok({ favorite, unlocked: activity?.unlocked ?? [] });
  } catch (error) {
    return internal('POST /api/lecturas/[id]/favorita', error);
  }
};
