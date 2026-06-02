import { buildReadingPrompt, zodiSystemPrompt } from "@/lib/ai/prompts";
import type { ReadingKind, UserProfile } from "@/types/zodi";

export type AIProvider = "openai" | "claude" | "anthropic" | "gemini" | "mock" | "auto";

// Lecturas extendidas — más tokens, más tiempo
const EXTENDED_KINDS: ReadingKind[] = ["numerology", "natal-chart", "name-reading", "celtic-tarot"];
const EXTENDED_MAX_TOKENS = 900;
const DEFAULT_MAX_TOKENS  = 550;

// ── Routing de modelos ────────────────────────────────────────────────────────
// Lecturas simples usan Haiku (20× más barato). Lecturas complejas usan Sonnet.
const HAIKU_KINDS: ReadingKind[] = [
  "crystals", "biorhythm", "runes", "dream", "roast",
  "chinese-horoscope", "mayan-horoscope",
];

// ── Response cache en memoria ─────────────────────────────────────────────────
// Lecturas genéricas por signo+fecha no cambian entre usuarios → se reutilizan.
// En Vercel, las funciones warm conservan el módulo entre invocaciones (~5-30 min).
const CACHEABLE_KINDS: ReadingKind[] = [
  "daily-horoscope", "weekly-horoscope", "monthly-horoscope",
];
const responseCache = new Map<string, { text: string; cachedAt: number }>();
const CACHE_TTL_MS  = 4 * 60 * 60 * 1000; // 4 horas

function cacheKey(kind: ReadingKind, zodiac: string): string | null {
  if (!CACHEABLE_KINDS.includes(kind) || !zodiac) return null;
  const date = new Date().toISOString().slice(0, 10);
  return `${kind}:${zodiac}:${date}`;
}

function getCache(key: string): string | null {
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > CACHE_TTL_MS) { responseCache.delete(key); return null; }
  return entry.text;
}

function setCache(key: string, text: string): void {
  responseCache.set(key, { text, cachedAt: Date.now() });
  // Evitar memory leak: limpiar entradas viejas si el mapa crece demasiado
  if (responseCache.size > 500) {
    const oldest = [...responseCache.entries()].sort((a, b) => a[1].cachedAt - b[1].cachedAt);
    for (const [k] of oldest.slice(0, 100)) responseCache.delete(k);
  }
}

export type GenerateReadingParams = {
  provider?: AIProvider;
  kind: ReadingKind;
  profile: Partial<UserProfile>;
  input: string;
  system?: string;
  prompt?: string;
  userContext?: Record<string, unknown>;
};

export type ZodiReadingResponse = {
  status: "ok" | "fallback";
  title: string;
  vibeScore: number;
  reading: string;
  warning: string;
  ritual: string;
  roast: string;
  text: string;
  provider: AIProvider;
  fallback?: boolean;
  reason?: string;
  prompt: { system: string; user: string };
};

export async function generateReading(params: GenerateReadingParams): Promise<ZodiReadingResponse> {
  const promptBundle = params.prompt
    ? { system: params.system ?? zodiSystemPrompt, user: params.prompt }
    : buildReadingPrompt(params.kind, params.profile, params.input);

  const resolvedProvider = resolveProvider(params.provider);
  if (resolvedProvider === "mock") {
    return localFallback(params.kind, params.profile, promptBundle, "mock");
  }

  const normalizedProvider: AIProvider = resolvedProvider === "anthropic" ? "claude" : resolvedProvider;

  const available: AIProvider[] = (params.provider && params.provider !== "auto")
    ? [normalizedProvider]
    : (["claude", "openai", "gemini"] as AIProvider[]).filter(p => {
        if (p === "claude") return !!(process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY);
        if (p === "openai") return !!process.env.OPENAI_API_KEY;
        if (p === "gemini") return !!process.env.GEMINI_API_KEY;
        return false;
      });

  if (available.length === 0) {
    return localFallback(params.kind, params.profile, promptBundle, "mock", "Sin proveedores configurados.");
  }

  // ── Response cache — lecturas genéricas por signo+fecha ───────────────────
  const ck = cacheKey(params.kind, params.profile.zodiac ?? "");
  if (ck) {
    const cached = getCache(ck);
    if (cached) {
      return normalizeReading(cached, params.kind, promptBundle, normalizedProvider);
    }
  }

  const maxTokens = EXTENDED_KINDS.includes(params.kind) ? EXTENDED_MAX_TOKENS : DEFAULT_MAX_TOKENS;

  const attempts = available.map((p): Promise<string> => {
    if (p === "claude" || p === "anthropic") return callClaude(promptBundle.system, promptBundle.user, maxTokens, params.kind);
    if (p === "openai") return callOpenAI(promptBundle.system, promptBundle.user, maxTokens);
    if (p === "gemini") return callGemini(promptBundle.system, promptBundle.user, maxTokens);
    return Promise.reject(new Error(`Provider ${p} no implementado`));
  });

  try {
    const text = await Promise.any(attempts);
    if (ck) setCache(ck, text); // guardar en cache si es cacheable
    return normalizeReading(text, params.kind, promptBundle, normalizedProvider);
  } catch (aggErr: unknown) {
    const errors = aggErr instanceof AggregateError
      ? aggErr.errors.map((e: unknown) => (e instanceof Error ? e.message : String(e))).join(" | ")
      : "Todos los providers fallaron";
    console.error("[ZODI] generateReading: all providers failed:", errors);
    return localFallback(params.kind, params.profile, promptBundle, "mock", errors);
  }
}

function resolveProvider(provider: AIProvider = "auto"): AIProvider {
  if (provider !== "auto") return provider;
  if (process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY) return "claude";
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.GEMINI_API_KEY) return "gemini";
  return "mock";
}

// ── Claude — prompt caching + routing Haiku/Sonnet ───────────────────────────
async function callClaude(system: string, user: string, maxTokens = DEFAULT_MAX_TOKENS, kind?: ReadingKind): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
  if (!apiKey) throw new Error("La señal astral no está activa.");

  // Haiku para lecturas simples (20× más barato), Sonnet para lecturas complejas
  const model = (kind && HAIKU_KINDS.includes(kind))
    ? (process.env.CLAUDE_HAIKU_MODEL || "claude-haiku-4-5-20251001")
    : (process.env.CLAUDE_MODEL       || "claude-sonnet-4-6");

  const timeoutMs = maxTokens > 800 ? 14000 : 11000;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      // Prompt caching: el system prompt se cachea 5 min en Anthropic.
      // Requests siguientes del mismo usuario en sesión pagan 10% del costo.
      "anthropic-beta": "prompt-caching-2024-07-31",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      // system como array con cache_control — cachea el bloque estático
      system: [
        {
          type: "text",
          text: system,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: user }],
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(readProviderError(data, `Claude ${response.status}`));

  const content = Array.isArray(data.content) ? data.content : [];
  const text = content
    .map((item: { text?: string }) => item.text)
    .filter(Boolean)
    .join("\n\n")
    .trim();
  if (!text) throw new Error("La lectura llegó en silencio.");
  return text;
}

async function callGemini(system: string, user: string, maxTokens = DEFAULT_MAX_TOKENS): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("La señal astral no está activa.");

  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI({ apiKey });

  const timeoutMs = maxTokens > 1000 ? 13000 : 10000;
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Gemini timeout")), timeoutMs)
  );

  const geminiPromise = ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [{ role: "user", parts: [{ text: user }] }],
    config: { systemInstruction: system, temperature: 0.85, maxOutputTokens: maxTokens },
  });

  const response = await Promise.race([geminiPromise, timeoutPromise]);
  const text = response.text?.trim();
  if (!text) throw new Error("La lectura llegó en silencio.");
  return text;
}

async function callOpenAI(system: string, user: string, maxTokens = DEFAULT_MAX_TOKENS): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("La señal astral no está activa.");

  const timeoutMs = maxTokens > 800 ? 14000 : 11000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.85,
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
      signal: controller.signal,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(readProviderError(data, `OpenAI ${response.status}`));

    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("La lectura llegó en silencio.");
    return text;
  } finally {
    clearTimeout(timeoutId);
  }
}

function normalizeReading(
  text: string,
  kind: ReadingKind,
  prompt: { system: string; user: string },
  provider: AIProvider
): ZodiReadingResponse {
  return {
    status: "ok",
    title: titleForKind(kind),
    vibeScore: 65 + Math.floor(Math.random() * 33),
    reading: text,
    warning: warningForKind(kind),
    ritual: ritualForKind(kind),
    roast: "ZODI ya leyó el caos. Ahora falta que tú no lo conviertas en plan de vida.",
    text,
    provider,
    prompt,
  };
}

function warningForKind(kind: ReadingKind): string {
  const warnings: Record<ReadingKind, string> = {
    "daily-horoscope":   "Toma esto como una guía simbólica, no como sentencia del destino.",
    "weekly-horoscope":  "La semana tiene energía propia. No la conviertas en profecía antes de vivirla.",
    "monthly-horoscope": "Un ciclo no define el mes entero. Úsalo como mapa, no como destino.",
    "natal-chart":       "Tu carta muestra patrones, no jaula. Úsala para entenderte, no para limitarte.",
    tarot:               "Las cartas reflejan energía del momento. Tú decides el movimiento final.",
    "celtic-tarot":      "La tirada celta muestra capas, no verdades absolutas. Interpreta con calma.",
    compatibility:       "La compatibilidad es probabilidad, no destino. Las personas cambian y tú también.",
    dream:               "Los sueños son lenguaje simbólico, no mensajes literales del futuro.",
    transits:            "Los tránsitos son contexto astral, no excusa ni sentencia para tus decisiones.",
    numerology:          "Los números muestran patrones de energía. No los uses como única brújula vital.",
    "name-reading":      "Nombre y apellidos tienen vibración, pero tú construyes tu presencia con acciones.",
    "palm-reading":      "Las líneas de la mano son simbólicas, no deterministas. Tu historia la escribes tú.",
    biorhythm:           "El biorritmo es referencia orientativa, no excusa para no actuar cuando debes.",
    "chinese-horoscope": "El ciclo chino orienta con sabiduría milenaria, pero no determina tu rumbo.",
    "mayan-horoscope":   "El sello maya es energía simbólica. Léelo como guía, no como decreto del cosmos.",
    runes:               "Las runas son mensajes simbólicos de una tradición antigua. La acción siempre es tuya.",
    crystals:            "Los cristales son recordatorios simbólicos de intención. No son soluciones mágicas.",
    roast:               "El humor ácido ilumina sin destruir. Si duele demasiado, pregúntate por qué resuena.",
    assistant:           "No fuerces una respuesta solo porque la ansiedad quiere tener todo en un calendario.",
  };
  return warnings[kind];
}

function ritualForKind(kind: ReadingKind): string {
  const rituals: Record<ReadingKind, string> = {
    "daily-horoscope":   "Elige una acción concreta basada en la lectura y ponla en práctica hoy. Solo una.",
    "weekly-horoscope":  "Escribe una intención clara para los próximos 7 días y revísala el domingo.",
    "monthly-horoscope": "Identifica una cosa para soltar y una para construir este mes. Comprométete con ambas.",
    "natal-chart":       "Lee tu carta una vez más y subraya lo que resuena hoy. Ignora lo que no aplica.",
    tarot:               "Guarda la lectura, respira y vuelve a consultarla cuando baje el ruido mental.",
    "celtic-tarot":      "Anota la carta central de la tirada. Es el tema que más merece tu atención ahora.",
    compatibility:       "Describe en tres palabras lo que realmente buscas en una conexión auténtica.",
    dream:               "Escribe el sueño completo antes de interpretarlo. Los detalles olvidados también cuentan.",
    transits:            "Identifica una decisión pendiente que este tránsito quiere que mires de frente.",
    numerology:          "Elige una sola prioridad hoy basada en tu vibración numerológica. Menos es más.",
    "name-reading":      "Preséntate hoy usando tu nombre completo con intención. La firma energética se entrena.",
    "palm-reading":      "Observa tus manos hoy con curiosidad, no con ansiedad.",
    biorhythm:           "Ajusta tu agenda según tu ciclo actual. No empujes cuando el cuerpo pide pausa.",
    "chinese-horoscope": "Aplica una estrategia lenta y deliberada hoy. Tu animal marca el ritmo correcto.",
    "mayan-horoscope":   "Conecta con tu sello hoy: escribe lo que intuyes sin juzgarlo ni editarlo.",
    runes:               "Dibuja o visualiza la runa que salió. Mantenla presente durante tu próxima decisión.",
    crystals:            "Lleva el cristal sugerido o visualiza su color durante tu próxima decisión importante.",
    roast:               "Comparte la lectura con alguien de confianza. El roast duele menos cuando te ríes.",
    assistant:           "Elige una acción pequeña de la respuesta, guárdala en favoritos y revisa cómo resultó.",
  };
  return rituals[kind];
}

function localFallback(
  kind: ReadingKind,
  profile: Partial<UserProfile>,
  prompt: { system: string; user: string },
  provider: AIProvider,
  reason?: string
): ZodiReadingResponse {
  const sign  = profile.zodiac || "tu signo";
  const tone  = profile.readingTone || "directo";
  const title = titleForKind(kind);
  const vibeScore = scoreForKind(kind, sign);
  const reading   = fallbackText(kind, sign, tone);
  const warning   = warningForKind(kind);
  const ritual    = ritualForKind(kind);
  const roast = "El destino te mandó señales. Tu bandeja mental las marcó como spam.";
  const text  = `${title}\n\nEnergía: ${vibeScore}%\n\n${reading}\n\nAdvertencia: ${warning}\n\nAcción mágica: ${ritual}\n\n${roast}`;
  return { status: "fallback", title, vibeScore, reading, warning, ritual, roast, text, provider, fallback: true, reason, prompt };
}

function fallbackText(kind: ReadingKind, sign: string, tone: UserProfile["readingTone"] | undefined): string {
  const toneLine = tone === "brutal" || tone === "sarcastico" ? "sin envolverlo en incienso caro" : "con calma y foco";
  const lines: Record<ReadingKind, string> = {
    "daily-horoscope":   `${sign} entra hoy con energía de reinicio: menos drama, más criterio. Lee el ambiente antes de responder y decide ${toneLine}.`,
    "weekly-horoscope":  "Esta semana pide ordenar prioridades. Si algo se repite, no es misterio: es patrón esperando que lo mires de frente.",
    "monthly-horoscope": "El mes abre una puerta lenta pero potente. Lo que sostengas con constancia gana más fuerza que cualquier impulso de medianoche.",
    "natal-chart":       "Tu carta base mezcla deseo, defensa y ambición. La clave está en usar tu intensidad como mapa, no como alarma permanente.",
    tarot:               "La tirada muestra situación, bloqueo y salida: observa lo obvio, corta el ruido y no negocies contigo cuando ya sabes la respuesta.",
    "celtic-tarot":      "La cruz celta marca un ciclo de limpieza. Pasado pesado, presente cargado, futuro manejable si dejas de alimentar escenarios que no existen.",
    compatibility:       "La compatibilidad no se mide por química solamente. Mira ritmo, cuidado, conversación y cómo reaccionan cuando el ego se siente observado.",
    dream:               "El sueño funciona como graffiti del inconsciente: exagera una emoción real para que por fin la veas sin filtros.",
    transits:            "Los tránsitos activan decisiones pendientes. No hace falta correr, pero sí dejar de fingir que no viste la señal.",
    numerology:          "Tu numerología habla de patrones, ciclos y energía personal. Hoy conviene elegir una sola prioridad y cumplirla sin teatro.",
    "name-reading":      "Tu nombre y apellidos cargan una vibración única. Nombre: identidad pública. Apellidos: herencia y raíces.",
    "palm-reading":      "Las líneas de tu mano son un mapa simbólico de tu energía: vida, corazón, cabeza y destino.",
    biorhythm:           "Tu biorritmo sugiere administrar energía. No todo cansancio es bloqueo espiritual; a veces es cuerpo pidiendo mantenimiento.",
    "chinese-horoscope": "El ciclo chino pide estrategia. Avanza con paciencia, observa alianzas y no gastes poder en demostrar que tienes razón.",
    "mayan-horoscope":   "El sello maya marca una energía de memoria antigua: escucha intuición, pero pásala por hechos antes de declararla profecía.",
    runes:               "La runa simbólica del día habla de protección y movimiento. Cierra lo abierto antes de abrir otro portal mental.",
    crystals:            "La lectura de cristales pide aterrizar. Carga menos objetos y más intención: foco, descanso y una decisión limpia.",
    roast:               `${sign}, tu intuición está gritando y tu ego pide subtítulos. Hoy bloquea el autosabotaje antes de que se ponga creativo.`,
    assistant:           "ZODI está contigo: pregunta claro, recibe claro. El caos responde mejor cuando no lo alimentas con veinte pestañas abiertas.",
  };
  return lines[kind];
}

function titleForKind(kind: ReadingKind): string {
  const titles: Record<ReadingKind, string> = {
    "daily-horoscope":   "Horóscopo de hoy",
    "weekly-horoscope":  "Mapa semanal",
    "monthly-horoscope": "Predicción mensual",
    "natal-chart":       "Carta natal base",
    tarot:               "Tirada tarot",
    "celtic-tarot":      "Tirada celta",
    compatibility:       "Compatibilidad",
    dream:               "Interpretación de sueño",
    transits:            "Tránsitos activos",
    numerology:          "Numerología",
    "name-reading":      "Lectura de nombre y apellidos",
    "palm-reading":      "Lectura de mano",
    biorhythm:           "Biorritmo",
    "chinese-horoscope": "Horóscopo chino",
    "mayan-horoscope":   "Horóscopo maya",
    runes:               "Runas vikingas",
    crystals:            "Cristales",
    roast:               "Roast horoscope",
    assistant:           "Oráculo personal",
  };
  return titles[kind];
}

function scoreForKind(kind: ReadingKind, sign: string): number {
  const seed = `${kind}-${sign}`.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return 62 + (seed % 35);
}

function readProviderError(data: unknown, fallback: string): string {
  if (typeof data === "object" && data !== null && "error" in data) {
    const error = (data as { error?: { message?: string } | string }).error;
    if (typeof error === "string") return error;
    if (error?.message) return error.message;
  }
  return fallback;
}
