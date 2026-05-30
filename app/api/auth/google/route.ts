import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/auth/google
 * Inicia el flujo OAuth de Google en el servidor.
 * Bypass completo del auth handler de Firebase (evita auth/internal-error).
 */
export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "GOOGLE_CLIENT_ID no configurado en Vercel" }, { status: 500 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zodi-pwa.vercel.app";
  const redirectUri = `${siteUrl}/api/auth/callback`;

  // Obtener la URL de retorno después del login (por defecto: dashboard)
  const { searchParams } = new URL(request.url);
  const next = searchParams.get("next") || "/dashboard";

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
    state: encodeURIComponent(next),
  });

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  return NextResponse.redirect(googleAuthUrl);
}
