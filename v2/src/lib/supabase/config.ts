import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from 'astro:env/client';

export interface SupabasePublicConfig {
  url: string;
  anonKey: string;
}

/** null si faltan las variables: las rutas privadas se cierran, nunca se abren. */
export function getSupabaseConfig(): SupabasePublicConfig | null {
  if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) return null;
  return { url: PUBLIC_SUPABASE_URL, anonKey: PUBLIC_SUPABASE_ANON_KEY };
}
