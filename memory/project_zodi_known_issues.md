---
name: project-zodi-known-issues
description: Issues conocidos y fixes aplicados en Zodi Ultimate
metadata:
  type: project
---

**Issues resueltos en esta sesión:**
1. "Ranking" en navegación mostraba rituales energéticos — renombrado a "Rituales" con icono Sparkles, movido a grupo Lecturas
2. PerfilUI: email ahora read-only, campos editables (nombre, apellido, fechas, ciudad, país), avatar selector con presets y upload
3. Modelo Claude incorrecto: `claude-sonnet-4-5` → `claude-sonnet-4-6`
4. Token "local_session" bloqueaba AI cuando Firebase Admin configurado — corregido en route.ts
5. CSP no incluía api.anthropic.com y api.openai.com

**Issues de deployment:**
- Build DEBE usar `npm run build` (incluye --webpack), NO `npx next build` (falla por Turbopack+serwist)
- vercel.json creado para forzar `npm run build`
- Env vars de AI deben estar en Vercel dashboard (no se incluyen en el repo)

**Why:** Turbopack de Next.js 16 no es compatible con la configuración webpack de @serwist/next.
**How to apply:** Si el build falla en Vercel, verificar que usa `npm run build` y no el comando por defecto.
