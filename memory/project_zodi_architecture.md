---
name: project-zodi-architecture
description: Arquitectura principal del proyecto Zodi Ultimate - tech stack, auth, AI, rutas clave
metadata:
  type: project
---

Zodi Ultimate es una PWA de astrología/IA en Next.js 16 + Firebase + Anthropic/OpenAI/Gemini.

**Stack:**
- Next.js 16.2.6 con Turbopack deshabilitado (usa `--webpack` siempre)
- Firebase Auth + Firestore para usuarios reales, fallback local en localStorage
- AI: Claude (Anthropic) + OpenAI + Gemini en paralelo con Promise.any() — el primero que responde gana
- PWA con @serwist/next
- Build: `npm run build` (usa --webpack flag, NO usar `npx next build` directo)

**Rutas clave:**
- `/app/api/ai/reading/route.ts` - endpoint principal de AI, soporta token "local_session" para auth local
- `/lib/ai/providers.ts` - lógica de proveedores AI, modelo por defecto `claude-sonnet-4-6`
- `/lib/session.ts` - gestión de sesión en localStorage, con identidad duradera
- `/lib/firebase/admin.ts` - Firebase Admin SDK (opcional, token verification)
- `/components/dashboard/SectionSpecificUI.tsx` - UI de todas las secciones (2500+ líneas)
- `/components/auth/AuthForm.tsx` - Login/registro con Google + email

**Auth flow:**
- Token "local_session" = usuario sin Firebase Auth (fallback local). API route lo permite pasar.
- Si Firebase Admin configurado Y token es real JWT → verifica. Si token es "local_session" → bypasa.

**Variables de entorno necesarias en Vercel:**
- ANTHROPIC_API_KEY, CLAUDE_MODEL=claude-sonnet-4-6
- OPENAI_API_KEY, OPENAI_MODEL=gpt-4o-mini
- GEMINI_API_KEY
- NEXT_PUBLIC_FIREBASE_* (todos los de cliente)
- FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY (Admin, opcionales)

**Why:** Estas variables NO están en el repo; solo en .env.local localmente. Vercel necesita configuración manual.
**How to apply:** Antes de diagnosticar problemas de AI, preguntar si las env vars están en Vercel.
