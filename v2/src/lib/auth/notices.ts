/** Avisos por ?aviso= en /auth/login. Solo claves conocidas: nada de texto libre en la URL. */
const NOTICES = {
  salida: { tone: 'info', text: 'Has cerrado sesión. El universo seguirá aquí cuando vuelvas.' },
  'cuenta-borrada': {
    tone: 'info',
    text: 'Tu cuenta y todos tus datos se han borrado. Si algún día vuelves, aquí estaremos.',
  },
  'enlace-invalido': {
    tone: 'error',
    text: 'El enlace no es válido o ha caducado. Pide uno nuevo.',
  },
  'google-error': {
    tone: 'error',
    text: 'No hemos podido conectar con Google. Inténtalo otra vez.',
  },
  'no-disponible': { tone: 'error', text: 'El acceso está en mantenimiento. Vuelve en un rato.' },
  'google-no-disponible': {
    tone: 'info',
    text: 'El acceso con Google está a punto de llegar. Mientras, entra o regístrate con tu correo.',
  },
} as const;

export type Notice = (typeof NOTICES)[keyof typeof NOTICES];

export function noticeFor(key: string | null): Notice | null {
  return key && Object.hasOwn(NOTICES, key) ? NOTICES[key as keyof typeof NOTICES] : null;
}
