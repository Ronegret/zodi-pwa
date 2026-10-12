/**
 * Recorrido de primera vez en el móvil, con capturas para el estudio de UX
 * (solo con PREVIEW=1; no forma parte de la batería).
 * PREVIEW=1 NAPI_RS_FORCE_WASI=1 npx playwright test tests/e2e/journey.spec.ts --project=mobile
 */
import { expect, test, type Page } from '@playwright/test';
import { createTestUser, login } from './support/auth';

const OUT = process.env.PREVIEW_DIR ?? 'test-results/journey';
test.skip(!process.env.PREVIEW, 'Solo para el estudio de UX');

let n = 0;
async function shot(page: Page, name: string) {
  await page.waitForTimeout(600);
  n++;
  await page.screenshot({
    path: `${OUT}/${String(n).padStart(2, '0')}-${name}.png`,
    fullPage: true,
  });
}

test('primera vez: alta → onboarding → panel → lectura → oráculo → ajustes', async ({
  page,
  request,
}) => {
  test.setTimeout(240_000);
  await page.goto('/');
  await shot(page, 'portada');
  await page.goto('/auth/registro');
  await shot(page, 'registro');

  const user = await createTestUser(request, false);
  await login(page, user);
  await expect(page).toHaveURL(/\/app\/onboarding$/);
  await shot(page, 'onb-1-tu');
  await page.getByLabel('Nombre visible').fill('Ana Estrella');
  await page.getByLabel('Nombre de usuario').fill(`ana_${user.id.slice(0, 6)}`);
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await shot(page, 'onb-2-nacimiento');
  await page.getByLabel('Fecha de nacimiento').fill('1990-04-15');
  await page.getByLabel('Hora', { exact: true }).fill('10:30');
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await shot(page, 'onb-3-lugar');
  const city = page.getByRole('combobox', { name: /Ciudad de nacimiento/ });
  await city.fill('Madr');
  await expect(page.getByRole('option', { name: /Madrid/ })).toBeVisible();
  await city.press('Enter');
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await shot(page, 'onb-4-estilo');
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await shot(page, 'onb-5-sobre-ti');
  await page.getByRole('button', { name: 'Calcular mi carta' }).click();
  await expect(page).toHaveURL(/\/app\?bienvenida=1$/);
  await page.waitForTimeout(3800); // la bienvenida
  await shot(page, 'panel');

  for (const [path, name] of [
    ['/app/lecturas', 'lecturas'],
    ['/app/horoscopo', 'horoscopo'],
    ['/app/carta', 'carta'],
    ['/app/oraculo', 'oraculo'],
    ['/app/comunidad', 'comunidad'],
    ['/app/progreso', 'progreso'],
    ['/app/ajustes', 'ajustes'],
  ] as const) {
    await page.goto(path);
    await page.waitForLoadState('load');
    await shot(page, name);
  }

  await page.goto('/app/oraculo');
  await page.waitForLoadState('load');
  await page.getByRole('button', { name: '¿Qué me depara hoy?' }).click();
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
  await shot(page, 'oraculo-respuesta');
});
