import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://zodi.aibueno.es',
  output: 'server',
  adapter: vercel(),
  integrations: [react()],
  prefetch: { prefetchAll: true, defaultStrategy: 'viewport' },
  security: { checkOrigin: true },
});
