"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthForm } from "@/components/auth/AuthForm";

function playSwitchSound(on: boolean) {
  try {
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC() as AudioContext;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = "square";
    o.frequency.setValueAtTime(on ? 880 : 550, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(on ? 220 : 110, ctx.currentTime + 0.08);
    g.gain.setValueAtTime(0.2, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.12);
  } catch { /* noop */ }
}

function WallSwitch({ isOn, onToggle }: { isOn: boolean; onToggle: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-[11px] font-black uppercase tracking-[0.3em] transition-all duration-300"
        style={{ color: isOn ? "rgba(184,255,23,0.8)" : "rgba(255,255,255,0.5)" }}>
        {isOn ? "⚡ Oráculo encendido" : "🌑 Toca para entrar"}
      </p>

      <button type="button" onClick={onToggle} aria-pressed={isOn}
        className="relative focus:outline-none active:scale-95 transition-transform duration-150"
        style={{ WebkitTapHighlightColor: "transparent" }}>
        <div className="absolute -inset-8 rounded-full pointer-events-none transition-opacity duration-500"
          style={{ background: "radial-gradient(ellipse,rgba(184,255,23,0.22) 0%,transparent 70%)", opacity: isOn ? 1 : 0 }} />
        <div className="relative transition-all duration-300" style={{
          width: 80, height: 112, borderRadius: 14,
          background: isOn ? "linear-gradient(160deg,#141420,#0c0c14)" : "linear-gradient(160deg,#1e1e2c,#141420)",
          border: isOn ? "2px solid rgba(184,255,23,0.85)" : "2px solid rgba(255,255,255,0.38)",
          boxShadow: isOn
            ? "0 0 32px rgba(184,255,23,0.55),0 0 80px rgba(184,255,23,0.18),inset 0 1px 0 rgba(184,255,23,0.25)"
            : "0 8px 32px rgba(0,0,0,0.9),inset 0 1px 0 rgba(255,255,255,0.1)",
        }}>
          {[{ top:7,left:7 },{ bottom:7,right:7 } as any].map((p,i)=>(
            <div key={i} style={{ position:"absolute",...p,width:9,height:9,borderRadius:"50%",
              background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.25)" }} />
          ))}
          <div className="absolute transition-transform duration-200"
            style={{ left:11,right:11,top:13,bottom:13,borderRadius:9,
              transformOrigin:"center",transform:isOn?"rotateX(-14deg)":"rotateX(14deg)",
              transformStyle:"preserve-3d" }}>
            <div className="absolute inset-0 transition-all duration-300" style={{ borderRadius:9,
              background:isOn?"linear-gradient(180deg,rgba(184,255,23,0.15) 0%,rgba(0,0,0,0.6) 100%)":"linear-gradient(180deg,rgba(255,255,255,0.08) 0%,rgba(0,0,0,0.55) 100%)",
              border:isOn?"1px solid rgba(184,255,23,0.4)":"1px solid rgba(255,255,255,0.14)",
              boxShadow:isOn?"0 2px 14px rgba(184,255,23,0.3),inset 0 1px 0 rgba(184,255,23,0.3)":"0 8px 20px rgba(0,0,0,0.8),inset 0 1px 0 rgba(255,255,255,0.1)" }} />
            <span style={{ position:"absolute",top:9,left:"50%",transform:"translateX(-50%)",
              fontFamily:"monospace",fontSize:17,fontWeight:900,lineHeight:1,
              color:isOn?"rgba(184,255,23,1)":"rgba(255,255,255,0.3)",
              textShadow:isOn?"0 0 8px rgba(184,255,23,1)":"none",transition:"all 0.3s" }}>I</span>
            <span style={{ position:"absolute",bottom:9,left:"50%",transform:"translateX(-50%)",
              fontFamily:"monospace",fontSize:12,fontWeight:900,lineHeight:1,
              color:isOn?"rgba(255,255,255,0.15)":"rgba(255,255,255,0.5)",transition:"all 0.3s" }}>O</span>
            <div className="absolute transition-all duration-300" style={{
              left:"50%",top:"50%",transform:"translate(-50%,-50%)",
              width:7,height:7,borderRadius:"50%",
              background:isOn?"#b8ff17":"#1a1a2e",
              boxShadow:isOn?"0 0 8px rgba(184,255,23,1),0 0 16px rgba(184,255,23,0.7)":"none" }} />
          </div>
        </div>
      </button>

      <div className="flex items-center gap-2">
        <div className="h-px w-6 transition-all duration-300"
          style={{ background:isOn?"rgba(184,255,23,0.5)":"rgba(255,255,255,0.15)" }} />
        <span className="text-[9px] font-black uppercase tracking-[0.35em] transition-all duration-300"
          style={{ color:isOn?"rgba(184,255,23,0.6)":"rgba(255,255,255,0.2)" }}>ZODI</span>
        <div className="h-px w-6 transition-all duration-300"
          style={{ background:isOn?"rgba(184,255,23,0.5)":"rgba(255,255,255,0.15)" }} />
      </div>
    </div>
  );
}

export function NeonSwitchLogin({ mode }: { mode: "login" | "register" }) {
  // Always start with form visible — hiding it breaks Google OAuth redirect:
  // when user returns from redirect, AuthForm must be mounted to call getRedirectResult.
  const [isOn, setIsOn] = useState(true);

  const toggle = useCallback(() => {
    playSwitchSound(!isOn);
    setIsOn(v => !v);
  }, [isOn]);

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center gap-6">
      <WallSwitch isOn={isOn} onToggle={toggle} />

      <AnimatePresence mode="wait">
        {isOn ? (
          <motion.div
            key="on"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="w-full"
            style={{ borderRadius: 16, boxShadow: "0 0 50px rgba(184,255,23,0.10),0 0 0 1px rgba(184,255,23,0.12)" }}
          >
            <AuthForm mode={mode} />
          </motion.div>
        ) : (
          <motion.p
            key="off"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-sm text-white/30 text-center py-2"
          >
            {mode === "login" ? "Activa el interruptor para entrar." : "Activa el interruptor para registrarte."}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
