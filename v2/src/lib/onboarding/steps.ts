/**
 * Onboarding por pasos. Cada paso guarda en el perfil (guardado parcial) y
 * tiene su esquema Zod, compartido por servidor y cliente.
 */
import { z } from 'zod';
import { placeSchema } from '@/lib/geo/places';
import { READING_TONES } from '@/lib/supabase/enums';
import type { Tables } from '@/lib/supabase/database.types';
import { aboutStepSchema } from '@/lib/validation/about';
import { emptyToUndefined } from '@/lib/validation/common';
import {
  birthDateSchema,
  birthTimeSchema,
  displayNameSchema,
  usernameSchema,
} from '@/lib/validation/profile';

/**
 * `tip`: lo que explica ZODI en cada paso (por qué pide el dato), en
 * palabras sencillas: quien llega por primera vez no sabe qué es un
 * Ascendente ni por qué importa la hora.
 */
export const STEPS = [
  {
    id: 'perfil',
    label: 'Tú',
    heading: 'Cómo te llamamos',
    tip: 'Así te llamaré en tus lecturas. El nombre de usuario es cómo te ven en la comunidad; puedes cambiarlo cuando quieras.',
  },
  {
    id: 'nacimiento',
    label: 'Nacimiento',
    heading: 'Cuándo naciste',
    tip: 'Con tu fecha sé tu signo (tu Sol). Con la hora, tu Ascendente: cómo te ven los demás, y cambia cada dos horas. ¿No la sabes? Mira tu partida de nacimiento o pregunta en casa; puedes añadirla después.',
  },
  {
    id: 'lugar',
    label: 'Lugar',
    heading: 'Dónde naciste',
    tip: 'El lugar me dice la hora exacta del cielo (cada sitio tiene su zona horaria) y dónde caen tus casas. Si tu pueblo no sale, elige la ciudad más cercana: unos kilómetros no cambian tu carta.',
  },
  {
    id: 'estilo',
    label: 'Tu ZODI',
    heading: 'Cómo quieres que te hable',
    tip: 'Elige el tono de tus lecturas. Si dudas, Directo: claro pero con cariño. Los temas me dicen de qué hablarte primero.',
  },
  {
    id: 'sobre-ti',
    label: 'Sobre ti',
    heading: 'Lo que ZODI debería saber',
    tip: 'Opcional, pero marca la diferencia: si sé tu situación, mis lecturas hablan de tu vida y no de la de cualquiera. Solo lo uso yo; no lo ve nadie.',
  },
] as const;

export type StepId = (typeof STEPS)[number]['id'];
export const isStepId = (v: string | null): v is StepId => STEPS.some((s) => s.id === v);
export const stepIndex = (id: StepId) => STEPS.findIndex((s) => s.id === id);

// Mismos temas y avisos que la app actual (components/onboarding/OnboardingFlow.tsx).
export const TOPICS = [
  { value: 'amor', label: 'Amor' },
  { value: 'dinero', label: 'Dinero' },
  { value: 'trabajo', label: 'Trabajo' },
  { value: 'espiritualidad', label: 'Espiritualidad' },
  { value: 'futuro', label: 'Futuro' },
  { value: 'energia', label: 'Energía' },
] as const;

export const NOTIFICATIONS = [
  { value: 'horoscopo-diario', label: 'Horóscopo diario', hint: 'Cada mañana, antes del café.' },
  { value: 'alertas-lunares', label: 'Alertas lunares', hint: 'Lunas nuevas y llenas.' },
  { value: 'retrogrados', label: 'Retrógrados', hint: 'Para tener a quién culpar.' },
  { value: 'resumen-semanal', label: 'Resumen semanal', hint: 'Los lunes, lo que viene.' },
] as const;

export const TONES: Record<
  (typeof READING_TONES)[number],
  { title: string; hint: string; example: string }
> = {
  suave: {
    title: 'Suave',
    hint: 'Con cariño y sin sustos.',
    example: 'Hoy te toca cuidarte un poco más. Lo que esperas llegará a su ritmo.',
  },
  directo: {
    title: 'Directo',
    hint: 'Sin rodeos, pero con educación.',
    example: 'Ese mensaje no va a llegar si no lo mandas tú. Hoy es buen día.',
  },
  brutal: {
    title: 'Brutal',
    hint: 'Sin anestesia. Tú lo has pedido.',
    example: 'Llevas tres semanas esperando una señal. La señal es que pases página.',
  },
  sarcastico: {
    title: 'Sarcástico',
    hint: 'Con retranca. Mucha.',
    example: 'Mercurio no tiene la culpa de que contestes a las tres de la mañana.',
  },
};

const topicValues = TOPICS.map((t) => t.value) as [string, ...string[]];
const notificationValues = NOTIFICATIONS.map((n) => n.value) as [string, ...string[]];

export const stepSchemas = {
  perfil: z.object({ display_name: displayNameSchema, username: usernameSchema }),
  nacimiento: z
    .object({
      birth_date: birthDateSchema,
      birth_time: z.preprocess(emptyToUndefined, birthTimeSchema.optional()),
      birth_time_unknown: z.preprocess((v) => v === 'on' || v === true, z.boolean()),
    })
    .refine((d) => d.birth_time_unknown || d.birth_time !== undefined, {
      path: ['birth_time'],
      error: 'Indica la hora o marca que no la sabes.',
    })
    .transform((d) => ({
      birth_date: d.birth_date,
      birth_time: d.birth_time_unknown ? null : (d.birth_time ?? null),
      birth_time_known: !d.birth_time_unknown,
    })),
  lugar: placeSchema,
  estilo: z.object({
    reading_tone: z.enum(READING_TONES, 'Elige cómo quieres que te hable.'),
    favorite_topics: z
      .array(z.enum(topicValues, 'Tema no válido.'))
      .max(4, 'Como mucho 4 temas. Zodi no da abasto.')
      .default([]),
  }),
  'sobre-ti': aboutStepSchema,
  /** No es un paso del onboarding: lo usa Ajustes (los avisos llegarán más adelante). */
  avisos: z.object({
    notification_prefs: z.array(z.enum(notificationValues, 'Aviso no válido.')).default([]),
  }),
} as const;

/** Sugerencia de nombre de usuario a partir del nombre visible ("Ana Estrella" → "ana_estrella"). */
export function suggestUsername(displayName: string, salt: string): string {
  const base = displayName
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 16);
  const digits = salt
    .replace(/[^0-9]/g, '')
    .slice(0, 3)
    .padEnd(3, '7');
  return `${base.length >= 3 ? base : 'zodi'}_${digits}`;
}

/** Claves que llegan como varios valores en el FormData. */
export const ARRAY_FIELDS = ['favorite_topics', 'notification_prefs'] as const;

type ProfileLike = Pick<
  Tables<'profiles'>,
  'display_name' | 'username' | 'birth_date' | 'birth_time_known' | 'birth_lat' | 'time_zone'
>;

/** Primer paso con datos obligatorios pendientes; null si los tres primeros están. */
export function firstIncompleteStep(p: ProfileLike): StepId | null {
  if (!p.display_name || !p.username) return 'perfil';
  if (!p.birth_date || p.birth_time_known === null) return 'nacimiento';
  if (p.birth_lat === null || !p.time_zone) return 'lugar';
  return null;
}

/** Paso a mostrar: el pedido si ya es alcanzable; si no, el primero pendiente. */
export function resolveStep(requested: string | null, p: ProfileLike): StepId {
  const pending = firstIncompleteStep(p);
  const maxIndex = pending ? stepIndex(pending) : STEPS.length - 1;
  if (isStepId(requested) && stepIndex(requested) <= maxIndex) return requested;
  return pending ?? 'estilo';
}

export function nextStep(id: StepId): StepId | null {
  return STEPS[stepIndex(id) + 1]?.id ?? null;
}
