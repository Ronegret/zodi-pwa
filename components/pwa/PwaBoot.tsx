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
    <div className="rounded-xl border border-lime-300/30 bg-gradient-to-br from-black/80 to-lime-900/10 p-6 mt-5 relative overflow-hidden shadow-[0_0_30px_rgba(184,255,23,0.1)]">
      {/* Decorative gradient orb */}
      <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-lime-300/10 blur-2xl pointer-events-none" />
      
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-lime-300 shadow-[0_0_15px_rgba(184,255,23,0.3)]">
          {installState === "ios" ? (
            <Share className="h-6 w-6 text-black" />
          ) : (
            <Download className="h-6 w-6 text-black" />
          )}
        </div>
        <div className="flex-1">
          <p className="font-black text-white text-lg">Instala la App ZODI</p>
          {installState === "android" ? (
            <p className="mt-1 text-sm text-white/60 leading-relaxed">
              Guárdalo en tu pantalla de inicio para una experiencia más rápida, acceso offline y sin distracciones.
            </p>
          ) : (
            <div className="mt-2 text-sm text-white/70 leading-relaxed">
              Para tener ZODI como una App real en tu iPhone:
              <ol className="mt-3 grid gap-2">
                <li className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold">1</span>
                  Toca el botón <Share className="h-4 w-4 text-lime-300 mx-1 inline" /> <span className="font-bold text-white">Compartir</span> abajo.
                </li>
                <li className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold">2</span>
                  Baja y toca <span className="rounded bg-white/10 px-2 py-0.5 text-xs font-bold text-white">➕ Agregar a inicio</span>
                </li>
              </ol>
            </div>
          )}
        </div>
      </div>
      <div className="relative z-10">
        {installState === "android" && (
          <div className="mt-6 flex gap-3">
            <button onClick={install} className="flex-1 rounded-lg bg-lime-300 py-3 text-sm font-black text-black hover:bg-lime-200 transition shadow-[0_0_15px_rgba(184,255,23,0.3)]">
              Instalar ahora
            </button>
            <button onClick={dismiss} className="rounded-lg border border-white/20 px-5 py-3 text-sm font-bold text-white/60 hover:text-white transition">
              Ocultar
            </button>
          </div>
        )}
        {installState === "ios" && (
          <div className="mt-6 flex gap-3">
            <button onClick={dismiss} className="w-full rounded-lg border border-lime-300/30 py-3 text-sm font-bold text-lime-100 hover:bg-lime-300/10 transition">
              Entendido, ya lo instalé (Ocultar)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
