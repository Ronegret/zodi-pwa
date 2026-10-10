import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { createTestUser, login } from './support/auth';

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function expectNoViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  expect(violations).toEqual([]);
}

for (const path of ['/', '/auth/login', '/auth/registro', '/auth/recuperar']) {
  test(`sin violaciones axe WCAG 2.2 AA en ${path}`, async ({ page }) => {
    await page.goto(path);
    await expectNoViolations(page);
  });
}

test('sin violaciones axe en el estado de error del registro', async ({ page }) => {
  await page.goto('/auth/registro');
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await expect(page.locator('[data-error-summary]')).toBeVisible();
  await expectNoViolations(page);
});

test('sin violaciones axe en /app/onboarding y /app', async ({ page, request }) => {
  await login(page, await createTestUser(request, false));
  await expect(page).toHaveURL(/\/app\/onboarding$/);
  await expectNoViolations(page);

  await page.context().clearCookies();
  await login(page, await createTestUser(request, true));
  await expect(page).toHaveURL(/\/app$/);
  await expectNoViolations(page);
});

test('sin scroll horizontal a 320 px en login y onboarding', async ({ page, request }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('/auth/login');
  const overflow = () =>
    page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(await overflow()).toBe(false);
  await login(page, await createTestUser(request, false));
  await expect(page).toHaveURL(/\/app\/onboarding$/);
  expect(await overflow()).toBe(false);
});
