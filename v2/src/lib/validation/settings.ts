import { z } from 'zod';
import { stepSchemas } from '@/lib/onboarding/steps';

/** Formulario de Ajustes: los pasos de perfil, estilo y avisos juntos. */
export const settingsSchema = z.object({
  ...stepSchemas.perfil.shape,
  ...stepSchemas.estilo.shape,
  ...stepSchemas.avisos.shape,
});

export const SETTINGS_ARRAYS = ['favorite_topics', 'notification_prefs'] as const;
