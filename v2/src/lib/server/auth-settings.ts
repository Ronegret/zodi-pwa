/**
 * ¿Está activado el acceso con Google en Supabase? Se pregunta a la API
 * pública de ajustes de Auth (/auth/v1/settings) y se guarda un minuto.
 * Si Google no está activado, la app no enseña el botón ni manda a nadie a
 * un error de Supabase ("provider is not enabled").
 */
import { getSupabaseConfig } from '@/lib/supabase/config';

const TTL_MS = 60_000;
let cache: { at: number; google: boolean } | null = null;

export async function isGoogleEnabled(): Promise<boolean> {
  const config = getSupabaseConfig();
  if (!config) return false;
  if (cache && Date.now() - cache.at < TTL_MS) return cache.google;
  try {
    const res = await fetch(`${config.url}/auth/v1/settings`, {
      headers: { apikey: config.anonKey },
      signal: AbortSignal.timeout(3000),
    });
    const body = (await res.json()) as { external?: { google?: boolean } };
    const google = res.ok && body.external?.google === true;
    cache = { at: Date.now(), google };
    return google;
  } catch {
    return false;
  }
}
