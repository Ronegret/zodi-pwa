/**
 * Qué significa cada parte de un nombre. Por orden: el registro de serie
 * (~1.800 nombres y apellidos, data/*.json), el diccionario propio y las
 * reglas (patronímicos -ez, apellidos vascos y mapuches). Lo que no esté lo
 * investiga la IA en /api/nombre. Puro.
 */
import APELLIDOS from './data/apellidos.json';
import NOMBRES from './data/nombres.json';
import { FIRST_NAMES, MAPUCHE, PATRONYMIC, SURNAMES, type NameEntry } from './dictionary';

type Generated = Record<string, { w: string; o: string; m: string; n?: string }>;
const GEN: Record<'nombre' | 'apellido', Generated> = {
  nombre: NOMBRES as Generated,
  apellido: APELLIDOS as Generated,
};
const fromGen = (kind: 'nombre' | 'apellido', key: string): NameEntry | null => {
  const g = GEN[kind][key];
  if (!g) return null;
  return g.n ? { origin: g.o, meaning: g.m, note: g.n } : { origin: g.o, meaning: g.m };
};

/** Cuántos trae ZODI de serie (para enseñarlo). */
export const REGISTRY_SIZE = {
  nombres: new Set([...Object.keys(NOMBRES), ...Object.keys(FIRST_NAMES)]).size,
  apellidos: new Set([...Object.keys(APELLIDOS), ...Object.keys(SURNAMES)]).size,
};

export interface NamePart {
  word: string;
  kind: 'nombre' | 'apellido';
  /** null: no está en el libro de ZODI (se ofrece preguntarle). */
  entry: NameEntry | null;
  /** Cómo lo hemos deducido, si no venía del diccionario. */
  rule?: 'patronímico' | 'vasco' | 'mapuche';
}

export const norm = (w: string) =>
  w
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zñ]/g, '');

// Partículas que no se interpretan solas ("de la Fuente").
const PARTICLES = new Set(['de', 'del', 'la', 'las', 'los', 'y', 'e', 'san', 'santa']);

function patronymic(w: string): NameEntry | null {
  const root = PATRONYMIC[w];
  if (root) {
    const first = FIRST_NAMES[norm(root.split(' ')[0]!)];
    return {
      origin: 'castellano (patronímico)',
      meaning: `«hijo de ${root}»`,
      ...(first ? { note: `${root.split(' ')[0]} significa «${first.meaning}».` } : {}),
    };
  }
  if (/(ez|iz|az|oz)$/.test(w) && w.length > 4) {
    return {
      origin: 'castellano (probable patronímico)',
      meaning:
        'la terminación -ez significaba «hijo de»: así se apellidaba a los hijos por el nombre del padre',
    };
  }
  return null;
}

// Raíces y terminaciones típicas del euskera (casa, río, monte, piedra, vega…).
const BASQUE =
  /^(etxe|eche|echa|urru|iturr|ibarr|zubi|mendi|aran|arri|larr|goi)|(etxea|txea|tegui|tegi|egui|egi|aga|eta|zabal|garai|garay|alde|buru|eche|barren)$/;

function basque(w: string): NameEntry | null {
  if (!BASQUE.test(w) || w.length < 6) return null;
  return {
    origin: 'vasco (probable)',
    meaning:
      'por su forma, viene del euskera: casi siempre nombra la casa o el lugar de donde era la familia',
  };
}

/** Parte la palabra en trozos de mapudungun; vale si al menos dos la cubren entera. */
function mapuche(w: string): NameEntry | null {
  const parts: [string, string][] = [];
  let rest = w;
  while (rest.length) {
    const hit = MAPUCHE.find(([m]) => rest.startsWith(m));
    if (hit) {
      parts.push(hit);
      rest = rest.slice(hit[0].length);
      continue;
    }
    // Una vocal de enlace (Lef-i-mil) se admite entre partes.
    if (
      parts.length &&
      /^[aeiou]/.test(rest) &&
      MAPUCHE.some(([m]) => rest.slice(1).startsWith(m))
    ) {
      rest = rest.slice(1);
      continue;
    }
    // La "n" final de -pán / -llán.
    if (parts.length && rest === 'n') break;
    return null;
  }
  if (parts.length < 2) return null;
  return {
    origin: 'mapuche (mapudungun)',
    meaning: parts.map(([m, t]) => `${m} = ${t}`).join(' · '),
    note: 'En mapudungun lo que describe va antes: el último trozo es el sustantivo.',
  };
}

/** Lo que se sabe sin IA de una palabra (o null). */
export function knownEntry(kind: 'nombre' | 'apellido', w: string): NameEntry | null {
  if (kind === 'nombre') return fromGen('nombre', w) ?? FIRST_NAMES[w] ?? null;
  return surname(w, w).entry;
}

function surname(word: string, w: string): NamePart {
  const gen = fromGen('apellido', w);
  if (gen) return { word, kind: 'apellido', entry: gen };
  const dict = SURNAMES[w];
  if (dict) return { word, kind: 'apellido', entry: dict };
  const p = patronymic(w);
  if (p) return { word, kind: 'apellido', entry: p, rule: 'patronímico' };
  const m = mapuche(w);
  if (m) return { word, kind: 'apellido', entry: m, rule: 'mapuche' };
  const b = basque(w);
  if (b) return { word, kind: 'apellido', entry: b, rule: 'vasco' };
  return { word, kind: 'apellido', entry: null };
}

export function nameMeaning(fullName: string): NamePart[] {
  const words = fullName.trim().split(/\s+/).filter(Boolean).slice(0, 6);
  const out: NamePart[] = [];
  let surnames = false;
  words.forEach((raw, i) => {
    const w = norm(raw);
    if (!w || PARTICLES.has(w)) return;
    const word = raw.charAt(0).toUpperCase() + raw.slice(1);
    // El primero es nombre; luego, si no es un nombre conocido, empiezan los apellidos.
    const isName = Boolean(GEN.nombre[w] || FIRST_NAMES[w]);
    const isSurname = Boolean(GEN.apellido[w] || SURNAMES[w] || PATRONYMIC[w]);
    if (i === 0 || (!surnames && isName && !isSurname)) {
      out.push({ word, kind: 'nombre', entry: knownEntry('nombre', w) });
      return;
    }
    surnames = true;
    out.push(surname(word, w));
  });
  return out;
}
