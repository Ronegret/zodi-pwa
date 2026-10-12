/**
 * Numerología del nombre (tabla pitagórica, sin tildes; se respetan 11, 22 y
 * 33). Sin dependencias: también la usa el formulario para la vista previa.
 */
const MASTER = new Set([11, 22, 33]);

function reduce(n: number): number {
  let x = n;
  while (x > 9 && !MASTER.has(x)) {
    x = String(x)
      .split('')
      .reduce((s, d) => s + Number(d), 0);
  }
  return x;
}

const PYTHAGOREAN: Record<string, number> = Object.fromEntries(
  'abcdefghijklmnopqrstuvwxyz'.split('').map((c, i) => [c, (i % 9) + 1]),
);

const lettersOf = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
const sumOf = (letters: string) =>
  reduce(letters.split('').reduce((s, c) => s + (PYTHAGOREAN[c] ?? 0), 0));

export interface NameNumbers {
  /** Cada parte del nombre con su vibración. */
  parts: { label: string; text: string; value: number }[];
  /** Todas las letras. */
  expression: number;
  /** Solo vocales: lo que quieres por dentro. */
  soul: number;
  /** Solo consonantes: cómo te ven. */
  personality: number;
}

/** Numerología del nombre (pitagórica): por partes, expresión, alma y personalidad. */
export function nameNumbers(name: {
  first: string;
  last1?: string | undefined;
  last2?: string | undefined;
}): NameNumbers | null {
  const parts = (
    [
      ['Nombre', name.first],
      ['Primer apellido', name.last1],
      ['Segundo apellido', name.last2],
    ] as const
  )
    .filter(([, text]) => text && lettersOf(text))
    .map(([label, text]) => ({ label, text: text!.trim(), value: sumOf(lettersOf(text!)) }));
  const all = lettersOf(parts.map((p) => p.text).join(''));
  if (!all) return null;
  const vowels = all.replace(/[^aeiou]/g, '');
  const consonants = all.replace(/[aeiou]/g, '');
  return {
    parts,
    expression: sumOf(all),
    soul: vowels ? sumOf(vowels) : 0,
    personality: consonants ? sumOf(consonants) : 0,
  };
}

export function nameText(n: NameNumbers): string {
  return [
    ...n.parts.map((p) => `${p.label}: ${p.text} → ${p.value}`),
    `Número de expresión (todo el nombre): ${n.expression}`,
    `Número del alma (vocales): ${n.soul}`,
    `Número de personalidad (consonantes): ${n.personality}`,
  ].join('\n');
}
