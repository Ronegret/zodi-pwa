import type { APIRoute } from 'astro';
import { z } from 'zod';
import { fail, ok, readJson, unauthorized } from '@/lib/api/http';
import { updateOwnProfile } from '@/lib/server/profile';
import { timeZoneSchema } from '@/lib/validation/profile';

/**
 * Zona horaria actual de la persona (la de su navegador). Sirve para que
 * "hoy", las lecturas del día y el saludo de ZODI cuadren con la hora de
 * donde vive, no con la del lugar donde nació. Solo cambia `time_zone`.
 */
const body = z.strictObject({ timeZone: timeZoneSchema });

export const POST: APIRoute = async ({ request, locals }) => {
  const { supabase, user } = locals;
  if (!supabase || !user) return unauthorized();
  const parsed = await readJson(request, body);
  if (!parsed.ok) return parsed.response;
  try {
    await updateOwnProfile(supabase, user.id, { time_zone: parsed.data.timeZone });
  } catch {
    return fail(500, 'internal', 'No he podido guardar tu zona horaria.');
  }
  return ok({ timeZone: parsed.data.timeZone });
};
