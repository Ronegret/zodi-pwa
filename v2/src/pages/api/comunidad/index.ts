import type { APIRoute } from 'astro';
import { fail, internal, ok, readJson, unauthorized } from '@/lib/api/http';
import { fieldErrors } from '@/lib/validation/common';
import { recordActivity } from '@/lib/server/activity';
import { createPost, listFeed } from '@/lib/server/community';
import { feedQuerySchema, postSchema } from '@/lib/validation/community';

/** Feed: ?tema=amor&antes=<created_at del último> (paginación por fecha). */
export const GET: APIRoute = async ({ url, locals }) => {
  const { supabase, user } = locals;
  if (!supabase || !user) return unauthorized();
  const query = feedQuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!query.success) {
    return fail(422, 'validation_failed', 'Filtro no válido.', fieldErrors(query.error));
  }
  try {
    return ok(await listFeed(supabase, { topic: query.data.tema, before: query.data.antes }));
  } catch (error) {
    return internal('GET /api/comunidad', error);
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  const { supabase, user } = locals;
  if (!supabase || !user) return unauthorized();
  const body = await readJson(request, postSchema);
  if (!body.ok) return body.response;
  try {
    const id = await createPost(supabase, body.data);
    await recordActivity(supabase, 'post');
    const [post] = (await listFeed(supabase, {})).filter((p) => p.id === id);
    return ok(post ?? { id }, 201);
  } catch (error) {
    return internal('POST /api/comunidad', error);
  }
};
