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

test.describe('el significado de tu carta', () => {
  test('todo lo que dice tu nacimiento, con números y pregunta al oráculo', async ({
    page,
    request,
  }) => {
    await login(page, await createTestUser(request, true));
    await page.goto('/app/carta');
    await page.getByRole('link', { name: 'Lee el significado completo' }).click();
    await expect(page).toHaveURL(/\/app\/carta\/significado$/);
    await expect(page.getByRole('heading', { level: 2, name: 'Tu Sol en Aries' })).toBeVisible();
    // El día que naciste: el cielo sobre su ciudad, la Luna y sus citas con el cielo.
    await expect(
      page.getByRole('heading', { level: 2, name: /^Un domingo de primavera en / }),
    ).toBeVisible();
    await expect(page.getByRole('img', { name: /El cielo sobre .+ cuando naciste/ })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Tus próximas citas con el cielo' }),
    ).toBeVisible();
    await expect(page.getByText(/Tu retorno solar · en \d+ días/)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Tu ficha cósmica' })).toBeVisible();
    for (const h of ['Tus números', 'Tus aspectos más fuertes']) {
      await expect(page.getByRole('heading', { level: 2, name: h })).toBeVisible();
    }
    await expect(page.getByText('Camino de vida', { exact: true })).toBeVisible();
    await expect(page.locator('img[src^="/numeros/"]').first()).toBeVisible();
    // Tu nombre: con el nombre completo, nombre y apellidos explicados.
    await expect(
      page.getByRole('heading', { level: 2, name: 'Lo que significa «Ana Estrella»' }),
    ).toBeVisible();
    await page.getByLabel(/Tu nombre completo/).fill('Ana Calfuleo Quispilema Zorblax');
    await page.getByRole('button', { name: 'Ver lo que significa' }).click();
    await expect(page.getByText('Calfu = azul · leo = río.')).toBeVisible();
    // La investigación arranca al verse en pantalla.
    await page.locator('.name-parts').scrollIntoViewIfNeeded();
    // Lo que no está de serie lo investiga la IA (y lo inventado no se inventa).
    await expect(page.getByText('Significado de prueba de Quispilema.')).toBeVisible();
    await expect(page.getByText('✦ Investigado por ZODI')).toBeVisible();
    await expect(page.getByText(/No encuentro su historia/)).toBeVisible();
    await expectNoViolations(page);
    // El PDF lleva todo, con el nombre completo que se escribió.
    await page.getByRole('button', { name: 'Descargar todo en PDF' }).click();
    await expect(page).toHaveURL(/\/app\/carta\/imprimir$/);
    await expect(
      page.getByText('«Ana Calfuleo Quispilema Zorblax»: de dónde viene cada parte.'),
    ).toBeVisible();
    await expect(page.getByText(/significado de prueba de Quispilema/i)).toBeVisible();
    await page.goto('/app/carta/significado');
    await page
      .getByRole('region', { name: 'Tu Sol en Aries' })
      .getByRole('link', { name: 'Pregúntale a ZODI sobre esto' })
      .click();
    await expect(page).toHaveURL(/\/app\/oraculo\?pregunta=/);
    await expect(page.getByRole('textbox')).toHaveValue(/Explícame mi Sol en Aries/);
  });
});

test.describe('móvil: barra inferior y hoja Más', () => {
  test('Más abre el resto de secciones y se cierra', async ({ page, request }) => {
    test.skip(test.info().project.name !== 'mobile', 'La barra inferior es del móvil');
    await login(page, await createTestUser(request, true));
    await expect(page).toHaveURL(/\/app$/);
    const bar = page.getByRole('navigation', { name: 'Principal' });
    for (const name of ['Inicio', 'Lecturas', 'Tu gente', 'Carta']) {
      await expect(bar.getByRole('link', { name })).toBeVisible();
    }
    await expect(bar.getByRole('link', { name: 'Ajustes' })).toBeHidden();
    await bar.getByRole('button', { name: 'Más' }).click();
    const more = page.getByRole('navigation', { name: 'Más secciones' });
    for (const name of ['Horóscopo', 'Oráculo', 'Comunidad', 'Match', 'Progreso', 'Ajustes']) {
      await expect(more.getByRole('link', { name })).toBeVisible();
    }
    await expect(page.getByRole('button', { name: 'Cerrar sesión' }).last()).toBeVisible();
    await expectNoViolations(page);
    await page.keyboard.press('Escape');
    await expect(more).toBeHidden();
    await bar.getByRole('button', { name: 'Más' }).click();
    await more.getByRole('link', { name: 'Ajustes' }).click();
    await expect(page).toHaveURL(/\/app\/ajustes$/);
  });
});

test.describe('tu gente', () => {
  test('añadir a alguien, ver la afinidad y cómo está el día, y borrar', async ({
    page,
    request,
  }) => {
    await login(page, await createTestUser(request, true));
    await page.goto('/app/gente');
    await expect(page.getByRole('heading', { name: 'Aún no has añadido a nadie' })).toBeVisible();
    await expectNoViolations(page);
    // Errores claros si falta algo.
    await page.getByRole('button', { name: 'Añadir y ver nuestra afinidad' }).click();
    await expect(page.getByText('Escribe su nombre.').first()).toBeVisible();
    await page.getByLabel(/Nombre o apodo/).fill('Mamá');
    await page.getByLabel(/¿Qué es para ti?/).selectOption('familia');
    await page.getByLabel(/Fecha de nacimiento/).fill('1965-08-03');
    await page.getByRole('button', { name: 'Añadir y ver nuestra afinidad' }).click();
    await expect(page).toHaveURL(/\/app\/gente\/[0-9a-f-]{36}\?nuevo=1$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Mamá' })).toBeVisible();
    await expect(page.getByRole('heading', { name: /^\d+%$/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Hoy entre los dos' })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Cómo es Mamá según las estrellas' }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Tu esencia y la suya' })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Su camino de vida es el \d+/ })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Pregúntale a ZODI por Mamá' })).toHaveAttribute(
      'href',
      /\/app\/oraculo\?pregunta=/,
    );
    await expectNoViolations(page);
    // En la lista y en el panel.
    await page.goto('/app/gente');
    await expect(page.getByRole('link', { name: 'Mamá' })).toBeVisible();
    await page.goto('/app');
    await expect(
      page.getByRole('region', { name: 'Tu gente hoy' }).getByRole('link', { name: /Mamá/ }),
    ).toBeVisible();
    // Borrar.
    await page
      .getByRole('region', { name: 'Tu gente hoy' })
      .getByRole('link', { name: /Mamá/ })
      .click();
    await page.getByText('Borrar a Mamá', { exact: true }).click();
    await page.getByRole('button', { name: 'Sí, borrar a Mamá' }).click();
    await expect(page).toHaveURL(/\/app\/gente\?borrado=1$/);
    await expect(page.getByRole('heading', { name: 'Aún no has añadido a nadie' })).toBeVisible();
  });
});

test.describe('carta en PDF', () => {
  test('página lista para guardar como PDF, accesible', async ({ page, request }) => {
    await login(page, await createTestUser(request, true));
    await page.goto('/app/carta');
    await page.getByRole('link', { name: 'Descargar en PDF' }).click();
    await expect(page).toHaveURL(/\/app\/carta\/imprimir$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Ana Estrella' })).toBeVisible();
    for (const h of [
      'Tu rueda del cielo',
      'Tus elementos',
      'Tus planetas, uno a uno',
      'Tus 12 casas',
      'El significado de tu carta',
      'Lo que significa tu nombre',
    ]) {
      await expect(page.getByRole('heading', { level: 2, name: h })).toBeVisible();
    }
    await expect(page.getByRole('button', { name: 'Guardar como PDF' })).toBeVisible();
    await expect(page.getByText(/Creado por Rodrigo Negrete/)).toBeVisible();
    await expectNoViolations(page);
  });
});
