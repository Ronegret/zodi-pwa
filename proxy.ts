import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAuthenticated = request.cookies.has('zodi_auth');
  const onboardingCompleted = request.cookies.has('zodi_onboarding');

  const isPublicAuthRoute = pathname === '/' || pathname.startsWith('/auth/');

  if (isPublicAuthRoute && isAuthenticated) {
    if (onboardingCompleted) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.redirect(new URL('/onboarding', request.url));
  }

  const isProtectedRoute = pathname === '/onboarding';

  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  if (pathname.startsWith('/dashboard') && isAuthenticated && !onboardingCompleted) {
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|zodi-art|zodiac|sw.js|manifest.webmanifest).*)',
  ],
};
