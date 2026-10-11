/** Lee v2/.env.local (process.env tiene prioridad). Sin dependencias. */
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export function loadEnv() {
  const file = fileURLToPath(new URL('../../.env.local', import.meta.url));
  const fromFile = existsSync(file)
    ? Object.fromEntries(
        readFileSync(file, 'utf8')
          .split(/\r?\n/)
          .filter((l) => /^[A-Z_]+=/.test(l))
          .map((l) => [
            l.slice(0, l.indexOf('=')),
            l
              .slice(l.indexOf('=') + 1)
              .trim()
              .replace(/^["']|["']$/g, ''),
          ]),
      )
    : {};
  return { ...fromFile, ...process.env };
}

/** URL de conexión con el host cambiado (para probar clústeres). */
export function withHost(dbUrl, host) {
  const u = new URL(dbUrl);
  u.hostname = host;
  return u.toString();
}
