import { expect, test, type Page } from '@playwright/test';
import { createTestUser, login } from './support/auth';

interface Stats {
  calls: number;
  triangles: number;
  geometries: number;
  textures: number;
}
type ScenesWindow = Window & {
  __zodiScenes?: Record<
    string,
    { stats(): Stats | null; leftover(): Stats | null; remount(): void; state: string }
  >;
};

/** Presupuesto de la Fase 5: ≤150 draw calls por escena. */
const MAX_CALLS = 150;

/** La isla del tarot es client:visible: hay que llevarla a pantalla para que hidrate. */
async function showTarot(page: Page) {
  await page.getByRole('heading', { name: 'Carta del día' }).scrollIntoViewIfNeeded();
  // El botón viene del servidor; responde cuando la isla termina de hidratar.
  await expect(page.locator('astro-island:has(.tarot-flat)')).not.toHaveAttribute('ssr');
  return page.getByRole('button', { name: 'Voltear carta' });
}

const frame = (page: Page, label: RegExp) =>
  page.locator('.scene-frame').filter({ has: page.getByRole('img', { name: label }) });

async function stats(page: Page, name: string) {
  return page.evaluate((n) => (window as ScenesWindow).__zodiScenes?.[n]?.stats() ?? null, name);
}

async function expectReady(page: Page, name: string) {
  await expect
    .poll(() => page.evaluate((n) => (window as ScenesWindow).__zodiScenes?.[n]?.state, name), {
      timeout: 15_000,
    })
    .toBe('ready');
}

test.describe('escenas 3D', () => {
  test('portada: anillo listo, en presupuesto, pausa y signos por teclado', async ({ page }) => {
    await page.goto('/');
    await expectReady(page, 'hero');
    const hero = frame(page, /Anillo en 3D/);
    await expect(hero).toHaveAttribute('data-state', 'ready');
    // La alternativa queda oculta cuando el 3D pinta.
    await expect(hero.locator('.scene-fallback')).toBeHidden();

    const s = await stats(page, 'hero');
    expect(s?.calls).toBeGreaterThan(0);
    expect(s?.calls).toBeLessThanOrEqual(MAX_CALLS);

    const pause = page.getByRole('button', { name: 'Pausar animación' });
    await expect(pause).toHaveAttribute('aria-pressed', 'false');
    await pause.click();
    await expect(pause).toHaveAttribute('aria-pressed', 'true');

    // Teclado: Tab hasta el botón del signo y Enter.
    const leo = page.getByRole('button', { name: 'Leo' });
    await leo.focus();
    await page.keyboard.press('Enter');
    await expect(leo).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('status').filter({ hasText: 'Leo (' })).toContainText('fuego');
  });

  test('sin fugas: al remontar no queda nada en GPU', async ({ page }) => {
    await page.goto('/');
    await expectReady(page, 'hero');
    await page.evaluate(() => (window as ScenesWindow).__zodiScenes?.hero?.remount());
    await expect
      .poll(() => page.evaluate(() => (window as ScenesWindow).__zodiScenes?.hero?.leftover()))
      .toMatchObject({ geometries: 0, textures: 0 });
    await expectReady(page, 'hero');
  });

  test('dashboard: la carta del día se voltea y se anuncia', async ({ page, request }) => {
    const errors: string[] = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await login(page, await createTestUser(request, true));
    await expect(page).toHaveURL(/\/app$/);
    const flip = await showTarot(page);
    await expectReady(page, 'tarot');
    expect((await stats(page, 'tarot'))?.calls).toBeLessThanOrEqual(MAX_CALLS);
    await flip.click();
    await expect(flip).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('status').filter({ hasText: ' · ' })).not.toBeEmpty();
    // El HTML del servidor y el de la isla coinciden (también el <noscript>).
    expect(errors.filter((e) => /hydrat/i.test(e))).toEqual([]);
  });

  test('el foco no se pierde si la isla hidrata con un control enfocado', async ({
    page,
    request,
  }) => {
    await login(page, await createTestUser(request, true));
    await expect(page).toHaveURL(/\/app$/);
    const flip = page.getByRole('button', { name: 'Voltear carta' });
    // El botón existe antes de hidratar: se enfoca y la hidratación lo conserva.
    await flip.focus();
    await expectReady(page, 'tarot');
    await expect(flip).toBeFocused();
  });

  test('carta: rueda 3D con datos reales y planetas por teclado', async ({ page, request }) => {
    await login(page, await createTestUser(request, true));
    await page.goto('/app/carta');
    await expectReady(page, 'natal-wheel');
    expect((await stats(page, 'natal-wheel'))?.calls).toBeLessThanOrEqual(MAX_CALLS);
    const sun = page.getByRole('button', { name: 'Sol', exact: true });
    await sun.focus();
    await page.keyboard.press('Space');
    await expect(sun).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('status').filter({ hasText: 'Sol en' })).toBeVisible();
  });

  test('horóscopo: tótem del signo de la temporada', async ({ page, request }) => {
    await login(page, await createTestUser(request, true));
    await page.goto('/app/horoscopo');
    await expectReady(page, 'sign-of-day');
    expect((await stats(page, 'sign-of-day'))?.calls).toBeLessThanOrEqual(MAX_CALLS);
    await page.getByRole('button', { name: '¡Que salte!' }).click();
  });
});

test.describe('sin WebGL', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (
        this: HTMLCanvasElement,
        type: string,
        ...args: unknown[]
      ) {
        if (type.startsWith('webgl')) return null;
        return (original as (...a: unknown[]) => unknown).call(this, type, ...args);
      } as typeof original;
    });
  });

  test('la portada muestra la alternativa y los signos siguen funcionando', async ({ page }) => {
    await page.goto('/');
    const hero = page.locator('.scene-frame').first();
    await expect(page.getByRole('button', { name: 'Leo' })).toBeVisible();
    await expect(hero).toHaveAttribute('data-state', 'static');
    await expect(hero.locator('canvas')).toHaveCount(0);
    await expect(hero.getByRole('img', { name: /Zodi, la mascota/ })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Pausar animación' })).toHaveCount(0);
    // Los chips vienen del servidor; responden en cuanto la isla hidrata.
    await expect(page.locator('astro-island[ssr]')).toHaveCount(0);
    await page.getByRole('button', { name: 'Escorpio' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Escorpio (' })).toBeVisible();
  });

  test('la carta del día se voltea igual en plano', async ({ page, request }) => {
    await login(page, await createTestUser(request, true));
    await expect(page).toHaveURL(/\/app$/);
    await (await showTarot(page)).click();
    await expect(page.locator('.tarot-flat[data-revealed]')).toBeVisible();
  });
});

test.describe('con movimiento reducido', () => {
  test.use({ reducedMotion: 'reduce' });

  test('no se descarga three y se queda la alternativa', async ({ page }) => {
    const threeChunks: string[] = [];
    // three y las escenas van en chunks aparte; support/loop son los únicos estáticos.
    page.on('request', (r) => {
      if (/deps\/three|\/src\/scenes\/(?!core\/(support|loop))/.test(r.url())) {
        threeChunks.push(r.url());
      }
    });
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Leo' })).toBeVisible();
    await expect(page.locator('.scene-frame').first()).toHaveAttribute('data-state', 'static');
    expect(threeChunks).toEqual([]);
  });
});

test.describe('sin JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('sin botones muertos: la portada enseña la imagen y no los signos', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('img', { name: /Zodi, la mascota/ })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Leo' })).toBeHidden();
  });

  test('la carta del día se revela con details', async ({ page, request }) => {
    await login(page, await createTestUser(request, true));
    await expect(page).toHaveURL(/\/app$/);
    await expect(page.getByRole('button', { name: 'Voltear carta' })).toBeHidden();
    // getByText ignora el texto dentro de <noscript>: se busca por CSS.
    await page.locator('.tarot-details summary').click();
    await expect(page.locator('.tarot-details p')).toBeVisible();
  });
});
