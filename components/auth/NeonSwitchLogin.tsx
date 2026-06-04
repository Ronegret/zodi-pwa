"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AuthForm } from "@/components/auth/AuthForm";

function ImageWithFallback({ src, fallback, alt, cardW }: { src: string; fallback: string; alt: string; cardW: number }) {
  const [imgSrc, setImgSrc] = useState(src);
  return (
    <Image
      src={imgSrc}
      alt={alt}
      fill
      className="object-cover object-top select-none"
      priority
      draggable={false}
      sizes={`${cardW}px`}
      onError={() => setImgSrc(fallback)}
    />
  );
}

const CARD_IMAGE    = "/zodi-art/carta-identificacion.png";
const CARD_FALLBACK = "/zodi-art/nuevas/2-Portada--Home/Hero-principal-portada.webp";
const CARD_W        = 380;
const FLIP_MS       = 700;  // duración de la animación
const MID_MS        = 350;  // midpoint — cuando la cara es edge-on y el swap es invisible

export function NeonSwitchLogin({ mode }: { mode: "login" | "register" }) {
  const [flipped, setFlipped] = useState(false);
  const [ready,   setReady]   = useState(false);

  // "front" | "mid" | "back" — controla visibilidad JS para iOS Safari
  // (backface-visibility: hidden no es fiable en mobile WebKit)
  const [face, setFace] = useState<"front" | "mid" | "back">("front");

  useEffect(() => {
    setReady(true);
    if (sessionStorage.getItem("zodi.google_redirect_pending")) {
      doFlip(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function doFlip(toBack: boolean) {
    if (toBack) {
      // Empezar rotación → en el midpoint ocultar frente y mostrar trasera
      setFlipped(true);
      setFace("mid");
      setTimeout(() => setFace("back"), MID_MS);
    } else {
      // Restaurar frente antes de rotar, luego ocultar trasera en midpoint
      setFace("mid");
      setFlipped(false);
      setTimeout(() => setFace("front"), MID_MS);
    }
  }

  const frontVisible = face !== "back";   // visible en "front" y "mid"
  const backVisible  = face !== "front";  // visible en "back"  y "mid"

  return (
    <div className="w-full flex flex-col items-center" style={{ maxWidth: CARD_W }}>
      {/* ── Contenedor 3D ──────────────────────────────────────────────── */}
      <div style={{ width: "100%", perspective: "1400px" }}>

        {/* Wrapper del flip */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "min(570px, calc(100dvh - 170px))",
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            transition: `transform ${FLIP_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
          }}
        >
          {/* ── CARA FRONTAL — la carta ─────────────────────────────── */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              // JS backup para iOS Safari (donde backface-visibility falla)
              visibility: frontVisible ? "visible" : "hidden",
              zIndex: frontVisible ? 2 : 0,
            }}
          >
            <CardFront ready={ready && !flipped} onFlip={() => doFlip(true)} />
          </div>

          {/* ── CARA TRASERA — formulario ───────────────────────────── */}
          {/* Siempre en el DOM: los efectos de auth deben ejecutarse */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              // JS backup para iOS Safari
              visibility: backVisible ? "visible" : "hidden",
              zIndex: backVisible ? 2 : 0,
              overflowY: "auto",
              overflowX: "hidden",
            }}
          >
            <div className="flex flex-col h-full">
              <button
                type="button"
                onClick={() => doFlip(false)}
                className="shrink-0 self-start flex items-center gap-1.5 text-xs text-white/30 hover:text-lime-300/60 transition-colors px-1 py-1 mb-1"
              >
                <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
                  <path d="M8 2L4 6L8 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Volver a la carta
              </button>

              <div className="flex-1 min-h-0">
                <AuthForm mode={mode} compact />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Cara frontal: imagen flotante + glow neon verde
   La animación float se detiene cuando está girada para no interferir
   con el contexto 3D del padre en algunos motores WebKit.
───────────────────────────────────────────────────────────────────────── */
function CardFront({
  ready,
  onFlip,
}: {
  ready: boolean;
  onFlip: () => void;
}) {
  return (
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
        <ImageWithFallback
          src={CARD_IMAGE}
          fallback={CARD_FALLBACK}
          alt="LA IDENTIFICACIÓN — Haz clic para entrar"
          cardW={CARD_W}
        />

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
