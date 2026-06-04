import type { MetadataRoute } from "next";

const BASE = "https://zodi.aibueno.es";
const SIGNS = ["aries","tauro","geminis","cancer","leo","virgo","libra","escorpio","sagitario","capricornio","acuario","piscis"];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: BASE, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/auth/register`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/auth/login`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    ...SIGNS.map(sign => ({
      url: `${BASE}/horoscopo-diario/${sign}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.9,
    })),
  ];
}
