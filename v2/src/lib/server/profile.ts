import type { Tables, TablesUpdate } from '@/lib/supabase/database.types';
import type { ZodiSupabaseClient } from '@/lib/supabase/server';
import type { ProfileUpdate } from '@/lib/validation/profile';
import { saveSelfChart } from './charts';

export type Profile = Tables<'profiles'>;

export async function getOwnProfile(
  supabase: ZodiSupabaseClient,
  userId: string,
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw new Error(`getOwnProfile: ${error.message}`);
  return data;
}

/** Postgres devuelve unique_violation (23505) si el usuario ya existe. */
export class UsernameTakenError extends Error {
  constructor() {
    super('username_taken');
  }
}

export async function updateOwnProfile(
  supabase: ZodiSupabaseClient,
  userId: string,
  patch: ProfileUpdate | TablesUpdate<'profiles'>,
): Promise<Profile> {
  // Zod deja claves opcionales como undefined; PostgREST solo debe recibir las presentes.
  const values = Object.fromEntries(
    Object.entries(patch).filter(([, v]) => v !== undefined),
  ) as TablesUpdate<'profiles'>;
  const { data, error } = await supabase
    .from('profiles')
    .update(values)
    .eq('id', userId)
    .select('*')
    .single();
  if (error?.code === '23505') throw new UsernameTakenError();
  if (error) throw new Error(`updateOwnProfile: ${error.message}`);
  return data;
}

export class MissingBirthDataError extends Error {
  constructor() {
    super('missing_birth_data');
  }
}

/** Carta a partir de los datos de nacimiento del perfil. */
export async function saveChartFromProfile(supabase: ZodiSupabaseClient, profile: Profile) {
  const { birth_date, birth_time, birth_time_known, birth_lat, birth_lon, time_zone } = profile;
  if (
    !birth_date ||
    birth_lat === null ||
    birth_lon === null ||
    !time_zone ||
    birth_time_known === null
  ) {
    throw new MissingBirthDataError();
  }
  return saveSelfChart(supabase, {
    date: birth_date,
    // Postgres devuelve "HH:MM:SS"; el motor quiere "HH:mm".
    time: birth_time_known && birth_time ? birth_time.slice(0, 5) : null,
    timeZone: time_zone,
    latitude: birth_lat,
    longitude: birth_lon,
  });
}

/** Último paso del onboarding: calcula y guarda la carta y lo marca como hecho. */
export async function finishOnboarding(supabase: ZodiSupabaseClient, profile: Profile) {
  await saveChartFromProfile(supabase, profile);
  return updateOwnProfile(supabase, profile.id, {
    onboarding_completed_at: new Date().toISOString(),
  });
}
