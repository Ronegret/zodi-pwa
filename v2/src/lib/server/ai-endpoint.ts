/**
 * Flujo común de los endpoints de IA (lecturas y chat): disponibilidad,
 * perfil, carta, cuota y respuesta en streaming. Cada endpoint solo valida
 * su cuerpo y prepara la consulta.
 */
import type { NatalChart } from '@/lib/astro-engine';
import { aiAvailable, generate } from '@/lib/ai/client';
import type { ReadingKind } from '@/lib/ai/kinds';
import { fail, internal } from '@/lib/api/http';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type { ZodiSupabaseClient } from '@/lib/supabase/server';
import { getLatestSelfChart } from './charts';
import { getOwnProfile, type Profile } from './profile';
import { supabaseQuotaStore } from './quota';
import { insertReading, readingStream, type PreparedReading } from './readings';

const SHARPENING = 'Zodi está afilando la lengua. Vuelve en un rato.';

export interface AiRequestOptions {
  supabase: ZodiSupabaseClient;
  userId: string;
  request: Request;
  kind: ReadingKind;
  needsChart: boolean;
  prepare: (
    profile: Profile,
    stored: { chart: NatalChart; timeKnown: boolean } | null,
  ) => PreparedReading;
  route: string;
}

export async function runAiRequest(opts: AiRequestOptions): Promise<Response> {
  if (!aiAvailable()) return fail(503, 'unavailable', SHARPENING);
  const admin = createSupabaseAdminClient();
  if (!admin) return fail(503, 'unavailable', SHARPENING);

  try {
    const profile = await getOwnProfile(opts.supabase, opts.userId);
    if (!profile) return fail(404, 'not_found', 'Perfil no encontrado.');
    const stored = await getLatestSelfChart(opts.supabase);
    if (opts.needsChart && !stored) {
      return fail(
        409,
        'bad_request',
        'Sin tu fecha de nacimiento solo puedo leerte el horóscopo de la sala de espera. Completa tus datos primero.',
      );
    }

    const quota = supabaseQuotaStore(opts.supabase, admin);
    const { eventId, used, limit } = await quota.consume(opts.kind);
    if (eventId === null) {
      return fail(
        429,
        'quota_exceeded',
        `Has gastado tus ${limit} lecturas de hoy. El cosmos también descansa: vuelve mañana.`,
      );
    }

    const prepared = opts.prepare(
      profile,
      stored ? { chart: stored.chart, timeKnown: stored.input.timeKnown } : null,
    );
    const stream = readingStream({
      prepared,
      userId: opts.userId,
      quota,
      eventId,
      remaining: Math.max(0, limit - used),
      saveReading: (row) => insertReading(admin, row),
      generateFn: generate,
      signal: opts.request.signal,
    });
    return new Response(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson; charset=utf-8',
        'Cache-Control': 'private, no-store',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    return internal(opts.route, error);
  }
}
