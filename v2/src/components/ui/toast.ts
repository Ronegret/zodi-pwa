/** Lanza un aviso desde cualquier isla o script; lo pinta ToastRegion. */
export type ToastTone = 'info' | 'error';
export interface ToastDetail {
  message: string;
  tone?: ToastTone;
}

export const TOAST_EVENT = 'zodi:toast';

export function toast(message: string, tone: ToastTone = 'info') {
  window.dispatchEvent(new CustomEvent<ToastDetail>(TOAST_EVENT, { detail: { message, tone } }));
}
