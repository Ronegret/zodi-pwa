/**
 * Cliente de IA (Anthropic). Solo servidor. El system prompt va con
 * cache_control: es igual para todas las lecturas y abarata cada llamada.
 */
import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_API_KEY, ANTHROPIC_BASE_URL, ANTHROPIC_MODEL } from 'astro:env/server';

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface GenerationResult {
  model: string;
  inputTokens: number;
  outputTokens: number;
}

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
): Promise<GenerationResult> {
  const stream = getClient().messages.stream(
    {
      model: ANTHROPIC_MODEL,
      max_tokens: maxTokens,
      system: system.map((text, i) => ({
        type: 'text' as const,
        text,
        // El primer bloque (la voz de Zodi) es fijo: se cachea.
        ...(i === 0 ? { cache_control: { type: 'ephemeral' as const } } : {}),
      })),
      messages,
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
  };
}
