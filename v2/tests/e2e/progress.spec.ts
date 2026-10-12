import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { createTestUser, login } from './support/auth';

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function expectNoViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  expect(violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }))).toEqual([]);
}

test.describe('progreso, logros y favoritas', () => {
  test('lectura → logros → favorita → progreso e historial', async ({ page, request }) => {
    await login(page, await createTestUser(request, true));
    await expect(page).toHaveURL(/\/app$/);
    // El usuario de prueba lleva 5 días de racha: al entrar se desbloquea "Racha de 3 días".
    await expect(page.getByText('días seguidos')).toBeVisible();
    await expect(page.getByText(/Logro desbloqueado: Racha de 3 días/)).toBeVisible();

    await page.goto('/app/lecturas/tarot');
    await page.waitForLoadState('load');
    await expect(page.locator('astro-island[ssr]:has(.studio)')).toHaveCount(0);
    await page.getByLabel('Tu pregunta').fill('¿Me lo merezco?');
    await page.getByRole('button', { name: 'Tirar las cartas' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Lectura lista' })).toBeAttached();
    await expect(page.getByText(/Logro desbloqueado: Primera señal/)).toBeVisible();

    const fav = page.getByRole('button', { name: 'Guardar en favoritas' });
    await fav.click();
    await expect(page.getByRole('button', { name: 'En favoritas' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.getByText(/Logro desbloqueado: Esta me la guardo/)).toBeVisible();

    await page.goto('/app/progreso');
    await expect(page.getByRole('heading', { level: 1, name: 'Tu progreso' })).toBeVisible();
    const unlocked = page.locator('.ach.unlocked');
    await expect(unlocked).toHaveCount(4);
    for (const title of ['Racha de 3 días', 'Primera señal', 'Primer tarot', 'Esta me la guardo']) {
      await expect(unlocked.filter({ hasText: title })).toBeVisible();
    }
    await expectNoViolations(page);

    await page.goto('/app/lecturas/historial?favoritas=1');
    await expect(page.getByRole('link', { name: /Tarot ZODI/ })).toHaveCount(1);
    await page.getByRole('link', { name: /Tarot ZODI/ }).click();
    await expect(page.getByRole('button', { name: 'En favoritas' })).toBeVisible();
    await expectNoViolations(page);
  });

  test('historial vacío de favoritas sin errores de accesibilidad', async ({ page, request }) => {
    await login(page, await createTestUser(request, true));
    await page.goto('/app/lecturas/historial?favoritas=1');
    await expect(page.getByRole('heading', { name: 'Aún no tienes favoritas' })).toBeVisible();
    await expectNoViolations(page);
  });
});
