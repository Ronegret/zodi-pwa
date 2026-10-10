import { z } from 'zod';
import { LANGUAGES, READING_TONES, RELATIONSHIP_STATUSES } from '@/lib/supabase/enums';
import { emptyToUndefined, numberInRange } from './common';

export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

const todayIso = () => new Date().toISOString().slice(0, 10);

export const displayNameSchema = z
  .string({ error: 'Dinos cómo te llamas.' })
  .trim()
  .min(1, 'Dinos cómo te llamas.')
  .max(60, 'Máximo 60 caracteres.');

export const usernameSchema = z
  .string({ error: 'Elige un nombre de usuario.' })
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_]{3,24}$/, 'De 3 a 24 caracteres: letras sin tildes, números o guion bajo.');

export const birthDateSchema = z
  .string({ error: 'Indica tu fecha de nacimiento.' })
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Usa el formato AAAA-MM-DD.')
  .refine(
    (d) =>
      !Number.isNaN(Date.parse(`${d}T00:00:00Z`)) &&
      new Date(`${d}T00:00:00Z`).toISOString().startsWith(d),
    'Esa fecha no existe en ningún calendario.',
  )
  .refine(
    (d) => d >= '1900-01-01' && d <= todayIso(),
    'Tiene que estar entre 1900 y hoy. Nadie nace en el futuro, ni siquiera tú.',
  );

export const birthTimeSchema = z
  .string({ error: 'Indica la hora.' })
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Usa el formato HH:MM (24 h).');

export const timeZoneSchema = z
  .string({ error: 'Falta la zona horaria.' })
  .trim()
  .min(1, 'Falta la zona horaria.')
  .max(64, 'Zona horaria no válida.')
  .refine(isValidTimeZone, 'Esa zona horaria no existe (ejemplo: Europe/Madrid).');

export const latitudeSchema = numberInRange(-90, 90, 'Latitud entre -90 y 90.');
export const longitudeSchema = numberInRange(-180, 180, 'Longitud entre -180 y 180.');

const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess(emptyToUndefined, schema.optional());
const nullable = <T extends z.ZodType>(schema: T) =>
  z.preprocess((v) => (v === '' ? null : v), schema.nullable().optional());

/**
 * PATCH /api/perfil. Estricto: cualquier clave no listada (plan, gems, xp…)
 * se rechaza aquí, además de en la base de datos.
 */
export const profileUpdateSchema = z
  .strictObject({
    display_name: optional(displayNameSchema),
    username: optional(usernameSchema),
    avatar_url: nullable(
      z.url({ protocol: /^https$/, error: 'El avatar tiene que ser una URL https.' }).max(500),
    ),
    birth_date: optional(birthDateSchema),
    birth_time: nullable(birthTimeSchema),
    birth_place: optional(z.string().trim().min(1).max(120, 'Máximo 120 caracteres.')),
    birth_lat: optional(latitudeSchema),
    birth_lon: optional(longitudeSchema),
    time_zone: optional(timeZoneSchema),
    language: optional(z.enum(LANGUAGES, 'Idioma no disponible.')),
    reading_tone: optional(z.enum(READING_TONES, 'Elige un tono de la lista.')),
    favorite_topics: optional(
      z.array(z.string().trim().min(1).max(40)).max(12, 'Máximo 12 temas.'),
    ),
    notification_prefs: optional(z.array(z.string().trim().min(1).max(40)).max(8)),
    relationship_status: nullable(z.enum(RELATIONSHIP_STATUSES)),
    partner_name: nullable(z.string().trim().max(60)),
    has_kids: nullable(z.boolean()),
    kids_count: nullable(z.number().int().min(0).max(20)),
    personal_bio: nullable(z.string().trim().max(500, 'Máximo 500 caracteres.')),
  })
  .refine((p) => (p.birth_lat === undefined) === (p.birth_lon === undefined), {
    path: ['birth_lat'],
    error: 'Latitud y longitud van juntas.',
  });

export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;

/**
 * Onboarding mínimo (Fase 2). La Fase 3 añade geocodificación: entonces
 * lat/lon/zona llegarán del buscador de ciudades, no a mano.
 */
export const onboardingSchema = z
  .object({
    display_name: displayNameSchema,
    username: usernameSchema,
    birth_date: birthDateSchema,
    birth_time: z.preprocess(emptyToUndefined, birthTimeSchema.optional()),
    birth_time_unknown: z.preprocess((v) => v === 'on' || v === true, z.boolean()),
    birth_place: z
      .string({ error: 'Indica dónde naciste.' })
      .trim()
      .min(1, 'Indica dónde naciste.')
      .max(120, 'Máximo 120 caracteres.'),
    birth_lat: latitudeSchema,
    birth_lon: longitudeSchema,
    time_zone: timeZoneSchema,
    reading_tone: z.enum(READING_TONES, 'Elige un tono de la lista.').default('directo'),
  })
  .refine((d) => d.birth_time_unknown || d.birth_time !== undefined, {
    path: ['birth_time'],
    error: 'Indica la hora o marca que no la sabes.',
  });

export type OnboardingInput = z.infer<typeof onboardingSchema>;
