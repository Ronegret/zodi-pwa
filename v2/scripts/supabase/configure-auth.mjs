/**
 * Configura Auth de Supabase por la API de gestión, sin pasar por el panel:
 *  - correos de acceso en español con el estilo de ZODI (supabase/templates),
 *  - URL del sitio,
 *  - Google, si GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET están en .env.local,
 *  - Resend como servidor de correo, si RESEND_API_KEY está en .env.local
 *    (con --confirmar-correo, además, vuelve a pedir confirmación al registrarse).
 *
 * Necesita SUPABASE_ACCESS_TOKEN en v2/.env.local (Supabase → Account →
 * Access Tokens). Nunca imprime claves.
 *   node scripts/supabase/configure-auth.mjs --dry-run
 *   node scripts/supabase/configure-auth.mjs
 */
import { readFileSync } from 'node:fs';
import { loadEnv } from '../db/env.mjs';

const env = loadEnv();
const dryRun = process.argv.includes('--dry-run');
const confirmEmail = process.argv.includes('--confirmar-correo');

if (!env.PUBLIC_SUPABASE_URL) throw new Error('Falta PUBLIC_SUPABASE_URL en .env.local');
const ref = new URL(env.PUBLIC_SUPABASE_URL).hostname.split('.')[0];
const template = (file) =>
  readFileSync(new URL(`../../supabase/templates/${file}`, import.meta.url), 'utf8');

const config = {
  site_url: 'https://zodi.aibueno.es',
  mailer_subjects_confirmation: 'Confirma tu correo y entra en ZODI',
  mailer_templates_confirmation_content: template('confirmar-cuenta.html'),
  mailer_subjects_recovery: 'Tu nueva contraseña de ZODI',
  mailer_templates_recovery_content: template('recuperar-clave.html'),
  mailer_subjects_email_change: 'Confirma tu nuevo correo de ZODI',
  mailer_templates_email_change_content: template('cambiar-correo.html'),
};
const notes = ['correos en español (confirmar, recuperar, cambiar correo)', 'URL del sitio'];

if (env.GOOGLE_CLIENT_ID || env.GOOGLE_CLIENT_SECRET) {
  const id = env.GOOGLE_CLIENT_ID ?? '';
  const secret = env.GOOGLE_CLIENT_SECRET ?? '';
  if (!id.endsWith('.apps.googleusercontent.com') || !secret.startsWith('GOCSPX-')) {
    throw new Error(
      'GOOGLE_CLIENT_ID debe terminar en .apps.googleusercontent.com y GOOGLE_CLIENT_SECRET empezar por GOCSPX- (Google Cloud → Credenciales → Web client).',
    );
  }
  Object.assign(config, {
    external_google_enabled: true,
    external_google_client_id: id,
    external_google_secret: secret,
  });
  notes.push('acceso con Google activado');
}

if (env.RESEND_API_KEY) {
  Object.assign(config, {
    smtp_host: 'smtp.resend.com',
    smtp_port: '465',
    smtp_user: 'resend',
    smtp_pass: env.RESEND_API_KEY,
    smtp_admin_email: env.SMTP_FROM ?? 'hola@zodi.aibueno.es',
    smtp_sender_name: 'ZODI',
  });
  notes.push(`correo enviado con Resend desde ${env.SMTP_FROM ?? 'hola@zodi.aibueno.es'}`);
  if (confirmEmail) {
    config.mailer_autoconfirm = false;
    notes.push('confirmación por correo al registrarse: activada');
  }
}

console.log(`Proyecto ${ref}. Se aplicará:\n - ${notes.join('\n - ')}`);
if (dryRun) {
  console.log('(simulación: no se ha cambiado nada)');
  process.exit(0);
}
if (!env.SUPABASE_ACCESS_TOKEN) {
  console.error(
    'Falta SUPABASE_ACCESS_TOKEN en v2/.env.local (Supabase → Account → Access Tokens → Generate new token).',
  );
  process.exit(1);
}

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(config),
});
if (!res.ok) {
  // El cuerpo del error no incluye las claves enviadas.
  console.error(`Supabase respondió ${res.status}: ${(await res.text()).slice(0, 300)}`);
  process.exit(1);
}
console.log('Hecho: configuración de Auth aplicada.');
