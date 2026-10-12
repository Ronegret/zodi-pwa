/**
 * Vídeos y música de ZODI comprimidos para la web (necesita ffmpeg en el PATH).
 * Uso: node scripts/media-assets.mjs
 * - Vídeos sin audio, H.264 con faststart (empiezan a reproducirse al momento).
 * - Póster en webp del fotograma elegido (lo que se ve antes y con movimiento reducido).
 * - La canción a 96 kbps (solo se descarga si la persona le da al play).
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const out = fileURLToPath(new URL('../public/', import.meta.url));
mkdirSync(`${out}video`, { recursive: true });
mkdirSync(`${out}audio`, { recursive: true });

const ff = (...args) =>
  execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: 'inherit' });
const size = (f) => `${(statSync(f).size / 1024).toFixed(0)} KB`;

const VIDEOS = [
  // Horizontal: ZODI con la carta y la bola de cristal.
  { src: 'public/zodi-art/hero-bg.mp4', dest: 'video/zodi-portada', scale: '1280:-2', poster: 5 },
  // Vertical: ZODI bailando con cartas, "Tu futuro. Sin filtro."
  {
    src: 'public/zodi-art/splash-zodi.mp4',
    dest: 'video/zodi-cartas',
    scale: '540:-2',
    poster: 2.5,
  },
];

for (const v of VIDEOS) {
  const mp4 = `${out}${v.dest}.mp4`;
  ff(
    '-i',
    `${root}${v.src}`,
    '-an',
    '-vf',
    `scale=${v.scale}`,
    '-c:v',
    'libx264',
    '-preset',
    'slow',
    '-crf',
    '30',
    '-pix_fmt',
    'yuv420p',
    '-movflags',
    '+faststart',
    mp4,
  );
  const poster = `${out}${v.dest}.webp`;
  ff(
    '-ss',
    String(v.poster),
    '-i',
    `${root}${v.src}`,
    '-frames:v',
    '1',
    '-vf',
    `scale=${v.scale}`,
    '-quality',
    '78',
    poster,
  );
  console.log(`${v.dest}.mp4 ${size(mp4)} · póster ${size(poster)}`);
}

const song = `${out}audio/zodi-te-lo-dijo.mp3`;
ff('-i', `${root}ZODI IMAGENES/ZODI te lo dijo.mp3`, '-c:a', 'libmp3lame', '-b:a', '96k', song);
console.log(`audio/zodi-te-lo-dijo.mp3 ${size(song)}`);
