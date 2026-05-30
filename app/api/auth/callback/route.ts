import { NextResponse } from "next/server";
import { getFirebaseAuth } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

function getSiteUrl(request: Request) {
  return process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
}

function getSafeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

/**
 * GET /api/auth/callback
 * Recibe el código de autorización de Google, crea un Firebase custom token
 * y redirige al cliente para completar el sign-in.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const stateRaw = searchParams.get("state");
  const next = getSafeNext(stateRaw);

  const siteUrl = getSiteUrl(request);
  const failUrl = `${siteUrl}/auth/login?error=`;

  // Error directo de Google (ej: usuario canceló)
  if (error) {
    if (error === "access_denied") {
      return NextResponse.redirect(`${siteUrl}/auth/login`);
    }
    return NextResponse.redirect(`${failUrl}${encodeURIComponent(error)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${failUrl}no_code`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("[AUTH CALLBACK] Faltan GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET");
    return NextResponse.redirect(`${failUrl}server_config_error`);
  }

  const redirectUri = `${siteUrl}/api/auth/callback`;

  try {
    // ── 1. Intercambiar código por tokens ──────────────────────────────
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const tokenError = await tokenRes.json();
      console.error("[AUTH CALLBACK] Error intercambiando token:", tokenError);
      return NextResponse.redirect(`${failUrl}${encodeURIComponent(tokenError.error_description || "token_exchange_failed")}`);
    }

    const tokens: { id_token?: string; access_token?: string } = await tokenRes.json();
    const idToken = tokens.id_token;

    if (!idToken) {
      return NextResponse.redirect(`${failUrl}no_id_token`);
    }

    // ── 2. Obtener info del usuario desde el ID token ──────────────────
    const userInfoRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
    );
    const userInfo: {
      sub?: string;
      email?: string;
      name?: string;
      picture?: string;
      email_verified?: string;
    } = await userInfoRes.json();

    if (!userInfo.sub || !userInfo.email) {
      return NextResponse.redirect(`${failUrl}invalid_user_info`);
    }

    // ── 3. Obtener/crear usuario en Firebase Auth (Admin SDK) ──────────
    const adminAuth = getFirebaseAuth();
    if (!adminAuth) {
      console.error("[AUTH CALLBACK] Firebase Admin no configurado");
      return NextResponse.redirect(`${failUrl}admin_not_configured`);
    }

    let uid: string;

    try {
      // Intentar buscar por Google UID (provider UID)
      const existing = await adminAuth.getUserByProviderUid("google.com", userInfo.sub);
      uid = existing.uid;
    } catch {
      // No existe por provider UID — buscar por email
      try {
        const byEmail = await adminAuth.getUserByEmail(userInfo.email);
        uid = byEmail.uid;
      } catch {
        // Crear usuario nuevo
        const newUser = await adminAuth.createUser({
          email: userInfo.email,
          displayName: userInfo.name || "",
          photoURL: userInfo.picture || "",
          emailVerified: userInfo.email_verified === "true",
        });
        uid = newUser.uid;
      }
    }

    // ── 4. Crear custom token de Firebase (válido 1 hora) ──────────────
    const customToken = await adminAuth.createCustomToken(uid, {
      googleId: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name || "",
      picture: userInfo.picture || "",
    });

    // ── 5. Redirigir al cliente con el custom token ────────────────────
    const completeUrl = new URL(`${siteUrl}/auth/complete`);
    completeUrl.searchParams.set("token", customToken);
    completeUrl.searchParams.set("name", userInfo.name || "");
    completeUrl.searchParams.set("email", userInfo.email);
    completeUrl.searchParams.set("next", next);

    return NextResponse.redirect(completeUrl.toString());
  } catch (err: any) {
    console.error("[AUTH CALLBACK] Error inesperado:", err?.message || err);
    return NextResponse.redirect(`${failUrl}${encodeURIComponent(err?.message || "unknown_error")}`);
  }
}
