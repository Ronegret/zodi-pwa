import type { APIRoute } from 'astro';
import { fail, ok, unauthorized } from '@/lib/api/http';
import { lookupName } from '@/lib/server/names';

/**
 * Significado de un nombre o apellido: de serie, de la caché compartida o
 * investigado por la IA (máx. 30 nuevos al día por persona).
 * GET /api/nombre?palabra=Aros&tipo=apellido
 */
export const GET: APIRoute = async ({ url, locals }) => {
  const { supabase, user } = locals;
  if (!supabase || !user) return unauthorized();
  const word = (url.searchParams.get('palabra') ?? '').trim();
  if (word.length < 2 || word.length > 30) return fail(400, 'bad_request', 'Palabra no válida.');
  const kind = url.searchParams.get('tipo') === 'nombre' ? 'nombre' : 'apellido';
  return ok(await lookupName(supabase, kind, word));
};
