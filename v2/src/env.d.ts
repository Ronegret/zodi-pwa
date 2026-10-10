/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    /** Cliente con la sesión de la petición; null si Supabase no está configurado. */
    supabase: import('@/lib/supabase/server').ZodiSupabaseClient | null;
    /** Usuario validado con supabase.auth.getUser() en el middleware. */
    user: import('@supabase/supabase-js').User | null;
  }
}
