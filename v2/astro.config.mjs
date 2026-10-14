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
  // Rutas de la app anterior (Next) para que no rompan enlaces ni marcadores.
  redirects: {
    '/auth/register': '/auth/registro',
    '/onboarding': '/app/onboarding',
    '/dashboard': '/app',
    '/dashboard/[section]': '/app',
    '/reset': '/',
  },
  // La barra de dev tapa la parte baja de la pantalla (avisos, botón flotante) en los e2e.
  devToolbar: { enabled: false },
  // Sin resaltado de código: Shiki usa estilos en línea, incompatibles con la CSP.
  markdown: { syntaxHighlight: false },
  vite: {
    // astronomy-engine publica ESM en .js sin "type": "module". Node 24 lo
    // detecta en local, pero el cargador de Vercel lo trata como CommonJS
    // (SyntaxError: Unexpected token 'export'). Se empaqueta en el bundle.
    ssr: { noExternal: ['astronomy-engine'] },
    // three se importa de forma dinámica: sin esto, en dev Vite lo descubre al
    // montar la primera escena y recarga la página (rompe e2e y CLS).
    optimizeDeps: {
      include: [
        'three',
        'three/addons/effects/OutlineEffect.js',
        'three/addons/geometries/RoundedBoxGeometry.js',
      ],
    },
    build: {
      rolldownOptions: {
        treeshake: {
          // @astrojs/vercel 11.0.13: su entrypoint importa constantes de la
          // integración y deja `import "rolldown"` y `import "@vercel/routing-utils"`
          // en la función. En Vercel falta el binario nativo de rolldown y la
          // función cae al arrancar (FUNCTION_INVOCATION_FAILED). Son código de
          // compilación sin efectos en runtime: se descartan.
          moduleSideEffects: (id) =>
            /^(rolldown|@vercel\/routing-utils)(\/|$)/.test(id) ? false : undefined,
        },
      },
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
      // Modelo de las lecturas profundas (carta, tránsitos, compatibilidad, tarot).
      ANTHROPIC_MODEL: envField.string({
        context: 'server',
        access: 'public',
        default: 'claude-sonnet-5-5',
      }),
      // Modelo rápido y barato (oráculo, horóscopo diario y el resto): ~20 veces menos.
      ANTHROPIC_MODEL_FAST: envField.string({
        context: 'server',
        access: 'public',
        default: 'claude-haiku-5-5',
      }),
      // Solo para los e2e (servidor simulado); en producción no se define.
      ANTHROPIC_BASE_URL: envField.string({
        context: 'server',
        access: 'public',
        optional: true,
        url: true,
      }),
    },
  },
});
