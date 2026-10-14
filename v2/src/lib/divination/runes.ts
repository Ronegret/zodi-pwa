/**
 * Runas del Elder Futhark (24). Las simétricas no pueden salir invertidas
 * (merkstave): se ven igual del derecho y del revés. Puro.
 */
import { secureRandom } from '@/lib/tarot/deck';

export interface Rune {
  symbol: string;
  name: string;
  /** Qué significa al derecho. */
  meaning: string;
  /** Se puede invertir (no es simétrica). */
  reversible: boolean;
}

export const RUNES: Rune[] = [
  {
    symbol: 'ᚠ',
    name: 'Fehu',
    meaning: 'Riqueza, lo que ganas y cómo lo cuidas',
    reversible: true,
  },
  { symbol: 'ᚢ', name: 'Uruz', meaning: 'Fuerza bruta, salud, empuje', reversible: true },
  {
    symbol: 'ᚦ',
    name: 'Thurisaz',
    meaning: 'Conflicto, defensa, una espina necesaria',
    reversible: true,
  },
  {
    symbol: 'ᚨ',
    name: 'Ansuz',
    meaning: 'Mensajes, palabra, una señal que llega',
    reversible: true,
  },
  { symbol: 'ᚱ', name: 'Raidho', meaning: 'Viaje, movimiento, ritmo correcto', reversible: true },
  {
    symbol: 'ᚲ',
    name: 'Kenaz',
    meaning: 'Claridad, talento, la antorcha que enciende',
    reversible: true,
  },
  { symbol: 'ᚷ', name: 'Gebo', meaning: 'Regalo, intercambio, pacto', reversible: false },
  { symbol: 'ᚹ', name: 'Wunjo', meaning: 'Alegría, pertenencia, por fin encaja', reversible: true },
  {
    symbol: 'ᚺ',
    name: 'Hagalaz',
    meaning: 'Granizo: ruptura necesaria que limpia',
    reversible: false,
  },
  {
    symbol: 'ᚾ',
    name: 'Naudiz',
    meaning: 'Necesidad, límite, aprender a esperar',
    reversible: false,
  },
  {
    symbol: 'ᛁ',
    name: 'Isa',
    meaning: 'Hielo: pausa, todo congelado un momento',
    reversible: false,
  },
  { symbol: 'ᛃ', name: 'Jera', meaning: 'Cosecha, ciclos, recoger lo sembrado', reversible: false },
  { symbol: 'ᛇ', name: 'Eihwaz', meaning: 'Resistencia, el tejo que aguanta', reversible: false },
  {
    symbol: 'ᛈ',
    name: 'Perthro',
    meaning: 'Misterio, azar, lo que aún no se ve',
    reversible: true,
  },
  { symbol: 'ᛉ', name: 'Algiz', meaning: 'Protección, instinto, límites sanos', reversible: true },
  { symbol: 'ᛊ', name: 'Sowilo', meaning: 'Sol, éxito, energía que gana', reversible: false },
  {
    symbol: 'ᛏ',
    name: 'Tiwaz',
    meaning: 'Justicia, coraje, sacrificio con sentido',
    reversible: true,
  },
  {
    symbol: 'ᛒ',
    name: 'Berkano',
    meaning: 'Nacimiento, cuidado, crecer despacio',
    reversible: true,
  },
  { symbol: 'ᛖ', name: 'Ehwaz', meaning: 'Alianza, avance en equipo', reversible: true },
  { symbol: 'ᛗ', name: 'Mannaz', meaning: 'Tú y los demás, conciencia de ti', reversible: true },
  { symbol: 'ᛚ', name: 'Laguz', meaning: 'Agua, intuición, dejarse llevar', reversible: true },
  { symbol: 'ᛜ', name: 'Ingwaz', meaning: 'Potencial listo para nacer', reversible: false },
  { symbol: 'ᛞ', name: 'Dagaz', meaning: 'Amanecer, giro total, despertar', reversible: false },
  { symbol: 'ᛟ', name: 'Othala', meaning: 'Herencia, hogar, lo que es tuyo', reversible: true },
];

export const RUNE_POSITIONS = {
  1: ['Tu runa'],
  3: ['Lo que fue', 'Lo que es', 'Lo que viene'],
} as const;

export type RuneCount = keyof typeof RUNE_POSITIONS;

export interface DrawnRune extends Rune {
  position: string;
  reversed: boolean;
}

export function drawRunes(count: RuneCount, random: () => number = secureRandom): DrawnRune[] {
  const bag = [...RUNES];
  return RUNE_POSITIONS[count].map((position) => {
    const rune = bag.splice(Math.floor(random() * bag.length), 1)[0]!;
    return { ...rune, position, reversed: rune.reversible && random() < 0.3 };
  });
}

export function runesText(runes: DrawnRune[], question: string | undefined): string {
  return [
    question ? `Pregunta: "${question}"` : 'Sin pregunta concreta: lectura general de su momento.',
    'Runas tiradas (Elder Futhark):',
    ...runes.map(
      (r) =>
        `- ${r.position}: ${r.symbol} ${r.name}${r.reversed ? ' (invertida, merkstave)' : ''} — ${r.meaning}`,
    ),
  ].join('\n');
}
