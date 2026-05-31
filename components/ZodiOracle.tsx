"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Send, WandSparkles } from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { getLocalSession } from "@/lib/session";
import { getGems, spendGems } from "@/lib/gamification";
import { getFirebaseToken } from "@/lib/firebase/client";

type Message = { role: "user" | "zodi"; text: string };

export function ZodiOracle() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "zodi", text: "Soy ZODI. Habla ahora o guarda silencio para siempre. ¿Qué quieres saber?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Solo en dashboard, NUNCA en landing ni en la página del oráculo
  // (que ya es el oráculo dedicado — tener dos sería redundante)
  const isDashboard = pathname?.startsWith("/dashboard");
  const isOraclePage = pathname === "/dashboard/oraculo";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener("open-oracle", handleOpen);
    return () => window.removeEventListener("open-oracle", handleOpen);
  }, []);

  if (!isDashboard || isOraclePage) return null;

  const handleSend = async () => {
    if (!input.trim()) return;

    const session = getLocalSession();
    if (!session.isAuthenticated) {
      alert("Debes iniciar sesión para consultar al oráculo.");
      return;
    }

    // Check Daily Energy or Gems
    const today = new Date().toISOString().split('T')[0];
    const lastDaily = localStorage.getItem('zodi.daily_oracle_used');
    const hasDaily = lastDaily !== today;

    if (!hasDaily) {
      const currentGems = getGems().total;
      if (currentGems < 5) {
        alert("Te has quedado sin energía libre y no tienes suficientes gemas (Cuesta 5). Ve a la tienda a comprar más Gemas.");
        return;
      }
    }

    const userMsg = input.trim();
    setInput("");
    const newMessages = [...messages, { role: "user" as const, text: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const token = await getFirebaseToken();
      // Slice history to the last 4 messages to save tokens
      const historyToKeep = newMessages.slice(-4);
      
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          messages: historyToKeep,
          userProfile: {
            sunSign:       session.astralProfile?.sunSign,
            moonSign:      session.astralProfile?.moonSign,
            ascendant:     session.astralProfile?.ascendant,
            displayName:   session.displayName,
            birthDate:     session.onboardingData?.birthDate,
            birthCity:     session.onboardingData?.birthCity,
            birthCountry:  session.onboardingData?.birthCountry,
            currentCity:   session.onboardingData?.currentCity,
            currentCountry: session.onboardingData?.currentCountry,
          }
        })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo consultar al oráculo.");
      }
      if (hasDaily) {
        localStorage.setItem('zodi.daily_oracle_used', today);
      } else {
        spendGems(5);
      }
      setMessages(prev => [...prev, { role: "zodi", text: data.text }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "zodi", text: "Error de red cósmico. Se me ha caído la bola de cristal." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Botón Flotante: Oráculo — diseño limpio, un solo anillo */}
      <motion.button
        whileHover={{ scale: 1.08, transition: { duration: 0.15 } }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 z-50 hidden md:flex h-14 w-14 items-center justify-center rounded-2xl border border-lime-300/30 bg-[rgb(8,8,14)] shadow-[0_4px_20px_rgba(0,0,0,0.7)] transition-colors hover:border-lime-300/60 hover:bg-[rgb(10,10,18)]"
        aria-label="Abrir oráculo"
      >
        <WandSparkles className="h-6 w-6 text-lime-300" />
      </motion.button>

      {/* Modal de Chat */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto flex h-[80vh] max-w-md flex-col overflow-hidden rounded-t-3xl border border-lime-300/20 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] sm:bottom-24 sm:h-[600px] sm:rounded-3xl"
            style={{ background: "rgb(4, 4, 10)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-lime-300/10 bg-black p-4">
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 overflow-hidden rounded-full border border-lime-300/30">
                  <Image src="/zodi-art/brand/isotipo.png" alt="ZODI" fill className="object-contain p-1" />
                </div>
                <div>
                  <h3 className="font-display font-black text-lime-300 text-xl tracking-wide">ZODI Oráculo</h3>
                  <p className="text-xs text-white/50 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> En línea
                  </p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-full bg-white/5 p-2 text-white/50 hover:bg-white/10 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-lg font-display font-bold tracking-wide ${
                    msg.role === "user" 
                      ? "bg-lime-300 text-black rounded-br-none" 
                      : "bg-white/10 text-white rounded-bl-none border border-white/5"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white/10 text-white/50 rounded-2xl rounded-bl-none border border-white/5 px-4 py-3 text-base flex gap-1">
                    <span className="animate-bounce">.</span><span className="animate-bounce delay-75">.</span><span className="animate-bounce delay-150">.</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-lime-300/10 p-4">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Pregúntale al oráculo..."
                  className="w-full rounded-full border border-white/10 bg-white/5 pl-4 pr-12 py-3 text-base font-bold text-white outline-none focus:border-lime-300/40"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className="absolute right-1 flex h-10 w-10 items-center justify-center rounded-full bg-lime-300 text-black transition hover:bg-lime-200 disabled:opacity-50"
                >
                  <Send className="h-4 w-4 ml-1" />
                </button>
              </div>
              <p className="mt-2 text-center text-[10px] text-white/30">ZODI puede equivocarse, pero tú también.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
