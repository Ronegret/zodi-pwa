import { expect, test } from '@playwright/test';
import { createTestUser, login } from './support/auth';

test('dashboard: salto al contenido y toda la navegación con Tab', async ({ page, request }) => {
  await login(page, await createTestUser(request, true));
  await expect(page).toHaveURL(/\/app$/);

  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Saltar al contenido' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();

  // Recorre la página entera con Tab y apunta qué recibe el foco.
  await page.locator('body').focus();
  const reached = new Set<string>();
  for (let i = 0; i < 60; i++) {
    await page.keyboard.press('Tab');
    const label = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return '';
      return (
        el.getAttribute('aria-label') || el.textContent?.trim().replace(/\s+/g, ' ') || el.tagName
      );
    });
    if (label) reached.add(label);
  }
  for (const name of [
    'Inicio',
    'Carta',
    'Horóscopo',
    'Match',
    'Ajustes',
    'Ver carta',
    'Hablar con Zodi, tu asistente',
  ]) {
    expect(
      [...reached].some((r) => r.includes(name)),
      name,
    ).toBe(true);
  }
});

test('el foco siempre es visible', async ({ page, request }) => {
  await login(page, await createTestUser(request, true));
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab');
    const outline = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      if (el === document.body) return true; // primer Tab tras navegar
      const s = getComputedStyle(el);
      return s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2;
    });
    expect(outline).toBe(true);
  }
});

test.describe('componentes interactivos', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dev/componentes');
    await page.waitForFunction(() => !document.querySelector('astro-island[ssr]'));
  });

  test('pestañas con flechas, Inicio y Fin', async ({ page }) => {
    const sol = page.getByRole('tab', { name: 'Sol' });
    await sol.focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: 'Luna' })).toBeFocused();
    await expect(page.getByRole('tab', { name: 'Luna' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tabpanel')).toContainText('Lo que sientes');
    await page.keyboard.press('End');
    await expect(page.getByRole('tab', { name: 'Ascendente' })).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(sol).toBeFocused();
  });

  test('diálogo: atrapa el foco, Esc cierra y devuelve el foco', async ({ page }) => {
    const trigger = page.getByRole('button', { name: 'Abrir diálogo' });
    await trigger.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: '¿Seguro?' });
    await expect(dialog).toBeVisible();
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab');
      expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true);
    }
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('tooltip aparece con el foco y se cierra con Esc', async ({ page }) => {
    const button = page.getByRole('button', { name: 'Con tooltip' });
    await button.focus();
    const tip = page.getByRole('tooltip');
    await expect(tip).toBeVisible();
    await expect(button).toHaveAccessibleDescription(/Se cierra con Esc/);
    await page.keyboard.press('Escape');
    await expect(tip).toBeHidden();
  });

  test('los avisos se anuncian en una región viva y se pueden cerrar', async ({ page }) => {
    await page.getByRole('button', { name: 'Lanzar aviso' }).click();
    const region = page.getByRole('status').filter({ hasText: 'Mercurio dice hola.' });
    await expect(region).toBeVisible();
    await page.getByRole('button', { name: 'Cerrar aviso' }).click();
    await expect(page.getByText('Mercurio dice hola.')).toBeHidden();
  });
});
