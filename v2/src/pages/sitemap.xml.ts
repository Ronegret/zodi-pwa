import type { APIRoute } from 'astro';
import { pairSlug } from '@/lib/public/compat';
import { SIGN_INFO } from '@/lib/public/signs';

/** Mapa del sitio: solo las páginas públicas indexables. */
const SITE = 'https://zodi.aibueno.es';

export const GET: APIRoute = () => {
  const pairs = SIGN_INFO.flatMap((a, i) => SIGN_INFO.slice(i).map((b) => pairSlug(a, b)));
  const urls = [
    '/',
    '/horoscopo',
    ...SIGN_INFO.map((s) => `/horoscopo/${s.slug}`),
    '/compatibilidad',
    ...pairs.map((p) => `/compatibilidad/${p}`),
    '/legal/privacidad',
    '/legal/terminos',
    '/legal/cookies',
    '/legal/aviso-legal',
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${SITE}${u}</loc></url>`)
    .join('\n')}\n</urlset>\n`;
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
};
