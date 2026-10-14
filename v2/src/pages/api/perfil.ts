import type { APIRoute } from 'astro';
import { fail, internal, ok, readJson, unauthorized } from '@/lib/api/http';
import { getOwnProfile, UsernameTakenError, updateOwnProfile } from '@/lib/server/profile';
import { profileUpdateSchema } from '@/lib/validation/profile';

export const GET: APIRoute = async ({ locals }) => {
  const { supabase, user } = locals;
  if (!supabase || !user) return unauthorized();
  try {
    const profile = await getOwnProfile(supabase, user.id);
    return profile ? ok(profile) : fail(404, 'not_found', 'Perfil no encontrado.');
  } catch (error) {
    return internal('GET /api/perfil', error);
  }
};

export const PATCH: APIRoute = async ({ locals, request }) => {
  const { supabase, user } = locals;
  if (!supabase || !user) return unauthorized();
  const body = await readJson(request, profileUpdateSchema);
  if (!body.ok) return body.response;
  try {
    return ok(await updateOwnProfile(supabase, user.id, body.data));
  } catch (error) {
    if (error instanceof UsernameTakenError) {
      return fail(409, 'validation_failed', 'Revisa los datos enviados.', {
        username: 'Ese usuario ya tiene dueño. Prueba otro.',
      });
    }
    return internal('PATCH /api/perfil', error);
  }
};
