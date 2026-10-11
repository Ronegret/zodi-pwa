/**
 * Niveles por XP: umbral(n) = 50·n·(n−1) → nivel 2 a 100 XP, 3 a 300,
 * 4 a 600… Cada nivel cuesta 100 XP más que el anterior.
 */
export const xpThreshold = (level: number) => 50 * level * (level - 1);

export function levelFromXp(xp: number): number {
  let level = 1;
  while (xpThreshold(level + 1) <= Math.max(0, xp)) level++;
  return level;
}

export interface LevelProgress {
  level: number;
  current: number;
  needed: number;
  ratio: number;
}

export function levelProgress(xp: number): LevelProgress {
  const level = levelFromXp(xp);
  const start = xpThreshold(level);
  const needed = xpThreshold(level + 1) - start;
  const current = Math.max(0, xp) - start;
  return { level, current, needed, ratio: current / needed };
}

/** Rangos con el tono Zodi. */
export function rankFor(level: number): string {
  if (level >= 20) return 'Oráculo sin filtro';
  if (level >= 12) return 'Bruja de guardia';
  if (level >= 7) return 'Lectora de señales';
  if (level >= 3) return 'Aprendiz cósmica';
  return 'Recién aterrizada';
}
