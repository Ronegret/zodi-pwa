import { z } from 'zod';
import { numberInRange } from '@/lib/validation/common';
import { isValidTimeZone } from '@/lib/validation/profile';

/** Lugar de nacimiento normalizado (lo que guarda el perfil). */
export interface Place {
  id: string;
  name: string;
  /** "Madrid, Comunidad de Madrid, España" */
  label: string;
  latitude: number;
  longitude: number;
  timeZone: string;
}

// Respuesta de Open-Meteo Geocoding (solo los campos que usamos).
const upstreamSchema = z.object({
  results: z
    .array(
      z.object({
        id: z.number(),
        name: z.string(),
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        timezone: z.string().optional(),
        country: z.string().optional(),
        admin1: z.string().optional(),
      }),
    )
    .optional(),
});

const round = (n: number) => Math.round(n * 10_000) / 10_000;

export function toPlaces(json: unknown): Place[] {
  const parsed = upstreamSchema.safeParse(json);
  if (!parsed.success) throw new Error('geocoding: respuesta inesperada');
  return (parsed.data.results ?? [])
    .filter((r) => r.timezone && isValidTimeZone(r.timezone))
    .map((r) => {
      const label = [r.name, r.admin1 !== r.name ? r.admin1 : undefined, r.country]
        .filter(Boolean)
        .join(', ');
      return {
        id: String(r.id),
        name: r.name,
        label,
        latitude: round(r.latitude),
        longitude: round(r.longitude),
        timeZone: r.timezone!,
      };
    });
}

export const DEFAULT_GEOCODING_URL = 'https://geocoding-api.open-meteo.com';

/** Busca ciudades. Timeout de 4 s: la UI ofrece reintentar. */
export async function searchPlaces(
  query: string,
  {
    baseUrl = DEFAULT_GEOCODING_URL,
    fetchImpl = fetch,
  }: { baseUrl?: string; fetchImpl?: typeof fetch } = {},
): Promise<Place[]> {
  const url = new URL('/v1/search', baseUrl);
  url.searchParams.set('name', query);
  url.searchParams.set('count', '8');
  url.searchParams.set('language', 'es');
  url.searchParams.set('format', 'json');
  const res = await fetchImpl(url, { signal: AbortSignal.timeout(4000) });
  if (!res.ok) throw new Error(`geocoding: HTTP ${res.status}`);
  return toPlaces(await res.json());
}

/** Lugar elegido en el formulario (combobox o lista sin JS). */
export const placeSchema = z.object({
  birth_place: z
    .string({ error: 'Elige tu ciudad de la lista.' })
    .trim()
    .min(1, 'Elige tu ciudad de la lista.')
    .max(120, 'Máximo 120 caracteres.'),
  // numberInRange: un campo oculto vacío no puede convertirse en 0 (Golfo de Guinea).
  birth_lat: numberInRange(-90, 90, 'Elige tu ciudad de la lista.'),
  birth_lon: numberInRange(-180, 180, 'Elige tu ciudad de la lista.'),
  time_zone: z
    .string({ error: 'Elige tu ciudad de la lista.' })
    .refine(isValidTimeZone, 'Esa zona horaria no existe.'),
});

export const geocodeQuerySchema = z
  .string({ error: 'Escribe al menos 2 letras.' })
  .trim()
  .min(2, 'Escribe al menos 2 letras.')
  .max(80, 'Demasiado largo.');
