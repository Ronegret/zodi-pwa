import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware mínimo: solo protege rutas privadas.
// NO redirige usuarios autenticados fuera de /auth/* — eso lo maneja el cliente
// (onAuthStateChanged en AuthForm) para evitar bucles de redirect.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAuthenticated    = request.cookies.has('zodi_auth');
  const onboardingDone     = request.cookies.has('zodi_onboarding');

  // Dashboard requiere estar autenticado y con onboarding completado
  if (pathname.startsWith('/dashboard')) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    if (!onboardingDone) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
  }

  // Onboarding requiere estar autenticado
  if (pathname === '/onboarding' && !isAuthenticated) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|zodi-art|zodiac|sw.js|manifest.webmanifest).*)',
  ],
};
