/**
 * Cristales: herramientas simbólicas de intención (sin promesas de salud).
 * El cristal sale de la intención y del elemento de su Sol; el día desempata
 * para que no sea siempre el mismo. Puro.
 */
export const INTENTS = {
  amor: 'Amor y autoestima',
  proteccion: 'Protección y límites',
  claridad: 'Claridad mental',
  abundancia: 'Abundancia y trabajo',
  calma: 'Calma y descanso',
  creatividad: 'Creatividad',
  intuicion: 'Intuición',
  valor: 'Valor para dar el paso',
} as const;

export type Intent = keyof typeof INTENTS;
export const INTENT_IDS = Object.keys(INTENTS) as Intent[];

export type Element = 'fuego' | 'tierra' | 'aire' | 'agua';

export interface Crystal {
  name: string;
  color: string;
  /** Para qué se usa, en una frase. */
  use: string;
  intents: Intent[];
  elements: Element[];
}

export const CRYSTALS: Crystal[] = [
  {
    name: 'Amatista',
    color: '#9b4dff',
    use: 'Calma mental, descanso y límites sin drama.',
    intents: ['calma', 'intuicion', 'proteccion'],
    elements: ['agua', 'aire'],
  },
  {
    name: 'Cuarzo rosa',
    color: '#ff8fc7',
    use: 'Amor propio primero; el resto viene después.',
    intents: ['amor', 'calma'],
    elements: ['agua', 'tierra'],
  },
  {
    name: 'Obsidiana negra',
    color: '#3a3a44',
    use: 'Protección y espejo de lo que no quieres ver.',
    intents: ['proteccion', 'valor'],
    elements: ['fuego', 'tierra'],
  },
  {
    name: 'Citrino',
    color: '#ffd23f',
    use: 'Abundancia, iniciativa y ganas de cobrar lo que vales.',
    intents: ['abundancia', 'creatividad', 'valor'],
    elements: ['fuego', 'aire'],
  },
  {
    name: 'Lapislázuli',
    color: '#3f6bff',
    use: 'Decir la verdad con calma y pensar claro.',
    intents: ['claridad', 'intuicion'],
    elements: ['aire', 'agua'],
  },
  {
    name: 'Selenita',
    color: '#e9ecff',
    use: 'Limpiar el ruido y empezar de cero.',
    intents: ['claridad', 'calma'],
    elements: ['aire', 'agua'],
  },
  {
    name: 'Turmalina negra',
    color: '#20202a',
    use: 'Escudo frente a la energía ajena (y los grupos de WhatsApp).',
    intents: ['proteccion'],
    elements: ['tierra'],
  },
  {
    name: 'Malaquita',
    color: '#2fbf71',
    use: 'Transformación: soltar lo que ya no te sirve.',
    intents: ['valor', 'amor'],
    elements: ['tierra', 'agua'],
  },
  {
    name: 'Cornalina',
    color: '#ff6a3d',
    use: 'Motivación, creatividad y fuego para arrancar.',
    intents: ['creatividad', 'valor', 'abundancia'],
    elements: ['fuego'],
  },
  {
    name: 'Ojo de tigre',
    color: '#c48a2c',
    use: 'Foco, confianza y decisiones con los pies en el suelo.',
    intents: ['abundancia', 'valor', 'claridad'],
    elements: ['tierra', 'fuego'],
  },
  {
    name: 'Piedra luna',
    color: '#cfd8ff',
    use: 'Intuición, ciclos y escucharte por dentro.',
    intents: ['intuicion', 'amor'],
    elements: ['agua'],
  },
  {
    name: 'Cuarzo transparente',
    color: '#f4f7ff',
    use: 'El comodín: amplifica la intención que le pongas.',
    intents: ['claridad', 'creatividad', 'abundancia'],
    elements: ['fuego', 'tierra', 'aire', 'agua'],
  },
];

/** Elemento de cada signo (índice 0 = Aries). */
const SIGN_ELEMENT: Element[] = ['fuego', 'tierra', 'aire', 'agua'];
export const elementOfSign = (signIndex: number): Element => SIGN_ELEMENT[signIndex % 4]!;

/** Cristal para esa intención: primero los de su elemento; el día elige entre ellos. */
export function pickCrystal(intent: Intent, element: Element | null, civilDate: string): Crystal {
  const forIntent = CRYSTALS.filter((c) => c.intents.includes(intent));
  const matching = element ? forIntent.filter((c) => c.elements.includes(element)) : [];
  const pool = matching.length ? matching : forIntent;
  const day = Number(civilDate.replaceAll('-', ''));
  return pool[day % pool.length]!;
}

export function crystalText(
  crystal: Crystal,
  intent: Intent,
  question: string | undefined,
): string {
  return [
    `Intención: ${INTENTS[intent]}.`,
    question ? `Lo que le ronda: "${question}"` : '',
    `Cristal elegido para hoy: ${crystal.name} — ${crystal.use}`,
  ]
    .filter(Boolean)
    .join('\n');
}
