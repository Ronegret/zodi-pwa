import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function expectNoViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  expect(violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }))).toEqual([]);
}

test.describe('horóscopo público (sin cuenta)', () => {
  test('los doce signos con su día', async ({ page }) => {
    const res = await page.goto('/horoscopo');
    expect(res?.headers()['cache-control']).toMatch(/s-maxage=\d+/);
    await expect(page.getByRole('heading', { level: 1, name: 'Elige tu signo' })).toBeVisible();
    const list = page.getByRole('main').getByRole('listitem');
    await expect(list).toHaveCount(12);
    await expect(page.getByRole('main').getByRole('link', { name: /Escorpio/ })).toHaveAttribute(
      'href',
      '/horoscopo/escorpio',
    );
    await expectNoViolations(page);
  });

  test('el día de Leo: áreas, consejo y llamada a crear cuenta', async ({ page }) => {
    await page.goto('/horoscopo/leo');
    await expect(page.getByRole('heading', { level: 1, name: /Leo/ })).toBeVisible();
    for (const area of ['Amor', 'Trabajo y dinero', 'Energía', 'El consejo de ZODI']) {
      await expect(page.getByRole('heading', { level: 2, name: area })).toBeVisible();
    }
    await expect(page.getByRole('img', { name: /Amor: [1-5] de 5/ })).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://zodi.aibueno.es/horoscopo/leo',
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      /\/signos\/leo-1024\.webp$/,
    );
    await page.getByRole('link', { name: 'Crear mi carta gratis' }).click();
    await expect(page).toHaveURL(/\/auth\/registro/);
  });

  test('sin errores de accesibilidad y 404 para signos inventados', async ({ page }) => {
    await page.goto('/horoscopo/piscis');
    await expectNoViolations(page);
    const res = await page.goto('/horoscopo/ofiuco');
    expect(res?.status()).toBe(404);
  });
});

test.describe('compatibilidad de signos', () => {
  test('eliges dos signos y ves amor, amistad y trabajo', async ({ page }) => {
    await page.goto('/compatibilidad');
    await expect(page.getByRole('heading', { level: 1, name: '¿Encajan o chocan?' })).toBeVisible();
    await page.getByLabel(/Tu signo/).selectOption('aries');
    await page.getByLabel(/Su signo/).selectOption('leo');
    await page.getByRole('button', { name: 'Ver compatibilidad' }).click();
    await expect(page).toHaveURL(/\/compatibilidad\/aries-y-leo$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Aries y Leo' })).toBeVisible();
    await expect(page.getByText('92%')).toBeVisible();
    for (const h of ['En el amor', 'En la amistad', 'En el trabajo', 'Cómo es Leo']) {
      await expect(page.getByRole('heading', { name: h })).toBeVisible();
    }
    // La otra orden enseña lo mismo con la misma canónica.
    await page.goto('/compatibilidad/leo-y-aries');
    await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
      'href',
      /\/compatibilidad\/aries-y-leo$/,
    );
    const res = await page.goto('/compatibilidad/aries-y-dragon');
    expect(res?.status()).toBe(404);
  });

  test('el horóscopo de cada signo enlaza con quién encaja', async ({ page }) => {
    await page.goto('/horoscopo/aries');
    await page
      .getByRole('link', { name: /^Aries y / })
      .first()
      .click();
    await expect(page).toHaveURL(/\/compatibilidad\/aries-y-/);
  });
});
