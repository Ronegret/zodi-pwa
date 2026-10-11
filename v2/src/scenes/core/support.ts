import { reducedMotion } from '@/lib/motion';

export type Unsupported = 'no-webgl' | 'reduced-motion' | 'save-data';

/**
 * ¿Se puede pintar 3D? Sin WebGL, con movimiento reducido o con ahorro de
 * datos se queda la alternativa estática (y no se descarga three).
 */
export function sceneSupport(): { ok: true } | { ok: false; reason: Unsupported } {
  if (reducedMotion()) return { ok: false, reason: 'reduced-motion' };
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (connection?.saveData) return { ok: false, reason: 'save-data' };
  try {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2') ?? probe.getContext('webgl');
    if (!gl) return { ok: false, reason: 'no-webgl' };
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    return { ok: false, reason: 'no-webgl' };
  }
  return { ok: true };
}
