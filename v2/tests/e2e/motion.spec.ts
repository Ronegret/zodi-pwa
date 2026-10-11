import { expect, test, type Page } from '@playwright/test';
import { createTestUser, login } from './support/auth';

/** Animaciones que siguen corriendo (las infinitas o las de >0,01 ms). */
const running = (page: Page) =>
  page.evaluate(
    () =>
      document
        .getAnimations()
        .filter((a) => a.playState === 'running' && Number(a.effect?.getTiming().duration) > 1)
        .length,
  );

test.describe('con movimiento reducido', () => {
  test.use({ reducedMotion: 'reduce' });

  test('portada y dashboard sin animaciones, sin scroll suave ni confeti', async ({
    page,
    request,
  }) => {
    await page.goto('/');
    await page.waitForTimeout(150);
    expect(await running(page)).toBe(0);
    await expect(page.locator('html')).not.toHaveClass(/lenis/);

    await login(page, await createTestUser(request, true));
    await page.goto('/app?bienvenida=1');
    await page.waitForTimeout(600);
    expect(await running(page)).toBe(0);
    await expect(page.locator('.confetti')).toHaveCount(0);
    // El contador muestra el valor final desde el principio.
    await expect(page.locator('[data-countup]')).toHaveText('5');
    // Los revelados no desplazan nada.
    const translates = await page
      .locator('.reveal')
      .evaluateAll((els) => els.map((el) => getComputedStyle(el).translate));
    expect(translates.every((t) => t === 'none' || t === '0px')).toBe(true);
  });
});

test.describe('con movimiento', () => {
  test('scroll suave, revelados que terminan en su sitio y contador hasta el final', async ({
    page,
    request,
  }) => {
    await login(page, await createTestUser(request, true));
    await expect(page).toHaveURL(/\/app$/);
    await expect(page.locator('html')).toHaveClass(/lenis/);
    await expect(page.locator('[data-countup]')).toHaveText('5', { timeout: 3000 });

    const last = page.locator('.reveal').last();
    await last.scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    await expect
      .poll(() => last.evaluate((el) => getComputedStyle(el).translate))
      .toMatch(/^(none|0px)$/);
  });

  test('bienvenida con confeti que se retira solo', async ({ page, request }) => {
    await login(page, await createTestUser(request, true));
    await page.goto('/app?bienvenida=1');
    await expect(page.locator('.confetti')).toHaveCount(1);
    await expect(page.locator('.confetti')).toHaveCount(0, { timeout: 4000 });
  });

  test('título compartido entre páginas para la transición', async ({ page }) => {
    await page.goto('/auth/login');
    const name = await page
      .getByRole('heading', { level: 1 })
      .evaluate((el) => getComputedStyle(el).viewTransitionName);
    expect(name).toBe('page-title');
  });

  test('efectos de ratón solo con puntero fino', async ({ page }, info) => {
    await page.goto('/');
    const cta = page.getByRole('link', { name: 'Empezar gratis' });
    if (info.project.name === 'desktop') {
      const box = (await cta.boundingBox())!;
      await page.mouse.move(box.x + box.width - 4, box.y + 4);
      await expect
        .poll(() => cta.evaluate((el) => getComputedStyle(el).translate))
        .not.toBe('none');
      await expect(page.locator('.cursor-glow')).toHaveCount(1);
    } else {
      await expect(page.locator('.cursor-glow')).toHaveCount(0);
    }
  });

  test('Ajustes permite reducir animaciones en este dispositivo', async ({ page, request }) => {
    await login(page, await createTestUser(request, true));
    await page.goto('/app/ajustes');
    const sw = page.getByRole('switch', { name: 'Reducir animaciones' });
    await expect(sw).not.toBeChecked();
    await sw.check();
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduce');
    await expect(
      page.getByRole('status').filter({ hasText: 'Animaciones reducidas.' }),
    ).toBeVisible();
    await page.goto('/app');
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduce');
    await expect(page.locator('html')).not.toHaveClass(/lenis/);
    await page.waitForTimeout(200);
    expect(await running(page)).toBe(0);
  });
});

test.describe('rendimiento', () => {
  test('CLS 0 al cargar el dashboard e interacción < 200 ms', async ({ page, request }) => {
    await page.addInitScript(() => {
      (window as unknown as { __cls: number }).__cls = 0;
      new PerformanceObserver((list) => {
        for (const e of list.getEntries() as unknown as {
          value: number;
          hadRecentInput: boolean;
        }[]) {
          if (!e.hadRecentInput) (window as unknown as { __cls: number }).__cls += e.value;
        }
      }).observe({ type: 'layout-shift', buffered: true });
    });
    await login(page, await createTestUser(request, true));
    await expect(page).toHaveURL(/\/app$/);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls);
    expect(cls).toBe(0);

    await page.goto('/app/ajustes');
    await page.evaluate(() => {
      (window as unknown as { __inp: number }).__inp = 0;
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          const w = window as unknown as { __inp: number };
          w.__inp = Math.max(w.__inp, e.duration);
        }
      }).observe({
        type: 'event',
        buffered: true,
        durationThreshold: 16,
      } as PerformanceObserverInit);
    });
    await page.getByRole('checkbox', { name: 'Dinero' }).click();
    await page.getByRole('radio', { name: /Sarcástico/ }).click();
    await page.waitForTimeout(300);
    const inp = await page.evaluate(() => (window as unknown as { __inp: number }).__inp);
    expect(inp).toBeLessThan(200);
  });
});
