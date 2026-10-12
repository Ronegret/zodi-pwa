# Fase 8 — Volver a tener todo lo de la Zodi de antes (y mejor)

Fecha: 12/10/2026 · Rama: `fase-7` (preview) → `astro-v2` (producción) cuando Rodrigo lo apruebe.

## Qué tenía la Zodi de antes (rama `main`, Next.js) y qué tiene la v2

| Bloque | Zodi de antes | v2 hoy | Estado |
|---|---|---|---|
| Login | Email + Google (Firebase) | Email (Supabase). Google listo en código, falta activarlo en Supabase | Pendiente de Rodrigo (pasos abajo) |
| Horóscopo diario / semanal / mensual | Sí | Sí, con tránsitos reales | ✅ |
| Carta natal | Lectura IA | Rueda 3D + lectura IA | ✅ mejor |
| Tarot | 1 carta, 3 cartas y cruz celta; cartas que se voltean con el arte del Tarot ZODI | 3 cartas, cartas de texto sin animación | ❌ falta animación, arte, tiradas |
| Tirada celta | Sí | No | ❌ |
| Compatibilidad | Por signos | Sinastría real | ✅ mejor |
| Sueños, tránsitos, numerología, biorritmo, chino, roast | Sí | Sí | ✅ |
| Nombre y apellidos | Vibración por letra, 4 modos | No | ❌ |
| Lectura de mano | Líneas + descripción | No | ❌ |
| Horóscopo maya | Sello y tono | No | ❌ |
| Runas vikingas | 1 o 3 runas que se revelan | No | ❌ |
| Cristales | Intención + cristal + ritual | No | ❌ |
| Oráculo | Botón flotante de ZODI en todo el panel + página propia | Chat "asistente" sin botón flotante | ⚠️ falta el oráculo como tal |
| Explicaciones | Cada sección: "qué es", glosario de conceptos y temas | Solo una frase | ❌ falta lo informativo |
| Vídeos y música | Vídeo de fondo en portada, splash de ZODI bailando con cartas, canción "ZODI te lo dijo" | Nada | ❌ |
| Signos ilustrados | Arte de los 12 signos | Solo en el tótem | ⚠️ |
| Horóscopo público por signo (SEO) | `/horoscopo/leo` sin cuenta | Redirige a la portada | ❌ lo que más busca el público |
| Portada | Muchas secciones: tarot vivo, rituales, humor ácido, planes, "mira lo que ZODI sabe de ti" | Héroe con ZODI + pocas secciones | ⚠️ |
| Comunidad | Feed anónimo | Feed con reacciones, temas, denuncias | ✅ mejor |
| Lecturas guardadas / historial | Sí | Historial | ✅ (faltan favoritos) |
| Puntos, niveles, gemas, logros, rachas | Sí (en el navegador) | No | ❌ |
| Amigos / círculo astral | Sí | No | ❌ |
| Predicciones 90 días, rituales energéticos | Sí | No | ❌ |
| Planes premium y tienda de gemas (Stripe) | Sí | No | ❌ |
| Compartir lectura como imagen, PDF de la carta | Sí | No | ❌ |
| Emails diarios, notificaciones push | Sí | No | ❌ (Resend pendiente de DNS) |

## Plan por fases

### 8A — Lecturas completas e informativas (ahora)
1. Cada lectura con **"¿Qué es esto?"**, **glosario** y **temas** (el texto de la Zodi de antes, revisado).
2. **Tarot vivo**: mazo de 22 arcanos mayores + 9 **Arcanos ZODI** (El Ego, La Red Flag, El Ex que Vuelve…) con su arte; barajar, repartir boca abajo y voltear en 3D; tiradas de 1 y 3 cartas.
3. Lecturas nuevas: **Tirada celta** (10 cartas), **Nombre y apellidos**, **Lectura de mano**, **Horóscopo maya** (sello y tono calculados), **Runas vikingas**, **Cristales**.
4. **Oráculo de ZODI**: página propia y botón flotante con ZODI en todo el panel.

### 8B — Lo que ve el público sin cuenta
1. **Horóscopo de hoy para cada signo** (`/horoscopo/leo`…), con el cielo real del día, arte del signo y llamada a crear cuenta. Escrito por la IA una vez al día y signo (12 lecturas/día), con texto de respaldo si la IA no está.
2. Portada completa: vídeo de fondo, los 12 signos ilustrados, tarot vivo, "cómo funciona", humor ácido, planes.
3. Bienvenida con el vídeo de ZODI bailando con cartas y la canción "ZODI te lo dijo" (con botón de silencio, nunca automática con sonido).
4. Login con la carta "La Identificación".

### 8C — Volver cada día
Puntos y niveles, rachas, logros, favoritos, predicciones a 90 días, ritual del día, amigos y círculo astral.

### 8D — Negocio y difusión
Planes y gemas con Stripe, compartir lectura como imagen, PDF de la carta, emails diarios (Resend) y notificaciones.

## Lo que necesita Rodrigo (no lo puedo hacer yo)
- **Google**: activar el proveedor Google en Supabase (Authentication → Sign In / Providers → Google) con el Client ID y Secret del cliente web de Google Cloud, y añadir `https://mdtgjgfeoudiyotgcxsy.supabase.co/auth/v1/callback` como URI de redirección en Google Cloud. El botón aparece solo en cuanto se activa.
- **IA**: pegar `ANTHROPIC_API_KEY` en Vercel (Production y Preview) y en `v2/.env.local`.
- **Resend**: añadir los 3 registros DNS en Hostinger.
