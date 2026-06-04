"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthForm } from "@/components/auth/AuthForm";

export function NeonSwitchLogin({ mode }: { mode: "login" | "register" }) {
  const [flipped, setFlipped] = useState(false);

  // Si viene de un redirect de Google, mostrar el formulario directamente
  useEffect(() => {
    if (sessionStorage.getItem("zodi.google_redirect_pending")) {
      setFlipped(true);
    }
  }, []);

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Perspectiva 3D para el efecto flip */}
      <div style={{ perspective: "1200px" }}>
        <div
          style={{
            position: "relative",
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            transition: "transform 0.65s cubic-bezier(0.22, 1, 0.36, 1)",
            minHeight: 520,
          }}
        >
          {/* ── CARA FRONTAL ── */}
          <div
            style={{ backfaceVisibility: "hidden", position: "absolute", inset: 0 }}
            className="cursor-pointer"
            onClick={() => setFlipped(true)}
          >
            <CardFront mode={mode} />
          </div>

          {/* ── CARA TRASERA (formulario) ── */}
          <div
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              position: "absolute",
              inset: 0,
            }}
          >
            {/* Botón volver arriba — accesible antes del formulario */}
            <div className="flex justify-start px-1 pb-1">
              <button
                type="button"
                onClick={() => setFlipped(false)}
                className="flex items-center gap-1.5 text-xs text-white/30 hover:text-lime-300/70 transition-colors py-1"
              >
                <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
                  <path d="M8 2L4 6L8 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Voltear carta
              </button>
            </div>

            {/* AuthForm SIEMPRE en el DOM — necesario para que getRedirectResult
                se ejecute al volver de un redirect de Google */}
            <AuthForm mode={mode} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Cara frontal de la carta
────────────────────────────────────────────────────────────────── */
function CardFront({ mode }: { mode: "login" | "register" }) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl select-none"
      style={{
        minHeight: 520,
        background: "linear-gradient(160deg, #0e0e1c 0%, #06060f 100%)",
        border: "1px solid rgba(184,255,23,0.18)",
        boxShadow:
          "0 0 60px rgba(184,255,23,0.07), 0 0 0 1px rgba(184,255,23,0.1), 0 24px 60px rgba(0,0,0,0.7)",
      }}
    >
      {/* Glow central */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 35%, rgba(184,255,23,0.07) 0%, transparent 65%)",
        }}
      />

      {/* Borde superior degradado */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(184,255,23,0.5), transparent)" }} />

      <div className="relative h-full flex flex-col items-center justify-between px-6 pt-7 pb-7"
        style={{ minHeight: 520 }}>

        {/* Encabezado */}
        <div className="text-center w-full">
          <p className="text-[9px] font-black uppercase tracking-[0.55em] text-lime-300/40">
            {mode === "login" ? "Portal de entrada" : "Portal de registro"}
          </p>
          <div className="mt-2 flex items-center gap-2 justify-center">
            <div className="h-px w-8" style={{ background: "rgba(184,255,23,0.2)" }} />
            <span className="text-lime-300/30 text-xs">✦</span>
            <div className="h-px w-8" style={{ background: "rgba(184,255,23,0.2)" }} />
          </div>
        </div>

        {/* Símbolo central — rueda zodiacal */}
        <div className="flex flex-col items-center gap-5">
          <ZodiacWheel />
          <div className="text-center">
            <h1 className="text-5xl font-black tracking-[0.2em] text-white"
              style={{ textShadow: "0 0 30px rgba(184,255,23,0.2)" }}>
              ZODI
            </h1>
            <p className="mt-1 text-[11px] uppercase tracking-[0.45em] text-lime-300/50">
              Oráculo Astral IA
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="w-full space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1" style={{ background: "rgba(184,255,23,0.15)" }} />
            <span className="text-lime-300/25 text-[10px]">✦</span>
            <div className="h-px flex-1" style={{ background: "rgba(184,255,23,0.15)" }} />
          </div>

          {/* Botón / zona de clic */}
          <motion.div
            whileTap={{ scale: 0.97 }}
            className="rounded-xl px-4 py-3.5 text-center"
            style={{
              background: "rgba(184,255,23,0.06)",
              border: "1px solid rgba(184,255,23,0.2)",
            }}
          >
            <p className="text-sm font-bold text-white/85">
              {mode === "login" ? "✦ Toca para entrar" : "✦ Toca para crear cuenta"}
            </p>
            <p className="text-[10px] text-white/30 mt-0.5">
              {mode === "login" ? "Tu destino te espera" : "Descubre tu carta astral"}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Borde inferior degradado */}
      <div className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(184,255,23,0.35), transparent)" }} />

      {/* Esquinas decorativas */}
      <Corner pos="top-2.5 left-2.5" />
      <Corner pos="top-2.5 right-2.5" rotate={90} />
      <Corner pos="bottom-2.5 left-2.5" rotate={270} />
      <Corner pos="bottom-2.5 right-2.5" rotate={180} />
    </div>
  );
}

function ZodiacWheel() {
  const signs = ["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"];
  return (
    <div className="relative" style={{ width: 148, height: 148 }}>
      <svg viewBox="0 0 148 148" className="w-full h-full">
        {/* Círculos */}
        <circle cx="74" cy="74" r="70" fill="none" stroke="rgba(184,255,23,0.12)" strokeWidth="0.5" />
        <circle cx="74" cy="74" r="56" fill="none" stroke="rgba(184,255,23,0.18)" strokeWidth="0.5" />
        <circle cx="74" cy="74" r="24" fill="none" stroke="rgba(184,255,23,0.25)" strokeWidth="0.5" />
        {/* 12 marcas */}
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i * 30 - 90) * Math.PI / 180;
          return (
            <line key={i}
              x1={74 + 56 * Math.cos(a)} y1={74 + 56 * Math.sin(a)}
              x2={74 + 70 * Math.cos(a)} y2={74 + 70 * Math.sin(a)}
              stroke="rgba(184,255,23,0.35)" strokeWidth="0.8"
            />
          );
        })}
        {/* Signos */}
        {signs.map((s, i) => {
          const a = (i * 30 - 90 + 15) * Math.PI / 180;
          const r = 42;
          return (
            <text key={i}
              x={74 + r * Math.cos(a)} y={74 + r * Math.sin(a)}
              textAnchor="middle" dominantBaseline="central"
              fontSize="9" fill="rgba(184,255,23,0.45)"
            >{s}</text>
          );
        })}
        {/* Centro */}
        <text x="74" y="74" textAnchor="middle" dominantBaseline="central"
          fontSize="22" fill="rgba(184,255,23,0.7)">✦</text>
      </svg>
    </div>
  );
}

function Corner({ pos, rotate = 0 }: { pos: string; rotate?: number }) {
  return (
    <div className={`absolute ${pos} pointer-events-none`}
      style={{ transform: `rotate(${rotate}deg)`, width: 14, height: 14 }}>
      <svg viewBox="0 0 14 14" className="w-full h-full">
        <path d="M1,1 L7,1 M1,1 L1,7" stroke="rgba(184,255,23,0.4)" strokeWidth="1" fill="none" />
      </svg>
    </div>
  );
}
