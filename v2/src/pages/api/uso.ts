import type { APIRoute } from 'astro';
import { fail, internal, ok, unauthorized } from '@/lib/api/http';
import { getQuotaStatus } from '@/lib/server/quota';

/** Lecturas de IA usadas hoy y límite del plan. */
export const GET: APIRoute = async ({ locals }) => {
  const { supabase, user } = locals;
  if (!supabase || !user) return unauthorized();
  try {
    const status = await getQuotaStatus(supabase);
    return status
      ? ok({ ...status, remaining: Math.max(0, status.limit - status.used) })
      : fail(404, 'not_found', 'Perfil no encontrado.');
  } catch (error) {
    return internal('GET /api/uso', error);
  }
};
