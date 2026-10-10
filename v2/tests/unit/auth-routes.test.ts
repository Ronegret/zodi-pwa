import { describe, expect, it } from 'vitest';
import {
  classifyRoute,
  isSameOrigin,
  loginPath,
  requiresSession,
  safeNext,
} from '@/lib/auth/routes';
import { authErrorMessage, GENERIC_AUTH_ERROR } from '@/lib/auth/errors';
import { noticeFor } from '@/lib/auth/notices';

describe('classifyRoute', () => {
  it.each([
    ['/', 'public'],
    ['/horoscopo/aries', 'public'],
    ['/auth/callback', 'public'],
    ['/auth/salir', 'public'],
    ['/auth/login', 'guest-only'],
    ['/auth/registro/', 'guest-only'],
    ['/auth/nueva-clave', 'session-only'],
    ['/app', 'app'],
    ['/app/', 'app'],
    ['/app/carta', 'app'],
    ['/APP/Carta', 'app'],
    ['/app/onboarding', 'onboarding'],
    ['/api/salud', 'api-public'],
    ['/api/perfil', 'api-private'],
    ['/api', 'api-private'],
    ['/api/nuevo-endpoint-sin-registrar', 'api-private'],
    ['/API/SALUD/', 'api-public'],
  ] as const)('%s → %s', (path, kind) => {
    expect(classifyRoute(path)).toBe(kind);
  });

  it('no confunde prefijos parecidos', () => {
    expect(classifyRoute('/apple')).toBe('public');
    expect(classifyRoute('/application')).toBe('public');
  });

  it('las rutas privadas exigen sesión y las públicas no', () => {
    expect(requiresSession('app')).toBe(true);
    expect(requiresSession('api-private')).toBe(true);
    expect(requiresSession('session-only')).toBe(true);
    expect(requiresSession('public')).toBe(false);
    expect(requiresSession('guest-only')).toBe(false);
  });
});

describe('safeNext (open redirect)', () => {
  it.each([
    [null, '/app'],
    ['', '/app'],
    ['/app/carta?x=1#y', '/app/carta?x=1#y'],
    ['https://evil.com', '/app'],
    ['//evil.com', '/app'],
    ['/\\evil.com', '/app'],
    ['\\\\evil.com', '/app'],
    ['/app\n/x', '/app'],
    ['javascript:alert(1)', '/app'],
    ['/' + 'a'.repeat(600), '/app'],
  ])('%j → %s', (input, expected) => {
    expect(safeNext(input)).toBe(expected);
  });

  it('loginPath conserva el destino interno', () => {
    expect(loginPath(new URL('https://zodi.aibueno.es/app'))).toBe('/auth/login');
    expect(loginPath(new URL('https://zodi.aibueno.es/app/carta?tab=casas'))).toBe(
      '/auth/login?next=%2Fapp%2Fcarta%3Ftab%3Dcasas',
    );
  });
});

describe('isSameOrigin (CSRF en /api)', () => {
  const url = new URL('https://zodi.aibueno.es/api/perfil');
  const req = (headers: Record<string, string>) => new Request(url, { method: 'POST', headers });

  it('acepta el mismo origen', () => {
    expect(isSameOrigin(req({ origin: 'https://zodi.aibueno.es' }), url)).toBe(true);
    expect(isSameOrigin(req({ 'sec-fetch-site': 'same-origin' }), url)).toBe(true);
  });

  it('rechaza otros orígenes o peticiones sin pistas', () => {
    expect(isSameOrigin(req({ origin: 'https://evil.com' }), url)).toBe(false);
    expect(isSameOrigin(req({ origin: 'http://zodi.aibueno.es' }), url)).toBe(false);
    expect(isSameOrigin(req({ 'sec-fetch-site': 'cross-site' }), url)).toBe(false);
    expect(isSameOrigin(req({}), url)).toBe(false);
  });
});

describe('mensajes de auth', () => {
  it('traduce códigos conocidos sin filtrar detalles', () => {
    expect(authErrorMessage({ code: 'invalid_credentials' })).toMatch(/incorrectos/);
    expect(authErrorMessage({ status: 429 })).toMatch(/Demasiados intentos/);
    expect(authErrorMessage({ code: 'unexpected_failure', status: 500 })).toBe(GENERIC_AUTH_ERROR);
  });

  it('no confirma si un correo ya existe', () => {
    expect(authErrorMessage({ code: 'user_already_exists' })).not.toMatch(/ya existe|registrado/i);
  });

  it('solo acepta avisos conocidos', () => {
    expect(noticeFor('salida')?.tone).toBe('info');
    expect(noticeFor('<script>')).toBeNull();
    expect(noticeFor('toString')).toBeNull();
  });
});
