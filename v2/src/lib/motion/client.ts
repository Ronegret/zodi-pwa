/**
 * Capa de movimiento del navegador: scroll suave (Lenis), efectos de
 * puntero (botón magnético, tilt 3D, halo que sigue al cursor), contadores
 * y confeti. Nada es imprescindible para usar la app: con movimiento
 * reducido o pantalla táctil simplemente no se activa.
 *
 * Los estilos se tocan por CSSOM (element.style.setProperty), que la CSP
 * permite; los atributos style="" en el HTML no.
 */
import Lenis from 'lenis';
import { DURATION, EASING, finePointer, reducedMotion, storedPreference } from './index';

let lenis: Lenis | null = null;

function initSmoothScroll() {
  if (lenis || reducedMotion()) return;
  // Solo rueda/trackpad: el teclado, el foco y los anclajes siguen siendo nativos.
  lenis = new Lenis({ autoRaf: true, anchors: true, smoothWheel: true, syncTouch: false });
}

export function stopSmoothScroll() {
  lenis?.destroy();
  lenis = null;
}

/** Botones que se acercan un poco al cursor (máx. 8 px). */
function initMagnetic(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const dx = ((e.clientX - r.left) / r.width - 0.5) * 16;
      const dy = ((e.clientY - r.top) / r.height - 0.5) * 16;
      el.style.setProperty('--mx', `${dx.toFixed(1)}px`);
      el.style.setProperty('--my', `${dy.toFixed(1)}px`);
    });
    el.addEventListener('pointerleave', () => {
      el.style.setProperty('--mx', '0px');
      el.style.setProperty('--my', '0px');
    });
  });
}

/** Inclinación 3D suave de tarjetas (máx. 4°). */
function initTilt(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('[data-tilt]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty('--ry', `${(x * 8).toFixed(2)}deg`);
      el.style.setProperty('--rx', `${(-y * 8).toFixed(2)}deg`);
    });
    el.addEventListener('pointerleave', () => {
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    });
  });
}

/** Halo de luz que sigue al cursor dentro de una zona (hero de la portada). */
function initCursorGlow(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('[data-cursor-glow]').forEach((zone) => {
    const glow = document.createElement('span');
    glow.className = 'cursor-glow';
    glow.setAttribute('aria-hidden', 'true');
    zone.append(glow);
    zone.addEventListener('pointermove', (e) => {
      const r = zone.getBoundingClientRect();
      glow.style.setProperty('--gx', `${e.clientX - r.left}px`);
      glow.style.setProperty('--gy', `${e.clientY - r.top}px`);
      glow.classList.add('is-on');
    });
    zone.addEventListener('pointerleave', () => glow.classList.remove('is-on'));
  });
}

/**
 * Contadores que suben hasta su valor. El número final está siempre en el
 * HTML (sin saltos de diseño ni lecturas a medias): solo se anima la copia
 * visual, que es aria-hidden.
 */
function initCountUp(root: ParentNode) {
  if (reducedMotion()) return;
  root.querySelectorAll<HTMLElement>('[data-countup]').forEach((el) => {
    const to = Number(el.dataset.countup);
    if (!Number.isFinite(to) || to === 0) return;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / 900);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = String(Math.round(to * eased));
      if (t < 1) requestAnimationFrame(step);
    };
    el.textContent = '0';
    requestAnimationFrame(step);
  });
}

const CONFETTI_COLORS = ['--acid', '--violet', '--hot', '--cyan', '--gold'];

/** Confeti discreto (36 piezas, ~1,3 s). Nunca con movimiento reducido. */
export function celebrate(origin?: { x: number; y: number }) {
  if (reducedMotion()) return;
  const layer = document.createElement('div');
  layer.className = 'confetti';
  layer.setAttribute('aria-hidden', 'true');
  document.body.append(layer);
  const x = origin?.x ?? window.innerWidth / 2;
  const y = origin?.y ?? window.innerHeight / 3;
  const animations = Array.from({ length: 36 }, (_, i) => {
    const bit = document.createElement('span');
    bit.className = 'confetti-bit';
    bit.style.setProperty('--c', `var(${CONFETTI_COLORS[i % CONFETTI_COLORS.length]})`);
    bit.style.left = `${x}px`;
    bit.style.top = `${y}px`;
    layer.append(bit);
    const angle = (Math.PI * 2 * i) / 36 + Math.random() * 0.4;
    const dist = 120 + Math.random() * 160;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist * 0.7 + 160;
    return bit.animate(
      [
        { transform: 'translate(-50%, -50%) rotate(0deg)', opacity: 1 },
        {
          transform: `translate(${dx}px, ${dy}px) rotate(${360 + Math.random() * 360}deg)`,
          opacity: 0,
        },
      ],
      { duration: 1100 + Math.random() * 400, easing: EASING.out, fill: 'forwards' },
    );
  });
  Promise.all(animations.map((a) => a.finished)).finally(() => layer.remove());
}

/** Punto de entrada: Base.astro lo llama en cada página. */
export function initMotion() {
  const pref = storedPreference();
  if (pref) document.documentElement.dataset.motion = pref;
  if (reducedMotion()) return;
  initSmoothScroll();
  initCountUp(document);
  if (finePointer()) {
    initMagnetic(document);
    initTilt(document);
    initCursorGlow(document);
  }
  // Fiesta al llegar al dashboard tras calcular la carta.
  if (document.querySelector('[data-celebrate]')) {
    window.setTimeout(() => celebrate(), DURATION.base);
  }
}
