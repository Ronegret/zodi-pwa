"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Retrasamos un poco la aparición para no agobiar en el primer segundo
    const timer = setTimeout(() => {
      const consent = localStorage.getItem("zodi-cookies-accepted");
      if (!consent) {
        setShow(true);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("zodi-cookies-accepted", "true");
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-[60] flex flex-col items-center justify-between gap-4 border-t border-white/10 p-5 sm:flex-row sm:px-8 pb-[max(env(safe-area-inset-bottom,20px),20px)]"
          style={{ background: "rgb(4, 4, 8)" }}
        >
          <div className="max-w-3xl text-sm leading-relaxed text-white/70">
            <strong>El cosmos tiene cookies.</strong> Usamos cookies estrictamente necesarias para el funcionamiento de ZODI y para recordar tu sesión. No te rastreamos por toda la web ni vendemos tu carta natal. Al seguir navegando, aceptas nuestra{" "}
            <Link href="/legal/privacidad" className="font-bold text-lime-300 hover:underline">
              Política de Privacidad
            </Link>{" "}
            y{" "}
            <Link href="/legal/terminos" className="font-bold text-lime-300 hover:underline">
              Términos de Servicio
            </Link>.
          </div>
          <div className="w-full shrink-0 sm:w-auto">
            <button
              onClick={acceptCookies}
              className="w-full rounded-xl bg-lime-300 px-6 py-3 font-black text-black transition hover:bg-lime-200 sm:w-auto"
            >
              Aceptar y continuar
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
