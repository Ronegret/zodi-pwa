/*
 * Retirada del service worker de la app anterior de Zodi (Next + Serwist).
 * Los navegadores que la tenían instalada piden esta URL al buscar
 * actualizaciones: este worker borra sus cachés, se desinstala y recarga
 * las pestañas abiertas para que carguen la versión nueva desde la red.
 * La v2 no registra ningún service worker.
 */
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.registration.unregister();
      const windows = await self.clients.matchAll({ type: 'window' });
      for (const client of windows) client.navigate(client.url);
    })(),
  );
});
