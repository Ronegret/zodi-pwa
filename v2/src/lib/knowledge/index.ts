/**
 * Base de conocimiento de ZODI (numerología, horóscopo chino, compatibilidad
 * de signos y planetas en cada signo). Los textos se generaron una vez en
 * voz ZODI (scripts/knowledge) y viven en el repo: la app los lee sin gastar
 * tokens y el oráculo recibe solo el fragmento que le hace falta. Puro.
 */
import ANIO from './anio.json';
import CHINO from './chino.json';
import NUMEROS from './numeros.json';
import NUMEROS_PLUS from './numeros_plus.json';
import NUMEROS_TIPOS from './numeros_tipos.json';
import PARES from './pares.json';
import PLANETAS from './planetas.json';
import SIGNOS from './signos.json';
import { SIGNS, type Sign } from '@/lib/astro-engine/types';
import { signMatch } from '@/lib/people/affinity';

export interface NumberKnowledge {
  titulo: string;
  frase: string;
  esencia: string;
  amor: string;
  trabajo: string;
  dinero: string;
  salud: string;
  sombra: string;
  reto: string;
  consejo: string;
  compatibles: number[];
  choca: number[];
  compat_texto: string;
}

export interface ChineseKnowledge {
  titulo: string;
  frase: string;
  esencia: string;
  amor: string;
  trabajo: string;
  dinero: string;
  salud: string;
  sombra: string;
  consejo: string;
  aliados: string[];
  amigo_secreto: string;
  choque: string;
  compat_texto: string;
  suerte: { numeros: number[]; colores: string[] };
}

export interface PairKnowledge {
  resumen: string;
  por_que: string;
  amor: string;
  amistad: string;
  trabajo: string;
  choque: string;
  truco: string;
}

export interface PlanetKnowledge {
  texto: string;
  en_el_dia_a_dia: string;
  luz: string;
  sombra: string;
  tip: string;
}

/** Ficha completa de un signo (biblioteca de ZODI). */
export interface SignKnowledge {
  frase: string;
  esencia: string;
  luz: string;
  sombra: string;
  amor: string;
  pasion: string;
  amistad: string;
  familia: string;
  trabajo: string;
  dinero: string;
  energia: string;
  futuro: string;
  como_te_ven: string;
  secreto: string;
  necesita: string;
  consejo: string;
}

/** Ampliación del camino de vida: personalidad, energía, futuro… */
export interface NumberPlus {
  personalidad: string;
  energia: string;
  futuro: string;
  amistad: string;
  familia: string;
  como_te_ven: string;
  secreto: string;
  pareja_ideal: string;
  profesiones: string;
}

export interface YearKnowledge {
  titulo: string;
  tema: string;
  amor: string;
  trabajo: string;
  dinero: string;
  energia: string;
  evita: string;
  consejo: string;
}

export type NumberKind = 'alma' | 'expresion' | 'personalidad' | 'nacimiento';

export type PlanetKey = 'sol' | 'luna' | 'ascendente' | 'mercurio' | 'venus' | 'marte';

const slug = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export const numberKnowledge = (n: number): NumberKnowledge | null =>
  ((NUMEROS as Record<string, NumberKnowledge>)[String(n)] as NumberKnowledge | undefined) ?? null;

export const signKnowledge = (sign: Sign): SignKnowledge | null =>
  ((SIGNOS as unknown as Record<string, SignKnowledge>)[slug(sign)] as SignKnowledge | undefined) ??
  null;

export const numberPlus = (n: number): NumberPlus | null =>
  ((NUMEROS_PLUS as unknown as Record<string, NumberPlus>)[String(n)] as NumberPlus | undefined) ??
  null;

/** Qué significa un número como Alma, Expresión, Personalidad o día de nacimiento. */
export const numberAs = (kind: NumberKind, n: number): string | null =>
  (NUMEROS_TIPOS as unknown as Record<string, Record<string, string>>)[kind]?.[String(n)] ?? null;

export const yearKnowledge = (n: number): YearKnowledge | null =>
  ((ANIO as unknown as Record<string, YearKnowledge>)[String(n)] as YearKnowledge | undefined) ??
  null;

export const chineseKnowledge = (animal: string): ChineseKnowledge | null =>
  ((CHINO as unknown as Record<string, ChineseKnowledge>)[animal] as
    ChineseKnowledge | undefined) ?? null;

export const chineseElement = (element: string): string | null =>
  ((CHINO as unknown as Record<string, Record<string, string>>)._elementos?.[element] as
    string | undefined) ?? null;

/** El par se guarda una sola vez, en el orden del zodiaco. */
export function pairKnowledge(a: Sign, b: Sign): PairKnowledge | null {
  const [x, y] = SIGNS.indexOf(a) <= SIGNS.indexOf(b) ? [a, b] : [b, a];
  return (
    ((PARES as Record<string, PairKnowledge>)[`${slug(x)}-${slug(y)}`] as
      PairKnowledge | undefined) ?? null
  );
}

export const planetKnowledge = (planet: PlanetKey, sign: Sign): PlanetKnowledge | null =>
  ((PLANETAS as Record<string, PlanetKnowledge>)[`${planet}-${slug(sign)}`] as
    PlanetKnowledge | undefined) ?? null;

/** Con quién encaja cada signo, de mejor a peor, por la puntuación de afinidad. */
export function bestAndWorst(sign: Sign): { best: Sign[]; worst: Sign[] } {
  const ranked = SIGNS.filter((s) => s !== sign)
    .map((s) => ({ s, score: signMatch(sign, s).score }))
    .sort((a, b) => b.score - a.score || SIGNS.indexOf(a.s) - SIGNS.indexOf(b.s));
  return { best: ranked.slice(0, 3).map((r) => r.s), worst: ranked.slice(-2).map((r) => r.s) };
}

/**
 * Biblioteca para las lecturas con IA: fichas ya escritas de su signo, su
 * número y su año. La IA no las copia: las traduce a su vida. Así escribe
 * menos de cero y el dato fiable viene de aquí, no del modelo.
 */
export function librarySnippet(input: {
  sunSign: Sign | null;
  lifePath: number | null;
  personalYear: number | null;
}): string {
  const cut = (s: string | undefined, n: number) =>
    s ? s.slice(0, n).replace(/\s+\S*$/, '…') : '';
  const out: string[] = [];
  const sign = input.sunSign ? signKnowledge(input.sunSign) : null;
  if (sign && input.sunSign) {
    out.push(
      `Su signo (${input.sunSign}): ${cut(sign.esencia, 260)} Amor: ${cut(sign.amor, 200)} Trabajo: ${cut(sign.trabajo, 160)} Sombra: ${cut(sign.sombra, 160)}`,
    );
  }
  const num = input.lifePath ? numberKnowledge(input.lifePath) : null;
  const plus = input.lifePath ? numberPlus(input.lifePath) : null;
  if (num && input.lifePath) {
    out.push(
      `Su camino de vida ${input.lifePath} («${num.titulo}»): ${cut(num.esencia, 220)} ${cut(plus?.futuro, 200)}`,
    );
  }
  const year = input.personalYear ? yearKnowledge(input.personalYear) : null;
  if (year) out.push(`Su año personal («${year.titulo}»): ${cut(year.tema, 240)}`);
  return out.join('\n');
}

/** Fragmento breve para el oráculo (así no se manda toda la base en cada pregunta). */
export function oracleSnippet(input: { lifePath: number; chinese: string; sunSign: Sign }): string {
  const n = numberKnowledge(input.lifePath);
  const c = chineseKnowledge(input.chinese);
  const best = bestAndWorst(input.sunSign);
  return [
    n && `Camino de vida ${input.lifePath} («${n.titulo}»): ${n.esencia}`,
    c && `${input.chinese} («${c.titulo}»): ${c.esencia}`,
    `Con quién encaja su Sol (${input.sunSign}): ${best.best.join(', ')}; choca más con ${best.worst.join(' y ')}.`,
  ]
    .filter(Boolean)
    .join('\n');
}
