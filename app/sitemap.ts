import { MetadataRoute } from 'next';

const validSigns = [
  "aries", "tauro", "geminis", "cancer", 
  "leo", "virgo", "libra", "escorpio", 
  "sagitario", "capricornio", "acuario", "piscis"
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://zodi.aibueno.es'; // Asegúrate de definir esto en tu entorno

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/auth/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/auth/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/legal/privacidad`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/legal/terminos`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
  ];

  const dynamicHoroscopeRoutes: MetadataRoute.Sitemap = validSigns.map((sign) => ({
    url: `${baseUrl}/horoscopo-diario/${sign}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.9,
  }));

  return [...staticRoutes, ...dynamicHoroscopeRoutes];
}
