import { NextResponse } from "next/server";
import { generateReading, type AIProvider } from "@/lib/ai/providers";
import type { ReadingKind } from "@/types/zodi";

const requests = new Map<string, { count: number; resetAt: number }>();

export async function POST(request: Request) {
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

  const body = (await request.json().catch(() => ({}))) as {
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
