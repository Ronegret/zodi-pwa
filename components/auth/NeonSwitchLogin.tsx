"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AuthForm } from "@/components/auth/AuthForm";

/* ─── Imagen de la carta ────────────────────────────────────────────────────
   Guarda la imagen en: /public/zodi-art/carta-identificacion.webp
   Relación de aspecto recomendada: 2:3 (ej. 800×1200 px)
──────────────────────────────────────────────────────────────────────────── */
const CARD_IMAGE = "/zodi-art/carta-identificacion.webp";

/* ─── Dimensiones de la carta ───────────────────────────────────────────── */
const CARD_W = 380;    // px — máximo ancho
const CARD_H = 570;    // px — alto fijo (ratio 2:3 aprox)

export function NeonSwitchLogin({ mode }: { mode: "login" | "register" }) {
  const [flipped, setFlipped] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
    // Si viene de redirect de Google → mostrar formulario directamente
    if (sessionStorage.getItem("zodi.google_redirect_pending")) {
      setFlipped(true);
    }
  }, []);

  return (
    <div className="w-full flex flex-col items-center" style={{ maxWidth: CARD_W }}>
      {/* ── Contenedor 3D ─────────────────────────────────────────────── */}
      <div style={{ width: "100%", perspective: "1400px" }}>

        {/* Wrapper del flip */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: CARD_H,
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            transition: "transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          {/* ── CARA FRONTAL — la carta ─────────────────────────────── */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }}
          >
            <CardFront ready={ready} onFlip={() => setFlipped(true)} />
          </div>

          {/* ── CARA TRASERA — formulario ───────────────────────────── */}
          {/* SIEMPRE en el DOM: getRedirectResult debe ejecutarse aunque
              la carta esté mostrando el frente */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              overflowY: "auto",
            }}
          >
            <div className="flex flex-col gap-1.5">
              {/* Botón volver — siempre arriba del todo */}
              <button
                type="button"
                onClick={() => setFlipped(false)}
                className="self-start flex items-center gap-1.5 text-xs text-white/30 hover:text-lime-300/60 transition-colors px-1 py-1"
              >
                <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
                  <path d="M8 2L4 6L8 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Volver a la carta
              </button>

              <AuthForm mode={mode} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Cara frontal: imagen flotante + glow neon verde
───────────────────────────────────────────────────────────────────────── */
function CardFront({
  ready,
  onFlip,
}: {
  ready: boolean;
  onFlip: () => void;
}) {
  return (
    /* Wrapper del float — solo anima el movimiento vertical */
    <motion.div
      style={{ width: "100%", height: "100%", position: "relative", cursor: "pointer" }}
      animate={ready ? { y: [0, -14, 0] } : { y: 0 }}
      transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", repeatType: "loop" }}
      onClick={onFlip}
      whileTap={{ scale: 0.97 }}
    >
      {/* ── Glow neon detrás de la carta ── */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: "-28px",
          borderRadius: "28px",
          background:
            "radial-gradient(ellipse at 50% 55%, rgba(184,255,23,0.45) 0%, rgba(184,255,23,0.15) 35%, transparent 70%)",
          filter: "blur(24px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* ── Imagen de la carta ── */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          borderRadius: "18px",
          overflow: "hidden",
          zIndex: 1,
          boxShadow: [
            "0 0 0 1.5px rgba(184,255,23,0.5)",
            "0 0 24px rgba(184,255,23,0.35)",
            "0 0 60px rgba(184,255,23,0.15)",
            "0 32px 80px rgba(0,0,0,0.85)",
          ].join(", "),
        }}
      >
        <Image
          src={CARD_IMAGE}
          alt="LA IDENTIFICACIÓN — Haz clic para entrar"
          fill
          className="object-cover object-top select-none"
          priority
          draggable={false}
          sizes={`${CARD_W}px`}
        />

        {/* Overlay sutil para dar depth al borde */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "18px",
            background:
              "linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.25) 100%)",
            pointerEvents: "none",
          }}
        />
      </div>
    </motion.div>
  );
}
