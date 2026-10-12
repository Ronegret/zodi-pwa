import { expect, test } from '@playwright/test';

/** El dominio pasa de la app Next a la v2: enlaces viejos, legal y service worker. */
test.describe('cambio de dominio', () => {
  for (const [from, to, status] of [
    ['/auth/register', '/auth/registro', 301],
    ['/onboarding', '/app/onboarding', 301],
    ['/dashboard', '/app', 301],
    ['/dashboard/carta', '/app', 301],
    ['/reset', '/', 301],
    ['/horoscopo-diario/leo', '/horoscopo/leo', 301],
  ] as const) {
    test(`${from} redirige a ${to}`, async ({ request }) => {
      const res = await request.get(from, { maxRedirects: 0 });
      expect(res.status()).toBe(status);
      expect(new URL(res.headers()['location'] ?? '', 'http://x').pathname).toBe(to);
    });
  }

  test('páginas legales enlazadas desde la portada y el acceso', async ({ page }) => {
    await page.goto('/');
    await page
      .getByRole('navigation', { name: 'Información legal' })
      .getByRole('link', { name: 'Privacidad' })
      .click();
    await expect(
      page.getByRole('heading', { level: 1, name: 'Política de Privacidad' }),
    ).toBeVisible();
    await page.goto('/auth/login');
    await page.getByRole('link', { name: 'Términos' }).click();
    await expect(
      page.getByRole('heading', { level: 1, name: 'Términos de Servicio' }),
    ).toBeVisible();
  });

  test('sw.js y el worker de Firebase se retiran solos', async ({ request }) => {
    for (const path of ['/sw.js', '/firebase-messaging-sw.js']) {
      const res = await request.get(path);
      expect(res.status(), path).toBe(200);
      expect(res.headers()['content-type'], path).toContain('javascript');
      expect(await res.text(), path).toContain('registration.unregister()');
    }
  });
});
