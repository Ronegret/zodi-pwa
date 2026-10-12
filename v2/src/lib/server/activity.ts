/**
 * Registra lo que hace la persona (racha, XP, logros) con su propia sesión:
 * record_activity() usa auth.uid(). Nunca rompe la acción principal: si
 * falla, se apunta en el log y se sigue.
 */
import type { Database } from '@/lib/supabase/database.types';
import type { ZodiSupabaseClient } from '@/lib/supabase/server';

export type ActivityAction = Database['public']['Functions']['record_activity']['Args']['p_action'];
export type ActivityResult = Database['public']['Functions']['record_activity']['Returns'][number];

export async function recordActivity(
  supabase: ZodiSupabaseClient,
  action: ActivityAction,
): Promise<ActivityResult | null> {
  try {
    const { data, error } = await supabase.rpc('record_activity', { p_action: action });
    if (error) throw error;
    return (Array.isArray(data) ? data[0] : data) ?? null;
  } catch (error) {
    console.error('[actividad]', action, error);
    return null;
  }
}
