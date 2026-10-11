import type { APIRoute } from 'astro';
import { fail, ok, unauthorized } from '@/lib/api/http';
import { geocodeQuerySchema } from '@/lib/geo/places';
import { fieldErrors } from '@/lib/validation/common';
import { geocode } from '@/lib/server/geocoding';

/** GET /api/geocodificar?q=Madrid → lugares con lat/lon y zona IANA. */
export const GET: APIRoute = async ({ locals, url }) => {
  if (!locals.user) return unauthorized();
  const parsed = geocodeQuerySchema.safeParse(url.searchParams.get('q') ?? '');
  if (!parsed.success) {
    return fail(422, 'validation_failed', 'Revisa la búsqueda.', {
      q: fieldErrors(parsed.error)._form ?? 'Búsqueda no válida.',
    });
  }
  try {
    return ok(await geocode(parsed.data));
  } catch (error) {
    console.error('[api] geocodificar', error);
    return fail(
      503,
      'unavailable',
      'El buscador de ciudades no responde. Inténtalo en un momento.',
    );
  }
};
