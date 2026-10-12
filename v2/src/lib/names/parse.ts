/** Lee la respuesta JSON de la IA sobre un nombre y descarta lo dudoso. Puro. */
import type { NameEntry } from './dictionary';

const clean = (s: unknown, n: number) =>
  typeof s === 'string' && s.trim()
    ? s.trim().replace(/\s+/g, ' ').replace(/\.$/, '').slice(0, n)
    : undefined;

export function parseEntry(text: string): NameEntry | null {
  try {
    const json = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)) as Record<
      string,
      unknown
    >;
    const origin = clean(json.o, 80);
    const meaning = clean(json.m, 200);
    if (!origin || !meaning || origin === 'desconocido' || meaning === 'desconocido') return null;
    const note = clean(json.n, 200);
    return note ? { origin, meaning, note } : { origin, meaning };
  } catch {
    return null;
  }
}
