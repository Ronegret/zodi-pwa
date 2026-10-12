import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { createTestUser, login } from './support/auth';

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function expectNoViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  expect(violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }))).toEqual([]);
}

test.describe('primera vez y cuenta', () => {
  test('panel: 30 días gratis y primeros pasos que guían', async ({ page, request }) => {
    await login(page, await createTestUser(request, true, true));
    await expect(page).toHaveURL(/\/app$/);
    await expect(page.getByRole('note')).toContainText('Tienes ZODI completo gratis 30 días más');
    const steps = page.getByRole('region', { name: 'Tus primeros pasos con ZODI' });
    await expect(steps.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '1 de 5');
    await expect(steps.getByRole('link', { name: 'Leer mi día' })).toHaveAttribute(
      'href',
      '/app/horoscopo',
    );
    // Lenguaje sencillo: el tránsito se explica sin jerga.
    await page.getByText('¿Qué es esto?').first().click();
    await expect(page.getByText(/eso es un/)).toBeVisible();
    await expectNoViolations(page);
  });

  test('ajustes: sobre ti se guarda y se puede vaciar', async ({ page, request }) => {
    await login(page, await createTestUser(request, true));
    await page.goto('/app/ajustes#sobre-ti');
    await page.getByLabel('Situación sentimental').selectOption('complicated');
    await page.getByLabel(/Nombre de tu pareja/).fill('Leo');
    await page.getByRole('radio', { name: 'Sí' }).check();
    await page.getByLabel('¿Cuántos?').fill('2');
    await page.getByLabel('Cuéntale a ZODI de ti').fill('Trabajo en diseño y no duermo.');
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(page).toHaveURL(/guardado=1/);
    await expect(page.getByLabel('Situación sentimental')).toHaveValue('complicated');
    await expect(page.getByLabel('¿Cuántos?')).toHaveValue('2');
    await page.getByLabel(/Nombre de tu pareja/).fill('');
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(page.getByLabel(/Nombre de tu pareja/)).toHaveValue('');
    // El tono enseña un ejemplo de cómo habla ZODI.
    await expect(page.getByText(/Mercurio no tiene la culpa/)).toBeVisible();
    await expectNoViolations(page);
  });

  test('borrar la cuenta pide confirmación y lo borra todo', async ({ page, request }) => {
    const user = await createTestUser(request, true);
    await login(page, user);
    await page.goto('/app/ajustes');
    await page.getByRole('link', { name: 'Borrar mi cuenta y mis datos' }).click();
    await expect(page.getByRole('heading', { name: 'Esto no se puede deshacer' })).toBeVisible();
    await expectNoViolations(page);
    await page.getByLabel('Escribe BORRAR para confirmar').fill('vale');
    await page.getByRole('button', { name: 'Borrar mi cuenta para siempre' }).click();
    await expect(page.getByText('Escribe BORRAR').first()).toBeVisible();
    await page.getByLabel('Escribe BORRAR para confirmar').fill('borrar');
    await page.getByRole('button', { name: 'Borrar mi cuenta para siempre' }).click();
    await expect(page).toHaveURL(/aviso=cuenta-borrada/);
    await expect(page.getByRole('status')).toContainText('Tu cuenta y todos tus datos');
    // Ya no puede entrar.
    await page.getByLabel('Correo electrónico').fill(user.email);
    await page.getByLabel('Contraseña').fill(user.password);
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('oráculo: enseña con qué lee, cómo funciona y propone seguir', async ({ page, request }) => {
    await login(page, await createTestUser(request, true));
    await page.goto('/app/oraculo');
    await page.waitForLoadState('load');
    await expect(page.locator('astro-island[ssr]:has(.chat)')).toHaveCount(0);
    await expect(page.getByRole('list', { name: 'Con qué lee ZODI' })).toContainText(
      'Sol en Aries',
    );
    await expect(page.getByRole('list', { name: 'Cómo funciona' })).toBeVisible();
    await expect(page.getByText('Te quedan 15 mensajes hoy')).toBeVisible();
    await page.getByRole('button', { name: 'Dame un consejo para esta semana' }).click();
    const log = page.getByRole('list', { name: 'Conversación con Zodi' });
    await expect(log.locator('[aria-busy="true"]')).toHaveCount(0);
    await expect(page.getByRole('group', { name: 'Seguir hablando' })).toBeVisible();
    await page.getByRole('button', { name: '¿Y en el amor?' }).click();
    await expect(log.locator('[aria-busy="true"]')).toHaveCount(0);
    await expect(log.getByRole('listitem')).toHaveCount(5);
  });
});

test.describe('portada', () => {
  test('qué es ZODI y demo interactiva (tono, oráculo y carta)', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByRole('heading', { level: 2, name: /Tu astrólogo de bolsillo/ }),
    ).toBeVisible();
    const demo = page.locator('.demo');
    await demo.scrollIntoViewIfNeeded();
    await expect(page.locator('astro-island[ssr]:has(.demo-tone)')).toHaveCount(0);
    await demo.getByRole('radio', { name: 'Brutal' }).check();
    await expect(demo.getByText(/Spoiler: no lo va a hacer/)).toBeVisible();

    await demo.getByRole('tab', { name: 'Pregúntale' }).click();
    await demo.getByRole('button', { name: '¿Cambio de trabajo este año?' }).click();
    await expect(demo.getByRole('list', { name: 'Ejemplo de conversación' })).toContainText(
      'Júpiter',
    );

    await demo.getByRole('tab', { name: 'Tira una carta' }).click();
    await demo.getByRole('button', { name: 'Dar la vuelta' }).click();
    await expect(demo.locator('.demo-card-name')).not.toBeEmpty();
    await expect(demo.getByRole('button', { name: 'Otra carta' })).toBeVisible();
    await expectNoViolations(page);
  });
});

test.describe('horóscopo de la app', () => {
  test('tu día de un vistazo al momento y la temporada con el arte de ZODI', async ({
    page,
    request,
  }) => {
    await login(page, await createTestUser(request, true));
    await page.goto('/app/horoscopo');
    await expect(
      page.getByRole('heading', { level: 2, name: /Tu día de un vistazo/ }),
    ).toBeVisible();
    for (const area of ['Amor', 'Trabajo y dinero', 'Energía', 'El consejo de ZODI']) {
      await expect(page.getByRole('heading', { level: 3, name: area })).toBeVisible();
    }
    await expect(page.getByRole('heading', { level: 2, name: /Temporada de/ })).toBeVisible();
    await expect(page.getByRole('img', { name: /según ZODI/ })).toBeVisible();
    await expect(page.locator('.scene-frame')).toHaveCount(0);
    await expectNoViolations(page);
  });
});

test.describe('carta en palabras normales', () => {
  test('pilares, cómo se lee la rueda y planetas uno a uno', async ({ page, request }) => {
    await login(page, await createTestUser(request, true));
    await page.goto('/app/carta');
    await expect(page.getByRole('img', { name: 'Aries según ZODI' })).toBeVisible();
    await expect(page.getByRole('list', { name: 'Cómo se lee la rueda' })).toContainText(
      'Las piezas blancas son tus planetas',
    );
    const planets = page.getByRole('heading', { name: 'Tus planetas, uno a uno' });
    await expect(planets).toBeVisible();
    await expect(page.getByText(/^Brillas con valentía y a lo loco/)).toBeVisible();
    await expect(page.getByText(/Casa \d+ · /).first()).toBeVisible();
    // Las tablas técnicas están plegadas.
    await expect(page.getByRole('table', { name: 'Planetas' })).toBeHidden();
    await page.getByText('Datos técnicos (para quien sabe de astrología)').click();
    await expect(page.getByRole('table', { name: 'Planetas' })).toBeVisible();
    await expect(page.getByText('ZODI está creado por')).toBeVisible();
    await expectNoViolations(page);
  });
});
