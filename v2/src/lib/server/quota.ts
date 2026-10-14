import type { Enums } from '@/lib/supabase/database.types';
import type { ZodiSupabaseClient } from '@/lib/supabase/server';

export type ReadingKind = Enums<'reading_kind'>;

export interface QuotaSnapshot {
  used: number;
  limit: number;
}

/** Acceso a la cuota. Separado de Supabase para poder testear la lógica. */
export interface QuotaStore {
  consume(kind: ReadingKind): Promise<QuotaSnapshot & { eventId: number | null }>;
  release(eventId: number): Promise<void>;
}

export class QuotaExceededError extends Error {
  constructor(readonly quota: QuotaSnapshot) {
    super('quota_exceeded');
  }
}

/**
 * Consume una lectura de la cuota ANTES de llamar a la IA. Si la generación
 * falla, devuelve la lectura (el usuario no paga por nuestros errores).
 */
export async function withAiQuota<T>(
  store: QuotaStore,
  kind: ReadingKind,
  run: () => Promise<T>,
): Promise<{ value: T; quota: QuotaSnapshot }> {
  const { eventId, used, limit } = await store.consume(kind);
  if (eventId === null) throw new QuotaExceededError({ used, limit });
  try {
    return { value: await run(), quota: { used, limit } };
  } catch (error) {
    await store.release(eventId).catch((releaseError: unknown) => {
      console.error('[quota] no se pudo devolver la lectura', releaseError);
    });
    throw error;
  }
}

/** Cuota sobre Supabase: consume con la sesión del usuario, devuelve con service role. */
export function supabaseQuotaStore(
  user: ZodiSupabaseClient,
  admin: ZodiSupabaseClient,
): QuotaStore {
  return {
    async consume(kind) {
      const { data, error } = await user.rpc('consume_ai_quota', { p_kind: kind });
      if (error) throw new Error(`consume_ai_quota: ${error.message}`);
      const row = data[0];
      if (!row) throw new Error('consume_ai_quota: sin resultado');
      return { used: row.used, limit: row.daily_limit, eventId: row.allowed ? row.event_id : null };
    },
    async release(eventId) {
      const { error } = await admin.from('usage_events').delete().eq('id', eventId);
      if (error) throw new Error(`release: ${error.message}`);
    },
  };
}

export async function getQuotaStatus(user: ZodiSupabaseClient): Promise<QuotaSnapshot | null> {
  const { data, error } = await user.rpc('ai_quota_status');
  if (error) throw new Error(`ai_quota_status: ${error.message}`);
  const row = data[0];
  return row ? { used: row.used, limit: row.daily_limit } : null;
}

/** Mensajes al oráculo hoy (cuota aparte de las lecturas). */
export async function getOracleQuota(user: ZodiSupabaseClient): Promise<QuotaSnapshot | null> {
  const { data, error } = await user.rpc('oracle_quota_status');
  if (error) throw new Error(`oracle_quota_status: ${error.message}`);
  const row = data[0];
  return row ? { used: row.used, limit: row.daily_limit } : null;
}

/** Días que le quedan del periodo gratis (0 si ya terminó o no tiene). */
export function trialDaysLeft(trialEndsAt: string | null, now = new Date()): number {
  if (!trialEndsAt) return 0;
  const ms = Date.parse(trialEndsAt) - now.getTime();
  return ms > 0 ? Math.ceil(ms / 86_400_000) : 0;
}
