"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Share, WifiOff, X } from "lucide-react";

type InstallState = "idle" | "android" | "ios" | "dismissed";

export function PwaBoot() {
  const [offline, setOffline] = useState(false);
  const [installState, setInstallState] = useState<InstallState>("idle");
  const deferredPrompt = useRef<Event & { prompt: () => void; userChoice: Promise<{ outcome: string }> } | null>(null);

  useEffect(() => {
    // Ocultar si ya esta instalada como PWA
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if ((navigator as { standalone?: boolean }).standalone === true) return;

    const isProduction = process.env.NODE_ENV === "production";

    // Service Worker
    if ("serviceWorker" in navigator) {
      if (isProduction) {
        navigator.serviceWorker.register("/sw.js").catch(() => undefined);
      } else {
        navigator.serviceWorker
          .getRegistrations()
          .then((regs) => Promise.all(regs.map((r) => r.unregister())))
          .catch(() => undefined);
        if ("caches" in window) {
          caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))).catch(() => undefined);
        }
      }
    }

    // Detectar iOS (Safari no soporta beforeinstallprompt)
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isSafari = /safari/i.test(navigator.userAgent) && !/chrome/i.test(navigator.userAgent);

    if (isIos && isSafari) {
      // Mostrar instrucciones iOS despues de 3 segundos (si no fue descartado antes)
      const dismissed = sessionStorage.getItem("zodi-pwa-dismissed");
      if (!dismissed) {
        const timer = setTimeout(() => setInstallState("ios"), 3000);
        return () => clearTimeout(timer);
      }
    }

    // Android / Chrome
    const onInstallPrompt = (event: Event) => {
      event.preventDefault();
      const dismissed = sessionStorage.getItem("zodi-pwa-dismissed");
      if (!dismissed) {
        deferredPrompt.current = event as typeof deferredPrompt.current;
        setInstallState("android");
      }
    };

    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    window.addEventListener("beforeinstallprompt", onInstallPrompt);

    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      window.removeEventListener("beforeinstallprompt", onInstallPrompt);
    };
  }, []);

  function dismiss() {
    sessionStorage.setItem("zodi-pwa-dismissed", "1");
    setInstallState("dismissed");
  }

  async function install() {
    if (!deferredPrompt.current) return;
    deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;
    deferredPrompt.current = null;
    setInstallState("dismissed");
    if (outcome === "accepted") {
      sessionStorage.setItem("zodi-pwa-dismissed", "1");
    }
  }

  const showBanner = installState === "android" || installState === "ios";

  return (
    <>
      {/* Offline pill */}
      <AnimatePresence>
        {offline && (
          <motion.div
            key="offline"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="fixed left-3 top-3 z-50 flex items-center gap-2 rounded-md bg-black/80 px-3 py-2 text-xs text-lime-200 backdrop-blur-md border border-lime-300/20"
          >
            <WifiOff className="h-4 w-4" />
            Modo offline activo
          </motion.div>
        )}
      </AnimatePresence>

      {/* Install banner */}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            key="install-banner"
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 80 }}
            transition={{ type: "spring", damping: 24, stiffness: 300 }}
            className="fixed bottom-20 left-3 right-3 z-50 sm:bottom-5 sm:left-auto sm:right-5 sm:w-80"
          >
            <div className="rounded-md border border-lime-300/25 bg-black/92 p-4 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,.7)]">
              <div className="flex items-start justify-between gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-lime-300">
                  {installState === "ios" ? (
                    <Share className="h-5 w-5 text-black" />
                  ) : (
                    <Download className="h-5 w-5 text-black" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-black text-white">Instala ZODI</p>
                  {installState === "android" ? (
                    <p className="mt-1 text-xs leading-5 text-white/60">
                      Guardalo en tu pantalla de inicio para acceder rapido sin abrir el navegador.
                    </p>
                  ) : (
                    <p className="mt-1 text-xs leading-5 text-white/60">
                      Toca <span className="text-lime-200 font-bold">Compartir</span>{" "}
                      <Share className="inline h-3 w-3" /> y luego{" "}
                      <span className="text-lime-200 font-bold">"Agregar a inicio"</span> para instalarlo.
                    </p>
                  )}
                </div>
                <button
                  onClick={dismiss}
                  className="shrink-0 text-white/40 hover:text-white/70 transition"
                  aria-label="Cerrar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              {installState === "android" && (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={install}
                    className="flex-1 rounded-md bg-lime-300 py-2 text-sm font-black text-black transition hover:bg-lime-200 active:scale-95"
                  >
                    Instalar ahora
                  </button>
                  <button
                    onClick={dismiss}
                    className="rounded-md border border-white/15 px-3 py-2 text-sm text-white/60 transition hover:border-white/30"
                  >
                    Despues
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
