/**
 * Sello y tono mayas según el Sincronario de las 13 Lunas (la cuenta que usa
 * casi todo el mundo cuando habla de "horóscopo maya"). El 29 de febrero no
 * cuenta (comparte kin con el 28). Referencia: 26/07/1987 = kin 34. Puro.
 */
interface Seal {
  name: string;
  color: 'Rojo' | 'Blanco' | 'Azul' | 'Amarillo';
  feminine: boolean;
  /** Acción y poder del sello. */
  essence: string;
}

export const SEALS: Seal[] = [
  { name: 'Dragón', color: 'Rojo', feminine: false, essence: 'nutrir, dar vida, el origen' },
  {
    name: 'Viento',
    color: 'Blanco',
    feminine: false,
    essence: 'comunicar, el espíritu, la palabra',
  },
  { name: 'Noche', color: 'Azul', feminine: true, essence: 'soñar, la abundancia interior' },
  {
    name: 'Semilla',
    color: 'Amarillo',
    feminine: true,
    essence: 'florecer, la intención que germina',
  },
  {
    name: 'Serpiente',
    color: 'Rojo',
    feminine: true,
    essence: 'instinto, fuerza vital, el cuerpo',
  },
  {
    name: 'Enlazador de Mundos',
    color: 'Blanco',
    feminine: false,
    essence: 'soltar, cerrar ciclos, igualar',
  },
  { name: 'Mano', color: 'Azul', feminine: true, essence: 'conocer, realizar, sanar' },
  { name: 'Estrella', color: 'Amarillo', feminine: true, essence: 'belleza, arte, elegancia' },
  { name: 'Luna', color: 'Rojo', feminine: true, essence: 'purificar, el flujo de las emociones' },
  { name: 'Perro', color: 'Blanco', feminine: false, essence: 'amar, la lealtad, el corazón' },
  { name: 'Mono', color: 'Azul', feminine: false, essence: 'jugar, la magia, el humor' },
  {
    name: 'Humano',
    color: 'Amarillo',
    feminine: false,
    essence: 'libre albedrío, influir, la sabiduría',
  },
  {
    name: 'Caminante del Cielo',
    color: 'Rojo',
    feminine: false,
    essence: 'explorar, el espacio, la vigilancia',
  },
  {
    name: 'Mago',
    color: 'Blanco',
    feminine: false,
    essence: 'encantar, la atemporalidad, la receptividad',
  },
  {
    name: 'Águila',
    color: 'Azul',
    feminine: true,
    essence: 'visión, crear, la mente que ve lejos',
  },
  {
    name: 'Guerrero',
    color: 'Amarillo',
    feminine: false,
    essence: 'cuestionar, la inteligencia, la valentía',
  },
  { name: 'Tierra', color: 'Rojo', feminine: true, essence: 'evolucionar, la sincronía, navegar' },
  {
    name: 'Espejo',
    color: 'Blanco',
    feminine: false,
    essence: 'reflejar, el orden, la verdad sin adornos',
  },
  {
    name: 'Tormenta',
    color: 'Azul',
    feminine: true,
    essence: 'catalizar, la transformación, la energía',
  },
  {
    name: 'Sol',
    color: 'Amarillo',
    feminine: false,
    essence: 'iluminar, la vida, el fuego universal',
  },
];

interface Tone {
  masculine: string;
  feminine: string;
  /** Pregunta que plantea el tono. */
  power: string;
}

export const TONES: Tone[] = [
  { masculine: 'Magnético', feminine: 'Magnética', power: 'propósito: unificar' },
  { masculine: 'Lunar', feminine: 'Lunar', power: 'desafío: polarizar' },
  { masculine: 'Eléctrico', feminine: 'Eléctrica', power: 'servicio: activar' },
  { masculine: 'Autoexistente', feminine: 'Autoexistente', power: 'forma: definir' },
  { masculine: 'Entonado', feminine: 'Entonada', power: 'resplandor: dar poder' },
  { masculine: 'Rítmico', feminine: 'Rítmica', power: 'igualdad: organizar' },
  { masculine: 'Resonante', feminine: 'Resonante', power: 'sintonía: canalizar' },
  { masculine: 'Galáctico', feminine: 'Galáctica', power: 'integridad: armonizar' },
  { masculine: 'Solar', feminine: 'Solar', power: 'intención: pulsar' },
  { masculine: 'Planetario', feminine: 'Planetaria', power: 'manifestación: perfeccionar' },
  { masculine: 'Espectral', feminine: 'Espectral', power: 'liberación: disolver' },
  { masculine: 'Cristal', feminine: 'Cristal', power: 'cooperación: dedicar' },
  { masculine: 'Cósmico', feminine: 'Cósmica', power: 'presencia: perdurar' },
];

const CUMULATIVE = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];

/** Días desde una época fija sin contar los 29 de febrero. */
function ordinal(date: string): number {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  return y * 365 + CUMULATIVE[m - 1]! + (m === 2 && d === 29 ? 28 : d);
}

const REFERENCE = ordinal('1987-07-26');
const REFERENCE_KIN = 34;

export interface MayanSign {
  kin: number;
  seal: Seal;
  tone: Tone;
  toneNumber: number;
  /** "Mano Azul Cristal". */
  name: string;
}

export function mayanSign(birthDate: string): MayanSign {
  const offset = ordinal(birthDate) - REFERENCE;
  const kin = ((((REFERENCE_KIN - 1 + offset) % 260) + 260) % 260) + 1;
  const seal = SEALS[(kin - 1) % 20]!;
  const toneNumber = ((kin - 1) % 13) + 1;
  const tone = TONES[toneNumber - 1]!;
  const color = seal.feminine ? feminineColor(seal.color) : seal.color;
  const adjective = seal.feminine ? tone.feminine : tone.masculine;
  return { kin, seal, tone, toneNumber, name: `${seal.name} ${color} ${adjective}` };
}

function feminineColor(color: Seal['color']): string {
  return { Rojo: 'Roja', Blanco: 'Blanca', Azul: 'Azul', Amarillo: 'Amarilla' }[color];
}

export function mayanText(sign: MayanSign): string {
  return [
    `Sincronario maya (13 Lunas): Kin ${sign.kin} · ${sign.name}.`,
    `Sello: ${sign.seal.name}, familia de color ${sign.seal.color.toLowerCase()} (${sign.seal.essence}).`,
    `Tono ${sign.toneNumber}, ${sign.tone.masculine} (${sign.tone.power}).`,
  ].join('\n');
}
