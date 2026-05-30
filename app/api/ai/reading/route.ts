import { NextResponse } from "next/server";
import { generateReading, type AIProvider } from "@/lib/ai/providers";
import type { ReadingKind } from "@/types/zodi";
import { getFirebaseAuth } from "@/lib/firebase/admin";
import { z } from "zod";

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
  const auth = getFirebaseAuth();
  if (auth) {
    try {
      await auth.verifyIdToken(token);
    } catch (e) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }
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
