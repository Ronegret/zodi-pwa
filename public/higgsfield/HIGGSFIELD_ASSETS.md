# ZODI — Higgsfield Video Assets

Prompts listos para generar en [Higgsfield AI](https://higgsfield.ai/).  
Guardar los MP4 resultantes en esta misma carpeta (`/public/higgsfield/`).

---

## Guía de estilo visual ZODI

- **Paleta**: negro profundo (#050507), neón lima (#b8ff17), neón violeta (#a855f7), cyan eléctrico (#22d3ee)
- **Personaje**: figura con capucha oscura, ojos X que brillan en verde, sonrisa cosida de neón
- **Estética**: cyberpunk urbano, graffiti luminoso, humo de neón, pantallas holográficas, calles mojadas de noche
- **NO incluir**: fondo blanco, colores pastel, estética wellness o new-age, símbolos religiosos explícitos
- **Formato recomendado**: 9:16 (vertical mobile) o 16:9 (landscape hero), 4-8 segundos, loop fluido

---

## VIDEO 1 — Hero loop (reemplazar `hero-bg.mp4`)

**Slug**: `hero-loop.mp4`  
**Uso**: Fondo de pantalla completa en la sección hero de la landing

**Prompt Higgsfield**:
> A dark futuristic cityscape at night, rain-slicked neon streets reflecting purple and lime-green lights, holographic astrology symbols drifting through the air like smoke, slow cinematic camera drift, ultra-dark ambient lighting, 4K, cyberpunk aesthetic, no people, seamless loop

**Alternativa más energética**:
> Slow-motion glitch effect on a dark surface, lime-green neon symbols (stars, circles, glyphs) floating and dissolving, deep black background, subtle purple haze, looping animation, abstract and mystical

---

## VIDEO 2 — Personaje ZODI animado

**Slug**: `zodi-character-loop.mp4`  
**Uso**: Banner secundario o intro de onboarding

**Prompt Higgsfield**:
> A hooded cyberpunk figure with glowing green X eyes and a stitched neon smile, standing in a dark urban alley, purple and lime neon lights illuminating the scene, light rain, smoke rising from grates, slow breathing animation, cinematic close-up, dark and mystical atmosphere

---

## VIDEO 3 — Tarot en movimiento

**Slug**: `tarot-animated.mp4`  
**Uso**: Sección de Tarot en la landing o en el dashboard de tarot

**Prompt Higgsfield**:
> Dark tarot cards floating and slowly rotating in void, surrounded by electric purple light particles, each card has glowing neon edges, mystical and cinematic, slow dramatic motion, black background with subtle smoke, loop-ready

---

## VIDEO 4 — Carta natal / cosmos

**Slug**: `natal-chart-cosmos.mp4`  
**Uso**: Sección de carta natal o fondo del dashboard

**Prompt Higgsfield**:
> A glowing astrology birth chart wheel spinning slowly in deep space, neon purple and cyan constellation lines connecting zodiac symbols, dark background, soft star nebula behind it, cinematic depth of field, loop-ready, no text

---

## VIDEO 5 — Numerología

**Slug**: `numerology-loop.mp4`  
**Uso**: Sección de numerología en la landing

**Prompt Higgsfield**:
> Floating neon numbers (1 through 9 and 11) slowly drifting through a dark void, each number glowing in a different color: lime green, neon purple, electric cyan, deep magenta, trails of light following each number, mystical and cosmic atmosphere, seamless loop

---

## VIDEO 6 — Comunidad / Social

**Slug**: `community-loop.mp4`  
**Uso**: Sección "Tu futuro, sin filtro. Tu comunidad, sin postureo."

**Prompt Higgsfield**:
> Abstract visualization of glowing threads connecting floating zodiac symbols in the dark, like a social network of stars, neon lime and purple color scheme, slow pulsing light, cosmic depth, no human faces, mystical and urban aesthetic

---

## VIDEO 7 — PWA Install / Onboarding intro

**Slug**: `install-screen.mp4`  
**Uso**: Pantalla de bienvenida / PWA install prompt

**Prompt Higgsfield**:
> A dark smartphone screen with a glowing oracle interface, neon purple holographic charts and text appearing on screen, subtle hand holding the phone from below, rainy night background out of focus, cinematic mobile-first composition, 9:16 aspect ratio

---

## Configuración técnica recomendada

| Parámetro | Valor |
|-----------|-------|
| Resolución mínima | 1080p |
| Formato salida | MP4 H.264 |
| Duración | 4–8 segundos (loop) |
| FPS | 24 o 30 |
| Audio | Sin audio (muted backgrounds) |
| Compresión web | < 5MB por video (usar HandBrake o ffmpeg) |

---

## Cómo comprimir para web

```bash
# Con ffmpeg — bajar bitrate para web
ffmpeg -i input.mp4 -vcodec libx264 -crf 28 -preset slow -movflags +faststart output-web.mp4

# Ver tamaño resultante
ls -lh output-web.mp4
```

---

## Estado de assets

| Video | Estado | Notas |
|-------|--------|-------|
| hero-loop.mp4 | ✅ En uso | `hero-bg.mp4` actual (7.3MB — comprimir) |
| zodi-character-loop.mp4 | ⏳ Pendiente | Generar en Higgsfield |
| tarot-animated.mp4 | ⏳ Pendiente | Generar en Higgsfield |
| natal-chart-cosmos.mp4 | ⏳ Pendiente | Generar en Higgsfield |
| numerology-loop.mp4 | ⏳ Pendiente | Generar en Higgsfield |
| community-loop.mp4 | ⏳ Pendiente | Generar en Higgsfield |
| install-screen.mp4 | ⏳ Pendiente | Generar en Higgsfield |
