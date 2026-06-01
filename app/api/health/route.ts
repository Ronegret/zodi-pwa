import { NextResponse } from "next/server";
import { getRuntimeEnvStatus } from "@/lib/env";

/**
 * GET /api/health
 * Verifica que el servidor está corriendo y las API keys están cargadas.
 * Útil para diagnóstico cuando las consultas de IA no funcionan.
 */
export async function GET() {
  const env = getRuntimeEnvStatus();
  const keys = {
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    openai:    !!process.env.OPENAI_API_KEY,
    gemini:    !!process.env.GEMINI_API_KEY,
    firebase:  env.firebaseClientReady,
    firebaseAdmin: env.firebaseAdminReady,
    siteUrl: env.siteUrlReady,
    stripe:    !!process.env.STRIPE_SECRET_KEY,
  };

  const aiReady = keys.anthropic || keys.openai || keys.gemini;
  const appReady = aiReady && env.firebaseClientReady && env.siteUrlReady;

  return NextResponse.json({
    status: appReady ? "ok" : "needs_configuration",
    message: appReady
      ? "Servidor ZODI operativo. Auth y entorno cargados."
      : "Servidor corriendo, pero faltan variables de entorno para produccion.",
    model: process.env.CLAUDE_MODEL || "claude-sonnet-4-6",
    keys,
    env: {
      missingFirebaseClient: env.missingFirebaseClient,
      missingFirebaseAdmin: env.missingFirebaseAdmin,
      siteUrlValid: env.siteUrlValid,
    },
    ts: new Date().toISOString(),
  });
}
