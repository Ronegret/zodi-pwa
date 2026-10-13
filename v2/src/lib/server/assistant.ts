/**
 * Chat con Zodi: misma voz (bloque cacheado) + modo chat + contexto real de
 * la persona en un segundo bloque de system. Cada respuesta cuenta como una
 * lectura de la cuota y se guarda (tipo "assistant", fuera del historial).
 */
import { z } from 'zod';
import type { NatalChart } from '@/lib/astro-engine';
import type { ChatTurn } from '@/lib/ai/client';
import { buildReadingContext, type ProfileForReading } from '@/lib/ai/context';
import { TONES, ZODI_CHAT_MODE, ZODI_VOICE } from '@/lib/ai/prompts';
import { oracleSnippet } from '@/lib/knowledge';
import { chineseZodiac, lifePathNumber } from '@/lib/ai/numerology';
import { peopleContext } from '@/lib/people/context';
import type { Person } from './people';
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
  /** Su gente: para que el oráculo pueda hablar de cada persona. */
  people: Person[] = [],
): PreparedReading {
  const context = buildReadingContext(profile, stored, now);
  const gente = peopleContext(people, profile, now);
  // Fragmento de la base de conocimiento (número, animal chino y compatibilidades del Sol).
  const sunSign = stored?.chart.planets.find((p) => p.id === 'sun')?.sign;
  const saber =
    profile.birth_date && sunSign
      ? oracleSnippet({
          lifePath: lifePathNumber(profile.birth_date),
          chinese: chineseZodiac(profile.birth_date).animal,
          sunSign,
        })
      : '';
  // Solo los últimos turnos, empezando siempre por uno de la persona.
  let messages: ChatTurn[] = request.messages.slice(-MAX_TURNS);
  while (messages[0]?.role === 'assistant') messages = messages.slice(1);
  const last = messages.at(-1)!.content;
  return {
    kind: 'assistant',
    system: [
      ZODI_VOICE,
      `<perfil>\n${context.text}${saber ? `\n\n## Lo que ZODI sabe de su número, su animal y sus signos afines\n${saber}` : ''}${gente ? `\n\n${gente}` : ''}\n</perfil>\n\n${ZODI_CHAT_MODE}\n${TONES[profile.reading_tone].instruction}`,
    ],
    messages,
    maxTokens: 800,
    tier: 'fast',
    cacheHistory: true,
    input: { question: last.slice(0, 1000) },
    visuals: {},
  };
}
