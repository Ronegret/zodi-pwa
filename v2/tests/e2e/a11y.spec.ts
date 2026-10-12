import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { createTestUser, login } from './support/auth';

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function expectNoViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  expect(violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }))).toEqual([]);
}

async function noHorizontalScroll(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
}

const PUBLIC = [
  '/',
  '/auth/login',
  '/auth/registro',
  '/auth/recuperar',
  '/legal/privacidad',
  '/legal/terminos',
  '/dev/componentes',
];
const PRIVATE = [
  '/app',
  '/app/lecturas',
  '/app/lecturas/tarot',
  '/app/lecturas/mano',
  '/app/lecturas/nombre',
  '/app/lecturas/horoscopo-maya',
  '/app/comunidad',
  '/app/carta',
  '/app/ajustes',
  '/app/horoscopo',
  '/app/compatibilidad',
  '/app/oraculo',
];

for (const path of PUBLIC) {
  test(`axe WCAG 2.2 AA en ${path}`, async ({ page }) => {
    await page.goto(path);
    await expectNoViolations(page);
  });
}

test('axe en las páginas privadas', async ({ page, request }) => {
  await login(page, await createTestUser(request, true));
  await expect(page).toHaveURL(/\/app$/);
  for (const path of PRIVATE) {
    await page.goto(path);
    await expectNoViolations(page);
  }
});

test('axe en los 5 pasos del onboarding y en sus errores', async ({ page, request }) => {
  const user = await createTestUser(request, false);
  await login(page, user);
  await expectNoViolations(page);
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await expect(page.locator('[data-error-summary]')).toBeVisible();
  await expectNoViolations(page);
  await page.getByLabel('Nombre visible').fill('Ana');
  await page.getByLabel('Nombre de usuario').fill(`ana_${user.id.slice(0, 6)}`);
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await page.getByLabel('Fecha de nacimiento').fill('1990-04-15');
  await page.getByLabel('Hora', { exact: true }).fill('10:30');
  await expectNoViolations(page);
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await page.getByRole('combobox', { name: /Ciudad/ }).fill('Madr');
  await expect(page.getByRole('listbox')).toBeVisible();
  await expectNoViolations(page);
  await page.getByRole('option', { name: /Madrid/ }).click();
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await expectNoViolations(page);
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await expectNoViolations(page);
});

test('axe en el estado de error del registro', async ({ page }) => {
  await page.goto('/auth/registro');
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await expect(page.locator('[data-error-summary]')).toBeVisible();
  await expectNoViolations(page);
});

test('sin scroll horizontal a 320 px', async ({ page, request }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  for (const path of PUBLIC) {
    await page.goto(path);
    expect(await noHorizontalScroll(page), path).toBe(true);
  }
  await login(page, await createTestUser(request, true));
  for (const path of PRIVATE) {
    await page.goto(path);
    expect(await noHorizontalScroll(page), path).toBe(true);
  }
  await page.context().clearCookies();
  await login(page, await createTestUser(request, false));
  expect(await noHorizontalScroll(page), 'onboarding').toBe(true);
});
