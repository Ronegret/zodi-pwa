import { expect, test, type Page } from '@playwright/test';
import { createTestUser, login } from './support/auth';

async function stepTo(page: Page, n: number) {
  await expect(page.getByRole('progressbar', { name: 'Progreso' })).toHaveAttribute(
    'aria-valuetext',
    `Paso ${n} de 5`,
  );
}

test('onboarding completo: 5 pasos, ciudad con teclado y carta real', async ({ page, request }) => {
  const user = await createTestUser(request, false);
  await login(page, user);
  await expect(page).toHaveURL(/\/app\/onboarding$/);

  // 1 · Tú: ZODI propone un usuario; vacío, la validación en cliente no deja avanzar.
  await stepTo(page, 1);
  await expect(page.getByLabel('Nombre de usuario')).toHaveValue(/^e2e_\d{3}$/);
  await page.getByLabel('Nombre visible').fill('Ana Estrella');
  await page.getByLabel('Nombre de usuario').fill('');
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await expect(page.locator('[data-error-summary]')).toBeFocused();
  await page.getByLabel('Nombre de usuario').fill(`ana_${user.id.slice(0, 6)}`);
  await page.getByRole('button', { name: 'Siguiente' }).click();

  // 2 · Nacimiento
  await stepTo(page, 2);
  await page.getByLabel('Fecha de nacimiento').fill('1990-04-15');
  await page.getByLabel('Hora', { exact: true }).fill('10:30');
  await page.getByRole('button', { name: 'Siguiente' }).click();

  // 3 · Lugar: combobox accesible manejado con teclado
  await stepTo(page, 3);
  const city = page.getByRole('combobox', { name: /Ciudad de nacimiento/ });
  await city.fill('Madr');
  const listbox = page.getByRole('listbox', { name: 'Ciudades encontradas' });
  await expect(listbox).toBeVisible();
  await expect(page.getByRole('option', { name: /Madrid/ })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await city.press('Enter');
  await expect(listbox).toBeHidden();
  await expect(city).toHaveValue('Madrid, Comunidad de Madrid, España');
  await expect(page.getByText('Elegido: Madrid, Comunidad de Madrid, España.')).toBeVisible();
  await page.getByRole('button', { name: 'Siguiente' }).click();

  // 4 · Tono y temas (guardado parcial: volver atrás conserva lo guardado)
  await stepTo(page, 4);
  await page.getByRole('radio', { name: /Brutal/ }).check();
  await page.getByRole('checkbox', { name: 'Amor' }).check();
  await page.getByRole('checkbox', { name: 'Dinero' }).check();
  await page.getByRole('button', { name: 'Siguiente' }).click();

  await stepTo(page, 5);
  await page.getByRole('link', { name: 'Atrás' }).click();
  await stepTo(page, 4);
  await expect(page.getByRole('radio', { name: /Brutal/ })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Amor' })).toBeChecked();
  await page.getByRole('button', { name: 'Siguiente' }).click();

  // 5 · Sobre ti (opcional) → calcula la carta
  await stepTo(page, 5);
  await expect(page.getByText(/Opcional, pero marca la diferencia/)).toBeVisible();
  await page.getByLabel('Situación sentimental').selectOption('relationship');
  await page.getByLabel(/Cuéntale a ZODI de ti/).fill('Diseñadora con insomnio.');
  await page.getByRole('button', { name: 'Calcular mi carta' }).click();

  await expect(page).toHaveURL(/\/app\?bienvenida=1$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Hola, Ana' })).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'Carta calculada' })).toBeVisible();
  // Madrid del geocodificador (40.4165, -3.70256): mismo Sol que la referencia.
  await expect(page.getByText(/^Aries 25°0[56]′$/)).toBeVisible();

  const res = await page.request.get('/api/carta');
  const { data } = await res.json();
  expect(data.input).toMatchObject({
    date: '1990-04-15',
    time: '10:30',
    timeKnown: true,
    timeZone: 'Europe/Madrid',
  });
});

test('no deja saltarse pasos', async ({ page, request }) => {
  await login(page, await createTestUser(request, false));
  await page.goto('/app/onboarding?paso=sobre-ti');
  await expect(page).toHaveURL(/paso=perfil$/);
  await page.goto('/app/carta');
  await expect(page).toHaveURL(/\/app\/onboarding$/);
});

test('hora desconocida: la carta no muestra casas ni Ascendente', async ({ page, request }) => {
  const user = await createTestUser(request, false);
  await login(page, user);
  await page.getByLabel('Nombre visible').fill('Leo');
  await page.getByLabel('Nombre de usuario').fill(`leo_${user.id.slice(0, 6)}`);
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await page.getByLabel('Fecha de nacimiento').fill('1995-08-03');
  await page.getByLabel('No sé la hora').check();
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await page.getByRole('combobox', { name: /Ciudad/ }).fill('Barce');
  await page.getByRole('option', { name: /Barcelona/ }).click();
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await page.getByRole('button', { name: 'Calcular mi carta' }).click();
  await expect(page).toHaveURL(/\/app\?bienvenida=1$/);
  await expect(page.getByText('Sin hora de nacimiento')).toBeVisible();

  await page.goto('/app/carta');
  await page.getByText('Datos técnicos (para quien sabe de astrología)').click();
  await expect(page.getByRole('table', { name: 'Planetas' })).toBeVisible();
  await expect(page.getByRole('table', { name: /Casas/ })).toHaveCount(0);
  await expect(page.getByText(/Sin hora de nacimiento no hay Ascendente/)).toBeVisible();
});

test.describe('sin JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('la ciudad se elige de una lista que da el servidor', async ({ page, request }, info) => {
    test.skip(info.project.name !== 'desktop', 'Basta con un tamaño');
    const user = await createTestUser(request, false);
    await login(page, user);
    await page.getByLabel('Nombre visible').fill('Sol');
    await page.getByLabel('Nombre de usuario').fill(`sol_${user.id.slice(0, 6)}`);
    await page.getByRole('button', { name: 'Siguiente' }).click();
    await page.getByLabel('Fecha de nacimiento').fill('1988-01-20');
    await page.getByLabel('Hora', { exact: true }).fill('23:15');
    await page.getByRole('button', { name: 'Siguiente' }).click();

    await page.getByRole('combobox', { name: /Ciudad/ }).fill('Santiago');
    await page.getByRole('button', { name: 'Siguiente' }).click();
    const group = page.getByRole('group', { name: '¿Cuál de estos?' });
    await expect(group.getByRole('radio')).toHaveCount(2);
    await group.getByRole('radio', { name: /Región Metropolitana/ }).check();
    await page.getByRole('button', { name: 'Siguiente' }).click();
    await stepTo(page, 4);
  });
});
