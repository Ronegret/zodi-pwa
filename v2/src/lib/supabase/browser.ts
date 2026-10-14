import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from './config';
import type { Database } from './database.types';

let client: SupabaseClient<Database> | null = null;

/**
 * Cliente para islas React. Las cookies de sesión son HttpOnly, así que aquí
 * no hay sesión: sirve para datos públicos (posts publicados, límites de plan).
 * Lo privado pasa por /api/*, que valida la sesión en el servidor.
 */
export function getSupabaseBrowserClient(): SupabaseClient<Database> | null {
  if (client) return client;
  const config = getSupabaseConfig();
  if (!config) return null;
  client = createBrowserClient<Database>(config.url, config.anonKey);
  return client;
}
