import { z } from 'zod';
import { numberInRange } from '@/lib/validation/common';
import { isValidTimeZone } from '@/lib/validation/profile';

/**
 * Lugares de nacimiento. Fuente propia: tabla `places` de Supabase con
 * GeoNames cities500 (CC BY 4.0), cargada con scripts/places/import.mjs.
 * Sin proveedor externo: sin límites, sin coste y sin caídas ajenas.
 */
export const PLACES_ATTRIBUTION = 'Lugares: GeoNames (CC BY 4.0)';

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

/** Minúsculas y sin tildes: igual que name_norm en la base de datos. */
export function normalizePlaceName(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim().replace(/\s+/g, ' ');
}

const countryNames = new Intl.DisplayNames(['es'], { type: 'region' });
export function countryName(code: string): string {
  try {
    return countryNames.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

// Fila que devuelve la función search_places.
const rowSchema = z.object({
  id: z.number(),
  name: z.string(),
  country_code: z.string().length(2),
  admin1: z.string().nullable(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  time_zone: z.string(),
  population: z.number(),
});

const round = (n: number) => Math.round(n * 10_000) / 10_000;

export function rowsToPlaces(rows: unknown): Place[] {
  const parsed = z.array(rowSchema).safeParse(rows);
  if (!parsed.success) throw new Error('places: respuesta inesperada');
  return parsed.data
    .filter((r) => isValidTimeZone(r.time_zone))
    .map((r) => ({
      id: String(r.id),
      name: r.name,
      label: [
        r.name,
        r.admin1 && r.admin1 !== r.name ? r.admin1 : undefined,
        countryName(r.country_code),
      ]
        .filter(Boolean)
        .join(', '),
      latitude: round(r.latitude),
      longitude: round(r.longitude),
      timeZone: r.time_zone,
    }));
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
