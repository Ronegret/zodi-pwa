importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title || "ZODI", {
      body: data.body || "El oraculo tiene una alerta nueva.",
      icon: "/icons/icon-512.png",
      badge: "/icons/icon-512.png"
    })
  );
});
