import { expect, test } from '@playwright/test';
import { createTestUser, login } from './support/auth';

test.describe('acceso', () => {
  test('sin sesión las rutas privadas llevan al login conservando el destino', async ({ page }) => {
    await page.goto('/app/carta');
    await expect(page).toHaveURL(/\/auth\/login\?next=%2Fapp%2Fcarta$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Vuelve a tu cielo');
  });

  test('una cookie de sesión falsificada no abre /app', async ({ page, context, baseURL }) => {
    const now = Math.floor(Date.now() / 1000);
    const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
    const forged = {
      access_token: `${b64({ alg: 'HS256' })}.${b64({ sub: 'x', exp: now + 3600 })}.firma-falsa`,
      refresh_token: 'falso',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: now + 3600,
      user: {
        id: '00000000-0000-4000-8000-000000000000',
        aud: 'authenticated',
        role: 'authenticated',
      },
    };
    await context.addCookies([
      { name: 'sb-127-auth-token', value: `base64-${b64(forged)}`, url: baseURL! },
    ]);
    await page.goto('/app');
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('errores de formulario accesibles: foco al resumen y campo asociado', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.locator('[data-error-summary]')).toBeFocused();
    const email = page.getByLabel('Correo electrónico');
    await expect(email).toHaveAttribute('aria-invalid', 'true');
    const describedBy = await email.getAttribute('aria-describedby');
    await expect(page.locator(`#${describedBy}`)).toContainText('Escribe tu correo');
    await page.getByRole('link', { name: 'Escribe tu correo.' }).click();
    await expect(email).toBeFocused();
  });

  test('credenciales incorrectas: mensaje genérico', async ({ page, request }) => {
    const user = await createTestUser(request, true);
    await login(page, { ...user, password: 'NoEsLaClave123' });
    await expect(page.locator('[data-error-summary]')).toContainText(
      'Correo o contraseña incorrectos',
    );
    await expect(page).toHaveURL(/\/auth\/login$/);
  });

  test('login → dashboard con su carta → cerrar sesión', async ({ page, request }) => {
    const user = await createTestUser(request, true);
    await login(page, user);
    await expect(page).toHaveURL(/\/app$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Hola, Ana' })).toBeVisible();
    await expect(page.getByText('Aries 25°06′')).toBeVisible();

    const cookie = (await page.context().cookies()).find((c) => c.name.startsWith('sb-'));
    expect(cookie).toMatchObject({ httpOnly: true, sameSite: 'Lax' });

    await page.goto('/auth/login');
    await expect(page).toHaveURL(/\/app$/);

    await page.getByRole('button', { name: 'Cerrar sesión' }).click();
    await expect(page).toHaveURL(/\/auth\/login\?aviso=salida$/);
    await expect(page.getByRole('status')).toContainText('Has cerrado sesión');
    await page.goto('/app');
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('un next externo no saca al usuario de Zodi', async ({ page, request }) => {
    const user = await createTestUser(request, true);
    await login(page, user, '/auth/login?next=%2F%2Fevil.example%2F');
    await expect(page).toHaveURL(/localhost:4329\/app$/);
  });
});

test.describe('API', () => {
  test('sin sesión responde 401 JSON; salud es pública', async ({ request }) => {
    const res = await request.get('/api/perfil');
    expect(res.status()).toBe(401);
    expect(await res.json()).toEqual({
      error: { code: 'unauthorized', message: 'Necesitas iniciar sesión.' },
    });
    expect((await request.get('/api/salud')).status()).toBe(200);
  });

  test('rechaza escrituras desde otro origen (CSRF)', async ({ request }) => {
    const res = await request.post('/api/carta', {
      headers: { origin: 'https://evil.example' },
      data: {},
    });
    expect(res.status()).toBe(403);
  });

  test('con sesión valida entradas y no deja tocar el plan', async ({ page, request, baseURL }) => {
    const user = await createTestUser(request, true);
    await login(page, user);
    await expect(page).toHaveURL(/\/app$/);
    const headers = { origin: baseURL! };
    const plan = await page.request.patch('/api/perfil', { headers, data: { plan: 'vip' } });
    expect(plan.status()).toBe(422);
    const ok = await page.request.patch('/api/perfil', {
      headers,
      data: { reading_tone: 'sarcastico' },
    });
    expect(ok.status()).toBe(200);
    expect((await ok.json()).data.reading_tone).toBe('sarcastico');
    const uso = await page.request.get('/api/uso');
    expect((await uso.json()).data).toEqual({ used: 0, limit: 5, remaining: 5 });
  });

  test('cabeceras de seguridad y sin caché en rutas privadas', async ({ request }) => {
    const res = await request.get('/auth/login');
    const h = res.headers();
    expect(h['x-frame-options']).toBe('DENY');
    expect(h['x-content-type-options']).toBe('nosniff');
    expect(h['strict-transport-security']).toContain('max-age=');
    expect(h['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(h['cache-control']).toBe('private, no-store');
  });
});
