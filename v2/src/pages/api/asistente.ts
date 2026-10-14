import type { APIRoute } from 'astro';
import { readJson, unauthorized } from '@/lib/api/http';
import { runAiRequest } from '@/lib/server/ai-endpoint';
import { chatRequestSchema, prepareChat } from '@/lib/server/assistant';
import { listPeople } from '@/lib/server/people';

/** Un turno del chat con Zodi. Mismo protocolo NDJSON que las lecturas. */
export const POST: APIRoute = async ({ request, locals }) => {
  const { supabase, user } = locals;
  if (!supabase || !user) return unauthorized();

  const body = await readJson(request, chatRequestSchema);
  if (!body.ok) return body.response;
  // Su gente, para que ZODI sepa de quién le hablan (si falla, sigue sin ella).
  const people = await listPeople(supabase).catch(() => []);

  return runAiRequest({
    supabase,
    userId: user.id,
    request,
    kind: 'assistant',
    needsChart: false,
    prepare: (profile, stored) => prepareChat(body.data, profile, stored, new Date(), people),
    route: 'POST /api/asistente',
  });
};
