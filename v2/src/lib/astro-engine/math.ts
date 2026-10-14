import { SIGNS, type ZodiacPosition } from './types';

export const DEG = Math.PI / 180;
export const norm360 = (x: number) => ((x % 360) + 360) % 360;
/** Diferencia angular con signo en (-180, 180]. */
export const diff180 = (a: number, b: number) => {
  const d = norm360(a - b);
  return d > 180 ? d - 360 : d;
};

export function toZodiac(lon: number): ZodiacPosition {
  const l = norm360(lon);
  const totalMin = Math.floor(l * 60 + 1e-9);
  const inSign = totalMin % 1800;
  return {
    lon: l,
    sign: SIGNS[Math.floor(totalMin / 1800) % 12]!,
    degree: Math.floor(inSign / 60),
    minute: inSign % 60,
  };
}
