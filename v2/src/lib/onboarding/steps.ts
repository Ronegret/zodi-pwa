/**
 * Onboarding por pasos. Cada paso guarda en el perfil (guardado parcial) y
 * tiene su esquema Zod, compartido por servidor y cliente.
 */
import { z } from 'zod';
import { placeSchema } from '@/lib/geo/places';
import { READING_TONES } from '@/lib/supabase/enums';
import type { Tables } from '@/lib/supabase/database.types';
import { emptyToUndefined } from '@/lib/validation/common';
import {
  birthDateSchema,
  birthTimeSchema,
  displayNameSchema,
  usernameSchema,
} from '@/lib/validation/profile';

export const STEPS = [
  { id: 'perfil', label: 'Tú', heading: 'Cómo te llamamos' },
  { id: 'nacimiento', label: 'Nacimiento', heading: 'Cuándo aterrizaste' },
  { id: 'lugar', label: 'Lugar', heading: 'Dónde aterrizaste' },
  { id: 'estilo', label: 'Tu Zodi', heading: 'Cómo quieres que te hable' },
  { id: 'avisos', label: 'Avisos', heading: 'Cuándo te damos la lata' },
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

export const TONES: Record<(typeof READING_TONES)[number], { title: string; hint: string }> = {
  suave: { title: 'Suave', hint: 'Con cariño y sin sustos.' },
  directo: { title: 'Directo', hint: 'Sin rodeos, pero con educación.' },
  brutal: { title: 'Brutal', hint: 'Sin anestesia. Tú lo has pedido.' },
  sarcastico: { title: 'Sarcástico', hint: 'Con retranca. Mucha.' },
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
  avisos: z.object({
    notification_prefs: z.array(z.enum(notificationValues, 'Aviso no válido.')).default([]),
  }),
} as const;

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
