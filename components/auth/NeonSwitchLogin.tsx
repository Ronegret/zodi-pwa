"use client";

import { useState, useCallback, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthForm } from "@/components/auth/AuthForm";

// ── Sonido del interruptor ────────────────────────────────────────────────────
function playSwitchSound(on: boolean) {
  try {
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC() as AudioContext;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = "square";
    osc.frequency.setValueAtTime(on ? 900 : 600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(on ? 180 : 80, ctx.currentTime + 0.07);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.12);
  } catch { /* silencio */ }
}

// ── Interruptor de pared ──────────────────────────────────────────────────────
function WallSwitch({ isOn, onToggle }: { isOn: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center gap-4">
      {/* Etiqueta izquierda */}
      <span className="text-[10px] font-black uppercase tracking-[0.28em] hidden sm:block"
        style={{ color: isOn ? "rgba(184,255,23,0.7)" : "rgba(255,255,255,0.3)" }}>
        {isOn ? "Activo" : "Dormido"}
      </span>

      {/* Placa */}
      <motion.div
        role="button"
        tabIndex={0}
        aria-pressed={isOn}
        aria-label={isOn ? "Apagar efecto" : "Encender efecto"}
        onClick={onToggle}
        onTouchEnd={e => { e.preventDefault(); onToggle(); }}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") onToggle(); }}
        whileTap={{ scale: 0.94 }}
        className="relative cursor-pointer select-none focus:outline-none"
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        {/* Halo */}
        <AnimatePresence>
          {isOn && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="absolute -inset-6 rounded-full pointer-events-none"
              style={{ background: "radial-gradient(ellipse, rgba(184,255,23,0.2) 0%, transparent 70%)" }}
            />
          )}
        </AnimatePresence>

        {/* Caja */}
        <div style={{
          width: 72, height: 100, borderRadius: 12, position: "relative",
          background: isOn ? "linear-gradient(160deg,#141420,#0c0c14)" : "linear-gradient(160deg,#1c1c26,#131320)",
          border: isOn ? "2px solid rgba(184,255,23,0.7)" : "2px solid rgba(255,255,255,0.3)",
          boxShadow: isOn
            ? "0 0 24px rgba(184,255,23,0.4), inset 0 1px 0 rgba(184,255,23,0.2)"
            : "0 6px 24px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1)",
          transition: "all 0.3s ease",
        }}>
          {/* Tornillo sup-izq */}
          <div style={{ position:"absolute", top:6, left:6, width:8, height:8, borderRadius:"50%",
            background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.2)" }} />
          {/* Tornillo inf-der */}
          <div style={{ position:"absolute", bottom:6, right:6, width:8, height:8, borderRadius:"50%",
            background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.2)" }} />

          {/* Rocker */}
          <motion.div
            animate={{ rotateX: isOn ? -14 : 14 }}
            transition={{ type:"spring", stiffness:450, damping:26 }}
            style={{ position:"absolute", left:10, right:10, top:12, bottom:12,
              borderRadius:8, transformOrigin:"center", transformStyle:"preserve-3d" }}
          >
            <div style={{
              position:"absolute", inset:0, borderRadius:8,
              background: isOn
                ? "linear-gradient(180deg,rgba(184,255,23,0.12) 0%,rgba(0,0,0,0.6) 100%)"
                : "linear-gradient(180deg,rgba(255,255,255,0.07) 0%,rgba(0,0,0,0.5) 100%)",
              border: isOn ? "1px solid rgba(184,255,23,0.3)" : "1px solid rgba(255,255,255,0.12)",
              boxShadow: isOn
                ? "0 2px 12px rgba(184,255,23,0.2), inset 0 1px 0 rgba(184,255,23,0.25)"
                : "0 6px 16px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1)",
              transition:"all 0.3s ease",
            }} />
            {/* I */}
            <div style={{ position:"absolute", top:8, left:"50%", transform:"translateX(-50%)",
              fontFamily:"monospace", fontSize:16, fontWeight:900, lineHeight:1,
              color: isOn ? "rgba(184,255,23,1)" : "rgba(255,255,255,0.3)",
              textShadow: isOn ? "0 0 8px rgba(184,255,23,0.9)" : "none",
              transition:"all 0.3s ease" }}>I</div>
            {/* O */}
            <div style={{ position:"absolute", bottom:8, left:"50%", transform:"translateX(-50%)",
              fontFamily:"monospace", fontSize:11, fontWeight:900, lineHeight:1,
              color: isOn ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.45)",
              transition:"all 0.3s ease" }}>O</div>
            {/* LED */}
            <motion.div
              animate={{ backgroundColor: isOn ? "#b8ff17" : "#1a1a2e",
                boxShadow: isOn ? "0 0 6px rgba(184,255,23,1),0 0 12px rgba(184,255,23,0.5)" : "none" }}
              transition={{ duration:0.2 }}
              style={{ position:"absolute", left:"50%", top:"50%",
                transform:"translate(-50%,-50%)", width:6, height:6, borderRadius:"50%" }}
            />
          </motion.div>
        </div>
      </motion.div>

      {/* Etiqueta derecha */}
      <span className="text-[9px] font-black uppercase tracking-[0.3em]"
        style={{ color: isOn ? "rgba(184,255,23,0.6)" : "rgba(255,255,255,0.2)" }}>
        ZODI
      </span>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
// El interruptor es DECORATIVO — el formulario siempre está visible y funcional.
// Encender el interruptor solo activa el efecto de "sala encendida" (glow neon).
// Esto garantiza que el login NUNCA falle independientemente del estado del switch.
export function NeonSwitchLogin({ mode }: { mode: "login" | "register" }) {
  const [isOn, setIsOn] = useState(mode === "register");

  const toggle = useCallback(() => {
    const next = !isOn;
    playSwitchSound(next);
    setIsOn(next);
  }, [isOn]);

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Glow de fondo cuando está encendido */}
      <AnimatePresence>
        {isOn && (
          <motion.div
            key="room-glow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-0 -z-10"
            style={{
              background: "radial-gradient(ellipse at 50% 30%, rgba(184,255,23,0.06) 0%, transparent 60%)",
            }}
          />
        )}
      </AnimatePresence>

      {/* Switch + estado — centrado encima del form */}
      <div className="flex flex-col items-center gap-2 mb-6">
        <WallSwitch isOn={isOn} onToggle={toggle} />
        <motion.p
          key={isOn ? "on" : "off"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[10px] uppercase tracking-[0.28em] text-center"
          style={{ color: isOn ? "rgba(184,255,23,0.6)" : "rgba(255,255,255,0.25)" }}
        >
          {isOn ? "⚡ Oráculo encendido" : "🌑 Oráculo en reposo"}
        </motion.p>
      </div>

      {/* Formulario — SIEMPRE VISIBLE, login funciona siempre */}
      <motion.div
        animate={{
          boxShadow: isOn
            ? "0 0 60px rgba(184,255,23,0.08), 0 0 0 1px rgba(184,255,23,0.12)"
            : "none",
          borderRadius: 16,
        }}
        transition={{ duration: 0.4 }}
      >
        <Suspense fallback={
          <div className="flex items-center justify-center py-16 text-white/30 text-sm">
            Cargando...
          </div>
        }>
          <AuthForm mode={mode} />
        </Suspense>
      </motion.div>
    </div>
  );
}
