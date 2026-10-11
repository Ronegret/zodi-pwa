/*
 * Retirada del worker de notificaciones (Firebase Cloud Messaging) de la app
 * anterior de Zodi. La v2 aún no tiene notificaciones push (Fase 7): este
 * worker se desinstala y deja de recibir mensajes.
 */
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(self.registration.unregister());
});
