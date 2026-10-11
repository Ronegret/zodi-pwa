/**
 * Lecturas de IA en el servidor: prepara la consulta (contexto real +
 * extras), la genera en streaming (NDJSON), la guarda con service role y
 * devuelve la cuota si algo falla. El usuario nunca paga nuestros errores.
 */
import type { NatalChart } from '@/lib/astro-engine';
import type { ChatTurn, GenerationResult, generate } from '@/lib/ai/client';
import { buildReadingContext, type ProfileForReading } from '@/lib/ai/context';
import {
  drawTarot,
  partnerChart,
  partnerText,
  synastry,
  tarotText,
  type DrawnCard,
} from '@/lib/ai/extras';
import { KIND_BY_SLUG, LENGTHS, type ReadingKind } from '@/lib/ai/kinds';
import { ZODI_SYSTEM, buildUserMessage, type Tone } from '@/lib/ai/prompts';
import type { Json } from '@/lib/supabase/database.types';
import type { ZodiSupabaseClient } from '@/lib/supabase/server';
import type { ReadingRequest } from '@/lib/validation/reading';
import type { QuotaStore } from './quota';

export type StreamEvent =
  | { type: 'meta'; cards?: DrawnCard[] }
  | { type: 'text'; text: string }
  | { type: 'done'; id: string; remaining: number }
  | { type: 'error'; message: string };

export interface PreparedReading {
  kind: ReadingKind;
  /** Bloques de system: el primero (la voz de Zodi) se cachea. */
  system: string[];
  messages: ChatTurn[];
  maxTokens: number;
  /** Lo que se guarda en readings.input (sin datos del perfil). */
  input: Record<string, Json>;
  cards?: DrawnCard[];
}

export function prepareReading(
  request: ReadingRequest,
  profile: ProfileForReading,
  stored: { chart: NatalChart; timeKnown: boolean } | null,
  now: Date,
  random?: () => number,
): PreparedReading {
  const def = KIND_BY_SLUG.get(request.slug)!;
  const tone: Tone = request.tone ?? profile.reading_tone;
  const context = buildReadingContext(profile, stored, now);
  const input: Record<string, Json> = {
    slug: def.slug,
    tone,
    length: request.length,
    ...(request.focus ? { focus: request.focus } : {}),
  };
  let extra: string | undefined;
  let cards: DrawnCard[] | undefined;

  if (def.input === 'question' && request.question) {
    cards = drawTarot(random);
    extra = tarotText(cards, request.question);
    input.question = request.question;
    input.cards = cards.map((c) => ({
      numeral: c.numeral,
      name: c.name,
      position: c.position,
      reversed: c.reversed,
    }));
  }
  if (def.input === 'dream' && request.dream) {
    extra = `Sueño:\n"""${request.dream}"""`;
    input.dream = request.dream;
  }
  if (def.input === 'partner' && request.partner && stored) {
    const theirs = partnerChart(request.partner, context.timeZone);
    extra = partnerText(request.partner, theirs, synastry(stored.chart, theirs));
    input.partner = {
      name: request.partner.name,
      date: request.partner.date,
      time: request.partner.time ?? null,
    };
  }

  return {
    kind: def.kind,
    system: [ZODI_SYSTEM],
    messages: [
      {
        role: 'user',
        content: buildUserMessage({
          def,
          context: context.text,
          tone,
          length: request.length,
          focus: request.focus,
          extra,
        }),
      },
    ],
    maxTokens: LENGTHS[request.length].maxTokens,
    input,
    ...(cards ? { cards } : {}),
  };
}

export interface RunOptions {
  prepared: PreparedReading;
  userId: string;
  quota: QuotaStore;
  eventId: number;
  remaining: number;
  saveReading: (row: SavedReadingRow) => Promise<string>;
  /** El generador de IA (inyectado: así el módulo no depende de astro:env). */
  generateFn: typeof generate;
  signal?: AbortSignal;
}

export interface SavedReadingRow {
  user_id: string;
  kind: ReadingKind;
  input: Json;
  content: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
}

/** Stream NDJSON: meta → text… → done | error. Devuelve la cuota si falla. */
export function readingStream(opts: RunOptions): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const { prepared } = opts;
  return new ReadableStream({
    async start(controller) {
      const send = (event: StreamEvent) =>
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      send({ type: 'meta', ...(prepared.cards ? { cards: prepared.cards } : {}) });
      let content = '';
      try {
        const result: GenerationResult = await opts.generateFn(
          prepared.system,
          prepared.messages,
          prepared.maxTokens,
          (text) => {
            content += text;
            send({ type: 'text', text });
          },
          opts.signal,
        );
        if (!content.trim()) throw new Error('respuesta vacía');
        const id = await opts.saveReading({
          user_id: opts.userId,
          kind: prepared.kind,
          input: prepared.input,
          content: content.slice(0, 20000),
          model: result.model,
          input_tokens: result.inputTokens,
          output_tokens: result.outputTokens,
        });
        send({ type: 'done', id, remaining: opts.remaining });
      } catch (error) {
        console.error('[lecturas] generación fallida', error);
        await opts.quota.release(opts.eventId).catch(() => {});
        send({
          type: 'error',
          message:
            'El cosmos se ha caído a mitad de frase. No te he cobrado la lectura: inténtalo otra vez.',
        });
      } finally {
        controller.close();
      }
    },
  });
}

export async function insertReading(
  admin: ZodiSupabaseClient,
  row: SavedReadingRow,
): Promise<string> {
  const { data, error } = await admin.from('readings').insert(row).select('id').single();
  if (error) throw new Error(`readings.insert: ${error.message}`);
  return data.id;
}

export interface ReadingSummary {
  id: string;
  kind: ReadingKind;
  input: Json;
  content: string;
  created_at: string;
}

export async function listReadings(
  supabase: ZodiSupabaseClient,
  limit = 20,
): Promise<ReadingSummary[]> {
  const { data, error } = await supabase
    .from('readings')
    .select('id, kind, input, content, created_at')
    .neq('kind', 'assistant')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(`readings.list: ${error.message}`);
  return data;
}

export async function getReading(
  supabase: ZodiSupabaseClient,
  id: string,
): Promise<ReadingSummary | null> {
  const { data, error } = await supabase
    .from('readings')
    .select('id, kind, input, content, created_at')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`readings.get: ${error.message}`);
  return data;
}

/** Lectura de un tipo creada hoy (desde `since`, inicio del día local). */
export async function latestReadingSince(
  supabase: ZodiSupabaseClient,
  kind: ReadingKind,
  since: string,
): Promise<ReadingSummary | null> {
  const { data, error } = await supabase
    .from('readings')
    .select('id, kind, input, content, created_at')
    .eq('kind', kind)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`readings.latest: ${error.message}`);
  return data;
}
