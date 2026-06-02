import { NextResponse } from "next/server";
import { getFirebaseAuth } from "@/lib/firebase/admin";
import { zodiChatPrompt } from "@/lib/ai/prompts";
import { buildPersonalizationBlock } from "@/lib/ai/personalization";
import { z } from "zod";

export const maxDuration = 30;

const ChatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "model", "zodi"]),
    text: z.string().min(1).max(2000)
  })).min(1).max(50),
  userProfile: z.object({
    // Perfil astral
    sunSign:          z.string().optional(),
    moonSign:         z.string().optional(),
    ascendant:        z.string().optional(),
    chineseZodiac:    z.string().optional(),
    mayanSign:        z.string().optional(),
    lifePathNumber:   z.number().optional(),
    natalChartBase:   z.string().optional(),
    // Identidad
    displayName:      z.string().optional(),
    birthDate:        z.string().optional(),
    birthCity:        z.string().optional(),
    birthCountry:     z.string().optional(),
    currentCity:      z.string().optional(),
    currentCountry:   z.string().optional(),
    // Preferencias
    readingTone:      z.string().optional(),
    favoriteTopics:   z.array(z.string()).optional(),
    // Contexto vital
    relationshipStatus: z.string().optional(),
    partnerName:      z.string().optional(),
    partnerBirthDate: z.string().optional(),
    hasKids:          z.boolean().optional(),
    kidsCount:        z.number().optional(),
    personalBio:      z.string().optional(),
  }).optional()
});

// ── Detectar tema recurrente en el historial ─────────────────────────────────
function detectRecurringTheme(messages: { role: string; text: string }[]): string | null {
  const userMsgs = messages.filter(m => m.role === "user").map(m => m.text.toLowerCase());
  if (userMsgs.length < 3) return null;

  const themes = [
    { key: "amor", words: ["amor", "pareja", "ex", "relación", "quiere", "le gusta", "me dejó", "chico", "chica", "novio", "novia"] },
    { key: "trabajo", words: ["trabajo", "jefe", "empresa", "dinero", "sueldo", "proyecto", "laboral", "empleo", "carrera"] },
    { key: "familia", words: ["familia", "mamá", "papá", "madre", "padre", "hermano", "hermana", "hijos", "padres"] },
    { key: "salud", words: ["salud", "ansiedad", "cansancio", "agotado", "enfermo", "depresión", "estrés"] },
    { key: "decisión", words: ["decisión", "elegir", "cambio", "moverme", "quedarme", "no sé qué hacer", "debo"] },
  ];

  for (const theme of themes) {
    const hits = userMsgs.filter(m => theme.words.some(w => m.includes(w)));
    if (hits.length >= 2) return theme.key;
  }
  return null;
}

// ── Construir system prompt personalizado ────────────────────────────────────
function buildSystemPrompt(
  profile?: z.infer<typeof ChatSchema>["userProfile"],
  messages?: { role: string; text: string }[]
) {
  // Perfil astral completo
  const astralParts = [
    profile?.sunSign        ? `Signo solar: ${profile.sunSign}`           : null,
    profile?.moonSign       ? `Luna en: ${profile.moonSign}`              : null,
    profile?.ascendant      ? `Ascendente: ${profile.ascendant}`          : null,
    profile?.chineseZodiac  ? `Horóscopo chino: ${profile.chineseZodiac}` : null,
    profile?.mayanSign      ? `Sello maya: ${profile.mayanSign}`          : null,
    profile?.lifePathNumber ? `Camino de vida: ${profile.lifePathNumber}` : null,
  ].filter(Boolean).join(" | ");

  // Tema recurrente detectado de la conversación
  const recurringTheme = messages ? detectRecurringTheme(messages) : null;

  // Tono de lectura
  const toneInstructions: Record<string, string> = {
    suave:      "Tono SUAVE — empático, amable, sin golpes bajos. Cuida mucho cómo dice las verdades difíciles.",
    directo:    "Tono DIRECTO — claro, sin rodeos, pero no cruel. La verdad sin azúcar pero con respeto.",
    brutal:     "Tono BRUTAL — máxima honestidad. Sin filtros, sin suavizar. El usuario lo pidió así — dale exactamente eso.",
    sarcastico: "Tono SARCÁSTICO — humor ácido sin freno, ironía afilada. El usuario quiere que ZODI se ría con él de todo.",
  };
  const toneNote = profile?.readingTone
    ? toneInstructions[profile.readingTone] ?? toneInstructions.directo
    : toneInstructions.directo;

  // Temas favoritos
  const topicsNote = profile?.favoriteTopics?.length
    ? `Temas que más consulta: ${profile.favoriteTopics.join(", ")}. Si su pregunta es ambigua, guíate por estos temas.`
    : null;

  const personalization = buildPersonalizationBlock({
    displayName:        profile?.displayName,
    birthDate:          profile?.birthDate,
    birthCity:          profile?.birthCity,
    birthCountry:       profile?.birthCountry,
    currentCity:        profile?.currentCity,
    currentCountry:     profile?.currentCountry,
    relationshipStatus: profile?.relationshipStatus,
    partnerName:        profile?.partnerName,
    partnerBirthDate:   profile?.partnerBirthDate,
    hasKids:            profile?.hasKids,
    kidsCount:          profile?.kidsCount,
    personalBio:        profile?.personalBio,
    recurringTheme:     recurringTheme ?? undefined,
  });

  return [
    zodiChatPrompt,
    astralParts ? `PERFIL ASTRAL: ${astralParts}` : "Perfil astral sin completar — pide los datos que necesites.",
    toneNote,
    topicsNote,
    personalization
  ].filter(Boolean).join("\n\n");
}

// ── Llamada a Claude (Anthropic) ─────────────────────────────────────────────
async function callClaude(system: string, messages: { role: string; text: string }[]): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
  if (!apiKey) throw new Error("No Claude key");

  const claudeMessages = messages.map(m => ({
    role: m.role === "user" ? "user" : "assistant",
    content: m.text
  }));

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: process.env.CLAUDE_MODEL || "claude-sonnet-4-6",
      max_tokens: 400,
      system,
      messages: claudeMessages
    }),
    signal: AbortSignal.timeout(7000)
  });

  if (!res.ok) throw new Error(`Claude ${res.status}`);
  const data = await res.json();
  const text = (data.content as { text?: string }[])
    ?.map(c => c.text).filter(Boolean).join("").trim();
  if (!text) throw new Error("Claude empty response");
  return text;
}

// ── Llamada a OpenAI ─────────────────────────────────────────────────────────
async function callOpenAI(system: string, messages: { role: string; text: string }[]): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("No OpenAI key");

  const openaiMessages = [
    { role: "system", content: system },
    ...messages.map(m => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.text
    }))
  ];

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.88,
      max_tokens: 400,
      messages: openaiMessages
    }),
    signal: AbortSignal.timeout(7000)
  });

  if (!res.ok) throw new Error(`OpenAI ${res.status}`);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("OpenAI empty response");
  return text;
}

// ── Llamada a Gemini ─────────────────────────────────────────────────────────
async function callGemini(system: string, messages: { role: string; text: string }[]): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("No Gemini key");

  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI({ apiKey });

  const geminiContents = messages.map(m => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.text }]
  }));

  const res = await ai.models.generateContent({
    model: "gemini-1.5-flash",
    contents: geminiContents,
    config: { systemInstruction: system, temperature: 0.88, maxOutputTokens: 400 }
  });

  const text = res.text?.trim();
  if (!text) throw new Error("Gemini empty response");
  return text;
}

// ── Llamar todos los providers en PARALELO — el primero que responda gana ──
async function generateZodiReply(system: string, messages: { role: string; text: string }[]): Promise<string> {
  const attempts: Promise<string>[] = [];

  if (process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY) {
    attempts.push(callClaude(system, messages));
  }
  if (process.env.OPENAI_API_KEY) {
    attempts.push(callOpenAI(system, messages));
  }
  if (process.env.GEMINI_API_KEY) {
    attempts.push(callGemini(system, messages));
  }

  if (attempts.length === 0) {
    throw new Error("Sin providers configurados");
  }

  try {
    return await Promise.any(attempts);
  } catch (aggErr: any) {
    const reason = aggErr?.errors
      ? (aggErr.errors as Error[]).map((e: Error) => e.message).join(" | ")
      : "Todos los providers fallaron";
    console.error("[ZODI chat] All providers failed:", reason);
    throw new Error(reason);
  }
}

// ── Handler principal ────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado. ZODI no habla con desconocidos." }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const isLocalSession = !token || token === "local_session";
    try {
      const auth = getFirebaseAuth();
      if (auth && !isLocalSession) {
        try { await auth.verifyIdToken(token); }
        catch { return NextResponse.json({ error: "Token inválido. El cosmos te pide que te identifiques." }, { status: 401 }); }
      }
    } catch (adminErr) {
      console.error("[ZODI chat] Firebase Admin error:", adminErr);
    }

    const json = await req.json();
    const parsed = ChatSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Formato inválido.", details: parsed.error.issues }, { status: 400 });
    }

    const { messages, userProfile } = parsed.data;
    const system = buildSystemPrompt(userProfile, messages as any);

    const replyText = await generateZodiReply(system, messages as any);
    return NextResponse.json({ text: replyText });

  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { text: "Los astros se alinearon para darte un error. Literalmente. Vuelve a intentarlo en unos segundos. 🔮" },
      { status: 500 }
    );
  }
}
