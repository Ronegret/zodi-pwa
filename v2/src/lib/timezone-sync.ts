/**
 * Mantiene `profiles.time_zone` igual que la zona horaria del navegador. Si
 * cambia (viaje, o la que quedó guardada del lugar de nacimiento), se guarda
 * y se recarga UNA vez para que la página ya pinte la hora y el día correctos.
 * Una clave en sessionStorage evita cualquier bucle.
 */
const KEY = 'zodi:tz';

export function syncTimeZone(root: HTMLElement | null): void {
  if (!root) return;
  let browser = '';
  try {
    browser = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return;
  }
  if (!browser || root.dataset.tz === browser) return;
  try {
    // Ya lo intentamos en esta pestaña con este valor: no insistir.
    if (sessionStorage.getItem(KEY) === browser) return;
    sessionStorage.setItem(KEY, browser);
  } catch {
    /* sin sessionStorage: se intenta una vez por carga */
  }
  fetch('/api/zona-horaria', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ timeZone: browser }),
  })
    .then((res) => {
      if (res.ok) location.reload();
    })
    .catch(() => {});
}
