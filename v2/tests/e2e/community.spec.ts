import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { createTestUser, login } from './support/auth';

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function expectNoViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  expect(violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }))).toEqual([]);
}

async function openCommunity(page: Page, path = '/app/comunidad') {
  await page.goto(path);
  await page.waitForLoadState('load');
  await expect(page.locator('astro-island[ssr]:has(.community)')).toHaveCount(0);
}

/** Texto único por test (los tres dispositivos comparten el Supabase falso). */
const unique = (label: string) => `${label} ${Math.random().toString(36).slice(2, 8)}`;

async function publish(page: Page, text: string, topic: string) {
  await page.getByLabel(/¿Qué te dicen los astros hoy/).fill(text);
  await page.getByRole('radio', { name: topic }).check();
  await page.getByRole('button', { name: 'Publicar' }).click();
  const post = page.getByRole('listitem').filter({ hasText: text });
  await expect(post).toBeVisible();
  return post;
}

test.describe('comunidad', () => {
  test('publicar con tema, tarjeta de autor y filtro', async ({ page, request }) => {
    await login(page, await createTestUser(request, true));
    await openCommunity(page);
    const text = unique('¿Alguien más con Saturno encima?');
    const post = await publish(page, text, 'Preguntas');
    await expect(post).toContainText('Ana Estrella');
    await expect(post).toContainText('Aries');
    await expect(post).toContainText('Nv 3');
    await expect(post).toContainText('Preguntas');
    await expect(page.getByLabel(/¿Qué te dicen los astros hoy/)).toHaveValue('');

    await page
      .getByRole('navigation', { name: 'Filtrar por tema' })
      .getByRole('button', { name: 'Amor' })
      .click();
    await expect(page).toHaveURL(/tema=amor/);
    await expect(page.getByRole('listitem').filter({ hasText: text })).toHaveCount(0);
    await page
      .getByRole('navigation', { name: 'Filtrar por tema' })
      .getByRole('button', { name: 'Preguntas' })
      .click();
    await expect(page.getByRole('listitem').filter({ hasText: text })).toBeVisible();
  });

  test('reacciones y comentarios', async ({ page, request }) => {
    await login(page, await createTestUser(request, true));
    await openCommunity(page);
    const post = await publish(page, unique('Mercurio me odia'), 'General');

    const fire = post.getByRole('button', { name: /^Fuego, / });
    await fire.click();
    await expect(fire).toHaveAttribute('aria-pressed', 'true');
    await expect(fire).toHaveAccessibleName('Fuego, 1');
    await fire.click();
    await expect(fire).toHaveAttribute('aria-pressed', 'false');
    await expect(fire).toHaveAccessibleName('Fuego, 0');

    const toggle = post.getByRole('button', { name: '0 comentarios' });
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await post.getByLabel('Tu comentario').fill('Y a mí, hermana');
    await post.getByRole('button', { name: 'Comentar', exact: true }).click();
    await expect(post.getByRole('region', { name: 'Comentarios' })).toContainText(
      'Y a mí, hermana',
    );
    await expect(post.getByRole('button', { name: '1 comentario' })).toBeVisible();
    await expectNoViolations(page);
  });

  test('borrar lo propio; lo ajeno se denuncia', async ({ page, browser, request }) => {
    const author = await createTestUser(request, true);
    await login(page, author);
    await openCommunity(page);
    const text = unique('Post para borrar');
    const post = await publish(page, text, 'Confesiones');

    // Otra persona: no puede borrarlo, sí denunciarlo.
    const other = await browser.newContext();
    const page2 = await other.newPage();
    await login(page2, await createTestUser(request, true));
    await openCommunity(page2);
    const seen = page2.getByRole('listitem').filter({ hasText: text });
    await expect(seen.getByRole('button', { name: 'Borrar' })).toHaveCount(0);
    await seen.getByRole('button', { name: 'Denunciar' }).click();
    await seen.getByRole('button', { name: 'Spam' }).click();
    await expect(page2.getByRole('status').filter({ hasText: 'Gracias' })).toBeAttached();
    await other.close();

    await post.getByRole('button', { name: 'Borrar' }).click();
    await post.getByRole('button', { name: 'Sí, borrar' }).click();
    await expect(page.getByRole('listitem').filter({ hasText: text })).toHaveCount(0);
  });

  test('sin texto no se publica; accesible', async ({ page, request }) => {
    await login(page, await createTestUser(request, true));
    await openCommunity(page);
    await expect(page.getByRole('button', { name: 'Publicar' })).toBeDisabled();
    await expectNoViolations(page);
  });
});
