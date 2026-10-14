/**
 * Lanza un aviso desde cualquier isla o script; lo pinta ToastRegion.
 * Si la región aún no ha cargado (se hidrata con client:idle), el aviso
 * espera en cola y se muestra en cuanto esté lista.
 */
export type ToastTone = 'info' | 'error';
export interface ToastDetail {
  message: string;
  tone?: ToastTone;
}

export const TOAST_EVENT = 'zodi:toast';

type ToastWindow = Window & { __zodiToastReady?: boolean; __zodiToastQueue?: ToastDetail[] };

export function toast(message: string, tone: ToastTone = 'info') {
  const w = window as ToastWindow;
  const detail = { message, tone };
  if (!w.__zodiToastReady) {
    (w.__zodiToastQueue ??= []).push(detail);
    return;
  }
  w.dispatchEvent(new CustomEvent<ToastDetail>(TOAST_EVENT, { detail }));
}

/** La región la llama al montarse: marca lista y devuelve lo pendiente. */
export function drainToastQueue(): ToastDetail[] {
  const w = window as ToastWindow;
  w.__zodiToastReady = true;
  const queued = w.__zodiToastQueue ?? [];
  w.__zodiToastQueue = [];
  return queued;
}
