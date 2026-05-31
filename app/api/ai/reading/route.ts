import { NextResponse } from "next/server";
import { generateReading, type AIProvider } from "@/lib/ai/providers";
import type { ReadingKind } from "@/types/zodi";
import { getFirebaseAuth } from "@/lib/firebase/admin";
import { z } from "zod";

// Ampliar el timeout de Vercel (30s en Pro, ignorado en Hobby pero no causa error)
export const maxDuration = 30;

const requests = new Map<string, { count: number; resetAt: number }>();

const ReadingSchema = z.object({
  provider: z.enum(["auto", "gemini", "anthropic", "openai"]).optional(),
  kind: z.string().optional(),
  input: z.string().optional(),
  profile: z.record(z.string(), z.unknown()).optional(),
  system: z.string().optional(),
  prompt: z.string().optional(),
  userContext: z.record(z.string(), z.unknown()).optional()
});

export async function POST(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const token = authHeader.split("Bearer ")[1];
  // "local_session" = token de fallback cuando Firebase cliente no está disponible
  const isLocalSession = !token || token === "local_session";
  try {
    const auth = getFirebaseAuth();
    if (auth && !isLocalSession) {
      try {
        await auth.verifyIdToken(token);
      } catch {
        return NextResponse.json({ error: "Token inválido" }, { status: 401 });
      }
    }
  } catch (adminErr) {
    // Firebase Admin mal configurado — continuar sin verificación
    console.error("[ZODI] Firebase Admin getFirebaseAuth error:", adminErr);
  }

  // Rate limit by IP or UID (for simplicity, keeping IP, but ideal is UID)
  const clientId = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (isRateLimited(clientId)) {
    return NextResponse.json(
      {
        status: "fallback",
        text: "ZODI necesita respirar 60 segundos. El oráculo no se quema por impaciente."
      },
      { status: 429 }
    );
  }

  const json = await request.json().catch(() => ({}));
  const parsed = ReadingSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const body = parsed.data as {
    provider?: AIProvider;
    kind?: ReadingKind;
    input?: string;
    profile?: Record<string, unknown>;
    system?: string;
    prompt?: string;
    userContext?: Record<string, unknown>;
  };

  try {
    const response = await generateReading({
      provider: body.provider ?? "auto",
      kind: body.kind ?? "daily-horoscope",
      input: body.input ?? "Genera mi lectura ZODI.",
      profile: body.profile ?? {},
      system: body.system,
      prompt: body.prompt,
      userContext: body.userContext
    });

    const { provider, prompt, reason, ...publicReading } = response;
    void provider;
    void prompt;
    void reason;

    return NextResponse.json(publicReading);
  } catch (err) {
    console.error("[ZODI] generateReading unhandled error:", err);
    return NextResponse.json({
      status: "fallback",
      text: "El oráculo tuvo un problema técnico. Recarga e inténtalo de nuevo. 🔮",
      reading: "",
      warning: "",
      ritual: "",
      roast: "",
      title: "Error del oráculo",
      vibeScore: 0,
    });
  }
}

function isRateLimited(clientId: string) {
  const now = Date.now();
  const current = requests.get(clientId);

  if (!current || current.resetAt < now) {
    requests.set(clientId, { count: 1, resetAt: now + 60_000 });
    return false;
  }

  current.count += 1;
  requests.set(clientId, current);
  return current.count > 25;
}
