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
];

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
