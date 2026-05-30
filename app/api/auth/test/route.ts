import { NextResponse } from "next/server";

/**
 * Diagnóstico: testa si el Firebase API key funciona desde este entorno.
 * GET /api/auth/test
 * Solo accesible en producción con header secret para seguridad mínima.
 */
export async function GET(request: Request) {
  const expectedSecret = process.env.AUTH_TEST_SECRET;
  const providedSecret = request.headers.get("x-zodi-diagnostic-secret");

  if ((process.env.NODE_ENV === "production" || expectedSecret) && (!expectedSecret || providedSecret !== expectedSecret)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!apiKey || !projectId) {
    return NextResponse.json({ error: "Missing Firebase env vars", apiKey: !!apiKey, projectId: !!projectId }, { status: 500 });
  }

  const results: Record<string, any> = {
    environment: {
      apiKey: apiKey.slice(0, 10) + "...",
      projectId,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.slice(0, 20) + "...",
    },
    tests: {}
  };

  // Test 1: identitytoolkit API (crea un URL de auth)
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: "test@test.com",
          continueUri: `https://${projectId}.firebaseapp.com`
        })
      }
    );
    const data = await res.json();
    results.tests.identityToolkit = {
      status: res.status,
      ok: res.ok,
      // Si hay error de API key, aparecerá aquí
      error: data.error?.message || null,
      errorCode: data.error?.code || null,
      hasProviders: !!data.allProviders
    };
  } catch (e: any) {
    results.tests.identityToolkit = { error: e.message };
  }

  // Test 2: Token endpoint (verifica que el proyecto existe)
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/projects/${projectId}?key=${apiKey}`
    );
    results.tests.projectCheck = {
      status: res.status,
      ok: res.ok
    };
  } catch (e: any) {
    results.tests.projectCheck = { error: e.message };
  }

  return NextResponse.json(results);
}
