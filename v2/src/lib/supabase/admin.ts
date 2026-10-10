import { createClient, type SupabaseClient } from '@supabase/supabase-js';
// astro:env/server falla en el build si se importa desde código de cliente:
// la clave de service role no puede acabar en el navegador.
import { SUPABASE_SERVICE_ROLE_KEY } from 'astro:env/server';
import { getSupabaseConfig } from './config';
import type { Database } from './database.types';

/**
 * Cliente con service role: salta la RLS. Solo para lo que el usuario no
 * puede hacer por sí mismo (guardar lecturas, plan, gemas, webhooks).
 * Nunca usarlo para leer datos "en nombre" del usuario.
 */
export function createSupabaseAdminClient(): SupabaseClient<Database> | null {
  const config = getSupabaseConfig();
  if (!config || !SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient<Database>(config.url, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
