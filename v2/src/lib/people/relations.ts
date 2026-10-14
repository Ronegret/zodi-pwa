/** Qué es cada persona para ti. */
export const RELATIONS = {
  pareja: { label: 'Pareja', emoji: '❤️' },
  hijo: { label: 'Hijo/a', emoji: '🧸' },
  familia: { label: 'Familia', emoji: '🏠' },
  amistad: { label: 'Amistad', emoji: '🤝' },
  trabajo: { label: 'Trabajo', emoji: '💼' },
  otra: { label: 'Otra', emoji: '✨' },
} as const;
export type Relation = keyof typeof RELATIONS;
export const RELATION_IDS = Object.keys(RELATIONS) as Relation[];
