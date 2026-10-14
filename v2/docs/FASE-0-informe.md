# Fase 0 — Informe

## Decisiones

- Supabase: proyecto **nuevo y limpio** (sin migrar usuarios de Firebase).
- v2 vive en `v2/` dentro del repo, rama `astro-v2`. Producción (Next.js en raíz) no se toca.
- Carta natal: **cálculo real** con efemérides (Fase 1).

## Stack instalado

Astro 7 (SSR, adaptador Vercel) · React 19 (islas) · TypeScript 5.9 estricto · Three.js ·
ESLint 9 + jsx-a11y · Prettier · Vitest · Playwright + axe-core (móvil, tablet, escritorio).

## Verificado

`astro check` 0 errores · `eslint` limpio · `vitest` OK · `astro build` OK ·
axe WCAG 2.2 AA sin violaciones en `/` y `/app` (móvil y escritorio).

## Limpieza pendiente del repo raíz (no ejecutada, requiere tu OK)

| Elemento                        | Tamaño | Nota                                                  |
| ------------------------------- | ------ | ----------------------------------------------------- |
| `error.mp4`, `error1.mp4`       | ~70 MB | versionados; capturas de depuración                   |
| `ZODI IMAGENES/*.mp4` y `*.mp3` | ~13 MB | duplicados de `public/zodi-art` y `public/audio`      |
| `zodi-*.png` en la raíz         | ~5 MB  | capturas sueltas                                      |
| `.git`                          | 157 MB | además hay objetos temporales corruptos (`tmp_obj_*`) |

`.env.local` **no** está versionado (correcto). Revisar igualmente que ninguna clave real
haya pasado por el historial antes de hacer público el repo.

## Riesgos de seguridad detectados en la app actual (se resuelven en Fase 2)

- `middleware.ts` solo comprueba que exista la cookie `zodi_auth`, sin validarla.
- La API acepta el token literal `"local_session"` y se salta la verificación.
- Luna y Ascendente se calculan con la longitud del nombre de la ciudad (`lib/astral.ts`).
