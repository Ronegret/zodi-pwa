/**
 * Genera versiones ligeras de los recursos de marca de Zodi a partir de los
 * originales de la app actual (../public). Uso: node scripts/brand-assets.mjs
 */
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = fileURLToPath(new URL('../../public/', import.meta.url));
const out = fileURLToPath(new URL('../public/', import.meta.url));

const jobs = [
  ['zodi-art/logo-final.webp', 'brand/logo-480.webp', { width: 480 }],
  ['zodi-art/logo-final.webp', 'brand/logo-240.webp', { width: 240 }],
  ['zodi-art/brand/isotipo.webp', 'brand/isotipo-192.webp', { width: 192 }],
  ['zodi-art/brand/isotipo.webp', 'brand/isotipo-96.webp', { width: 96 }],
  ['zodi-art/brand/zodi-sin-fondo.webp', 'brand/zodi-480.webp', { width: 480 }],
  ['zodi-art/brand/zodi-sin-fondo.webp', 'brand/zodi-720.webp', { width: 720 }],
];

// El personaje ZODI es el protagonista: arte de cada sección y poses, en
// dos tamaños (tarjetas y cabeceras). Origen: ../public/zodi-art/nuevas.
const ART = {
  'horoscopo-diario': '3-Secciones-principales-de-la-web/Horoscopo-diario',
  prediccion: '3-Secciones-principales-de-la-web/Prediccion-del-dia',
  destino: '3-Secciones-principales-de-la-web/Tu-destino-hoy',
  'carta-astral': '3-Secciones-principales-de-la-web/Carta-astral',
  consejo: '3-Secciones-principales-de-la-web/Consejo-cosmico-sin-filtro',
  tarot: '3-Secciones-principales-de-la-web/Tarot-acido',
  compatibilidad: '3-Secciones-principales-de-la-web/Compatibilidad',
  rituales: '3-Secciones-principales-de-la-web/Rituales-energeticos',
  numerologia: '3-Secciones-principales-de-la-web/Numerologia',
  energia: '3-Secciones-principales-de-la-web/Tu-energia-actual',
  chino: '3-Secciones-principales-de-la-web/Horoscopo-chino',
  'frase-venenosa': '3-Secciones-principales-de-la-web/Frase-venenosa-del-dia',
  'zodi-bola': '4-Poses-del-personaje-ZODI/ZODI-con-bola-de-cristal',
  'zodi-movil': '4-Poses-del-personaje-ZODI/ZODI-mirando-movil',
  'zodi-riendose': '4-Poses-del-personaje-ZODI/ZODI-riendose',
  'zodi-carta': '4-Poses-del-personaje-ZODI/ZODI-sujetando-carta',
  'zodi-senalando': '2-Portada--Home/ZODI-senalando-al-usuario',
  'zodi-leyendo': '2-Portada--Home/ZODI-leyendo-el-destino',
};
for (const [slug, file] of Object.entries(ART)) {
  for (const width of [640, 1024]) {
    jobs.push([`zodi-art/nuevas/${file}.webp`, `art/${slug}-${width}.webp`, { width }]);
  }
}

const SIGNS = {
  aries: 'aries',
  tauro: 'tauro',
  geminis: 'geminis',
  cancer: 'cancer',
  leo: 'leo',
  virgo: 'virgo',
  libra: 'libra',
  escorpio: 'escorpio',
  sagitario: 'sagitario',
  capricornio: 'capricornio',
  acuario: 'acuario',
  // El original se llama "picis".
  piscis: 'picis',
};
for (const [slug, file] of Object.entries(SIGNS)) {
  jobs.push([`zodiac/${file}.webp`, `zodiac/${slug}-640.webp`, { width: 640 }]);
}

for (const [src, dest, resize] of jobs) {
  const target = out + dest;
  await mkdir(target.slice(0, target.lastIndexOf('/')), { recursive: true });
  const info = await sharp(root + src)
    .resize(resize)
    .webp({ quality: 80, alphaQuality: 90 })
    .toFile(target);
  console.log(`${dest} ${info.width}x${info.height} ${(info.size / 1024).toFixed(0)} KB`);
}
