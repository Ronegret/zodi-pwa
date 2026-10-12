import { z } from 'zod';
import { stepSchemas } from '@/lib/onboarding/steps';
import { aboutSchema } from './about';

export { RELATIONSHIP_OPTIONS } from './about';

/** Formulario de Ajustes: perfil, sobre ti, estilo y avisos juntos. */
export const settingsSchema = z
  .object({
    ...stepSchemas.perfil.shape,
    ...aboutSchema.shape,
    ...stepSchemas.estilo.shape,
    ...stepSchemas.avisos.shape,
  })
  .transform((d) => ({ ...d, kids_count: d.has_kids ? d.kids_count : null }));

export const SETTINGS_ARRAYS = ['favorite_topics', 'notification_prefs'] as const;
