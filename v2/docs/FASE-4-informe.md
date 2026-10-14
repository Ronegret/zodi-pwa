# Fase 4 — Motion design

Commits en `astro-v2`: `e7b2d38` (sistema), `cc53103` (interfaz), `1d42c73` (tests). Sin push.

## Hecho

- **Sistema de movimiento** (`src/lib/motion/`):
  - `tokens.ts` con duraciones (160/320/640 ms) y easings: out, in, inOut y resorte con `linear()`. Son los mismos valores que las variables CSS `--dur-*` y `--ease-*`; un test comprueba que no se desincronizan.
  - Presets `enter`, `exit`, `emphasis` y `spring`, que solo animan transform y opacity, y `play()`.
  - `reducedMotion()` vale verdadero si el sistema lo pide **o** si la persona lo eligió en Ajustes.
- **Transiciones de página:** View Transitions nativas entre documentos. Al cambiar de página el contenido sale y entra con un desplazamiento suave, y hay dos elementos compartidos:
  - el título (`.vt-title`, entre el layout de la app y el de acceso);
  - la imagen del signo solar (`.vt-sign-art`, entre la tarjeta "Tu carta" y `/app/carta`).
  - Sin soporte en el navegador, la navegación es normal.
- **Scroll:**
  - Lenis para rueda y trackpad. El teclado, el foco y los anclajes siguen siendo nativos, y no se activa con movimiento reducido.
  - Revelados con `animation-timeline: view()` que solo usan translate y scale. Nunca opacity, así que el contraste del texto no baja durante la animación. Sin soporte del navegador, los elementos simplemente están en su sitio.
  - Parallax sutil solo en el personaje de la portada.
- **Ratón** (solo con puntero fino y hover; en táctil no se activa nada):
  - CTA magnéticos (`data-magnetic`, máximo 8 px).
  - Tilt 3D en las tarjetas del dashboard (`data-tilt`, máximo 4°).
  - Halo que sigue al cursor en el hero, por detrás del texto.
- **Microinteracciones:**
  - Botones con escala al pulsar.
  - Check de chips con resorte y tarjetas de opción con "press".
  - Barras de progreso que se llenan al cargar.
  - Skeleton con shimmer.
  - Avisos con entrada y salida animadas.
  - Contador de racha que sube hasta su valor: el número final está siempre en el HTML y lo que se anima es una copia oculta a lectores de pantalla.
  - Confeti discreto (36 piezas, unos 1,3 s) al llegar al dashboard tras calcular la carta.
- **Interruptor "Reducir animaciones" en Ajustes** (`role="switch"`): es una preferencia local del dispositivo. Si el sistema ya pide menos movimiento, se muestra marcado y bloqueado.
- **Movimiento reducido:** todo va al estado final al instante (red de seguridad global en `motion.css`). Sin Lenis, sin confeti, sin efectos de puntero, sin transiciones de página y sin revelados. Nada parpadea.
- **Rendimiento:**
  - Solo se anima transform, translate, scale y opacity.
  - Los estilos dinámicos van por CSSOM, que la CSP permite.
  - Se precargan Syne y Plus Jakarta Sans (latin): el cambio de fuente provocaba un CLS de 0,18 en el dashboard.

## Verificado (desde `v2/`)

| Comando            | Resultado                                                |
| ------------------ | -------------------------------------------------------- |
| `npm run check`    | 0 errores (114 ficheros)                                 |
| `npm run lint`     | limpio                                                   |
| `npm test`         | **134/134** (7 nuevos de movimiento)                     |
| `npm run build`    | OK. CSP sin `unsafe-inline` y sin `style=""` en el HTML. |
| `npm run test:e2e` | **106/106** en los tres tamaños (2 omitidos por diseño). |

Qué cubren los e2e:

- **Con `reducedMotion: 'reduce'`:** ninguna animación en marcha, sin Lenis, sin confeti, el contador muestra el valor final desde el principio y los revelados no desplazan nada.
- **Con movimiento:** Lenis activo, el contador llega a su valor y los revelados terminan en su sitio.
- **Confeti:** aparece al llegar tras el onboarding y se retira solo.
- **Títulos:** el título lleva `view-transition-name`.
- **Efectos de ratón:** solo en escritorio.
- **Preferencia de Ajustes:** se mantiene tras recargar.
- **Rendimiento:** CLS = 0 al cargar el dashboard y la interacción más lenta tarda menos de 200 ms.
- **Accesibilidad:** axe sigue sin violaciones en todas las páginas.

## Riesgos y pendientes

- **Lighthouse** queda para la Fase 8, sobre un preview de Vercel. El adaptador no admite `astro preview` y medir sobre `astro dev` no es representativo. Por ahora CLS e INP se miden con PerformanceObserver en Playwright.
- **Preferencia de movimiento de Ajustes:** el script de la página es un módulo diferido, así que en la primera pintura puede verse un instante de animación aunque se haya elegido reducir. La preferencia del sistema no tiene este problema porque va por CSS.
- **Revelados y título compartido** dependen de navegadores modernos (`animation-timeline`, View Transitions entre documentos). En Firefox y Safari antiguos no hay animación, que es el comportamiento de respaldo previsto.
- **Lenis** añade unos 5 kB gzip en todas las páginas.
