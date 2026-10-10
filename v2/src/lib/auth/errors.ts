/**
 * Errores de Supabase Auth → mensajes en español, sin filtrar detalles
 * internos ni confirmar si un correo existe.
 */
const MESSAGES: Record<string, string> = {
  invalid_credentials: 'Correo o contraseña incorrectos. Los astros no mienten, pero los dedos sí.',
  email_not_confirmed: 'Aún no has confirmado tu correo. Busca nuestro email (y mira en spam).',
  user_already_exists:
    'No hemos podido crear la cuenta con esos datos. Si ya tienes cuenta, entra o recupera la contraseña.',
  email_exists:
    'No hemos podido crear la cuenta con esos datos. Si ya tienes cuenta, entra o recupera la contraseña.',
  weak_password: 'Esa contraseña es demasiado fácil. Prueba con una más larga y menos obvia.',
  same_password: 'La nueva contraseña tiene que ser distinta de la anterior.',
  over_request_rate_limit: 'Demasiados intentos seguidos. Respira, espera un minuto y vuelve.',
  over_email_send_rate_limit:
    'Ya te hemos enviado un correo hace poco. Espera unos minutos antes de pedir otro.',
  signup_disabled: 'El registro está cerrado ahora mismo. Vuelve pronto.',
  email_address_invalid: 'Ese correo no nos sirve. Prueba con otro.',
  otp_expired: 'El enlace ha caducado o ya se usó. Pide uno nuevo.',
  bad_code_verifier: 'El enlace se abrió en otro navegador. Ábrelo en el mismo donde lo pediste.',
  flow_state_expired: 'Has tardado demasiado en volver. Inténtalo de nuevo.',
  session_not_found: 'Tu sesión ha caducado. Entra otra vez.',
};

export const GENERIC_AUTH_ERROR =
  'Algo se ha torcido al conectar con el cielo. Inténtalo de nuevo en un momento.';
export const AUTH_UNAVAILABLE = 'El acceso está en mantenimiento. Vuelve en un rato.';

export function authErrorMessage(
  error: { code?: string | undefined; status?: number | undefined } | null | undefined,
): string {
  if (!error) return GENERIC_AUTH_ERROR;
  if (error.code && MESSAGES[error.code]) return MESSAGES[error.code]!;
  if (error.status === 429) return MESSAGES.over_request_rate_limit!;
  return GENERIC_AUTH_ERROR;
}
