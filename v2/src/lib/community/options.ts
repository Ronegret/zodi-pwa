/** Temas y reacciones de la comunidad (lo comparten servidor e islas). */
import type { CommunityTopic, Enums } from '@/lib/supabase/database.types';

export type ReactionKind = Enums<'reaction_kind'>;

export const TOPICS: { value: CommunityTopic; label: string; emoji: string; hint: string }[] = [
  { value: 'general', label: 'General', emoji: '🌌', hint: 'De todo un poco' },
  { value: 'amor', label: 'Amor', emoji: '💘', hint: 'Lo que el corazón no calla' },
  { value: 'trabajo', label: 'Trabajo', emoji: '💼', hint: 'Jefes, Saturno y lunes' },
  { value: 'dinero', label: 'Dinero', emoji: '💸', hint: 'Júpiter, ¿dónde estás?' },
  { value: 'confesion', label: 'Confesiones', emoji: '🕯️', hint: 'Aquí nadie juzga (mucho)' },
  { value: 'pregunta', label: 'Preguntas', emoji: '❓', hint: 'La comunidad responde' },
];
export const TOPIC_VALUES = TOPICS.map((t) => t.value) as [CommunityTopic, ...CommunityTopic[]];
export const TOPIC_BY_VALUE = new Map(TOPICS.map((t) => [t.value, t]));

export const REACTIONS: { value: ReactionKind; emoji: string; label: string }[] = [
  { value: 'fuego', emoji: '🔥', label: 'Fuego' },
  { value: 'magia', emoji: '✨', label: 'Magia' },
  { value: 'calavera', emoji: '💀', label: 'Me muero' },
  { value: 'amor', emoji: '💜', label: 'Amor' },
];
export const REACTION_VALUES = REACTIONS.map((r) => r.value) as [ReactionKind, ...ReactionKind[]];

/** "hace 3 min", "ayer"… en español. */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const seconds = Math.round((new Date(iso).getTime() - now.getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31_536_000],
    ['month', 2_592_000],
    ['week', 604_800],
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
  ];
  for (const [unit, size] of steps) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return 'ahora mismo';
}
