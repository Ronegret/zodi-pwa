/**
 * Parámetros de coste por modelo (Claude 5). Puro, para poder probarlo.
 * - Haiku: sin razonamiento (`thinking: disabled`).
 * - Sonnet: no se puede desactivar; lo mínimo es no pensar antes de
 *   responder (`between_tools`) con esfuerzo bajo.
 * - Opus: solo admite bajar el esfuerzo.
 */
export type AiTier = 'fast' | 'deep';

export function costParams(model: string) {
  if (model.includes('haiku')) return { thinking: { type: 'disabled' as const } };
  if (model.includes('sonnet')) {
    return {
      thinking: { type: 'between_tools' as const },
      output_config: { effort: 'low' as const },
    };
  }
  if (model.includes('opus')) return { output_config: { effort: 'low' as const } };
  return {};
}
