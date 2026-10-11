/**
 * Carta del día: un arcano mayor por persona y día, estable durante todo el
 * día (hash de id + fecha civil). Las lecturas de tarot con IA llegan en la
 * Fase 7; esto es la carta del dashboard.
 */
export interface TarotCard {
  numeral: string;
  name: string;
  /** Una línea con el tono Zodi. */
  message: string;
}

export const MAJOR_ARCANA: TarotCard[] = [
  { numeral: '0', name: 'El Loco', message: 'Salta. El paracaídas lo coses por el camino.' },
  {
    numeral: 'I',
    name: 'El Mago',
    message: 'Tienes todo lo que necesitas. Deja de buscar excusas en Amazon.',
  },
  {
    numeral: 'II',
    name: 'La Sacerdotisa',
    message: 'Tu intuición ya lo sabe. Haz caso antes de preguntar al grupo.',
  },
  {
    numeral: 'III',
    name: 'La Emperatriz',
    message: 'Hoy toca cuidarte como cuidas tus plantas (las vivas).',
  },
  {
    numeral: 'IV',
    name: 'El Emperador',
    message: 'Pon orden. Empieza por el escritorio y sigue por tu agenda.',
  },
  {
    numeral: 'V',
    name: 'El Hierofante',
    message: 'Escucha a quien sabe más, aunque te cueste admitirlo.',
  },
  { numeral: 'VI', name: 'Los Enamorados', message: 'Elige. No elegir también es elegir, y peor.' },
  {
    numeral: 'VII',
    name: 'El Carro',
    message: 'Acelera, pero mira por dónde. Las prisas no son plan.',
  },
  {
    numeral: 'VIII',
    name: 'La Fuerza',
    message: 'La calma también es fuerza. Respira antes de rugir.',
  },
  {
    numeral: 'IX',
    name: 'El Ermitaño',
    message: 'Un rato a solas no es aislarse: es cargar batería.',
  },
  {
    numeral: 'X',
    name: 'La Rueda de la Fortuna',
    message: 'Todo gira. Si hoy estás abajo, mañana no.',
  },
  {
    numeral: 'XI',
    name: 'La Justicia',
    message: 'Lo que siembras, recoges. Revisa qué sembraste.',
  },
  { numeral: 'XII', name: 'El Colgado', message: 'Míralo del revés: quizá así sí tiene sentido.' },
  {
    numeral: 'XIII',
    name: 'La Muerte',
    message: 'Algo termina. Tranquilidad: no eres tú, es una etapa.',
  },
  { numeral: 'XIV', name: 'La Templanza', message: 'Ni todo ni nada. Hoy gana el término medio.' },
  { numeral: 'XV', name: 'El Diablo', message: 'Ese vicio que dices controlar te está mirando.' },
  {
    numeral: 'XVI',
    name: 'La Torre',
    message: 'Se cae lo que estaba mal construido. Deja que caiga.',
  },
  { numeral: 'XVII', name: 'La Estrella', message: 'Hay esperanza, y esta vez no es humo.' },
  { numeral: 'XVIII', name: 'La Luna', message: 'No todo es lo que parece. Lee la letra pequeña.' },
  { numeral: 'XIX', name: 'El Sol', message: 'Día luminoso. Disfrútalo sin buscarle la pega.' },
  { numeral: 'XX', name: 'El Juicio', message: 'Toca decidir quién quieres ser a partir de hoy.' },
  {
    numeral: 'XXI',
    name: 'El Mundo',
    message: 'Cierras un ciclo. Celébralo antes de empezar otro.',
  },
];

/** FNV-1a de 32 bits: estable y sin dependencias. */
export function hash32(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function dailyCard(userId: string, civilDate: string): TarotCard {
  return MAJOR_ARCANA[hash32(`${userId}:${civilDate}`) % MAJOR_ARCANA.length]!;
}
