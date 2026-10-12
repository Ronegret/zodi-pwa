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
  mano: '3-Secciones-principales-de-la-web/Lectura-de-mano',
  runas: '3-Secciones-principales-de-la-web/Runas-vikingas',
  suerte: '3-Secciones-principales-de-la-web/Suerte--mala-suerte',
  'tarot-zodi': '8-Tarot-ZODI/Imagen-general-tarot-ZODI',
  'numerologia-zodi': '7-Numerologia/Imagen-general-numerologia',
  'zodi-silencio': '4-Poses-del-personaje-ZODI/ZODI-haciendo-silencio',
  'zodi-lanzando-cartas': '4-Poses-del-personaje-ZODI/ZODI-lanzando-cartas',
  'zodi-mano': '4-Poses-del-personaje-ZODI/ZODI-mano-extendida',
  'zodi-te-lo-adverti': '4-Poses-del-personaje-ZODI/ZODI-te-lo-adverti',
  'zodi-trono': '4-Poses-del-personaje-ZODI/ZODI-en-trono-urbano',
  'zodi-energia': '2-Portada--Home/ZODI-con-energia-en-la-mano',
  'zodi-cartas-flotando': '2-Portada--Home/ZODI-con-cartas-flotando',
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

// Arcanos ZODI (cartas propias del tarot de Zodi), 2:3.
const ZODI_ARCANA = {
  'el-destino': 'El-Destino',
  'el-ego': 'El-Ego',
  'el-ex-que-vuelve': 'El-Ex-que-Vuelve',
  'el-karma': 'El-Karma',
  'la-ilusion': 'La-Ilusion',
  'la-mala-idea': 'La-Mala-Idea',
  'la-red-flag': 'La-Red-Flag',
  'la-venganza-cosmica': 'La-Venganza-Cosmica',
  'la-verdad': 'La-Verdad',
};
const CARD = { width: 480, height: 720, fit: 'cover', position: 'centre' };
for (const [slug, file] of Object.entries(ZODI_ARCANA)) {
  jobs.push([`zodi-art/nuevas/8-Tarot-ZODI/${file}.webp`, `tarot/${slug}-480.webp`, CARD]);
}
// Reverso: el cartel "TAROT ZODI" recortado a carta.
jobs.push(['zodi-art/nuevas/8-Tarot-ZODI/Imagen-general-tarot-ZODI.webp', 'tarot/reverso-480.webp', CARD]);
// "La Identificación": la carta que invita a entrar (está fuera de public/).
jobs.push(['../ZODI IMAGENES/cartaid.png', 'tarot/la-identificacion-480.webp', CARD]);

// Números de la numerología (1-9 y maestros).
for (const n of [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33]) {
  jobs.push([`zodi-art/nuevas/7-Numerologia/${n}.webp`, `numeros/${n}-480.webp`, { width: 480 }]);
}

// Los doce signos ilustrados (páginas públicas) y su avatar.
const SIGN_ART = {
  aries: 'Aries',
  tauro: 'Tauro',
  geminis: 'Geminis',
  cancer: 'Cancer',
  leo: 'Leo',
  virgo: 'Virgo',
  libra: 'Libra',
  escorpio: 'Escorpio',
  sagitario: 'Sagitario',
  capricornio: 'Capricornio',
  acuario: 'Acuario',
  piscis: 'Piscis',
};
for (const [slug, file] of Object.entries(SIGN_ART)) {
  const dir = 'zodi-art/nuevas/5-Signos-del-zodiaco-occidental';
  jobs.push([`${dir}/${file}.webp`, `signos/${slug}-640.webp`, { width: 640 }]);
  jobs.push([`${dir}/${file}.webp`, `signos/${slug}-1024.webp`, { width: 1024 }]);
  jobs.push([`${dir}/Avatar_${file}.webp`, `signos/${slug}-avatar-240.webp`, { width: 240 }]);
}

// `node scripts/brand-assets.mjs tarot/ numeros/` regenera solo esos destinos.
const only = process.argv.slice(2);
for (const [src, dest, resize] of jobs) {
  if (only.length && !only.some((p) => dest.startsWith(p))) continue;
  const target = out + dest;
  await mkdir(target.slice(0, target.lastIndexOf('/')), { recursive: true });
  const info = await sharp(root + src)
    .resize(resize)
    .webp({ quality: 80, alphaQuality: 90 })
    .toFile(target);
  console.log(`${dest} ${info.width}x${info.height} ${(info.size / 1024).toFixed(0)} KB`);
}
