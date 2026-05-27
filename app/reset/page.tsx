"use client";

import { useEffect } from "react";

export default function ResetPage() {
  useEffect(() => {
    async function reset() {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
      }
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
      window.location.replace("/?limpio=1");
    }

    reset().catch(() => window.location.replace("/?limpio=1"));
  }, []);

  return (
    <main className="grid min-h-screen place-items-center bg-black px-6 text-center text-lime-200">
      <div className="glass-panel rounded-md p-6">
        <p className="text-xs uppercase tracking-[0.3em]">ZODI</p>
        <h1 className="mt-3 text-3xl font-black">Limpiando energía antigua...</h1>
      </div>
    </main>
  );
}
