"use client";

import { useState } from "react";
import { Sparkles, Flame, Crown, ShieldHalf, Infinity, Star } from "lucide-react";
import { getLocalSession } from "@/lib/session";

const SUBSCRIPTION_PLANS = [
  {
    id: "pro_monthly",
    name: "ZODI Pro",
    price: "4,99€/mes",
    badge: null,
    perks: ["Lecturas ilimitadas", "Todos los tonos (brutal, sarcástico)", "Respuestas extensas", "7 días de prueba gratis"],
    cta: "Probar 7 días gratis",
    accent: "border-lime-300/40 bg-lime-300/05",
    ctaClass: "bg-lime-300 text-black hover:bg-lime-200 shadow-[0_0_15px_rgba(184,255,23,0.3)]",
  },
  {
    id: "pro_annual",
    name: "ZODI Pro Anual",
    price: "39,99€/año",
    badge: "Ahorra 33%",
    perks: ["Todo lo de Pro Mensual", "Ahorro de 20€ al año", "Soporte prioritario", "Acceso anticipado a nuevas secciones"],
    cta: "Suscribirse anual",
    accent: "border-violet-400/40 bg-violet-500/05",
    ctaClass: "bg-violet-500 text-white hover:bg-violet-400",
  },
];

export function PremiumUI() {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const session = getLocalSession();

  const handleSubscribe = async (planId: string) => {
    if (!session.uid || !session.email) {
      alert("Debes iniciar sesión para suscribirte.");
      return;
    }
    setLoadingId(planId);
    try {
      const { getFirebaseToken } = await import("@/lib/firebase/client");
      const token = await getFirebaseToken();
      const res = await fetch("/api/checkout/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ uid: session.uid, email: session.email, planId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Error al iniciar la suscripción: " + (data.error ?? "Desconocido"));
      }
    } catch {
      alert("Error de conexión.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleBuyGems = async (packId: string) => {
    if (!session.uid || !session.email) {
      alert("Debes iniciar sesión para comprar gemas.");
      return;
    }

    setLoadingId(packId);
    try {
      const { getFirebaseToken } = await import('@/lib/firebase/client');
      const token = await getFirebaseToken();
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ uid: session.uid, email: session.email, packId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Error al iniciar el pago: " + (data.error || "Desconocido"));
      }
    } catch (e) {
      console.error(e);
      alert("Error de conexión al iniciar el pago.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="grid gap-5">

      {/* ── PLANES DE SUSCRIPCIÓN ────────────────────────────────────────────── */}
      <div className="glass-panel rounded-2xl p-6 border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-05 pointer-events-none">
          <Star className="w-40 h-40 text-violet-300" />
        </div>
        <h2 className="text-2xl font-black mb-1 flex items-center gap-2 relative z-10">
          <Crown className="h-6 w-6 text-lime-300" />
          Planes Pro
        </h2>
        <p className="text-white/60 mb-6 text-sm relative z-10">
          Sin restricciones, sin límites diarios. 7 días de prueba gratis sin compromiso.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 relative z-10">
          {SUBSCRIPTION_PLANS.map(plan => (
            <div key={plan.id} className={`rounded-xl border p-5 flex flex-col ${plan.accent}`}>
              {plan.badge && (
                <span className="mb-3 self-start rounded-full border border-violet-400/40 bg-violet-500/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-violet-200">
                  {plan.badge}
                </span>
              )}
              <h3 className="font-black text-lg text-white">{plan.name}</h3>
              <p className="text-2xl font-black text-white mt-1 mb-3">{plan.price}</p>
              <ul className="space-y-1.5 mb-5 flex-1">
                {plan.perks.map(perk => (
                  <li key={perk} className="flex items-start gap-2 text-sm text-white/70">
                    <span className="mt-0.5 text-lime-300 shrink-0">✓</span>
                    {perk}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={loadingId !== null}
                className={`w-full rounded-xl py-3 font-black transition disabled:opacity-50 ${plan.ctaClass}`}
              >
                {loadingId === plan.id ? "Redirigiendo..." : plan.cta}
              </button>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-white/35 mt-5 flex items-center justify-center gap-2">
          <ShieldHalf className="w-3 h-3" /> Pagos seguros con Stripe · Cancela cuando quieras
        </p>
      </div>

      {/* ── TIENDA DE GEMAS ──────────────────────────────────────────────────── */}
      <div className="glass-panel rounded-md p-6 border border-lime-300/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Crown className="w-32 h-32 text-lime-300" />
        </div>
        <h2 className="text-2xl font-black mb-2 flex items-center gap-2 relative z-10">
          <Sparkles className="h-6 w-6 text-lime-300" />
          Tienda de Gemas
        </h2>
        <p className="text-white/70 mb-6 relative z-10">
          Las Gemas de ZODI te permiten hacerle preguntas directas al Oráculo conversacional, tirar el tarot cuantas veces quieras y recibir consejos astrológicos profundos de emergencia.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 relative z-10">
          {/* Pack Crisis */}
          <div className="rounded-xl border border-white/15 bg-black/40 p-5 flex flex-col items-center text-center transition hover:border-lime-300/40">
            <div className="h-12 w-12 rounded-full bg-lime-300/10 flex items-center justify-center mb-3">
              <Flame className="h-6 w-6 text-lime-300" />
            </div>
            <h3 className="font-black text-lg text-white">Pack Crisis</h3>
            <p className="text-lime-300 font-bold text-xl my-2">50 Gemas</p>
            <p className="text-sm text-white/50 mb-5 flex-grow">Para emergencias, decisiones de último minuto y bloqueos energéticos.</p>
            <button
              onClick={() => handleBuyGems("crisis")}
              disabled={loadingId !== null}
              className="w-full rounded-md bg-white/10 hover:bg-white/20 py-3 font-black text-white transition disabled:opacity-50"
            >
              {loadingId === "crisis" ? "Cargando..." : "Comprar por 1.99€"}
            </button>
          </div>

          {/* Pack Místico */}
          <div className="rounded-xl border-2 border-lime-300/50 bg-lime-300/5 p-5 flex flex-col items-center text-center transition hover:border-lime-300 relative shadow-[0_0_30px_rgba(184,255,23,0.1)]">
            <div className="absolute -top-3 bg-lime-300 text-black px-3 py-1 text-xs font-black rounded-full uppercase tracking-widest">
              Mejor valor
            </div>
            <div className="h-12 w-12 rounded-full bg-lime-300/20 flex items-center justify-center mb-3">
              <Crown className="h-6 w-6 text-lime-300" />
            </div>
            <h3 className="font-black text-lg text-white">Pack Místico</h3>
            <p className="text-lime-300 font-bold text-xl my-2">200 Gemas</p>
            <p className="text-sm text-white/50 mb-5 flex-grow">Preguntas ilimitadas al oráculo, ideal para los que sobrepiensan absolutamente todo.</p>
            <button
              onClick={() => handleBuyGems("mistico")}
              disabled={loadingId !== null}
              className="w-full rounded-md bg-lime-300 hover:bg-lime-200 py-3 font-black text-black transition shadow-[0_0_15px_rgba(184,255,23,0.3)] disabled:opacity-50"
            >
              {loadingId === "mistico" ? "Cargando..." : "Comprar por 4.99€"}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-white/40 mt-6 flex items-center justify-center gap-2">
          Pagos seguros cifrados con Stripe <ShieldHalf className="w-3 h-3" /> Soporta Bizum, Apple Pay y Tarjetas
        </p>
      </div>

      {/* Free Gems Section */}
      <div className="glass-panel rounded-md p-6 border border-white/10 mt-5 relative overflow-hidden">
        <h2 className="text-xl font-black mb-2 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-white" />
          Gemas Gratis
        </h2>
        <p className="text-white/60 mb-4 text-sm">
          ¿No tienes dinero? ZODI entiende tu pobreza. Gana gemas gratis realizando misiones místicas.
        </p>
        
        <div className="grid gap-3">
          <button 
            onClick={() => {
              if (localStorage.getItem('zodi.ig_rewarded')) {
                alert('Ya recibiste tu recompensa por seguir a ZODI.');
                return;
              }
              window.open('https://instagram.com/zodi.elcrack', '_blank');
              setTimeout(async () => {
                const { addGems } = await import('@/lib/gamification');
                addGems(20);
                localStorage.setItem('zodi.ig_rewarded', 'true');
                alert('¡Has recibido 20 Gemas por seguir a ZODI en Instagram!');
                window.location.reload();
              }, 5000);
            }}
            className="flex items-center justify-between rounded-md bg-black/40 border border-white/10 p-4 hover:border-lime-300/40 transition"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </div>
              <div className="text-left">
                <h4 className="font-bold text-white text-sm">Seguir a @zodi.elcrack</h4>
                <p className="text-xs text-white/50">Síguenos en Instagram</p>
              </div>
            </div>
            <div className="bg-lime-300/10 text-lime-300 px-3 py-1 rounded-full text-xs font-black">
              +20 Gemas
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
