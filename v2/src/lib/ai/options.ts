/** Opciones de lectura que ve la persona. Sin texto de prompts: va al navegador. */
export type Tone = 'suave' | 'directo' | 'brutal' | 'sarcastico';

export const TONE_LABELS: Record<Tone, string> = {
  suave: 'Suave',
  directo: 'Directo',
  brutal: 'Brutal',
  sarcastico: 'Sarcástico',
};

export const LENGTHS = {
  breve: { label: 'Breve', maxTokens: 700 },
  normal: { label: 'Normal', maxTokens: 1300 },
  extensa: { label: 'Extensa', maxTokens: 2300 },
} as const;
export type ReadingLength = keyof typeof LENGTHS;

export const FOCUS = ['amor', 'trabajo', 'dinero', 'salud', 'familia', 'espiritualidad'] as const;
export type ReadingFocus = (typeof FOCUS)[number];

export const FOCUS_LABELS: Record<ReadingFocus, string> = {
  amor: 'amor',
  trabajo: 'trabajo',
  dinero: 'dinero',
  salud: 'salud y energía',
  familia: 'familia',
  espiritualidad: 'espiritualidad',
};
