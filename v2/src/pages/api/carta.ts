import type { APIRoute } from 'astro';
import { fail, internal, ok, readJson, unauthorized } from '@/lib/api/http';
import { getLatestSelfChart, saveSelfChart } from '@/lib/server/charts';
import { chartRequestSchema } from '@/lib/validation/chart';

/** Última carta propia guardada. */
export const GET: APIRoute = async ({ locals }) => {
  const { supabase, user } = locals;
  if (!supabase || !user) return unauthorized();
  try {
    const chart = await getLatestSelfChart(supabase);
    return chart
      ? ok(chart)
      : fail(404, 'not_found', 'Todavía no hay carta. Completa tus datos de nacimiento.');
  } catch (error) {
    return internal('GET /api/carta', error);
  }
};

/** Calcula con astro-engine (en el servidor) y guarda una carta nueva. */
export const POST: APIRoute = async ({ locals, request }) => {
  const { supabase, user } = locals;
  if (!supabase || !user) return unauthorized();
  const body = await readJson(request, chartRequestSchema);
  if (!body.ok) return body.response;
  try {
    return ok(await saveSelfChart(supabase, body.data), 201);
  } catch (error) {
    return internal('POST /api/carta', error);
  }
};
