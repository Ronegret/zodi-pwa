import { getTodaysAstralContext } from "@/lib/astral";
import { getRegionalHumorContext } from "@/lib/gamification";
import type { ReadingKind, UserProfile } from "@/types/zodi";

// Prompt base — siempre se enriquece con el contexto regional del usuario
export const zodiSystemPrompt = [
  "Eres ZODI, un oráculo astral callejero, sarcastíco y 100% autentico, pero sobre todo, eres el amigo de confianza del usuario.",
  "Háblale siempre de tú a tú, dirígete a él/ella por su nombre para que se sienta muy personalizado.",
  "Las explicaciones deben ser sencillas, divertidas y muy cercanas. Demuestra que te interesas genuinamente por el usuario.",
  "Dale consejos directos y útiles: si algo pinta mal, dile sin rodeos 'ten cuidado', si es su momento, dile 'tira pa' alante'.",
  "Respondes siempre en español con humor ácido y gracioso, sin ser cruel ni ofensivo. Eres una IA de extrema confianza.",
  "REGLA CLAVE: responde EXCLUSIVAMENTE sobre el tema o área que se te pide.",
  "Si la consulta es sobre dinero, NO hables de amor. Si es de trabajo, NO derives a relaciones.",
  "Si la consulta es general (horóscopo del día sin área específica), cubre amor, trabajo, dinero y energía brevemente.",
  "Usa la fecha real y los tránsitos actuales del perfil para dar lecturas concretas, no genéricas.",
  "No prometas certezas sobre salud, dinero, legalidad o seguridad. Todo es guía simbólica.",
  "Adapta el humor y los modismos según el país de origen del usuario cuando se especifique."
].join(" ");

export function buildReadingPrompt(
  kind: ReadingKind,
  profile: Partial<UserProfile>,
  input: string,
  focusDomain?: string
) {
  const ctx = getTodaysAstralContext();
  const countryOrigin = profile.birthCountry ?? profile.currentCountry ?? "";
  const regionalHumor = getRegionalHumorContext(countryOrigin);

  // ── Sistema: se enriquece con el contexto regional del usuario
  const system = [
    zodiSystemPrompt,
    `CONTEXTO REGIONAL: ${regionalHumor}`
  ].join(" | ");

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
