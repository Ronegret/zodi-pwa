/**
 * Chat con Zodi: misma voz (bloque cacheado) + modo chat + contexto real de
 * la persona en un segundo bloque de system. Cada respuesta cuenta como una
 * lectura de la cuota y se guarda (tipo "assistant", fuera del historial).
 */
import { z } from 'zod';
import type { NatalChart } from '@/lib/astro-engine';
import type { ChatTurn } from '@/lib/ai/client';
import { buildReadingContext, type ProfileForReading } from '@/lib/ai/context';
import { TONES, ZODI_CHAT_MODE, ZODI_SYSTEM } from '@/lib/ai/prompts';
import type { PreparedReading } from './readings';

export const MAX_TURNS = 16;

export const chatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z
          .string()
          .trim()
          .min(1, 'Escribe algo.')
          .max(1000, 'Máximo 1.000 caracteres por mensaje.'),
      }),
    )
    .min(1, 'Escribe algo.')
    .refine((m) => m.at(-1)?.role === 'user', 'El último mensaje tiene que ser tuyo.'),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;

export function prepareChat(
  request: ChatRequest,
  profile: ProfileForReading,
  stored: { chart: NatalChart; timeKnown: boolean } | null,
  now: Date,
): PreparedReading {
  const context = buildReadingContext(profile, stored, now);
  // Solo los últimos turnos, empezando siempre por uno de la persona.
  let messages: ChatTurn[] = request.messages.slice(-MAX_TURNS);
  while (messages[0]?.role === 'assistant') messages = messages.slice(1);
  const last = messages.at(-1)!.content;
  return {
    kind: 'assistant',
    system: [
      ZODI_SYSTEM,
      `${ZODI_CHAT_MODE}\n${TONES[profile.reading_tone].instruction}\n\n<perfil>\n${context.text}\n</perfil>`,
    ],
    messages,
    maxTokens: 500,
    input: { question: last.slice(0, 1000) },
    visuals: {},
  };
}
