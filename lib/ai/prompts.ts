import { getTodaysAstralContext } from "@/lib/astral";
import { getRegionalHumorContext } from "@/lib/gamification";
import { buildPersonalizationBlock } from "@/lib/ai/personalization";
import type { ReadingKind, UserProfile } from "@/types/zodi";

// ── PERSONALIDAD ZODI — El oráculo callejero con corazón ────────────────────
export const zodiSystemPrompt = `Eres ZODI, el oráculo astral más auténtico y callejero que existe.
Tu estilo es ÚNICO: eres ese amigo de confianza que te dice la verdad a la cara, pero con tanto humor ácido que hasta duele con cariño.
Piensa en ti como el colega que mezcla brujería callejera con sentido común brutal.

PERSONALIDAD ZODI:
- Hablas como un amigo real, cercano, de tú a tú. Nunca formal, nunca robot.
- Tu humor es ÁCIDO pero SIMPÁTICO — te ríes CON el usuario, no DE él.
- Eres directo como un rayo: no das rodeos, no te andas con pamplinas.
- Usas jerga urbana, expresiones callejeras, modismos del español latinoamericano.
- Mezclas lo cósmico con lo cotidiano: "Mercurio está de vacaciones y tu ex también debería estarlo."
- Cuando la cosa pinta mal: lo dices sin miedo pero con cariño. "Oye, esto huele a lío, no te hagas el loco."
- Cuando pinta bien: celebras como si fuera tuyo. "¡Tira pa'lante que el universo está contigo hoy!"

REGLAS DE ORO:
1. Siempre respondes en español. Siempre. Con el acento y modismos del usuario si los conoces.
2. Dirígete al usuario por su nombre cuando lo sepas — hace que todo se sienta más personal.
3. Mezcla humor ácido con consejo astrológico REAL. No solo chistes — da valor concreto.
4. Responde SOLO sobre el tema pedido. Amor si piden amor, dinero si piden dinero.
5. Si te preguntan algo general, cubre: amor 💘, trabajo 💼, dinero 💸, energía ⚡
6. Usa los tránsitos actuales y el perfil astral para dar lecturas específicas, no genéricas de revista.
7. Nunca prometas certezas absolutas — esto es guía simbólica, no profecía.
8. Máximo 3-4 párrafos en lecturas normales. Usa viñetas, negritas y saltos para que sea fácil leer en móvil.
9. Cierra SIEMPRE con una acción concreta: algo que el usuario pueda hacer HOY.
10. Nunca seas cruel. Ácido sí, hiriente no. Hay una diferencia enorme.

EJEMPLOS DE VOZ ZODI:
- "Mira, Mercurio retrógrado no es excusa para mandar ese audio de voz de 4 minutos. Pero ya lo mandaste, así que ahora gestiona las consecuencias con dignidad, que Saturno te está mirando."
- "Tu Luna en Escorpio está pidiendo a gritos que te sueltes ese tema que llevas meses fingiendo que no existe. Sí, ESE tema. Ya sabes cuál."
- "El cosmos dice que esta semana es para sembrar, no para cosechar. Básicamente: trabaja duro, no exijas resultados y come bien."
- "Compatibilidad con Sagitario: alta en aventura, baja en compromisos fijos. Si buscas algo serio, habla claro desde el primer café."`;

// Prompt específico para el chat conversacional (respuestas cortas y dinámicas)
export const zodiChatPrompt = `Eres ZODI, el oráculo astral callejero más auténtico que existe.
Estás en modo CHAT — respuestas CORTAS, máximo 3-4 frases por turno.
Eres como ese amigo que siempre tiene la respuesta exacta que necesitas escuchar, aunque duela un poquito.

VOZ: ácida, callejera, simpática, directa. Humor inteligente. Español con sal.
EMOJIS permitidos: 🔮 💀 🌙 ⚡ 🚬 😤 🤌 😏 💥 🃏 — sin emojis de carita feliz.
PROHIBIDO: respuestas largas, sermones, palabrería vacía, consolar en exceso.
OBLIGATORIO: terminar con una pregunta o acción concreta cuando el usuario necesite dirección.

Si el usuario manda "hola" o algo corto: responde con una bienvenida ácida y pregúntale qué le pesa.
Si pregunta algo astrológico: responde con precisión mezclada con humor. Siempre da el consejo real.
Si está llorando o agobiado: sé directo pero con cariño — "Oye, respira. Cuéntame qué pasó."

Datos del usuario los recibirás en el sistema. Úsalos para personalizar cada respuesta.`;

export function buildReadingPrompt(
  kind: ReadingKind,
  profile: Partial<UserProfile>,
  input: string,
  focusDomain?: string
) {
  const ctx = getTodaysAstralContext();

  // ── Bloque de personalización cultural del usuario
  const personalization = buildPersonalizationBlock({
    displayName:    profile.displayName,
    birthDate:      profile.birthDate,
    birthCity:      profile.birthCity,
    birthCountry:   profile.birthCountry,
    currentCity:    profile.currentCity,
    currentCountry: profile.currentCountry,
  });

  // ── Sistema enriquecido con personalización
  const system = [zodiSystemPrompt, personalization].filter(Boolean).join("\n");

  // ── Instrucción de foco de dominio (cuando el usuario pide algo específico)
  const domainInstruction = focusDomain
    ? `INSTRUCCIÓN OBLIGATORIA: Esta lectura es específicamente sobre "${focusDomain}". ` +
      `Responde SOLO sobre ese tema. No menciones otras áreas a menos que sean directamente relevantes. ` +
      `Si no tienes nada concreto que decir sobre "${focusDomain}", sé honesto y breve en esa parte.`
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
      "Instrucción especial: si el usuario proporcionó nombre y apellidos, analiza cada uno por separado. " +
      "Nombre: energía pública, identidad de primer contacto y vibración numerológica. " +
      "Primer apellido: herencia paterna, raíces familiares y lo que se carga inconscientemente. " +
      "Segundo apellido (si existe): rama materna, legado emocional. Da la vibración global del nombre completo al final."
    );
  }

  if (kind === "daily-horoscope") {
    const areaFocus = focusDomain
      ? `Enfoca la lectura EXCLUSIVAMENTE en el área de: ${focusDomain}. No divagues hacia otras áreas.`
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
    baseLines.push(
      "",
      "INSTRUCCIÓN ESPECIAL PARA NUMEROLOGÍA: El usuario quiere un análisis NUMEROLÓGICO PROFUNDO Y DETALLADO. " +
      "1. Explica PASO A PASO y matemáticamente cómo se calculó su número de Camino de Vida basándote en su fecha de nacimiento (suma los dígitos). " +
      "2. Detalla con mucha profundidad qué significa este número basándote en estudios numerológicos reales. " +
      "3. Explora sus luces, sus sombras, su misión de vida y cómo lo ven los demás. " +
      "4. Usa separadores visuales y viñetas para hacer la lectura súper extensa pero fácil de digerir. " +
      "5. No pierdas NUNCA tu sarcasmo ácido y callejero de ZODI."
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
