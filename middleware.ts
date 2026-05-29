import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const isAuthenticated = request.cookies.has('zodi_auth');
  const onboardingCompleted = request.cookies.has('zodi_onboarding');

  // Rutas públicas que no deben ver los usuarios autenticados
  const isPublicAuthRoute = pathname === '/' || pathname.startsWith('/auth/');
  
  if (isPublicAuthRoute && isAuthenticated) {
    if (onboardingCompleted) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
  }

  // Rutas protegidas que requieren autenticación
  const isProtectedRoute = pathname.startsWith('/dashboard') || pathname === '/onboarding';
  
  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Si intenta entrar al dashboard pero no ha completado el onboarding
  if (pathname.startsWith('/dashboard') && isAuthenticated && !onboardingCompleted) {
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - zodi-art (assets)
     * - zodiac (assets)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|zodi-art|zodiac|sw.js|manifest.webmanifest).*)',
  ],
};
