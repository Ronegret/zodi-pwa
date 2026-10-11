import type { APIRoute } from 'astro';
import { fail, internal, ok, readJson, unauthorized } from '@/lib/api/http';
import { createComment, listComments } from '@/lib/server/community';
import { commentSchema } from '@/lib/validation/community';

const UUID = /^[0-9a-f-]{36}$/i;

export const GET: APIRoute = async ({ params, locals }) => {
  const { supabase, user } = locals;
  if (!supabase || !user) return unauthorized();
  if (!UUID.test(params.id ?? '')) return fail(404, 'not_found', 'Ese post no existe.');
  try {
    return ok(await listComments(supabase, params.id!));
  } catch (error) {
    return internal('GET /api/comunidad/[id]/comentarios', error);
  }
};

export const POST: APIRoute = async ({ params, request, locals }) => {
  const { supabase, user } = locals;
  if (!supabase || !user) return unauthorized();
  if (!UUID.test(params.id ?? '')) return fail(404, 'not_found', 'Ese post no existe.');
  const body = await readJson(request, commentSchema);
  if (!body.ok) return body.response;
  try {
    await createComment(supabase, params.id!, body.data.body);
    return ok(await listComments(supabase, params.id!), 201);
  } catch (error) {
    return internal('POST /api/comunidad/[id]/comentarios', error);
  }
};
