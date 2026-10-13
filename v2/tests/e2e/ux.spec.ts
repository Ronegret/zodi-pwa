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
    await page.getByLabel('Su nombre').fill('Leo');
    await page.getByRole('radio', { name: 'Sí' }).check();
    await page.getByLabel('¿Cuántos?').fill('2');
    await page.getByLabel('Cuéntale a ZODI de ti').fill('Trabajo en diseño y no duermo.');
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(page).toHaveURL(/guardado=1/);
    await expect(page.getByLabel('Situación sentimental')).toHaveValue('complicated');
    await expect(page.getByLabel('¿Cuántos?')).toHaveValue('2');
    await page.getByLabel('Su nombre').fill('');
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(page.getByLabel('Su nombre')).toHaveValue('');
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
    await expect(page.locator('.site-foot').getByText(/Creado por/)).toBeVisible();
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
    await page.locator('.name-parts li').last().scrollIntoViewIfNeeded();
    // Lo que no está de serie lo investiga la IA (y lo inventado no se inventa).
    await expect(page.getByText('Significado de prueba de Quispilema.')).toBeVisible();
    await expect(page.getByText('✦ Investigado por ZODI')).toBeVisible();
    await expect(page.getByText(/No encuentro su historia/)).toBeVisible();
    await expectNoViolations(page);
    // El PDF lleva todo, con el nombre completo que se escribió.
    await page.getByRole('button', { name: 'Descargar todo en PDF' }).click();
    await expect(page).toHaveURL(/\/app\/yo\/informe$/);
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

test.describe('sobre ti: pareja e hijos a tu gente', () => {
  test('los campos aparecen cuando tocan y pasan a Tu gente con favoritos', async ({
    page,
    request,
  }) => {
    await login(page, await createTestUser(request, true));
    // Sin animaciones: axe no mide el contraste a mitad de un desplegable.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/app/ajustes#sobre-ti');
    const partnerDate = page.getByLabel('Su fecha de nacimiento');
    // Con "Prefiero no decirlo" no se pregunta nada más.
    await expect(partnerDate).toBeHidden();
    await expect(page.getByLabel('Hijo/a 1: nombre')).toBeHidden();
    await page.getByLabel('Situación sentimental').selectOption('relationship');
    await expect(partnerDate).toBeVisible();
    await page.getByLabel('Su nombre').fill('Leo');
    await partnerDate.fill('1992-08-03');
    await page.getByRole('radio', { name: 'Sí' }).check();
    await page.getByLabel('Hijo/a 1: nombre').fill('Lía');
    await page.getByLabel('Hijo/a 1: fecha de nacimiento').fill('2015-03-01');
    await expectNoViolations(page);
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(page).toHaveURL(/guardado=1/);
    // Vuelven rellenos.
    await expect(page.getByLabel('Su fecha de nacimiento')).toHaveValue('1992-08-03');

    await page.goto('/app/gente');
    const list = page.getByRole('list').filter({ has: page.getByRole('link', { name: 'Leo' }) });
    await expect(list.getByRole('link', { name: 'Leo' })).toBeVisible();
    await expect(list.getByRole('link', { name: 'Lía' })).toBeVisible();
    await expect(page.getByText(/Hijo\/a · Piscis/)).toBeVisible();
    // ⭐ La hija, favorita: pasa a ser la primera.
    await page.getByRole('button', { name: 'Favorita: Lía' }).click();
    await expect(page.getByRole('button', { name: 'Favorita: Lía' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.locator('.person h3').first()).toHaveText('Lía');
    await expectNoViolations(page);
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

test.describe('todo sobre mí y el informe en PDF', () => {
  test('el hub reúne todo y lleva al informe', async ({ page, request }) => {
    await login(page, await createTestUser(request, true));
    await page.goto('/app/yo');
    await expect(page.getByRole('heading', { level: 1, name: 'Todo sobre mí' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Tu ficha cósmica' })).toBeVisible();
    for (const label of ['Tu Sol', 'Camino de vida', 'Animal chino', 'Sello maya']) {
      await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
    }
    await expect(page.getByRole('link', { name: 'Descargar mis datos (JSON)' })).toHaveAttribute(
      'href',
      '/api/mis-datos',
    );
    await expectNoViolations(page);
    await page.getByRole('link', { name: 'Ver y descargar mi informe' }).click();
    await expect(page).toHaveURL(/\/app\/yo\/informe$/);
  });

  test('el informe tiene portada, todas las secciones y el crédito', async ({ page, request }) => {
    await login(page, await createTestUser(request, true));
    await page.goto('/app/carta/imprimir'); // la ruta antigua redirige
    await expect(page).toHaveURL(/\/app\/yo\/informe$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Ana Estrella' })).toBeVisible();
    for (const h of [
      'Lo que vas a descubrir',
      'El día que naciste',
      'Tu rueda del cielo',
      'Tus planetas, uno a uno',
      'Tus 12 casas',
      'El significado de tu carta',
      'Lo que significa tu nombre',
      'Y hasta aquí lo que sabemos de ti',
    ]) {
      await expect(page.getByRole('heading', { level: 2, name: h })).toBeVisible();
    }
    await expect(page.getByRole('button', { name: 'Guardar como PDF' })).toBeVisible();
    await expect(page.locator('.cover-by')).toBeVisible();
    await expect(page.locator('.signature')).toContainText('rodrigonegrete.es');
    await expectNoViolations(page);
  });

  test('en papel: A4, varias hojas y nada sobresale', async ({ page, request }, info) => {
    test.skip(info.project.name !== 'desktop', 'Basta con un tamaño');
    await login(page, await createTestUser(request, true));
    await page.goto('/app/yo/informe');
    // Un papel A4 a 96 dpi: 794 x 1123 px (menos los márgenes de la hoja).
    await page.setViewportSize({ width: 794 - 113, height: 1123 });
    await page.emulateMedia({ media: 'print' });
    const pdf = await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true });
    const text = pdf.toString('latin1');
    expect(text.startsWith('%PDF')).toBe(true);
    const pages = [...text.matchAll(/\/Type\s*\/Page[^s]/g)].length;
    expect(pages).toBeGreaterThan(8);
    expect(text).toMatch(/\/MediaBox\s*\[\s*0\s+0\s+59\d(\.\d+)?\s+8[34]\d(\.\d+)?\s*\]/);
    // Nada sobresale por la derecha de la hoja (A4 = 794 px a 96 dpi).
    const over = await page.evaluate(() => {
      const limit = 794 - 113 + 2;
      return [...document.querySelectorAll('.report .page *, .report .cover *')]
        .filter((el) => el.getBoundingClientRect().right > limit)
        .map((el) => `${el.tagName}.${[...el.classList].join('.')}`);
    });
    expect(over).toEqual([]);
  });
});

test.describe('pie de página y páginas legales', () => {
  test('el pie lleva legal, crédito y proyectos del creador', async ({ page }) => {
    await page.goto('/');
    const foot = page.getByRole('contentinfo');
    for (const name of ['Privacidad', 'Términos', 'Cookies', 'Aviso legal']) {
      await expect(foot.getByRole('link', { name })).toBeVisible();
    }
    await expect(foot.getByRole('link', { name: /rodrigonegrete\.es/ }).first()).toHaveAttribute(
      'href',
      'https://rodrigonegrete.es',
    );
    await expect(foot.getByText(/© \d{4} Rodrigo Negrete Aros/)).toBeVisible();
  });

  test('cookies, aviso legal y privacidad dicen lo que tienen que decir', async ({ page }) => {
    await page.goto('/legal/cookies');
    await expect(page.getByRole('table')).toContainText('sb-');
    await expect(page.getByText(/no usamos cookies de publicidad/)).toBeVisible();
    await page.goto('/legal/aviso-legal');
    await expect(page.getByRole('heading', { name: '1. Titular del sitio' })).toBeVisible();
    await page.goto('/legal/privacidad');
    for (const h of [
      '1. Quién es el responsable',
      '4. Inteligencia artificial: qué se envía y a quién',
      '8. Tus derechos',
    ]) {
      await expect(page.getByRole('heading', { name: h })).toBeVisible();
    }
  });

  test('robots, sitemap y security.txt', async ({ request }) => {
    expect(await (await request.get('/robots.txt')).text()).toContain('Disallow: /app/');
    const sitemap = await (await request.get('/sitemap.xml')).text();
    expect(sitemap).toContain('/compatibilidad/aries-y-leo');
    expect(sitemap).not.toContain('/app/');
    expect(await (await request.get('/.well-known/security.txt')).text()).toContain('Contact:');
  });
});

test.describe('tus datos', () => {
  test('descargar mis datos: solo lo mío, en JSON y sin caché', async ({ page, request }) => {
    await login(page, await createTestUser(request, true));
    const res = await page.request.get('/api/mis-datos');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-disposition']).toMatch(/attachment; filename="zodi-mis-datos-/);
    expect(res.headers()['cache-control']).toContain('no-store');
    const data = await res.json();
    expect(data.perfil.display_name).toBe('Ana Estrella');
    expect(data.cartas).toHaveLength(1);
    expect(JSON.stringify(data)).not.toMatch(/password|service_role/i);
    const anon = await request.get('/api/mis-datos');
    expect(anon.status()).toBe(401);
  });
});

test.describe('zona horaria', () => {
  test.use({ timezoneId: 'Asia/Tokyo' });

  test('la zona del perfil se sincroniza con la del navegador (no la del nacimiento)', async ({
    page,
    request,
  }) => {
    await login(page, await createTestUser(request, true));
    await expect(page).toHaveURL(/\/app$/);
    // Se guarda sola y la página se recarga una vez con el valor correcto.
    await expect(page.locator('[data-tz]')).toHaveAttribute('data-tz', 'Asia/Tokyo');
    const mine = await (await page.request.get('/api/mis-datos')).json();
    expect(mine.perfil.time_zone).toBe('Asia/Tokyo');
    // Datos no válidos, no.
    const bad = await page.evaluate(
      async () =>
        (
          await fetch('/api/zona-horaria', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ timeZone: 'Marte/Olimpo' }),
          })
        ).status,
    );
    expect(bad).toBe(422);
  });
});
