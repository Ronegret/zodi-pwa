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
    sunSign:       z.string().optional(),
    moonSign:      z.string().optional(),
    ascendant:     z.string().optional(),
    displayName:   z.string().optional(),
    birthDate:     z.string().optional(),
    birthCity:     z.string().optional(),
    birthCountry:  z.string().optional(),
    currentCity:   z.string().optional(),
    currentCountry: z.string().optional(),
  }).optional()
});

// ── Construir system prompt personalizado ────────────────────────────────────
function buildSystemPrompt(profile?: z.infer<typeof ChatSchema>["userProfile"]) {
  const signs = [
    profile?.sunSign   ? `Signo solar: ${profile.sunSign}`    : null,
    profile?.moonSign  ? `Luna en: ${profile.moonSign}`       : null,
    profile?.ascendant ? `Ascendente: ${profile.ascendant}`   : null,
  ].filter(Boolean).join(" | ");

  const personalization = buildPersonalizationBlock({
    displayName:    profile?.displayName,
    birthDate:      profile?.birthDate,
    birthCity:      profile?.birthCity,
    birthCountry:   profile?.birthCountry,
    currentCity:    profile?.currentCity,
    currentCountry: profile?.currentCountry,
  });

  return [
    zodiChatPrompt,
    signs ? `PERFIL ASTRAL: ${signs}` : "Perfil astral desconocido — pídelo si es relevante.",
    personalization
  ].filter(Boolean).join("\n");
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
      model: process.env.CLAUDE_MODEL || "claude-sonnet-4-5",
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
    const auth = getFirebaseAuth();
    if (auth) {
      try { await auth.verifyIdToken(token); }
      catch { return NextResponse.json({ error: "Token inválido. El cosmos te pide que te identifiques." }, { status: 401 }); }
    }

    const json = await req.json();
    const parsed = ChatSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Formato inválido.", details: parsed.error.issues }, { status: 400 });
    }

    const { messages, userProfile } = parsed.data;
    const system = buildSystemPrompt(userProfile);

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
