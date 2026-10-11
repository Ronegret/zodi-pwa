/**
 * API de movimiento para islas y scripts. Con movimiento reducido (ajuste
 * del sistema o preferencia guardada en Ajustes) nada se anima: los
 * elementos van directos a su estado final.
 */
import { PRESETS, type PresetName } from './tokens';

export * from './tokens';

export const MOTION_STORAGE_KEY = 'zodi:motion';
export type MotionPreference = 'full' | 'reduce';

export function storedPreference(): MotionPreference | null {
  try {
    const v = window.localStorage.getItem(MOTION_STORAGE_KEY);
    return v === 'reduce' || v === 'full' ? v : null;
  } catch {
    return null;
  }
}

export function setPreference(pref: MotionPreference) {
  try {
    window.localStorage.setItem(MOTION_STORAGE_KEY, pref);
  } catch {
    // Navegación privada: se aplica solo a esta página.
  }
  document.documentElement.dataset.motion = pref;
}

/** True si el sistema lo pide o la persona lo eligió en Ajustes. */
export function reducedMotion(): boolean {
  if (typeof window === 'undefined') return true;
  if (document.documentElement.dataset.motion === 'reduce') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Puntero fino con hover (ratón/trackpad): nada de efectos de cursor en táctil. */
export function finePointer(): boolean {
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

/** Reproduce un preset; con movimiento reducido no anima (devuelve null). */
export function play(el: Element, name: PresetName): Animation | null {
  if (reducedMotion()) return null;
  const { keyframes, options } = PRESETS[name];
  return el.animate(keyframes, options);
}
