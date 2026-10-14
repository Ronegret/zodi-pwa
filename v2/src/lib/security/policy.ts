/**
 * Política de seguridad HTTP compartida por astro.config.mjs (CSP con hashes
 * de Astro) y el middleware (resto de cabeceras). Sin dependencias de Astro
 * para poder importarla desde la configuración y desde los tests.
 */

const SUPABASE = 'https://*.supabase.co';

/**
 * Directivas CSP además de script-src/style-src, que Astro genera con hashes.
 * En rutas bajo demanda Astro la envía como cabecera, así que frame-ancestors
 * es efectivo. Sin 'unsafe-inline' ni 'unsafe-eval'.
 */
export const CSP_DIRECTIVES = [
  "default-src 'self'",
  `img-src 'self' data: blob: ${SUPABASE} https://lh3.googleusercontent.com`,
  "font-src 'self'",
  `connect-src 'self' ${SUPABASE} wss://*.supabase.co`,
  "object-src 'none'",
  "base-uri 'self'",
  // El login con Google redirige desde nuestro POST a Supabase y de ahí a Google.
  `form-action 'self' ${SUPABASE} https://accounts.google.com`,
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
] as const;

/** Cabeceras para todas las respuestas del servidor. */
export const SECURITY_HEADERS: Readonly<Record<string, string>> = {
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
  'Cross-Origin-Opener-Policy': 'same-origin',
  // geolocalización y giroscopio solo propios (onboarding y escenas 3D).
  'Permissions-Policy':
    'camera=(), microphone=(), payment=(), usb=(), geolocation=(self), gyroscope=(self), accelerometer=(self)',
};
