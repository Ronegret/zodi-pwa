import type { APIRoute } from 'astro';
import { KIND_BY_SLUG } from '@/lib/ai/kinds';
import { readJson, unauthorized } from '@/lib/api/http';
import { runAiRequest } from '@/lib/server/ai-endpoint';
import { prepareReading } from '@/lib/server/readings';
import { readingRequestSchema } from '@/lib/validation/reading';

/**
 * Nueva lectura de IA. Responde en streaming NDJSON (meta, text…, done |
 * error). Antes de generar: valida, comprueba datos de nacimiento y
 * consume cuota; si la IA falla, la cuota se devuelve.
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const { supabase, user } = locals;
  if (!supabase || !user) return unauthorized();

  const body = await readJson(request, readingRequestSchema);
  if (!body.ok) return body.response;
  const def = KIND_BY_SLUG.get(body.data.slug)!;

  return runAiRequest({
    supabase,
    userId: user.id,
    request,
    kind: def.kind,
    needsChart: def.needsChart,
    prepare: (profile, stored) => prepareReading(body.data, profile, stored, new Date()),
    route: 'POST /api/lecturas',
  });
};
