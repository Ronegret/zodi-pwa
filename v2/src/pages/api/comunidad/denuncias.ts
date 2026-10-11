import type { APIRoute } from 'astro';
import { internal, ok, readJson, unauthorized } from '@/lib/api/http';
import { report } from '@/lib/server/community';
import { reportSchema } from '@/lib/validation/community';

/** Denuncia un post o comentario. Con tres personas distintas, se oculta solo. */
export const POST: APIRoute = async ({ request, locals }) => {
  const { supabase, user } = locals;
  if (!supabase || !user) return unauthorized();
  const body = await readJson(request, reportSchema);
  if (!body.ok) return body.response;
  try {
    await report(supabase, body.data);
    return ok({ reported: true }, 201);
  } catch (error) {
    return internal('POST /api/comunidad/denuncias', error);
  }
};
