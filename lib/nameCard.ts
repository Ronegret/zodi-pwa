// Datos simbólicos del nombre — significado, origen y día del santo
// Se muestran en el hero del dashboard como subtítulo bajo el nombre del usuario.

export type NameCard = {
  meaning: string;   // significado breve
  origin:  string;   // origen etimológico
  saint?:  string;   // día del santo (formato "13 mar")
};

const DATA: Record<string, NameCard> = {
  // ── Masculinos ──────────────────────────────────────────────────────────
  rodrigo:    { meaning: "Guerrero glorioso",          origin: "Germánico",    saint: "13 mar" },
  gabriel:    { meaning: "Mensajero de Dios",          origin: "Hebreo",       saint: "29 sep" },
  miguel:     { meaning: "¿Quién como Dios?",          origin: "Hebreo",       saint: "29 sep" },
  alejandro:  { meaning: "El que protege al pueblo",   origin: "Griego",       saint: "3 may" },
  sebastian:  { meaning: "El venerado",                origin: "Griego",       saint: "20 ene" },
  daniel:     { meaning: "Dios es mi juez",            origin: "Hebreo",       saint: "11 dic" },
  nicolas:    { meaning: "Victoria del pueblo",        origin: "Griego",       saint: "6 dic" },
  juan:       { meaning: "Dios es misericordioso",     origin: "Hebreo",       saint: "24 jun" },
  carlos:     { meaning: "Hombre libre",               origin: "Germánico",    saint: "4 nov" },
  jorge:      { meaning: "El agricultor",              origin: "Griego",       saint: "23 abr" },
  pablo:      { meaning: "El pequeño",                 origin: "Latino",       saint: "29 jun" },
  david:      { meaning: "El amado",                   origin: "Hebreo",       saint: "29 dic" },
  andres:     { meaning: "Valeroso",                   origin: "Griego",       saint: "30 nov" },
  luis:       { meaning: "Guerrero ilustre",           origin: "Germánico",    saint: "25 ago" },
  fernando:   { meaning: "Atrevido en la paz",         origin: "Germánico",    saint: "30 may" },
  diego:      { meaning: "El que suplanta",            origin: "Hebreo",       saint: "13 nov" },
  ignacio:    { meaning: "El ardiente",                origin: "Latino",       saint: "31 jul" },
  mateo:      { meaning: "Don de Dios",                origin: "Hebreo",       saint: "21 sep" },
  emilio:     { meaning: "El que trabaja",             origin: "Latino",       saint: "22 may" },
  sergio:     { meaning: "El guardián",                origin: "Latino",       saint: "7 oct" },
  antonio:    { meaning: "El que florece",             origin: "Latino",       saint: "13 jun" },
  jose:       { meaning: "Dios añadirá",               origin: "Hebreo",       saint: "19 mar" },
  francisco:  { meaning: "El libre",                   origin: "Latino",       saint: "4 oct" },
  manuel:     { meaning: "Dios está con nosotros",     origin: "Hebreo",       saint: "1 ene" },
  pedro:      { meaning: "La roca",                    origin: "Griego",       saint: "29 jun" },
  jesus:      { meaning: "Dios salva",                 origin: "Hebreo",       saint: "1 ene" },
  rafael:     { meaning: "Dios ha sanado",             origin: "Hebreo",       saint: "29 sep" },
  hugo:       { meaning: "El de mente brillante",      origin: "Germánico",    saint: "1 abr" },
  oscar:      { meaning: "Lanza divina",               origin: "Escandinavo",  saint: "3 feb" },
  victor:     { meaning: "El victorioso",              origin: "Latino",       saint: "28 jul" },
  marcos:     { meaning: "Del dios Marte",             origin: "Latino",       saint: "25 abr" },
  martin:     { meaning: "Del dios Marte",             origin: "Latino",       saint: "11 nov" },
  tomas:      { meaning: "El gemelo",                  origin: "Hebreo",       saint: "3 jul" },
  alberto:    { meaning: "Noble y brillante",          origin: "Germánico",    saint: "15 nov" },
  ivan:       { meaning: "Dios es misericordioso",     origin: "Hebreo",       saint: "24 jun" },
  cristian:   { meaning: "El que sigue a Cristo",      origin: "Latino",       saint: "15 dic" },
  mario:      { meaning: "Del dios Marte",             origin: "Latino",       saint: "8 ene" },
  ricardo:    { meaning: "Caudillo poderoso",          origin: "Germánico",    saint: "3 abr" },
  roberto:    { meaning: "Famoso por su gloria",       origin: "Germánico",    saint: "29 abr" },
  enrique:    { meaning: "El que manda en casa",       origin: "Germánico",    saint: "13 jul" },
  cesar:      { meaning: "El que tiene cabello",       origin: "Latino",       saint: "26 ago" },
  alex:       { meaning: "El que protege al pueblo",   origin: "Griego",       saint: "3 may" },
  hector:     { meaning: "El que mantiene firme",      origin: "Griego",       saint: "— " },
  adrian:     { meaning: "El del mar Adriático",       origin: "Latino",       saint: "8 sep" },
  santiago:   { meaning: "San Jacobo",                 origin: "Hebreo",       saint: "25 jul" },
  javier:     { meaning: "Nuevo hogar",                origin: "Vasco",        saint: "3 dic" },
  raul:       { meaning: "Consejo del lobo",           origin: "Germánico",    saint: "21 jun" },
  kevin:      { meaning: "El hermoso de nacimiento",   origin: "Irlandés",     saint: "3 jun" },
  ernesto:    { meaning: "El combatiente serio",       origin: "Germánico",    saint: "7 nov" },
  leo:        { meaning: "León, el valiente",          origin: "Latino",       saint: "10 nov" },
  lucas:      { meaning: "El que da luz",              origin: "Griego",       saint: "18 oct" },
  // ── Femeninos ──────────────────────────────────────────────────────────
  sofia:      { meaning: "Sabiduría",                  origin: "Griego",       saint: "15 may" },
  camila:     { meaning: "La que sirve al templo",     origin: "Latino",       saint: "14 jul" },
  valeria:    { meaning: "Fuerte y sana",              origin: "Latino",       saint: "28 abr" },
  valentina:  { meaning: "Fuerte y valiente",          origin: "Latino",       saint: "14 feb" },
  mariana:    { meaning: "Del mar, llena de gracia",   origin: "Hebreo",       saint: "17 ago" },
  laura:      { meaning: "Laureada, victoriosa",       origin: "Latino",       saint: "19 oct" },
  patricia:   { meaning: "Noble",                      origin: "Latino",       saint: "17 mar" },
  lucia:      { meaning: "Luz",                        origin: "Latino",       saint: "13 dic" },
  andrea:     { meaning: "Valerosa",                   origin: "Griego",       saint: "30 nov" },
  elena:      { meaning: "Brillante, luminosa",        origin: "Griego",       saint: "18 ago" },
  maria:      { meaning: "La amada, la elegida",       origin: "Hebreo",       saint: "12 sep" },
  paula:      { meaning: "La pequeña",                 origin: "Latino",       saint: "26 ene" },
  claudia:    { meaning: "La ilustre",                 origin: "Latino",       saint: "18 may" },
  natalia:    { meaning: "Día de Navidad",             origin: "Latino",       saint: "1 dic" },
  carolina:   { meaning: "Mujer libre",                origin: "Germánico",    saint: "4 nov" },
  daniela:    { meaning: "Dios es mi juez",            origin: "Hebreo",       saint: "11 dic" },
  ana:        { meaning: "La graciosa",                origin: "Hebreo",       saint: "26 jul" },
  beatriz:    { meaning: "La que trae felicidad",      origin: "Latino",       saint: "29 jul" },
  raquel:     { meaning: "Oveja del rebaño",           origin: "Hebreo",       saint: "2 sep" },
  monica:     { meaning: "La que aconseja",            origin: "Griego",       saint: "27 ago" },
  marta:      { meaning: "La señora de la casa",       origin: "Arameo",       saint: "29 jul" },
  teresa:     { meaning: "Cazadora o cosechadora",     origin: "Griego",       saint: "15 oct" },
  carla:      { meaning: "Mujer libre",                origin: "Germánico",    saint: "4 nov" },
  rosa:       { meaning: "La rosa",                    origin: "Latino",       saint: "23 ago" },
  sara:       { meaning: "Princesa",                   origin: "Hebreo",       saint: "9 oct" },
  irene:      { meaning: "La pacífica",                origin: "Griego",       saint: "20 oct" },
  carmen:     { meaning: "Huerto, canción",            origin: "Hebreo",       saint: "16 jul" },
  alba:       { meaning: "El amanecer",                origin: "Latino",       saint: "3 sep" },
  silvia:     { meaning: "La del bosque",              origin: "Latino",       saint: "3 nov" },
  veronica:   { meaning: "La que trae la victoria",   origin: "Griego-Latino", saint: "4 feb" },
  lorena:     { meaning: "La del laurel",              origin: "Latino",       saint: "10 ago" },
  nuria:      { meaning: "Fuego, luz",                 origin: "Hebreo",       saint: "8 sep" },
  laia:       { meaning: "La que habla bien",          origin: "Griego",       saint: "5 ago" },
  mia:        { meaning: "La mía, la amada",           origin: "Escandinavo",  saint: "25 mar" },
  emma:       { meaning: "La universal",               origin: "Germánico",    saint: "19 abr" },
  olivia:     { meaning: "Del olivo",                  origin: "Latino",       saint: "5 mar" },
  isabella:   { meaning: "Consagrada a Dios",          origin: "Hebreo",       saint: "22 feb" },
  noa:        { meaning: "Movimiento, descanso",       origin: "Hebreo",       saint: "— " },
  luna:       { meaning: "La Luna",                    origin: "Latino",       saint: "— " },
  ariadna:    { meaning: "La muy pura",                origin: "Griego",       saint: "17 sep" },
  ines:       { meaning: "Pura, casta",                origin: "Griego",       saint: "21 ene" },
  julia:      { meaning: "Del linaje de Julio",        origin: "Latino",       saint: "22 may" },
  rebeca:     { meaning: "La que enlaza",              origin: "Hebreo",       saint: "25 mar" },
  amanda:     { meaning: "La que merece ser amada",    origin: "Latino",       saint: "— " },
  miriam:     { meaning: "La amada",                   origin: "Hebreo",       saint: "15 ago" },
};

// ── Planeta regente por signo ─────────────────────────────────────────────────
export type PlanetData = { planet: string; symbol: string; keyword: string };

const SIGN_RULERS: Record<string, PlanetData> = {
  Aries:       { planet: "Marte",    symbol: "♂",  keyword: "acción y energía" },
  Tauro:       { planet: "Venus",    symbol: "♀",  keyword: "placer y valor" },
  Géminis:     { planet: "Mercurio", symbol: "☿",  keyword: "mente y comunicación" },
  Cáncer:      { planet: "Luna",     symbol: "☽",  keyword: "emoción e instinto" },
  Leo:         { planet: "Sol",      symbol: "☀",  keyword: "identidad y poder" },
  Virgo:       { planet: "Mercurio", symbol: "☿",  keyword: "análisis y detalle" },
  Libra:       { planet: "Venus",    symbol: "♀",  keyword: "armonía y justicia" },
  Escorpio:    { planet: "Plutón",   symbol: "♇",  keyword: "transformación y poder" },
  Sagitario:   { planet: "Júpiter",  symbol: "♃",  keyword: "expansión y sabiduría" },
  Capricornio: { planet: "Saturno",  symbol: "♄",  keyword: "disciplina y estructura" },
  Acuario:     { planet: "Urano",    symbol: "♅",  keyword: "innovación y libertad" },
  Piscis:      { planet: "Neptuno",  symbol: "♆",  keyword: "intuición y misterio" },
};

export function getSignRuler(sign?: string): PlanetData | null {
  if (!sign) return null;
  return SIGN_RULERS[sign] ?? null;
}

// ── Cristal del día ───────────────────────────────────────────────────────────
export type CrystalData = { name: string; emoji: string; intent: string };

const CRYSTALS: CrystalData[] = [
  { name: "Amatista",        emoji: "💜", intent: "intuición" },
  { name: "Cuarzo rosa",     emoji: "🌸", intent: "amor propio" },
  { name: "Obsidiana",       emoji: "🖤", intent: "protección" },
  { name: "Citrino",         emoji: "🌕", intent: "abundancia" },
  { name: "Lapislázuli",     emoji: "💙", intent: "comunicación" },
  { name: "Selenita",        emoji: "🤍", intent: "claridad mental" },
  { name: "Turmalina negra", emoji: "⬛", intent: "bloqueo energético" },
  { name: "Malaquita",       emoji: "💚", intent: "transformación" },
  { name: "Cuarzo claro",    emoji: "🔮", intent: "amplificación" },
  { name: "Ojo de tigre",    emoji: "🟤", intent: "enfoque" },
  { name: "Ágata azul",      emoji: "🔵", intent: "equilibrio" },
  { name: "Pirita",          emoji: "✨", intent: "prosperidad" },
];

// Bias por elemento para que el cristal tenga afinidad con el signo
const ELEMENT_BIAS: Record<string, number> = {
  Fuego: 0, Tierra: 3, Aire: 4, Agua: 0,
};

const SIGN_ELEMENT: Record<string, string> = {
  Aries: "Fuego", Leo: "Fuego", Sagitario: "Fuego",
  Tauro: "Tierra", Virgo: "Tierra", Capricornio: "Tierra",
  Géminis: "Aire", Libra: "Aire", Acuario: "Aire",
  Cáncer: "Agua", Escorpio: "Agua", Piscis: "Agua",
};

export function getDailyCrystal(sign?: string): CrystalData {
  const element = SIGN_ELEMENT[sign ?? ""] ?? "Fuego";
  const bias    = ELEMENT_BIAS[element] ?? 0;
  const now     = new Date();
  const start   = new Date(now.getFullYear(), 0, 0).getTime();
  const day     = Math.floor((now.getTime() - start) / 86400000);
  const idx     = (day * 5 + bias) % CRYSTALS.length;
  return CRYSTALS[idx];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function normalize(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function getNameCard(displayName?: string): NameCard | null {
  if (!displayName) return null;
  const first = displayName.split(" ")[0];
  const key   = normalize(first);
  return DATA[key] ?? null;
}
