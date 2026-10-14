/**
 * El "hoy" de las páginas públicas: fecha civil de Madrid y caché de CDN
 * que nunca sirve el horóscopo de ayer.
 */
import { civilDate } from '@/lib/daily/biorhythm';

export const PUBLIC_TZ = 'Europe/Madrid';

export const publicToday = (now = new Date()) => civilDate(now, PUBLIC_TZ);

/** Segundos hasta la próxima medianoche de Madrid (como mucho una hora). */
export function secondsUntilTomorrow(now = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: PUBLIC_TZ,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  const elapsed = get('hour') * 3600 + get('minute') * 60 + get('second');
  return Math.max(60, Math.min(3600, 86_400 - elapsed));
}

export const publicCacheControl = (now = new Date()) =>
  `public, max-age=0, s-maxage=${secondsUntilTomorrow(now)}, stale-while-revalidate=300`;

export function longDate(date: string): string {
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${date}T12:00:00Z`));
}
