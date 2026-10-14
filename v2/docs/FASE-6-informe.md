# Fase 6 — Tu carta natal en PDF

Fecha: 12/10/2026 · Rama `fase-7` → `astro-v2`.

## Hecho

- `/app/carta/imprimir`: página A4 pensada para "Guardar como PDF" desde el navegador (ordenador y móvil), con el estilo de ZODI (colores intactos al imprimir, una sección por página).
- Contenido: portada con el logo, el arte de ZODI del signo solar, nombre y datos de nacimiento; los tres pilares en palabras normales; la rueda natal en SVG; el reparto de elementos; los planetas uno a uno (qué es, signo y grado, casa y área de la vida, retrógrado) y las 12 casas explicadas; pie con la fecha de cálculo y la firma de Rodrigo Negrete.
- Botón "Descargar en PDF" en la carta.

## Decisión

Se genera con la impresión del navegador en lugar de una librería de PDF en el servidor: cero peso extra, tipografías y SVG idénticos a la web, y funciona sin servicios de terceros. Si más adelante se quiere enviar el PDF por correo, habrá que generarlo en el servidor.

## Verificado

- e2e (`tests/e2e/ux.spec.ts`, "carta en PDF") en móvil, tablet y escritorio con axe WCAG 2.2 AA.
- PDF real generado con Chromium y revisado con la vista de impresión.
