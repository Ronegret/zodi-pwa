import { GEOCODING_API_URL } from 'astro:env/server';
import { DEFAULT_GEOCODING_URL, searchPlaces, type Place } from '@/lib/geo/places';

/** Búsqueda de ciudades con la URL configurada (Open-Meteo o el mock de e2e). */
export function geocode(query: string): Promise<Place[]> {
  return searchPlaces(query, { baseUrl: GEOCODING_API_URL ?? DEFAULT_GEOCODING_URL });
}
