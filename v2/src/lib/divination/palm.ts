/**
 * Lectura de mano guiada: la persona se mira la palma y elige cómo es cada
 * línea. Así aprende a leerla y la IA recibe datos concretos. Puro.
 */
export const PALM_FIELDS = {
  shape: {
    label: 'Forma de tu mano',
    hint: 'Mira la palma (cuadrada o alargada) y los dedos (cortos o largos).',
    options: {
      tierra: 'Palma cuadrada y dedos cortos',
      aire: 'Palma cuadrada y dedos largos',
      fuego: 'Palma alargada y dedos cortos',
      agua: 'Palma alargada y dedos largos',
    },
  },
  life: {
    label: 'Línea de la vida',
    hint: 'La que rodea la base del pulgar.',
    options: {
      larga: 'Larga y bien marcada',
      curva: 'Muy curva, se abre hacia la palma',
      recta: 'Pegada al pulgar, casi recta',
      tenue: 'Fina o poco marcada',
      cortada: 'Con cortes o islas',
    },
  },
  heart: {
    label: 'Línea del corazón',
    hint: 'La de arriba, justo debajo de los dedos.',
    options: {
      curva: 'Sube curvada hacia los dedos',
      recta: 'Recta, casi paralela a la de la cabeza',
      larga: 'Larga, cruza casi toda la palma',
      corta: 'Corta, acaba bajo el dedo corazón',
      ramas: 'Con ramas o cortes',
    },
  },
  head: {
    label: 'Línea de la cabeza',
    hint: 'La del medio, cruza la palma de lado a lado.',
    options: {
      recta: 'Recta y horizontal',
      inclinada: 'Baja inclinada hacia la muñeca',
      larga: 'Muy larga',
      corta: 'Corta',
      unida: 'Empieza pegada a la de la vida',
    },
  },
  fate: {
    label: 'Línea del destino',
    hint: 'Vertical, sube desde la muñeca hacia el dedo corazón.',
    options: {
      marcada: 'Bien marcada',
      tenue: 'Tenue o a trozos',
      tarde: 'Empieza a media palma',
      no: 'No la veo',
    },
  },
} as const;

export type PalmField = keyof typeof PALM_FIELDS;
export const PALM_FIELD_IDS = Object.keys(PALM_FIELDS) as PalmField[];
export type PalmAnswers = { [F in PalmField]: keyof (typeof PALM_FIELDS)[F]['options'] };

export function palmText(answers: PalmAnswers, notes: string | undefined): string {
  return [
    'Su mano (lo que ha observado en su mano dominante):',
    ...PALM_FIELD_IDS.map((f) => {
      const options = PALM_FIELDS[f].options as Record<string, string>;
      return `- ${PALM_FIELDS[f].label}: ${options[answers[f] as string]}`;
    }),
    notes ? `Detalles que añade: """${notes}"""` : '',
  ]
    .filter(Boolean)
    .join('\n');
}
