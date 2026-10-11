/**
 * Bucle de animación que solo corre cuando hace falta: se pausa fuera de
 * pantalla (IntersectionObserver), con la pestaña oculta o si la persona
 * pulsa "Pausar". dt se limita para que una pestaña dormida no dé saltos.
 */
export interface LoopTarget {
  update(dt: number): void;
  render(): void;
}

export interface LoopControl {
  pause(): void;
  resume(): void;
  stop(): void;
  readonly paused: boolean;
  readonly running: boolean;
}

export function startLoop(target: LoopTarget, observe: Element): LoopControl {
  let frame = 0;
  let last = 0;
  let visible = true;
  let userPaused = false;
  let stopped = false;

  const tick = (now: number) => {
    frame = 0;
    const dt = last ? Math.min((now - last) / 1000, 1 / 20) : 0;
    last = now;
    target.update(dt);
    target.render();
    schedule();
  };
  const active = () => !stopped && visible && !userPaused && document.visibilityState === 'visible';
  const schedule = () => {
    if (active() && !frame) frame = requestAnimationFrame(tick);
  };
  const halt = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
  };

  const io = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? true;
    if (visible) schedule();
    else halt();
  });
  io.observe(observe);
  const onVisibility = () => (document.visibilityState === 'visible' ? schedule() : halt());
  document.addEventListener('visibilitychange', onVisibility);

  // Primer frame aunque esté fuera de pantalla: la escena queda pintada.
  target.render();
  schedule();

  return {
    pause() {
      userPaused = true;
      halt();
    },
    resume() {
      userPaused = false;
      schedule();
    },
    stop() {
      stopped = true;
      halt();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    },
    get paused() {
      return userPaused;
    },
    get running() {
      return frame !== 0;
    },
  };
}
