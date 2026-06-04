importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.notification?.title || data.title || "ZODI", {
      body: data.notification?.body || data.body || "El oráculo tiene algo que decirte.",
      icon: "/icons/icon-512.png",
      badge: "/icons/icon-512.png",
      data: { url: data.fcmOptions?.link || "https://zodi.aibueno.es/dashboard" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "https://zodi.aibueno.es/dashboard";
  event.waitUntil(clients.openWindow(url));
});
