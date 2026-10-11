import AxeBuilder from '@axe-core/playwright';
import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { MOCK_SUPABASE_URL } from '../../playwright.config';
import { createTestUser, login } from './support/auth';

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function expectNoViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  expect(violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }))).toEqual([]);
}

/** Las islas de IA son client:load: hay que esperar a que hidraten (las 3D pueden esperar). */
async function hydrated(page: Page) {
  await page.waitForLoadState('load');
  await expect(page.locator('astro-island[ssr]:has(.studio, .chat)')).toHaveCount(0);
}

async function openStudio(page: Page, slug: string) {
  await page.goto(`/app/lecturas/${slug}`);
  await hydrated(page);
}

/** La petición que recibió la IA falsa con ese texto (cada test busca la suya). */
async function aiRequest(request: APIRequestContext, contains: string) {
  const res = await request.get(`${MOCK_SUPABASE_URL}/__test/ai`, { params: { contains } });
  expect(res.ok(), `petición a la IA con "${contains}"`).toBe(true);
  return (await res.json()) as {
    model: string;
    system: { text: string; cache_control?: unknown }[];
    messages: { role: string; content: string }[];
  };
}

test.describe('lecturas con IA', () => {
  test('hub con tipos, cuota y sin violaciones de accesibilidad', async ({ page, request }) => {
    await login(page, await createTestUser(request, true));
    await page.goto('/app/lecturas');
    await expect(page.getByRole('heading', { level: 1, name: 'Lecturas' })).toBeVisible();
    await expect(page.getByText(/Te quedan 5 de 5 lecturas hoy/)).toBeVisible();
    await expect(page.getByRole('link', { name: /Tarot: tres cartas/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Roast astral/ })).toBeVisible();
    await expectNoViolations(page);
  });

  test('horóscopo de hoy: streaming personal, guardado y cuota', async ({ page, request }) => {
    const user = await createTestUser(request, true);
    await login(page, user);
    await openStudio(page, 'horoscopo-diario');
    await page.getByRole('button', { name: 'Leer mi día' }).click();

    const paper = page.locator('.reading-paper');
    await expect(paper).toContainText('Hoy haz esto:');
    // El mock repite el nombre que recibe en el prompt.
    await expect(paper.locator('strong').first()).toHaveText('Ana');
    await expect(page.getByRole('status').filter({ hasText: 'Lectura lista' })).toBeAttached();
    await expect(page.getByText('Te quedan 4 lecturas hoy.')).toBeVisible();

    // El prompt que llegó a la IA: voz cacheada + perfil + cielo real.
    const ai = await aiRequest(request, 'HORÓSCOPO DE HOY');
    expect(ai.model).toBe('claude-sonnet-5-5');
    expect(ai.system[0]!.cache_control).toEqual({ type: 'ephemeral' });
    expect(ai.system[0]!.text).toContain('IDENTIDAD ABSOLUTA: eres ZODI');
    const prompt = ai.messages[0]!.content;
    expect(prompt).toContain('Nombre: Ana');
    expect(prompt).toMatch(/Sol en \w+ \d+°/);
    expect(prompt).toContain('Tránsitos de hoy');
    expect(prompt).toContain('HORÓSCOPO DE HOY');

    await page.getByRole('link', { name: 'Ver guardada' }).click();
    await expect(
      page.getByRole('heading', { level: 1, name: 'Tu horóscopo de hoy' }),
    ).toBeVisible();
    await expect(page.locator('.reading-paper')).toContainText('Hoy haz esto:');
    await expectNoViolations(page);
  });

  test('tarot: exige pregunta, tira tres cartas y las interpreta', async ({ page, request }) => {
    await login(page, await createTestUser(request, true));
    await openStudio(page, 'tarot');
    await page.getByRole('button', { name: 'Tirar las cartas' }).click();
    await expect(page.getByText('Las cartas necesitan una pregunta.')).toBeVisible();
    await expect(page.getByLabel('Tu pregunta')).toHaveAttribute('aria-invalid', 'true');

    await page.getByLabel('Tu pregunta').fill('¿Me cambio de ciudad este año?');
    await page.getByRole('button', { name: 'Tirar las cartas' }).click();
    const spread = page.getByRole('list', { name: 'Cartas tiradas' });
    await expect(spread.getByRole('listitem')).toHaveCount(3);
    const names = await spread.locator('.tarot-slot-name').allInnerTexts();
    // La IA recibió exactamente esas cartas (el mock las repite).
    const first = names[0]!.replace(' · invertida', '');
    await expect(page.locator('.reading-paper')).toContainText(first);
    await expectNoViolations(page);
  });

  test('compatibilidad con la carta de otra persona', async ({ page, request }) => {
    await login(page, await createTestUser(request, true));
    await page.goto('/app/compatibilidad');
    await hydrated(page);
    await page.getByLabel('Nombre').fill('Leo');
    await page.getByLabel('Fecha de nacimiento').fill('1991-08-03');
    await page.getByRole('button', { name: 'Comparar cartas' }).click();
    await expect(page.locator('.reading-paper')).toContainText('Hoy haz esto:');
    const ai = await aiRequest(request, 'La otra persona: Leo');
    expect(ai.messages[0]!.content).toContain('La otra persona: Leo');
    expect(ai.messages[0]!.content).toContain('Aspectos entre las dos cartas');
  });

  test('sin cuota: botón desactivado y mensaje', async ({ page, request }) => {
    const user = await createTestUser(request, true);
    await request.post(`${MOCK_SUPABASE_URL}/__test/quota`, { data: { userId: user.id, used: 5 } });
    await login(page, user);
    await openStudio(page, 'roast');
    await expect(page.getByRole('button', { name: 'Destrózame' })).toBeDisabled();
    await expect(page.getByText(/Sin lecturas por hoy/)).toBeVisible();
  });

  test('sin carta pide completar los datos', async ({ page, request }) => {
    await login(page, await createTestUser(request, false), '/auth/login?next=/app/lecturas/roast');
    // Sin onboarding el middleware lleva al onboarding: las lecturas no se abren sin datos.
    await expect(page).toHaveURL(/\/app\/onboarding/);
  });

  test('una lectura que no existe da 404', async ({ page, request }) => {
    await login(page, await createTestUser(request, true));
    const res = await page.goto('/app/lecturas/no-existe');
    expect(res?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1, name: 'Aquí no hay nada' })).toBeVisible();
  });

  test('horóscopo: se genera una vez y luego se muestra el de hoy', async ({ page, request }) => {
    await login(page, await createTestUser(request, true));
    await page.goto('/app/horoscopo');
    await hydrated(page);
    await page.getByRole('button', { name: 'Leer mi día' }).click();
    await expect(page.locator('.reading-paper')).toContainText('Hoy haz esto:');
    await page.reload();
    // Ya está el de hoy: se lee sin gastar otra lectura.
    await expect(page.getByRole('button', { name: 'Leer mi día' })).toHaveCount(0);
    await expect(page.locator('.reading-paper')).toContainText('Hoy haz esto:');
    await expect(page.getByText(/Escrito hoy a las/)).toBeVisible();
    await expectNoViolations(page);
  });

  test('asistente: chat con el perfil, sugerencias y teclado', async ({ page, request }) => {
    await login(page, await createTestUser(request, true));
    await page.goto('/app/asistente');
    await hydrated(page);
    await expect(page.getByRole('list', { name: 'Conversación con Zodi' })).toContainText(
      'Oye, Ana',
    );
    await page.getByRole('button', { name: '¿Qué me depara hoy?' }).click();
    const log = page.getByRole('list', { name: 'Conversación con Zodi' });
    // Mientras Zodi escribe hay una burbuja temporal (aria-busy): esperar a que acabe.
    await expect(log.locator('[aria-busy="true"]')).toHaveCount(0);
    await expect(log.getByRole('listitem')).toHaveCount(3);
    await expect(log).toContainText('Oye Ana, respira');

    // Intro envía; el mensaje y la respuesta se añaden a la conversación.
    const input = page.getByLabel('Tu mensaje para Zodi');
    await input.fill('¿Y mañana?');
    await input.press('Enter');
    await expect(log.locator('[aria-busy="true"]')).toHaveCount(0);
    await expect(log.getByRole('listitem')).toHaveCount(5);
    await expect(input).toBeFocused();
    await expect(page.getByText(/Te quedan 3\./)).toBeVisible();

    const ai = await aiRequest(request, '¿Y mañana?');
    expect(ai.system[1]!.text).toContain('MODO CHAT');
    expect(ai.system[1]!.text).toContain('Nombre: Ana');
    expect(ai.messages.map((m) => m.role)).toEqual(['user', 'assistant', 'user']);
    await expectNoViolations(page);
  });
});
