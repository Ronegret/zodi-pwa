"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Share, WifiOff, X } from "lucide-react";

type InstallState = "idle" | "android" | "ios" | "dismissed";

export const pwaState = {
  installState: "idle" as InstallState,
  deferredPrompt: null as any,
  listeners: new Set<() => void>(),
  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  },
  setInstallState(state: InstallState) {
    this.installState = state;
    this.listeners.forEach((fn) => fn());
  },
};

export function usePwa() {
  const [state, setState] = useState(pwaState.installState);
  useEffect(() => {
    return pwaState.subscribe(() => setState(pwaState.installState));
  }, []);
  
  const dismiss = () => {
    sessionStorage.setItem("zodi-pwa-dismissed", "1");
    pwaState.setInstallState("dismissed");
  };

  const install = async () => {
    if (!pwaState.deferredPrompt) return;
    pwaState.deferredPrompt.prompt();
    const { outcome } = await pwaState.deferredPrompt.userChoice;
    pwaState.deferredPrompt = null;
    pwaState.setInstallState("dismissed");
    if (outcome === "accepted") {
      sessionStorage.setItem("zodi-pwa-dismissed", "1");
    }
  };

  return { installState: state, install, dismiss };
}

export function PwaBoot() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if ((navigator as { standalone?: boolean }).standalone === true) return;

    const isProduction = process.env.NODE_ENV === "production";

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

    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isSafari = /safari/i.test(navigator.userAgent) && !/chrome/i.test(navigator.userAgent);

    if (isIos && isSafari) {
      const dismissed = sessionStorage.getItem("zodi-pwa-dismissed");
      if (!dismissed) {
        const timer = setTimeout(() => pwaState.setInstallState("ios"), 3000);
        return () => clearTimeout(timer);
      }
    }

    const onInstallPrompt = (event: Event) => {
      event.preventDefault();
      const dismissed = sessionStorage.getItem("zodi-pwa-dismissed");
      if (!dismissed) {
        pwaState.deferredPrompt = event;
        pwaState.setInstallState("android");
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

  return (
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
  );
}

// Este componente lo puedes poner en el Perfil o donde quieras, de forma fija.
export function InstallPwaCard() {
  const { installState, install, dismiss } = usePwa();
  if (installState !== "android" && installState !== "ios") return null;

  return (
    <div className="rounded-md border border-lime-300/25 bg-lime-300/5 p-5 mt-5">
      <div className="flex items-start justify-between gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-lime-300">
          {installState === "ios" ? (
            <Share className="h-5 w-5 text-black" />
          ) : (
            <Download className="h-5 w-5 text-black" />
          )}
        </div>
        <div className="flex-1">
          <p className="font-black text-white">Descarga la App ZODI</p>
          {installState === "android" ? (
            <p className="mt-1 text-xs text-white/60">
              Guárdalo en tu pantalla de inicio para una experiencia más rápida.
            </p>
          ) : (
            <p className="mt-1 text-xs text-white/60">
              Toca <span className="text-lime-200 font-bold">Compartir</span> y luego <span className="text-lime-200 font-bold">"Agregar a inicio"</span>.
            </p>
          )}
        </div>
      </div>
      {installState === "android" && (
        <div className="mt-4 flex gap-2">
          <button onClick={install} className="flex-1 rounded-md bg-lime-300 py-2.5 text-xs font-black text-black">
            Instalar ahora
          </button>
          <button onClick={dismiss} className="rounded-md border border-white/15 px-4 py-2.5 text-xs text-white/60">
            Ocultar
          </button>
        </div>
      )}
      {installState === "ios" && (
        <div className="mt-4 flex gap-2">
          <button onClick={dismiss} className="w-full rounded-md border border-white/15 py-2.5 text-xs text-white/60">
            Entendido, ocultar
          </button>
        </div>
      )}
    </div>
  );
}
