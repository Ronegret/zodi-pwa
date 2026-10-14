/**
 * El mazo de las lecturas: los 22 arcanos mayores de siempre más los nueve
 * Arcanos ZODI, cartas propias de la casa con su arte. Puro y serializable.
 */
import { MAJOR_ARCANA, type TarotCard } from './daily';

export interface DeckCard extends TarotCard {
  /** Imagen del anverso (solo los Arcanos ZODI la tienen). */
  art?: string;
  /** Qué significa, para la IA y para el glosario. */
  meaning?: string;
}

const art = (slug: string) => `/tarot/${slug}-480.webp`;

export const ZODI_ARCANA: DeckCard[] = [
  {
    numeral: 'Z·I',
    name: 'La Verdad',
    art: art('la-verdad'),
    message: 'Lo que llevas tiempo sin querer ver sale hoy a la luz.',
    meaning:
      'Revelación, honestidad radical, algo oculto que sale a la luz. Invertida: verdad a medias o miedo a decirla.',
  },
  {
    numeral: 'Z·II',
    name: 'El Ego',
    art: art('el-ego'),
    message: 'Tu orgullo va al volante. Pregúntate quién le dio las llaves.',
    meaning:
      'El orgullo decide por ti, necesidad de tener razón. Invertida: inseguridad disfrazada de seguridad.',
  },
  {
    numeral: 'Z·III',
    name: 'El Ex que Vuelve',
    art: art('el-ex-que-vuelve'),
    message: 'Lo que no cerraste vuelve a llamar. No contestes con nostalgia.',
    meaning:
      'Personas o patrones del pasado que regresan; una lección que no se aprendió. Invertida: por fin pasas página.',
  },
  {
    numeral: 'Z·IV',
    name: 'El Karma',
    art: art('el-karma'),
    message: 'Lo que sembraste ya está brotando. Mira bien qué plantaste.',
    meaning:
      'Consecuencias, causa y efecto, justicia cósmica. Invertida: deuda pendiente o culpa que no te toca.',
  },
  {
    numeral: 'Z·V',
    name: 'La Red Flag',
    art: art('la-red-flag'),
    message: 'Esa señal que ignoras no es un detalle. Es la película entera.',
    meaning:
      'Señal de alarma que estás ignorando, límites que se cruzan. Invertida: ya la viste y empiezas a actuar.',
  },
  {
    numeral: 'Z·VI',
    name: 'La Mala Idea',
    art: art('la-mala-idea'),
    message: 'Te apetece muchísimo. Por eso mismo, espera 24 horas.',
    meaning:
      'Un impulso tentador que saldrá caro; pausa antes de actuar. Invertida: te frenas a tiempo.',
  },
  {
    numeral: 'Z·VII',
    name: 'La Ilusión',
    art: art('la-ilusion'),
    message: 'Estás viendo lo que quieres ver. Quítate el filtro.',
    meaning:
      'Autoengaño, idealizar a alguien o algo, expectativas infladas. Invertida: se cae la venda.',
  },
  {
    numeral: 'Z·VIII',
    name: 'La Venganza Cósmica',
    art: art('la-venganza-cosmica'),
    message: 'No hace falta que te vengues: el universo ya tiene tu caso.',
    meaning:
      'El universo equilibra las cuentas; soltar el rencor. Invertida: la tentación de tomarte la justicia por tu mano.',
  },
  {
    numeral: 'Z·IX',
    name: 'El Destino',
    art: art('el-destino'),
    message: 'Un giro que no controlas te pone donde tenías que estar.',
    meaning:
      'Un giro inesperado, sincronías, lo que tenía que pasar. Invertida: resistirte a un cambio que ya llegó.',
  },
];

export const DECK: DeckCard[] = [...MAJOR_ARCANA, ...ZODI_ARCANA];

export const TAROT_BACK = '/tarot/reverso-480.webp';

export const SPREADS = {
  una: { label: 'Una carta', hint: 'Respuesta directa', positions: ['Tu carta'] },
  tres: {
    label: 'Tres cartas',
    hint: 'Pasado · Presente · Futuro',
    positions: ['Pasado', 'Presente', 'Futuro'],
  },
  celta: {
    label: 'Cruz celta',
    hint: 'Diez cartas para lo gordo',
    positions: [
      'La situación',
      'Lo que se cruza',
      'La raíz',
      'El pasado reciente',
      'Lo que buscas',
      'Lo que viene',
      'Tú',
      'Tu entorno',
      'Miedos y esperanzas',
      'El desenlace',
    ],
  },
} as const;

export type SpreadId = keyof typeof SPREADS;
export const SPREAD_IDS = Object.keys(SPREADS) as SpreadId[];

export interface DrawnCard extends DeckCard {
  position: string;
  reversed: boolean;
}

/** Tira cartas distintas para cada posición; `random` devuelve [0, 1) (inyectable en tests). */
export function drawCards(spread: SpreadId, random: () => number = secureRandom): DrawnCard[] {
  const deck = [...DECK];
  return SPREADS[spread].positions.map((position) => {
    const card = deck.splice(Math.floor(random() * deck.length), 1)[0]!;
    return { ...card, position, reversed: random() < 0.3 };
  });
}

export function secureRandom(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0]! / 2 ** 32;
}
