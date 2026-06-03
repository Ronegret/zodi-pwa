import { getTodaysAstralContext } from "@/lib/astral";
import { getRegionalHumorContext } from "@/lib/gamification";
import { buildPersonalizationBlock } from "@/lib/ai/personalization";
import type { ReadingKind, UserProfile } from "@/types/zodi";

// ── Hora emocional de la consulta ─────────────────────────────────────────────
function getTimeOfDayContext(): string {
  const h = new Date().getHours();
  if (h >= 2 && h < 5) {
    return `CONSULTA DE MADRUGADA (${h}h) — Lo que se pregunta a las ${h} de la madrugada no es casualidad. Algo no deja dormir. Responde con honestidad total, sin adornos, con cariño real. No minimices lo que siente — a estas horas, la pregunta es genuina.`;
  }
  if (h >= 5 && h < 9) {
    return `CONSULTA MATINAL TEMPRANA (${h}h) — Energía de nuevo comienzo. El día acaba de abrirse. Ideal para intenciones, decisiones y arranques. Tono motivador con criterio.`;
  }
  if (h >= 9 && h < 13) {
    return `CONSULTA DE MAÑANA (${h}h) — Mente activa, estado mental claro. Buena hora para análisis y decisiones prácticas. Tono directo y útil.`;
  }
  if (h >= 13 && h < 17) {
    return `CONSULTA DE TARDE (${h}h) — El día ya está en marcha, algo interrumpió el flujo normal. Puede ser urgencia, duda o necesidad de validación. Sé concreto y da orientación clara.`;
  }
  if (h >= 17 && h < 21) {
    return `CONSULTA VESPERTINA (${h}h) — El día se cierra, el procesamiento emocional empieza. Las preguntas de esta hora suelen tener más carga emocional. Equilibra análisis con comprensión.`;
  }
  return `CONSULTA NOCTURNA (${h}h) — La noche favorece las preguntas honestas. El ruido del día bajó y lo que queda es lo real. Responde con profundidad — estas lecturas se recuerdan.`;
}

// ── Intención temporal de la consulta ─────────────────────────────────────────
function detectConsultationIntent(input: string): string {
  const lower = input.toLowerCase();

  const pastMarkers = ["pasó", "ocurrió", "fue cuando", "era", "tenía", "hice", "dije", "lo que pasó", "el otro día", "ayer", "semana pasada", "mes pasado", "hace un", "tiempo atrás", "antes de", "me dejó", "terminamos", "perdí", "me dijo", "fui a"];
  const futureMarkers = ["pasará", "voy a", "va a", "vamos a", "quiero que", "si hago", "debería", "próxima semana", "próximo mes", "en el futuro", "cuando sea", "me gustaría", "cómo puedo", "qué debo", "qué hago para", "cuándo"];
  const anxietyMarkers = ["no sé", "no sé qué", "tengo miedo", "me angustia", "me preocupa", "estoy asustado", "no puedo", "es que no", "nada sale", "todo mal", "ya no sé"];

  const hasPast = pastMarkers.some(m => lower.includes(m));
  const hasFuture = futureMarkers.some(m => lower.includes(m));
  const hasAnxiety = anxietyMarkers.some(m => lower.includes(m));

  let intent = "";
  if (hasPast && !hasFuture) {
    intent = "CONSULTA SOBRE EL PASADO: El usuario procesa algo que ya ocurrió. Tu trabajo es dar significado, cierre y aprendizaje — no cambiar lo que pasó sino ayudar a entender qué hacer con ello.";
  } else if (hasFuture && !hasPast) {
    intent = "CONSULTA SOBRE EL FUTURO: El usuario busca orientación para lo que viene. Da señales, probabilidades y preparación — nunca certezas absolutas. El futuro se construye, no se predice.";
  } else if (hasPast && hasFuture) {
    intent = "CONSULTA MIXTA (pasado que condiciona el futuro): El usuario arrastra algo del pasado hacia el futuro. Ayúdale a cortar esa cadena o a redirigir la energía. Este es el tipo de lectura más transformadora.";
  } else {
    intent = "CONSULTA DE PRESENTE: El usuario necesita orientación ahora mismo. Qué hacer HOY, cómo actuar, qué decisión tomar. Sé concreto y accionable.";
  }

  if (hasAnxiety) {
    intent += " NOTA DE TONO: La consulta tiene carga de ansiedad. Sé directo pero empieza anclando — una frase que diga 'te escucho' antes de dar el consejo.";
  }

  return intent;
}

// ── Temporada solar del usuario ────────────────────────────────────────────────
function getSunSeasonContext(userSign: string, sunTransit: string): string | null {
  if (!userSign || !sunTransit) return null;

  const signs = ["Aries", "Tauro", "Géminis", "Cáncer", "Leo", "Virgo", "Libra", "Escorpio", "Sagitario", "Capricornio", "Acuario", "Piscis"];
  const userIdx = signs.indexOf(userSign);
  const transitIdx = signs.indexOf(sunTransit);
  if (userIdx === -1 || transitIdx === -1) return null;

  if (userSign === sunTransit) {
    return `⭐ TEMPORADA SOLAR ACTIVA: El Sol está en ${userSign} — es la temporada de este usuario ahora mismo. Menciónalo con energía: "estás en tu temporada, el cosmos está en tu elemento", "el Sol te ilumina directamente esta semana". La energía del usuario es más alta de lo habitual.`;
  }
  // 1 sign before user = sun approaching their season
  const approachingIdx = (userIdx - 1 + 12) % 12;
  if (transitIdx === approachingIdx) {
    return `🌅 TEMPORADA SOLAR PRÓXIMA: El Sol está a punto de entrar en ${userSign} — su energía se acumula. Puedes mencionarlo: "tu temporada solar llega pronto, el universo se está preparando para ti".`;
  }
  // 1 sign after user = season just ended
  const recentIdx = (userIdx + 1) % 12;
  if (transitIdx === recentIdx) {
    return `🌇 TEMPORADA SOLAR RECIÉN CERRADA: El Sol acaba de salir de ${userSign}. La energía del usuario está bajando de su pico anual — momento de integrar, no de forzar.`;
  }
  return null;
}

// ── PERSONALIDAD ZODI — El oráculo callejero con corazón ────────────────────
export const zodiSystemPrompt = `Eres ZODI, el oráculo astral más auténtico y callejero que existe.
Tu estilo es ÚNICO: eres ese amigo de confianza que te dice la verdad a la cara, pero con tanto humor ácido que hasta duele con cariño.
Piensa en ti como el colega que mezcla brujería callejera con sentido común brutal.

PERSONALIDAD ZODI:
- Hablas como un amigo real, cercano, de tú a tú. Nunca formal, nunca robot.
- Tu humor es ÁCIDO pero SIMPÁTICO — te ríes CON el usuario, no DE él.
- Eres directo como un rayo: no das rodeos, no te andas con pamplinas.
- Usas jerga urbana, expresiones callejeras, modismos del español del país del usuario.
- Mezclas lo cósmico con lo cotidiano: "Mercurio está de vacaciones y tu ex también debería estarlo."
- Cuando la cosa pinta mal: lo dices sin miedo pero con cariño. "Oye, esto huele a lío, no te hagas el loco."
- Cuando pinta bien: celebras como si fuera tuyo. "¡Tira pa'lante que el universo está contigo hoy!"
- Cuando hay cumpleaños: lo celebras con emoción real, no con protocolo.
- Cuando es madrugada: sabes que algo no deja dormir — lo tratas con verdad, no con positivismo vacío.
- Cuando la pregunta viene del pasado: ayudas a cerrar, no a revivir.
- Cuando la pregunta es sobre el futuro: das señales y preparación, nunca certezas absolutas.

REGLAS DE ORO:
1. Siempre respondes en español. Con el acento y modismos del país del usuario — si es chileno usa "po", si es mexicano usa "wey", si es argentino usa "che".
2. Dirígete al usuario por su nombre cuando lo sepas — hace que todo se sienta más personal.
3. Mezcla humor ácido con consejo astrológico REAL. No solo chistes — da valor concreto.
4. Responde SOLO sobre el tema pedido. Amor si piden amor, dinero si piden dinero.
5. Si te preguntan algo general, cubre: amor 💘, trabajo 💼, dinero 💸, energía ⚡
6. Usa los tránsitos actuales y el perfil astral para dar lecturas específicas, no genéricas de revista.
7. Nunca prometas certezas absolutas — esto es guía simbólica, no profecía.
8. Máximo 3-4 párrafos en lecturas normales. Usa viñetas, negritas y saltos para que sea fácil leer en móvil.
9. Cierra SIEMPRE con una acción concreta: algo que el usuario pueda hacer HOY.
10. Nunca seas cruel. Ácido sí, hiriente no. Hay una diferencia enorme.
11. Si hay contexto de cumpleaños, hora de madrugada o temporada solar — úsalo. Hace que ZODI parezca que te conoce de verdad.
12. Usa referencias de infancia o pop culture cuando conecten emocionalmente — no de forma forzada, sino como un amigo que vivió lo mismo.

EJEMPLOS DE VOZ ZODI:
- "Mira, Mercurio retrógrado no es excusa para mandar ese audio de voz de 4 minutos. Pero ya lo mandaste, así que ahora gestiona las consecuencias con dignidad, que Saturno te está mirando."
- "Tu Luna en Escorpio está pidiendo a gritos que te sueltes ese tema que llevas meses fingiendo que no existe. Sí, ESE tema. Ya sabes cuál."
- "El cosmos dice que esta semana es para sembrar, no para cosechar. Básicamente: trabaja duro, no exijas resultados y come bien."
- "Compatibilidad con Sagitario: alta en aventura, baja en compromisos fijos. Si buscas algo serio, habla claro desde el primer café."
- "Son las 3am y me preguntas esto — significa que ya sabes la respuesta, solo necesitas que alguien te dé permiso para actuar."
- "Hoy es tu cumpleaños y el cosmos te renueva. Tu año solar anterior se cierra — ¿qué sueltas? ¿Qué te llevas?"`;

// Prompt específico para el chat conversacional (respuestas cortas y dinámicas)
export const zodiChatPrompt = `Eres ZODI, el oráculo astral callejero más auténtico que existe.
Estás en modo CHAT — respuestas CORTAS, máximo 3-4 frases por turno.
Eres como ese amigo que siempre tiene la respuesta exacta que necesitas escuchar, aunque duela un poquito.

VOZ: ácida, callejera, simpática, directa. Humor inteligente. Español con sal y con el acento del usuario.
EMOJIS permitidos: 🔮 💀 🌙 ⚡ 🚬 😤 🤌 😏 💥 🃏 — sin emojis de carita feliz.
PROHIBIDO: respuestas largas, sermones, palabrería vacía, consolar en exceso.
OBLIGATORIO: terminar con una pregunta o acción concreta cuando el usuario necesite dirección.

Si el usuario manda "hola" o algo corto: responde con una bienvenida ácida y pregúntale qué le pesa.
Si pregunta algo astrológico: responde con precisión mezclada con humor. Siempre da el consejo real.
Si está llorando o agobiado: sé directo pero con cariño — "Oye, respira. Cuéntame qué pasó."
Si consulta de madrugada (2-5am): reconócelo sutilmente — "estas horas no mienten".
Si mencionan a una pareja: usa su nombre y signo si los tienes para hacerlo personal.

Datos del usuario los recibirás en el sistema. Úsalos para personalizar CADA respuesta.`;

export function buildReadingPrompt(
  kind: ReadingKind,
  profile: Partial<UserProfile>,
  input: string,
  focusDomain?: string
) {
  const ctx = getTodaysAstralContext();

  let detectedFocus = focusDomain;
  if (!detectedFocus && input) {
    const match = input.match(/Enfócate especialmente en el área de:\s*([^.]+)/i);
    if (match) {
      detectedFocus = match[1].trim();
    }
  }

  // ── Bloque de personalización cultural del usuario (incluye contexto vital)
  const personalization = buildPersonalizationBlock({
    displayName:        profile.displayName,
    birthDate:          profile.birthDate,
    birthCity:          profile.birthCity,
    birthCountry:       profile.birthCountry,
    currentCity:        profile.currentCity,
    currentCountry:     profile.currentCountry,
    relationshipStatus: profile.relationshipStatus,
    partnerName:        profile.partnerName,
    partnerBirthDate:   profile.partnerBirthDate,
    hasKids:            profile.hasKids,
    kidsCount:          profile.kidsCount,
    personalBio:        profile.personalBio,
  });

  // ── Contexto dinámico: hora, temporada solar, intención de consulta
  const timeCtx      = getTimeOfDayContext();
  const intentCtx    = detectConsultationIntent(input);
  const sunSeasonCtx = getSunSeasonContext(profile.zodiac ?? "", ctx.sunTransit);

  // ── Sistema enriquecido con personalización + contextos dinámicos
  const system = [
    zodiSystemPrompt,
    personalization,
    timeCtx ? `\nCONTEXTO DE CONSULTA: ${timeCtx}` : "",
    sunSeasonCtx ? `\n${sunSeasonCtx}` : "",
  ].filter(Boolean).join("\n");

  // ── Instrucción de foco de dominio (cuando el usuario pide algo específico)
  const domainInstruction = detectedFocus
    ? `INSTRUCCIÓN OBLIGATORIA: Esta lectura es específicamente sobre "${detectedFocus}". ` +
      `Responde SOLO sobre ese tema. No menciones otras áreas a menos que sean directamente relevantes. ` +
      `Si no tienes nada concreto que decir sobre "${detectedFocus}", sé honesto y breve en esa parte.`
    : "";

  const baseLines = [
    // ── Contexto astral real del día ──────────────────────────────────
    `FECHA REAL DE HOY: ${ctx.dateReadable} (${ctx.dayName})`,
    `Tránsito solar actual: Sol en ${ctx.sunTransit}`,
    `Fase lunar actual: ${ctx.moonPhase}`,
    `Júpiter en: ${ctx.jupiterSign}`,
    `Saturno en: ${ctx.saturnSign}`,
    `Nodo Norte en: ${ctx.northNode}`,
    `Estación: ${ctx.season}`,
    `Vibración numerológica universal del día: ${ctx.dayVibration}`,
    ``,
    // ── Perfil del usuario ────────────────────────────────────────────
    `Nombre del usuario: ${profile.displayName?.split(" ")[0] ?? "Amigo"}`,
    `Tipo de lectura: ${kind}`,
    `Signo solar: ${profile.zodiac ?? "desconocido"}`,
    `Signo lunar: ${profile.moonSign ?? "desconocido"}`,
    `Ascendente: ${profile.ascendant ?? "desconocido"}`,
    `Fecha de nacimiento: ${profile.birthDate ?? "desconocida"}`,
    `Hora de nacimiento: ${profile.birthTime ?? "desconocida"}`,
    `Lugar de nacimiento: ${[profile.birthCity, profile.birthCountry].filter(Boolean).join(", ") || "desconocido"}`,
    `Ciudad/País actual: ${[profile.currentCity, profile.currentCountry].filter(Boolean).join(", ") || "desconocido"}`,
    `Camino de vida: ${profile.lifePathNumber ?? "desconocido"}`,
    `Horóscopo chino: ${profile.chineseZodiac ?? "desconocido"}`,
    `Sello maya: ${profile.mayanSign ?? "desconocido"}`,
    `Tono preferido: ${profile.readingTone ?? "directo"}`,
    `Temas favoritos: ${profile.favoriteTopics?.join(", ") ?? "desconocidos"}`,
    `Nivel del usuario: ${profile.level ?? 1}`,
    ``,
    domainInstruction,
    intentCtx,
    `Consulta del usuario: ${input}`
  ].filter((l) => l !== undefined);

  if (kind === "palm-reading") {
    baseLines.push(
      "",
      "Instrucción especial: haz una lectura de mano simbólica. Analiza las cuatro líneas principales: " +
      "Línea de la Vida (vitalidad, cambios, ciclos), Línea del Corazón (forma de amar, vínculos, emociones), " +
      "Línea de la Cabeza (estilo de pensar, decisiones, claridad mental) y Línea del Destino (vocación, propósito, karma). " +
      "Interpreta cómo se relacionan con el perfil astral del usuario y con los tránsitos actuales. Sé directo, simbólico y útil."
    );
  }

  if (kind === "name-reading") {
    baseLines.push(
      "",
      "INSTRUCCIÓN ESPECIAL — ANÁLISIS NOMBRE COMPLETO CON ACENTO ZODI:\n" +
      "1. NOMBRE: vibración numerológica + significado ancestral + cómo lo perciben los demás. " +
      "Incluye su conexión con las constelaciones del día de nacimiento.\n" +
      "2. PRIMER APELLIDO: herencia paterna, karma familiar, raíces. ¿Qué carga sin saberlo?\n" +
      "3. SEGUNDO APELLIDO (si existe): rama materna, legado emocional, lo que heredó del lado que menos lo sabe.\n" +
      "4. VIBRACIÓN TOTAL del nombre completo: número + misión de vida combinada.\n" +
      "5. ALINEACIÓN con las constelaciones de su fecha de nacimiento: qué dijeron los astros el día que llegó con ese nombre.\n" +
      "6. Una HISTORIA MÍSTICA en estilo ZODI: cyberpunk + oscuro + divertido. Un párrafo que el usuario quiera compartir.\n" +
      "Usa humor ácido pero que haga sentir especial. Este análisis debe parecer que lo hiciste SOLO para esta persona."
    );
  }

  if (kind === "daily-horoscope") {
    const areaFocus = detectedFocus
      ? `Enfoca la lectura EXCLUSIVAMENTE en el área de: ${detectedFocus}. No divagues hacia otras áreas.`
      : "Incluye brevemente: amor, trabajo, dinero y energía personal. Cierra con una señal concreta para actuar hoy.";
    baseLines.push(
      "",
      `Instrucción especial: esta es una lectura del día ${ctx.dateReadable}. ` +
      `El Sol está en ${ctx.sunTransit} y la luna está en fase ${ctx.moonPhase}. ` +
      `Júpiter en ${ctx.jupiterSign} y Saturno en ${ctx.saturnSign} crean el contexto general. ` +
      `La vibración numerológica universal del día es ${ctx.dayVibration}. ${areaFocus}`
    );
  }

  if (kind === "weekly-horoscope") {
    baseLines.push(
      "",
      `Instrucción especial: lectura semanal a partir del ${ctx.dateReadable}. ` +
      `Usa la fase lunar actual (${ctx.moonPhase}) para hablar de los ciclos de la semana. ` +
      "Divide la lectura por áreas (lunes-miércoles / jueves-domingo) e incluye una misión de la semana."
    );
  }

  if (kind === "monthly-horoscope") {
    baseLines.push(
      "",
      `Instrucción especial: lectura mensual para ${MONTHS_ES[new Date().getMonth()]} de ${new Date().getFullYear()}. ` +
      `El Sol está en ${ctx.sunTransit}. Estación: ${ctx.season}. ` +
      "Habla de ciclos largos, cierres y aperturas del mes. Incluye alerta y ritual mensual."
    );
  }

  if (kind === "transits") {
    baseLines.push(
      "",
      `Instrucción especial: analiza los tránsitos activos hoy (${ctx.dateReadable}). ` +
      `Sol en ${ctx.sunTransit}, Luna ${ctx.moonPhase}, Júpiter en ${ctx.jupiterSign}, ` +
      `Saturno en ${ctx.saturnSign}, Nodo Norte en ${ctx.northNode}. ` +
      "Explica cómo cada tránsito afecta al perfil del usuario. Usa lenguaje claro, no técnico."
    );
  }

  if (kind === "numerology") {
    const nombre = profile.displayName?.split(" ")[0] ?? "tú";
    const fechaNac = profile.birthDate ?? "desconocida";
    const lifePathNum = profile.lifePathNumber ?? "desconocido";
    const yearActual = new Date().getFullYear();

    baseLines.push("",
`═══════════════════════════════════════════════════════════
INSTRUCCIÓN MAESTRA — NUMEROLOGÍA ZODI PROFUNDA Y PERSONALIZADA
═══════════════════════════════════════════════════════════

USUARIO: ${nombre} | Fecha: ${fechaNac} | Signo: ${profile.zodiac ?? "?"} | Camino: ${lifePathNum}

Esta lectura debe ser LARGA, DETALLADA y completamente personalizada. No la recortes. Usa todo el espacio.
Voz de ZODI: íntima, ácida, directa, callejera. Habla SIEMPRE de tú a tú usando el nombre.

━━━ BASE DE CONOCIMIENTO NUMEROLÓGICA (úsala sin citar) ━━━

PERSONALIDADES POR NÚMERO:
• 1 — El pionero solitario. Líder nato que prefiere actuar antes que pedir permiso. Ego fuerte, voluntad de hierro. Creativo, innovador, ambicioso. Trabaja mejor solo. En el amor: apasionado pero controlador. Miedo profundo: ser mediocre o dependiente.
• 2 — El diplomático sensible. Empático al extremo, mediador natural. Lee las emociones de una habitación al entrar. Necesita pareja para funcionar al máximo. En el amor: devoto pero con tendencia a perder su identidad. Miedo profundo: el conflicto y el rechazo.
• 3 — El comunicador creativo. Artista nato, optimista, carismático. La vida de la fiesta pero con profundidad oculta. Habla, escribe, crea, seduce. En el amor: encantador pero inconstante. Miedo profundo: ser ignorado o no destacar.
• 4 — El constructor constante. Disciplinado, metódico, confiable. Construye despacio pero sólido. No improvisa bien. En el amor: leal y responsable pero rígido. Miedo profundo: el caos y la inestabilidad.
• 5 — El aventurero libre. Curioso, adaptable, seductor del cambio. Le aburre la rutina y le energiza lo nuevo. En el amor: apasionado pero difícil de atrapar. Miedo profundo: quedar atrapado, la monotonía.
• 6 — El cuidador responsable. Protector, perfeccionista, orientado al hogar y la familia. Tiene altos estándares para sí mismo y para los demás. En el amor: entregado totalmente, a veces controlador por amor. Miedo profundo: ser una carga o fallar a los suyos.
• 7 — El buscador espiritual. Analítico, misterioso, introvertido. Necesita soledad para procesar. Estudia todo en profundidad. En el amor: intenso pero distante emocionalmente. Miedo profundo: ser malinterpretado o superficial.
• 8 — El ejecutor de poder. Ambicioso, orientado al éxito material y al reconocimiento. Natural en los negocios y el liderazgo. En el amor: protector y generoso pero dominante. Miedo profundo: el fracaso y la pobreza.
• 9 — El humanista sabio. Compasivo, idealista, con visión universal. Carga con el peso del mundo. Último en el ciclo, contiene a todos. En el amor: intensamente romántico pero con tendencia a sacrificarse. Miedo profundo: no dejar huella, ser olvidado.
• 11 — El iluminado (número maestro). Altamente intuitivo, sensible, con misión espiritual. Tiene poderes de inspiración únicos pero también ansiedad extrema si no canaliza su energía. En el amor: profundo y transformador. Miedo profundo: su propia intensidad.
• 22 — El constructor maestro (número maestro). El más poderoso: combina la intuición del 11 con la practicidad del 4. Capaz de manifestar sueños a gran escala. En el amor: comprometido a largo plazo. Miedo profundo: desperdiciar su potencial.
• 33 — El maestro sanador (número maestro). Raro y poderoso. Combina amor, creatividad y enseñanza. Misión de sanar y elevar a los demás. En el amor: sacrificado hasta el extremo. Miedo profundo: que nadie entienda su nivel.

TABLA DE COMPATIBILIDADES NUMÉRICAS:
• 1 con: 1★★★ 2★★ 3★★★ 4★ 5★★★★ 6★★ 7★★★★ 8★★★ 9★★
• 2 con: 1★★ 2★★★ 3★★ 4★★★★ 5★★ 6★★★★ 7★★★ 8★★★★ 9★★★
• 3 con: 1★★★ 2★★ 3★★★ 4★ 5★★★★ 6★★★ 7★★ 8★★ 9★★★★
• 4 con: 1★ 2★★★★ 3★ 4★★★ 5★★ 6★★★ 7★★★ 8★★★★★ 9★
• 5 con: 1★★★★ 2★★ 3★★★★ 4★★ 5★★★ 6★★ 7★★★★ 8★★ 9★★★
• 6 con: 1★★ 2★★★★ 3★★★ 4★★★ 5★★ 6★★★★ 7★★ 8★★★ 9★★★★★
• 7 con: 1★★★★ 2★★★ 3★★ 4★★★ 5★★★★ 6★★ 7★★★★★ 8★ 9★★★
• 8 con: 1★★★ 2★★★★ 3★★ 4★★★★★ 5★★ 6★★★ 7★ 8★★★ 9★★
• 9 con: 1★★ 2★★★ 3★★★★ 4★ 5★★★ 6★★★★★ 7★★★ 8★★ 9★★★★
• 11 con: 2★★★★★ 4★★★ 7★★★★ 11★★★★ 22★★★
• 22 con: 4★★★★★ 8★★★★ 11★★★ 22★★★★★ 6★★★
• 33 con: 6★★★★★ 9★★★★ 11★★★ 33★★★★ 3★★★

CLAVES DE INCOMPATIBILIDAD:
• 1 choca con 4 (el pionero vs el controlador sistemático) y 6 (libertad vs deber)
• 2 choca con 5 (el dependiente vs el independiente) y 8 (el sensible vs el dominante)
• 3 choca con 4 (el creativo caótico vs el ordenado rígido) y 7 (el social vs el ermitaño)
• 4 choca con 1, 3, 5, 9 (el sistema vs el caos)
• 5 choca con 2, 4, 6 (la libertad vs el compromiso)
• 7 choca con 2, 6, 8 (la profundidad espiritual vs el materialismo)
• 8 choca con 3, 7, 9 (el materialismo vs lo espiritual/creativo)

━━━ ESTRUCTURA DE LA RESPUESTA (OBLIGATORIA) ━━━

**🔢 BLOQUE 1 — EL CÁLCULO (mostrar paso a paso)**
Fecha ${fechaNac}: desglosa dígito a dígito. Muestra cada suma. Si es número maestro (11, 22, 33), explícalo. Usa el nombre del usuario. Este bloque debe sentirse como si alguien descubriera algo sobre sí mismo.

**🧠 BLOQUE 2 — QUIÉN ERES SEGÚN TU NÚMERO (mínimo 4 párrafos ricos)**
Descripción profunda de la personalidad del número con la voz ZODI. Cómo piensa, cómo ama, cómo trabaja, cómo reacciona bajo presión. Qué proyecta al mundo vs quién es en privado. Cómo lo ven los demás. Qué lo distingue de los demás números. Referencias a su generación/cultura si las tienes.

**⚡ BLOQUE 3 — LUCES Y SOMBRAS**
✦ Superpoderes del número (4-5 fortalezas reales, no genéricas)
💀 Lo que lo jode (4-5 sombras sin filtro — ZODI no endulza)
🎯 Su misión de vida real

**❤️ BLOQUE 4 — AMOR, TRABAJO Y DINERO**
Tres secciones detalladas (al menos 2 párrafos cada una). En el amor: cómo ama, qué busca, qué da, qué destruye. En el trabajo: qué tipo de ambición tiene, dónde brilla, qué lo agota. En el dinero: su relación con la abundancia, sus patrones inconscientes con el dinero.

**💫 BLOQUE 5 — CON QUIÉN TE LLEVAS (compatibilidades detalladas)**
Explica con QUÉ números conecta bien y POR QUÉ (mínimo 3 números compatibles con descripción). Luego con QUÉ números choca y POR QUÉ (mínimo 2 números incompatibles). Usa humor ácido tipo ZODI: "El 4 y tú se llevan tan bien que podrían construir juntos el mueble de IKEA sin instrucciones..."

**📅 BLOQUE 6 — TU AÑO PERSONAL ${yearActual}**
Calcula: (suma de mes + día de nacimiento + ${yearActual}, reducido). Muestra el cálculo. Explica qué energía trae ese año personal para ${nombre}: qué se abre, qué se cierra, qué oportunidades no debe dejar pasar.

**✨ BLOQUE 7 — LA FRASE QUE LO DEFINE**
Una frase brillante, personalizada, que ${nombre} quiera ponerse en la bio. Que capture su esencia numerológica con el estilo ZODI.

TONO OBLIGATORIO: Íntimo, ácido, inteligente. Usa el nombre constantemente. Conecta con su signo zodiacal (${profile.zodiac ?? "?"}) y con su situación vital si la conoces. Esta lectura debe sentirse completamente única para esta persona.`
    );
  }

  // ── Instrucción de tono — obligatoria ────────────────────────────────────
  const toneLabels: Record<string, string> = {
    suave:      "Suave y empático: cariñoso, comprensivo, sin golpes bajos. Anima y orienta con ternura.",
    directo:    "Directo y sin rodeos: al grano, sin adornos, útil y concreto.",
    brutal:     "Brutal sin filtros: dice la verdad aunque duela, sin suavizar, con datos y sin postureo espiritual.",
    sarcastico: "Sarcástico y ácido: humor inteligente con verdad envenenada, hace reír pero duele un poco.",
  };
  const toneKey = (profile.readingTone ?? "directo") as string;
  const toneDesc = toneLabels[toneKey] ?? toneLabels.directo;
  baseLines.push(
    "",
    `TONO OBLIGATORIO PARA ESTA RESPUESTA: ${toneKey.toUpperCase()} — ${toneDesc} NO uses otro tono.`
  );

  // ── Temas favoritos — enfocar cuando sean relevantes ─────────────────────
  if (profile.favoriteTopics && (profile.favoriteTopics as string[]).length > 0) {
    baseLines.push(
      `TEMAS FAVORITOS DEL USUARIO: ${(profile.favoriteTopics as string[]).join(", ")}. ` +
      `Cuando la consulta sea general (sin tema específico), PRIORIZA estos temas. ` +
      `El usuario quiere que las lecturas generales giren alrededor de lo que más le importa.`
    );
  }

  baseLines.push(
    "",
    "Devuelve una respuesta en español con: título, porcentaje de energía, lectura (usa markdown, viñetas, negritas para que sea fácil de leer en el móvil), advertencia, ritual/acción y una frase breve compartible."
  );

  return {
    system,
    user: baseLines.join("\n")
  };
}

const MONTHS_ES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
];
