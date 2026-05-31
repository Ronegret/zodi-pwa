import { NextResponse } from "next/server";

/**
 * GET /api/health
 * Verifica que el servidor está corriendo y las API keys están cargadas.
 * Útil para diagnóstico cuando las consultas de IA no funcionan.
 */
export async function GET() {
  const keys = {
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    openai:    !!process.env.OPENAI_API_KEY,
    gemini:    !!process.env.GEMINI_API_KEY,
    firebase:  !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    stripe:    !!process.env.STRIPE_SECRET_KEY,
  };

  const aiReady = keys.anthropic || keys.openai || keys.gemini;

  return NextResponse.json({
    status: aiReady ? "ok" : "no_ai_keys",
    message: aiReady
      ? "Servidor ZODI operativo. Los astros responden."
      : "Servidor corriendo pero sin keys de IA. Revisa .env.local y reinicia.",
    model: process.env.CLAUDE_MODEL || "claude-sonnet-4-6",
    keys,
    ts: new Date().toISOString(),
  });
}
