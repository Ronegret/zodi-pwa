/**
 * Catálogo de logros. Los ids son los que desbloquea record_activity() en
 * la base de datos (migración 20261012130000_activity.sql); aquí va lo que
 * se ve: título, texto y cómo se consigue. Cada logro da 5 gemas.
 */
export interface Achievement {
  id: string;
  /** Símbolo de texto (sin emojis de color: el estilo es neón). */
  glyph: string;
  title: string;
  desc: string;
  /** Cómo se consigue, para los que faltan. */
  how: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'primera-senal',
    glyph: '✦',
    title: 'Primera señal',
    desc: 'Tu primera lectura con ZODI.',
    how: 'Haz cualquier lectura.',
  },
  {
    id: 'primer-tarot',
    glyph: '🂠',
    title: 'Primer tarot',
    desc: 'Tiraste las cartas por primera vez.',
    how: 'Haz una tirada de tarot.',
  },
  {
    id: 'cruz-celta',
    glyph: '✚',
    title: 'Cruz completa',
    desc: 'Aguantaste las diez cartas de la cruz celta.',
    how: 'Echa una cruz celta.',
  },
  {
    id: 'las-runas-hablan',
    glyph: 'ᚱ',
    title: 'Las runas hablan',
    desc: 'Consultaste a los dioses nórdicos.',
    how: 'Tira las runas.',
  },
  {
    id: 'mapa-descubierto',
    glyph: '◎',
    title: 'Mapa descubierto',
    desc: 'ZODI interpretó tu carta natal.',
    how: 'Pide la lectura de tu carta natal.',
  },
  {
    id: 'quimica-detectada',
    glyph: '♡',
    title: 'Química detectada',
    desc: 'Primer análisis de compatibilidad.',
    how: 'Compara tu carta con la de alguien.',
  },
  {
    id: 'sonador',
    glyph: '☾',
    title: 'Soñador consciente',
    desc: 'ZODI tradujo tu primer sueño.',
    how: 'Cuéntale un sueño a ZODI.',
  },
  {
    id: 'los-numeros-no-mienten',
    glyph: '#',
    title: 'Los números no mienten',
    desc: 'Primera lectura de numerología o de tu nombre.',
    how: 'Pide tu numerología o la de tu nombre.',
  },
  {
    id: 'aguanto-el-roast',
    glyph: '☠',
    title: 'Aguantó el roast',
    desc: 'Pediste que te destrozaran y sobreviviste.',
    how: 'Pide el roast astral.',
  },
  {
    id: 'consulta-al-oraculo',
    glyph: '◉',
    title: 'Habla con el oráculo',
    desc: 'Primera consulta libre al oráculo.',
    how: 'Pregúntale algo al oráculo.',
  },
  {
    id: 'favorita',
    glyph: '★',
    title: 'Esta me la guardo',
    desc: 'Marcaste tu primera lectura favorita.',
    how: 'Marca una lectura como favorita.',
  },
  {
    id: 'coleccionista',
    glyph: '❖',
    title: 'Coleccionista de señales',
    desc: 'Diez lecturas guardadas.',
    how: 'Llega a diez lecturas.',
  },
  {
    id: 'explorador',
    glyph: '✧',
    title: 'Explorador del cosmos',
    desc: 'Probaste ocho tipos de lectura distintos.',
    how: 'Prueba ocho tipos de lectura.',
  },
  {
    id: 'voz-de-la-comunidad',
    glyph: '❝',
    title: 'Voz de la comunidad',
    desc: 'Tu primera publicación en la comunidad.',
    how: 'Publica algo en la comunidad.',
  },
  {
    id: 'racha-3',
    glyph: '🜂',
    title: 'Racha de 3 días',
    desc: 'Tres días seguidos mirando al cielo.',
    how: 'Entra tres días seguidos.',
  },
  {
    id: 'racha-7',
    glyph: '🜂',
    title: 'Racha semanal',
    desc: 'Siete días seguidos sin fallar.',
    how: 'Entra siete días seguidos.',
  },
  {
    id: 'racha-30',
    glyph: '🜂',
    title: 'Constancia astral',
    desc: 'Treinta días seguidos. Esto ya es un ritual.',
    how: 'Entra treinta días seguidos.',
  },
  {
    id: 'nivel-5',
    glyph: '♛',
    title: 'Nivel 5',
    desc: 'Ya lees las señales sin ayuda.',
    how: 'Llega al nivel 5.',
  },
  {
    id: 'nivel-10',
    glyph: '♛',
    title: 'Nivel 10',
    desc: 'El cosmos ya te conoce por tu nombre.',
    how: 'Llega al nivel 10.',
  },
];

export const ACHIEVEMENT_BY_ID = new Map(ACHIEVEMENTS.map((a) => [a.id, a]));

/** Cuánto XP da cada cosa (igual que record_activity). */
export const XP_RULES = [
  { action: 'Primer paso del día (racha)', xp: 5 },
  { action: 'Una lectura o consulta al oráculo', xp: 10 },
  { action: 'Publicar en la comunidad', xp: 8 },
  { action: 'Comentar', xp: 3 },
  { action: 'Marcar una favorita', xp: 2 },
] as const;
