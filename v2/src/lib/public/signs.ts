/**
 * Los doce signos para las páginas públicas (sin cuenta). Textos de la Zodi
 * de antes. El orden es el de SIGNS (0 = Aries).
 */
import { SIGN_GLYPHS } from '@/lib/astro-engine/labels';
import { SIGNS, type Sign } from '@/lib/astro-engine/types';

/** El glifo va en modo texto (SIGN_GLYPHS): sin el selector, Windows pinta un emoji. */
export interface SignInfo {
  slug: string;
  name: Sign;
  glyph: string;
  dates: string;
  element: 'Fuego' | 'Tierra' | 'Aire' | 'Agua';
  modality: 'Cardinal' | 'Fijo' | 'Mutable';
  ruler: string;
  desc: string;
  traits: string[];
}

export const SIGN_INFO: SignInfo[] = [
  {
    slug: 'aries',
    name: 'Aries',
    glyph: SIGN_GLYPHS['Aries'],
    dates: '21 de marzo – 19 de abril',
    element: 'Fuego',
    modality: 'Cardinal',
    ruler: 'Marte',
    desc: 'Aries abre el zodiaco con la fuerza de quien no pide permiso. Líder nato, impulsivo y apasionado: cuando quiere algo, va a por ello antes de que los demás terminen de pensar.',
    traits: ['Valentía', 'Liderazgo', 'Impulsividad', 'Energía', 'Independencia'],
  },
  {
    slug: 'tauro',
    name: 'Tauro',
    glyph: SIGN_GLYPHS['Tauro'],
    dates: '20 de abril – 20 de mayo',
    element: 'Tierra',
    modality: 'Fijo',
    ruler: 'Venus',
    desc: 'Tauro construye en piedra lo que otros construyen en arena. Paciente, sensual y con un radar para la calidad que no falla. No se mueve hasta que está seguro, pero cuando se mueve no hay quien lo pare.',
    traits: ['Perseverancia', 'Sensualidad', 'Lealtad', 'Terquedad', 'Buen gusto'],
  },
  {
    slug: 'geminis',
    name: 'Géminis',
    glyph: SIGN_GLYPHS['Géminis'],
    dates: '21 de mayo – 20 de junio',
    element: 'Aire',
    modality: 'Mutable',
    ruler: 'Mercurio',
    desc: 'Géminis vive en dos mundos a la vez y se aburre en ambos. La mente más rápida del zodiaco: comunica de maravilla, tiene una curiosidad insaciable y mantiene cinco conversaciones mientras piensa en otra cosa.',
    traits: ['Ingenio', 'Adaptabilidad', 'Curiosidad', 'Dualidad', 'Elocuencia'],
  },
  {
    slug: 'cancer',
    name: 'Cáncer',
    glyph: SIGN_GLYPHS['Cáncer'],
    dates: '21 de junio – 22 de julio',
    element: 'Agua',
    modality: 'Cardinal',
    ruler: 'Luna',
    desc: 'Cáncer siente lo que nadie ve. Intuición brutal, memoria emocional perfecta y una forma de cuidar que lo convierte en el pilar silencioso de cualquier grupo. No se fía fácil, pero cuando lo hace es para siempre.',
    traits: ['Intuición', 'Empatía', 'Protección', 'Sensibilidad', 'Memoria'],
  },
  {
    slug: 'leo',
    name: 'Leo',
    glyph: SIGN_GLYPHS['Leo'],
    dates: '23 de julio – 22 de agosto',
    element: 'Fuego',
    modality: 'Fijo',
    ruler: 'Sol',
    desc: 'Leo no entra en una habitación: la conquista. Carisma natural, generosidad desbordante y un ego que, bien usado, se convierte en liderazgo inspirador. Nació para brillar y lo sabe perfectamente.',
    traits: ['Carisma', 'Generosidad', 'Creatividad', 'Orgullo', 'Liderazgo'],
  },
  {
    slug: 'virgo',
    name: 'Virgo',
    glyph: SIGN_GLYPHS['Virgo'],
    dates: '23 de agosto – 22 de septiembre',
    element: 'Tierra',
    modality: 'Mutable',
    ruler: 'Mercurio',
    desc: 'Virgo ve lo que no funciona antes de que nadie lo note. Analítico, meticuloso y con unos estándares que a veces solo cumple él. Detrás de cada detalle perfecto hay un Virgo que lo pensó tres veces.',
    traits: ['Precisión', 'Análisis', 'Servicio', 'Crítica', 'Perfeccionismo'],
  },
  {
    slug: 'libra',
    name: 'Libra',
    glyph: SIGN_GLYPHS['Libra'],
    dates: '23 de septiembre – 22 de octubre',
    element: 'Aire',
    modality: 'Cardinal',
    ruler: 'Venus',
    desc: 'Libra busca el punto exacto donde todo encaja. Diplomático, estético y con un sentido de la justicia que lo convierte en árbitro de cada conflicto. La indecisión es el precio de ver todos los lados a la vez.',
    traits: ['Diplomacia', 'Estética', 'Justicia', 'Indecisión', 'Encanto'],
  },
  {
    slug: 'escorpio',
    name: 'Escorpio',
    glyph: SIGN_GLYPHS['Escorpio'],
    dates: '23 de octubre – 21 de noviembre',
    element: 'Agua',
    modality: 'Fijo',
    ruler: 'Plutón y Marte',
    desc: 'Escorpio va donde nadie se atreve. Intensidad pura, poder de transformación y una capacidad de ver a través de la gente que puede resultar incómoda. No perdona fácil, pero tampoco olvida lo que vale la pena guardar.',
    traits: ['Intensidad', 'Transformación', 'Intuición', 'Poder', 'Secretismo'],
  },
  {
    slug: 'sagitario',
    name: 'Sagitario',
    glyph: SIGN_GLYPHS['Sagitario'],
    dates: '22 de noviembre – 21 de diciembre',
    element: 'Fuego',
    modality: 'Mutable',
    ruler: 'Júpiter',
    desc: 'Sagitario apunta lejos y dispara antes de pensar si el arco aguanta. Filósofo, aventurero y brutalmente honesto: necesita horizonte, movimiento y libertad para cambiar de opinión mañana.',
    traits: ['Libertad', 'Optimismo', 'Filosofía', 'Aventura', 'Franqueza'],
  },
  {
    slug: 'capricornio',
    name: 'Capricornio',
    glyph: SIGN_GLYPHS['Capricornio'],
    dates: '22 de diciembre – 19 de enero',
    element: 'Tierra',
    modality: 'Cardinal',
    ruler: 'Saturno',
    desc: 'Capricornio escala la montaña que los demás ni se atrevieron a mirar. Ambición con estructura, disciplina de hierro y una paciencia estratégica que se confunde con frialdad. Llega. Siempre llega.',
    traits: ['Ambición', 'Disciplina', 'Responsabilidad', 'Paciencia', 'Pragmatismo'],
  },
  {
    slug: 'acuario',
    name: 'Acuario',
    glyph: SIGN_GLYPHS['Acuario'],
    dates: '20 de enero – 18 de febrero',
    element: 'Aire',
    modality: 'Fijo',
    ruler: 'Urano y Saturno',
    desc: 'Acuario vive veinte años adelantado. Innovador, rebelde y con una visión de colectivo que le hace querer cambiar el mundo antes del desayuno. Necesita libertad para pensar y espacio para ser raro sin que nadie lo juzgue.',
    traits: ['Originalidad', 'Visión', 'Rebeldía', 'Humanidad', 'Independencia'],
  },
  {
    slug: 'piscis',
    name: 'Piscis',
    glyph: SIGN_GLYPHS['Piscis'],
    dates: '19 de febrero – 20 de marzo',
    element: 'Agua',
    modality: 'Mutable',
    ruler: 'Neptuno y Júpiter',
    desc: 'Piscis absorbe el mundo como una esponja y lo devuelve convertido en arte, empatía o magia. El más espiritual del zodiaco, con una creatividad que asusta y una compasión que a veces le sale cara.',
    traits: ['Empatía', 'Creatividad', 'Espiritualidad', 'Intuición', 'Evasión'],
  },
];

export const SIGN_BY_SLUG = new Map(SIGN_INFO.map((s, i) => [s.slug, { ...s, index: i }]));

export const signIndex = (sign: Sign) => SIGNS.indexOf(sign);

/** Cada signo en dos palabras, para explicar la carta a quien empieza. */
export const SIGN_KEYWORDS: Record<Sign, string> = {
  Aries: 'Impulso y valentía',
  Tauro: 'Calma y disfrute',
  Géminis: 'Curiosidad y palabra',
  Cáncer: 'Cuidado y emoción',
  Leo: 'Brillo y orgullo',
  Virgo: 'Orden y detalle',
  Libra: 'Equilibrio y encanto',
  Escorpio: 'Intensidad y verdad',
  Sagitario: 'Libertad y aventura',
  Capricornio: 'Ambición y constancia',
  Acuario: 'Originalidad e independencia',
  Piscis: 'Sensibilidad e imaginación',
};
