import type { Tables, TablesUpdate } from '@/lib/supabase/database.types';
import type { ZodiSupabaseClient } from '@/lib/supabase/server';
import type { OnboardingInput, ProfileUpdate } from '@/lib/validation/profile';
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

/** Guarda los datos de nacimiento, calcula la carta y marca el onboarding como hecho. */
export async function completeOnboarding(
  supabase: ZodiSupabaseClient,
  userId: string,
  input: OnboardingInput,
) {
  const time = input.birth_time_unknown ? null : (input.birth_time ?? null);
  await updateOwnProfile(supabase, userId, {
    display_name: input.display_name,
    username: input.username,
    birth_date: input.birth_date,
    birth_time: time,
    birth_place: input.birth_place,
    birth_lat: input.birth_lat,
    birth_lon: input.birth_lon,
    time_zone: input.time_zone,
    reading_tone: input.reading_tone,
  });
  await saveSelfChart(supabase, {
    date: input.birth_date,
    time,
    timeZone: input.time_zone,
    latitude: input.birth_lat,
    longitude: input.birth_lon,
  });
  return updateOwnProfile(supabase, userId, { onboarding_completed_at: new Date().toISOString() });
}
