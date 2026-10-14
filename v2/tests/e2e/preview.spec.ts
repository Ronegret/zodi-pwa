/**
 * Capturas para revisar a ojo (no forma parte de la batería: solo con PREVIEW=1).
 * PREVIEW=1 npx playwright test tests/e2e/preview.spec.ts --project=desktop
 */
import { expect, test } from '@playwright/test';
import { createTestUser, login } from './support/auth';

const OUT = process.env.PREVIEW_DIR ?? 'test-results/preview';

test.skip(!process.env.PREVIEW, 'Solo para revisar a ojo');

test('capturas públicas', async ({ page }) => {
  await page.goto('/?nacimiento=1990-04-15#sabe');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/portada.png`, fullPage: true });
  await page.goto('/horoscopo/leo');
  await page.screenshot({ path: `${OUT}/leo.png`, fullPage: true });
  await page.goto('/auth/login');
  await page.screenshot({ path: `${OUT}/login.png`, fullPage: true });
});

test('capturas de las lecturas', async ({ page, request }) => {
  test.setTimeout(120_000);
  await login(page, await createTestUser(request, true));
  await expect(page).toHaveURL(/\/app$/);

  await page.goto('/app/lecturas');
  await page.screenshot({ path: `${OUT}/hub.png`, fullPage: true });

  await page.goto('/app/lecturas/tarot');
  await page.waitForLoadState('load');
  await page.getByLabel('Tu pregunta').fill('¿Me cambio de ciudad este año?');
  await page.getByRole('button', { name: 'Tirar las cartas' }).click();
  await expect(page.locator('.tarot-card3d[data-revealed]')).toHaveCount(3);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/tarot.png`, fullPage: true });

  await page.goto('/app/lecturas/tirada-celta');
  await page.waitForLoadState('load');
  await page.getByLabel('Tu pregunta').fill('¿Dejo el trabajo?');
  await page.getByRole('button', { name: 'Echar la cruz celta' }).click();
  await expect(page.locator('.tarot-card3d[data-revealed]')).toHaveCount(10);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/celta.png`, fullPage: true });

  await page.goto('/app/lecturas/runas');
  await page.waitForLoadState('load');
  await page.getByRole('button', { name: 'Tirar las runas' }).click();
  await expect(page.locator('.reading-paper')).toContainText('Hoy haz esto:');
  await page.screenshot({ path: `${OUT}/runas.png`, fullPage: true });

  await page.goto('/app/lecturas/horoscopo-maya');
  await page.waitForLoadState('load');
  await page.getByRole('button', { name: 'Ver mi sello maya' }).click();
  await expect(page.locator('.reading-paper')).toContainText('Hoy haz esto:');
  await page.screenshot({ path: `${OUT}/maya.png`, fullPage: true });
});
