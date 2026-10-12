/**
 * Cliente de IA (Anthropic). Solo servidor. Ahorro de tokens:
 * - Dos niveles: "fast" (Haiku, ~20 veces más barato) para el oráculo y la
 *   mayoría de lecturas, y "deep" (Sonnet) para las que piden más síntesis.
 * - Sin razonamiento previo: cobra como salida y no lo necesitamos (y además
 *   se comía el max_tokens y cortaba las lecturas).
 * - Caché en los bloques de system (la voz de ZODI y el perfil) y, en el
 *   chat, también en la conversación: lo repetido se cobra al 5–10 %.
 */
import Anthropic from '@anthropic-ai/sdk';
import {
  ANTHROPIC_API_KEY,
  ANTHROPIC_BASE_URL,
  ANTHROPIC_MODEL,
  ANTHROPIC_MODEL_FAST,
} from 'astro:env/server';
import { costParams, type AiTier } from './cost';

export type { AiTier } from './cost';

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface GenerationResult {
  model: string;
  inputTokens: number;
  outputTokens: number;
  /** 'max_tokens' = se cortó por el tope. */
  stopReason?: string | null;
}

export interface GenerateOptions {
  tier?: AiTier;
  /** Chat: cachea también la conversación (cada turno reaprovecha el anterior). */
  cacheHistory?: boolean;
}

export const modelFor = (tier: AiTier) =>
  tier === 'fast' ? ANTHROPIC_MODEL_FAST : ANTHROPIC_MODEL;

export const aiAvailable = () => Boolean(ANTHROPIC_API_KEY);

let client: Anthropic | null = null;
function getClient(): Anthropic {
  client ??= new Anthropic({
    apiKey: ANTHROPIC_API_KEY,
    ...(ANTHROPIC_BASE_URL ? { baseURL: ANTHROPIC_BASE_URL } : {}),
    maxRetries: 1,
    timeout: 60_000,
  });
  return client;
}

/**
 * Genera en streaming: `onText` recibe cada trozo de texto; al terminar
 * devuelve modelo y tokens para guardarlos con la lectura.
 */
export async function generate(
  system: string[],
  messages: ChatTurn[],
  maxTokens: number,
  onText: (text: string) => void,
  signal?: AbortSignal,
  options: GenerateOptions = {},
): Promise<GenerationResult> {
  const model = modelFor(options.tier ?? 'deep');
  const last = messages.length - 1;
  const stream = getClient().messages.stream(
    {
      model,
      max_tokens: maxTokens,
      // Cada bloque de system es estable (voz de ZODI; perfil del día): se cachean.
      system: system.map((text) => ({
        type: 'text' as const,
        text,
        cache_control: { type: 'ephemeral' as const },
      })),
      messages: options.cacheHistory
        ? messages.map((m, i) =>
            i === last
              ? {
                  role: m.role,
                  content: [
                    {
                      type: 'text' as const,
                      text: m.content,
                      cache_control: { type: 'ephemeral' as const },
                    },
                  ],
                }
              : m,
          )
        : messages,
      ...costParams(model),
    },
    signal ? { signal } : undefined,
  );
  stream.on('text', onText);
  const final = await stream.finalMessage();
  return {
    model: final.model,
    inputTokens:
      final.usage.input_tokens +
      (final.usage.cache_read_input_tokens ?? 0) +
      (final.usage.cache_creation_input_tokens ?? 0),
    outputTokens: final.usage.output_tokens,
    stopReason: final.stop_reason,
  };
}
