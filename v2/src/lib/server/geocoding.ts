import { normalizePlaceName, rowsToPlaces, type Place } from '@/lib/geo/places';
import type { ZodiSupabaseClient } from '@/lib/supabase/server';

/** Busca ciudades en nuestra tabla `places` (lectura pública, sin service role). */
export async function geocode(supabase: ZodiSupabaseClient, query: string): Promise<Place[]> {
  const { data, error } = await supabase.rpc('search_places', {
    p_query: normalizePlaceName(query),
    p_limit: 8,
  });
  if (error) throw new Error(`search_places: ${error.message}`);
  return rowsToPlaces(data);
}
