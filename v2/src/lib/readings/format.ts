/** Formatos de las lecturas guardadas (listas y detalle). Puro. */

/** Texto plano de una lectura (sin marcas de Markdown), recortado por palabra. */
export function excerpt(markdown: string, max: number): string {
  const plain = markdown
    .replace(/(\*\*|__|\*|_)/g, '')
    .replace(/^\s*(?:[-•]|\d+[.)])\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (plain.length <= max) return plain;
  const cut = plain.slice(0, max);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), max * 0.6)).trimEnd()}…`;
}

export function readingDate(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone,
  }).format(new Date(iso));
}
