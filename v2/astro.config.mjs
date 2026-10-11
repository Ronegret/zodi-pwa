import { defineConfig, envField } from 'astro/config';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';
import { CSP_DIRECTIVES } from './src/lib/security/policy.ts';

export default defineConfig({
  site: 'https://zodi.aibueno.es',
  output: 'server',
  adapter: vercel(),
  integrations: [react()],
  prefetch: { prefetchAll: true, defaultStrategy: 'viewport' },
  // La barra de dev tapa la parte baja de la pantalla (avisos, botón flotante) en los e2e.
  devToolbar: { enabled: false },
  // Sin resaltado de código: Shiki usa estilos en línea, incompatibles con la CSP.
  markdown: { syntaxHighlight: false },
  vite: {
    // three se importa de forma dinámica: sin esto, en dev Vite lo descubre al
    // montar la primera escena y recarga la página (rompe e2e y CLS).
    optimizeDeps: {
      include: [
        'three',
        'three/addons/effects/OutlineEffect.js',
        'three/addons/geometries/RoundedBoxGeometry.js',
      ],
    },
  },
  security: {
    // Rechaza envíos de formularios desde otros orígenes (CSRF).
    checkOrigin: true,
    // CSP con hashes de scripts y estilos; no activa en `astro dev`.
    csp: { directives: [...CSP_DIRECTIVES] },
  },
  env: {
    // Opcionales: sin credenciales la app arranca y las rutas privadas se cierran.
    schema: {
      PUBLIC_SUPABASE_URL: envField.string({
        context: 'client',
        access: 'public',
        optional: true,
        url: true,
      }),
      PUBLIC_SUPABASE_ANON_KEY: envField.string({
        context: 'client',
        access: 'public',
        optional: true,
      }),
      SUPABASE_SERVICE_ROLE_KEY: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
      }),
      ANTHROPIC_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
    },
  },
});
