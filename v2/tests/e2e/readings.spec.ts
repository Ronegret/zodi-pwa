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
    thinking?: unknown;
    output_config?: unknown;
    system: { text: string; cache_control?: unknown }[];
    messages: { role: string; content: string | { text: string; cache_control?: unknown }[] }[];
  };
}

test.describe('lecturas con IA', () => {
  test('hub con tipos, cuota y sin violaciones de accesibilidad', async ({ page, request }) => {
    await login(page, await createTestUser(request, true));
    await page.goto('/app/lecturas');
    await expect(page.getByRole('heading', { level: 1, name: 'Lecturas' })).toBeVisible();
    await expect(page.getByText(/Te quedan 5 de 5 lecturas hoy/)).toBeVisible();
    await expect(page.getByRole('link', { name: /Tarot ZODI/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Roast astral/ })).toBeVisible();
    // Agrupadas por temas, con las de la Zodi de antes y el oráculo.
    for (const group of ['Horóscopos', 'Tarot y runas', 'Tu carta y tus números']) {
      await expect(page.getByRole('heading', { level: 2, name: group })).toBeVisible();
    }
    for (const name of [/Cruz celta/, /Runas vikingas/, /Lectura de mano/, /Horóscopo maya/]) {
      await expect(page.getByRole('link', { name })).toBeVisible();
    }
    await expect(page.getByRole('link', { name: /Oráculo de ZODI/ })).toHaveAttribute(
      'href',
      '/app/oraculo',
    );
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
    // El horóscopo diario va con el modelo rápido y sin razonamiento.
    expect(ai.model).toBe('claude-haiku-5-5');
    expect(ai.thinking).toEqual({ type: 'disabled' });
    expect(ai.system[0]!.cache_control).toEqual({ type: 'ephemeral' });
    expect(ai.system[0]!.text).toContain('IDENTIDAD ABSOLUTA: eres ZODI');
    const prompt = ai.messages[0]!.content;
    expect(prompt).toContain('Nombre: Ana');
    expect(prompt).toMatch(/Sol en \w+ \d+°/);
    expect(prompt).toContain('Lo que pasa hoy en el cielo');
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
    // Se reparten boca abajo y se voltean una a una.
    await expect(spread.locator('.tarot-card3d[data-revealed]')).toHaveCount(3);
    const names = await spread.locator('.tarot-slot-name').allInnerTexts();
    // La IA recibió exactamente esas cartas (el mock las repite).
    const first = names[0]!.replace(' · invertida', '');
    await expect(page.locator('.reading-paper')).toContainText(first);
    await expectNoViolations(page);
  });

  test('tarot de una carta y cruz celta de diez', async ({ page, request }) => {
    await login(page, await createTestUser(request, true));
    await openStudio(page, 'tarot');
    await page.getByRole('radio', { name: /^Una carta/ }).check();
    await page.getByLabel('Tu pregunta').fill('¿Le escribo hoy?');
    await page.getByRole('button', { name: 'Tirar las cartas' }).click();
    const spread = page.getByRole('list', { name: 'Cartas tiradas' });
    await expect(spread.getByRole('listitem')).toHaveCount(1);
    await expect(page.locator('.reading-paper')).toContainText('Hoy haz esto:');
    const tarot = await aiRequest(request, '¿Le escribo hoy?');
    expect(tarot.messages[0]!.content).toContain('Cartas tiradas (una carta)');
    // El tarot va con el modelo profundo, sin razonamiento previo y esfuerzo bajo.
    expect(tarot.model).toBe('claude-sonnet-5-5');
    expect(tarot.thinking).toEqual({ type: 'between_tools' });
    expect(tarot.output_config).toEqual({ effort: 'low' });

    await openStudio(page, 'tirada-celta');
    await page.getByLabel('Tu pregunta').fill('¿Dejo el trabajo este año?');
    await page.getByRole('button', { name: 'Echar la cruz celta' }).click();
    await expect(spread.getByRole('listitem')).toHaveCount(10);
    await expect(spread.locator('.tarot-card3d[data-revealed]')).toHaveCount(10);
    await expect(page.locator('.reading-paper')).toContainText('Hoy haz esto:');
    // La guía explica qué es la cruz celta.
    await expect(page.getByRole('heading', { level: 2, name: '¿Qué es esto?' })).toBeVisible();
    await page.getByText('El báculo', { exact: true }).click();
    await expect(page.getByText(/Las cuatro últimas/)).toBeVisible();
  });

  test('runas y cristal', async ({ page, request }) => {
    await login(page, await createTestUser(request, true));
    await openStudio(page, 'runas');
    // Pregunta única por proyecto: los tres navegadores comparten la IA falsa.
    const question = `¿Le digo lo que siento? (${test.info().project.name})`;
    await page.getByLabel(/Tu pregunta/).fill(question);
    await page.getByRole('button', { name: 'Tirar las runas' }).click();
    const cast = page.getByRole('list', { name: 'Runas tiradas' });
    await expect(cast.getByRole('listitem')).toHaveCount(3);
    const rune = (await cast.locator('.rune-name').first().innerText()).split(' ·')[0]!;
    await expect(page.locator('.reading-paper')).toContainText('Hoy haz esto:');
    const ai = await aiRequest(request, question);
    expect(ai.messages[0]!.content).toContain(`Lo que fue: `);
    expect(ai.messages[0]!.content).toContain(rune);

    await openStudio(page, 'cristales');
    await page.getByRole('button', { name: 'Ver mi cristal' }).click();
    await expect(page.getByText('Elige una intención.').first()).toBeVisible();
    await page.getByRole('radio', { name: 'Calma y descanso' }).check();
    await page.getByRole('button', { name: 'Ver mi cristal' }).click();
    await expect(page.locator('.crystal-card')).toContainText('Para calma y descanso');
    await expect(page.locator('.reading-paper')).toContainText('Hoy haz esto:');
    await expectNoViolations(page);
  });

  test('nombre, mano y sello maya', async ({ page, request }) => {
    await login(page, await createTestUser(request, true));
    await openStudio(page, 'nombre');
    await page.getByLabel('Nombre', { exact: true }).fill('Ana');
    await page.getByLabel(/Primer apellido/).fill('Estrella');
    // Vista previa al escribir: Estrella vibra en 11 (número maestro).
    await expect(page.getByText('Estrella → 11').first()).toBeVisible();
    await page.getByRole('button', { name: 'Leer mi nombre' }).click();
    await expect(page.locator('.name-card')).toContainText('Expresión');
    await expect(page.locator('.reading-paper')).toContainText('Hoy haz esto:');

    await openStudio(page, 'mano');
    await page.getByRole('button', { name: 'Leer mi mano' }).click();
    await expect(page.getByText('Elige la forma de tu mano.').first()).toBeVisible();
    for (const option of [
      'Palma alargada y dedos largos',
      'Larga y bien marcada',
      'Sube curvada hacia los dedos',
      'Baja inclinada hacia la muñeca',
      'No la veo',
    ]) {
      await page.getByRole('radio', { name: option }).check();
    }
    await page.getByRole('button', { name: 'Leer mi mano' }).click();
    await expect(page.locator('.reading-paper')).toContainText('Hoy haz esto:');
    const ai = await aiRequest(request, 'Línea del destino: No la veo');
    expect(ai.messages[0]!.content).toContain('Forma de tu mano: Palma alargada y dedos largos');

    await openStudio(page, 'horoscopo-maya');
    await page.getByRole('button', { name: 'Ver mi sello maya' }).click();
    await expect(page.locator('.maya-card')).toContainText(/Kin \d+ de 260/);
    await expect(page.locator('.reading-paper')).toContainText('Hoy haz esto:');
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
    // Recargar solo cuando ya está guardada (si no, la recarga corta el guardado).
    await expect(page.getByRole('status').filter({ hasText: 'Lectura lista' })).toBeAttached();
    await page.reload();
    // Ya está el de hoy: se lee sin gastar otra lectura.
    await expect(page.getByRole('button', { name: 'Leer mi día' })).toHaveCount(0);
    await expect(page.locator('.reading-paper')).toContainText('Hoy haz esto:');
    await expect(page.getByText(/Escrito hoy a las/)).toBeVisible();
    await expectNoViolations(page);
  });

  test('oráculo: chat con el perfil, sugerencias y teclado', async ({ page, request }) => {
    await login(page, await createTestUser(request, true));
    await page.goto('/app/oraculo');
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
    // El oráculo tiene su propia cuota: 15 mensajes en free, sin gastar lecturas.
    await expect(page.getByText(/Te quedan 13 mensajes hoy/)).toBeVisible();

    const ai = await aiRequest(request, '¿Y mañana?');
    expect(ai.system[1]!.text).toContain('MODO CHAT');
    expect(ai.system[1]!.text).toContain('Nombre: Ana');
    expect(ai.messages.map((m) => m.role)).toEqual(['user', 'assistant', 'user']);
    // El oráculo va con el modelo rápido, sin razonamiento y con la conversación cacheada.
    expect(ai.model).toBe('claude-haiku-5-5');
    expect(ai.thinking).toEqual({ type: 'disabled' });
    expect(ai.system.every((b) => b.cache_control)).toBe(true);
    expect(ai.messages.at(-1)!.content).toEqual([
      { type: 'text', text: '¿Y mañana?', cache_control: { type: 'ephemeral' } },
    ]);
    await expectNoViolations(page);
  });

  test('lecturas fijas: la segunda vez se enseña la guardada sin gastar', async ({
    page,
    request,
  }) => {
    await login(page, await createTestUser(request, true));
    await openStudio(page, 'numerologia');
    await page.getByRole('button', { name: 'Ver mis números' }).click();
    await expect(page.getByRole('button', { name: 'Copiar' })).toBeVisible();
    await expect(page.getByText(/Ya la tenías/)).toHaveCount(0);

    await openStudio(page, 'numerologia');
    await page.getByRole('button', { name: 'Ver mis números' }).click();
    await expect(page.getByText(/Ya la tenías de hace poco/)).toBeVisible();
    await expect(page.locator('.reading-paper')).toContainText('Hoy haz esto:');
    await expectNoViolations(page);

    // A propósito, se puede pedir otra (esta sí gasta).
    await page.getByRole('button', { name: 'Hacer una nueva' }).click();
    await expect(page.getByRole('button', { name: 'Copiar' })).toBeVisible();
    await expect(page.getByText(/Ya la tenías/)).toHaveCount(0);
  });
});
