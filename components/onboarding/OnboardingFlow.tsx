"use client";

import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle, Check, CheckCircle2, ChevronDown, ImagePlus, Loader2,
  MapPin, Sparkles, Gem, Flame, UserCircle, X, XCircle
} from "lucide-react";
import { generateAstralProfile } from "@/lib/astral";
import { completeLocalOnboarding, getLocalSession, signOutZodi } from "@/lib/session";
import { COUNTRY_LIST, getCitiesForCountry } from "@/lib/places";
import type { OnboardingData } from "@/types/zodi";

const topics = ["amor", "dinero", "trabajo", "espiritualidad", "futuro", "energía"] as const;
const tones  = ["suave", "directo", "brutal", "sarcastico"] as const;

const TOTAL_STEPS = 3;

// ── Mapa de signos: imagen + gradiente de fondo ───────────────────────────────
const SIGN_META: Record<string, { img: string; gradient: string; element: string; emoji: string }> = {
  "Aries":       { img: "/zodi-art/signos/aries.png",       gradient: "from-red-600/60 via-orange-500/40 to-transparent",      element: "Fuego 🔥", emoji: "♈" },
  "Tauro":       { img: "/zodi-art/signos/tauro.png",       gradient: "from-emerald-700/60 via-green-600/40 to-transparent",   element: "Tierra 🌿", emoji: "♉" },
  "Géminis":     { img: "/zodi-art/signos/geminis.png",     gradient: "from-yellow-500/60 via-amber-400/40 to-transparent",    element: "Aire 💨", emoji: "♊" },
  "Cáncer":      { img: "/zodi-art/signos/cancer.png",      gradient: "from-slate-500/60 via-blue-400/40 to-transparent",      element: "Agua 🌊", emoji: "♋" },
  "Leo":         { img: "/zodi-art/signos/leo.png",         gradient: "from-amber-500/60 via-yellow-400/40 to-transparent",    element: "Fuego 🔥", emoji: "♌" },
  "Virgo":       { img: "/zodi-art/signos/virgo.png",       gradient: "from-green-700/60 via-lime-600/40 to-transparent",      element: "Tierra 🌿", emoji: "♍" },
  "Libra":       { img: "/zodi-art/signos/libra.png",       gradient: "from-pink-500/60 via-rose-400/40 to-transparent",       element: "Aire 💨", emoji: "♎" },
  "Escorpio":    { img: "/zodi-art/signos/escorpio.png",    gradient: "from-red-900/60 via-purple-700/40 to-transparent",      element: "Agua 🌊", emoji: "♏" },
  "Sagitario":   { img: "/zodi-art/signos/sagitario.png",   gradient: "from-purple-600/60 via-violet-500/40 to-transparent",   element: "Fuego 🔥", emoji: "♐" },
  "Capricornio": { img: "/zodi-art/signos/capricornio.png", gradient: "from-stone-700/60 via-zinc-600/40 to-transparent",      element: "Tierra 🌿", emoji: "♑" },
  "Acuario":     { img: "/zodi-art/signos/acuario.png",     gradient: "from-cyan-600/60 via-sky-500/40 to-transparent",        element: "Aire 💨", emoji: "♒" },
  "Piscis":      { img: "/zodi-art/signos/piscis.png",      gradient: "from-teal-600/60 via-purple-500/40 to-transparent",     element: "Agua 🌊", emoji: "♓" },
};

const CALC_PHRASES = [
  "Consultando las constelaciones...",
  "Tu mapa astral emergiendo del cosmos.",
  "Los planetas procesando. Mercurio también lo intenta.",
  "Calculando lo que las estrellas saben de ti.",
  "Tu carta astral tiene capas. ZODI las está leyendo.",
];

const initialData: OnboardingData = {
  displayName: "", username: "", avatar: "/zodi-art/perfil/perfil-1.png",
  genderIdentity: "", birthDate: "", birthTime: "", birthCity: "", birthCountry: "",
  currentCity: "", currentCountry: "",
  readingTone: "sarcastico",
  favoriteTopics: ["amor", "futuro"],
  notificationPreferences: ["horoscopo diario", "alertas lunares"]
};

function validateStep(step: number, data: OnboardingData, usernameStatus: string): string | null {
  if (step === 0) {
    if (!data.displayName.trim()) return "ZODI necesita un nombre para llamarte. No 'Usuario' ni 'Yo'. Un nombre.";
    if (usernameStatus === "taken") return "Ese alias ya existe. ZODI no repite usuarios, solo errores del universo.";
    if (usernameStatus === "checking") return "El oráculo está verificando ese usuario. Paciencia, Mercurio retrogradó.";
  }
  if (step === 1) {
    if (!data.birthDate) return "Sin fecha de nacimiento, ZODI te lee como 'error cósmico'. Dame la fecha.";
    if (!data.birthCountry.trim()) return "¿País de nacimiento? El planeta también cuenta, no solo el horóscopo.";
    if (!data.birthCity.trim()) return "La ciudad de nacimiento importa. Las estrellas son geográficas, no vagas.";
  }
  return null;
}

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 56 : -56, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -56 : 56, opacity: 0 })
};

// ── Componente principal ───────────────────────────────────────────────────────
export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep]         = useState(0);
  const [direction, setDir]     = useState(1);
  const [data, setData]         = useState<OnboardingData>(initialData);
  const [finishing, setFinishing] = useState(false);
  const [calculating, setCalc]  = useState(false);
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [error, setError]       = useState<string | null>(null);
  const [usernameStatus, setUsernameStatus] = useState<"idle"|"checking"|"available"|"taken">("idle");
  const profile = useMemo(() => generateAstralProfile(data), [data]);

  // Verificación de username en Firestore
  const checkUsername = useCallback(async (username: string) => {
    const clean = username.replace(/^@/, "").trim().toLowerCase();
    if (clean.length < 3) { setUsernameStatus("idle"); return; }
    setUsernameStatus("checking");
    try {
      const { getFirebaseDb } = await import("@/lib/firebase/client");
      const { collection, query, where, getDocs } = await import("firebase/firestore");
      const db = getFirebaseDb();
      if (!db) { setUsernameStatus("idle"); return; }
      const q = query(collection(db, "users"), where("username", "==", clean));
      const snap = await getDocs(q);
      setUsernameStatus(snap.empty ? "available" : "taken");
    } catch { setUsernameStatus("idle"); }
  }, []);

  useEffect(() => {
    if (!data.username) { setUsernameStatus("idle"); return; }
    const t = setTimeout(() => checkUsername(data.username), 600);
    return () => clearTimeout(t);
  }, [data.username, checkUsername]);

  function update<K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) {
    setData(d => ({ ...d, [key]: value }));
    setError(null);
  }

  function toggleTopic(value: string) {
    setData(d => ({
      ...d,
      favoriteTopics: d.favoriteTopics.includes(value)
        ? d.favoriteTopics.filter(t => t !== value)
        : [...d.favoriteTopics, value]
    }));
  }

  function goNext() {
    const err = validateStep(step, data, usernameStatus);
    if (err) { setError(err); return; }
    setError(null);

    // Cálculo astral entre paso 1 → 2
    if (step === 1) {
      setCalc(true);
      let i = 0;
      const interval = setInterval(() => {
        i++;
        setPhraseIdx(p => (p + 1) % CALC_PHRASES.length);
        if (i >= 4) {
          clearInterval(interval);
          setCalc(false);
          setDir(1);
          setStep(2);
        }
      }, 750);
      return;
    }

    setDir(1);
    setStep(s => Math.min(TOTAL_STEPS - 1, s + 1));
  }

  function goBack() {
    setError(null);
    setDir(-1);
    setStep(s => Math.max(0, s - 1));
  }

  async function finish() {
    setFinishing(true);
    try {
      completeLocalOnboarding(data, profile);

      const session = getLocalSession();
      // Guardar en Firestore en background (no bloquea la navegación)
      if (session.uid) {
        import("@/lib/firebase/profile").then(({ saveOnboardingProfile }) =>
          saveOnboardingProfile(session.uid!, data, profile)
        ).catch(() => {});
      }

      // Gemas de bienvenida
      try {
        const { getGems, addGems } = await import("@/lib/gamification");
        if (getGems().total < 300) addGems(300 - getGems().total);
      } catch { /* ignorar */ }

    } catch (e) {
      console.warn("Error en finish:", e);
    }

    // Siempre navegar al dashboard, sin importar qué falló
    router.push("/dashboard");
  }

  function uploadAvatar(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") update("avatar", reader.result);
    };
    reader.readAsDataURL(file);
  }

  // ── Pantalla de cálculo astral ────────────────────────────────────────────────
  if (calculating) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-ink px-4">
        <div className="spark-field -z-10" />
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-6 rounded-full border border-dashed border-lime-300/20"
          />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="h-32 w-32 overflow-hidden rounded-full border-2 border-lime-300/50 shadow-[0_0_40px_rgba(184,255,23,0.4)]"
          >
            <Image src="/zodi-art/brand/isotipo.png" alt="ZODI calculando" width={128} height={128} className="h-full w-full object-contain p-2 mix-blend-screen" />
          </motion.div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-3 w-3 rounded-full bg-lime-300 shadow-[0_0_12px_rgba(184,255,23,1)]" />
          </div>
        </div>
        <div className="flex gap-2">
          {[0,1,2].map(i => (
            <motion.span key={i} animate={{ opacity: [0.2,1,0.2] }} transition={{ duration: 1.2, repeat: Infinity, delay: i*0.22 }}
              className="h-2 w-2 rounded-full bg-lime-300" />
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.p key={phraseIdx}
            initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
            transition={{ duration:0.3 }}
            className="max-w-sm text-center text-base font-medium leading-relaxed text-white/65"
          >
            {CALC_PHRASES[phraseIdx]}
          </motion.p>
        </AnimatePresence>
        <p className="text-[11px] uppercase tracking-widest text-lime-300/50">Leyendo tu carta astral</p>
      </div>
    );
  }

  const signMeta = SIGN_META[profile.sunSign] ?? SIGN_META["Acuario"];

  return (
    <section className="relative mx-auto flex min-h-dvh max-w-2xl flex-col px-4 py-6">
      {/* Fondo */}
      <div className="absolute inset-0 -z-10 bg-[url('/zodi-art/oracle-frame-tall.png')] bg-cover bg-center opacity-10" />
      <div className="spark-field -z-10" />

      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="relative h-12 w-36">
          <Image src="/zodi-logo.png" alt="ZODI" fill sizes="144px" className="object-contain object-left mix-blend-screen" />
        </div>
        <div className="flex items-center gap-3">
          {/* Barra de progreso */}
          <div className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5">
            {[...Array(TOTAL_STEPS)].map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all duration-500 ${
                i < step ? "w-4 bg-lime-300" : i === step ? "w-6 bg-lime-300" : "w-1.5 bg-white/20"
              }`} />
            ))}
          </div>
          <button onClick={async () => { await signOutZodi(); router.push("/"); }}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-black/40 text-white/50 transition hover:bg-white/10 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Card principal */}
      <div className="glass-panel flex-1 overflow-hidden rounded-2xl border border-white/08">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div key={step} custom={direction}
            variants={slideVariants} initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="h-full"
          >

            {/* ─── PASO 0: Identidad + Preferencias ──────────────────────────── */}
            {step === 0 && (
              <div className="p-6 sm:p-8 overflow-y-auto max-h-[75dvh] no-scrollbar">
                <p className="zodi-kicker">Paso 1 de {TOTAL_STEPS}</p>
                <h1 className="mt-2 text-3xl font-black leading-tight">
                  ¿Quién eres<br />en este universo?
                </h1>
                <p className="mt-2 text-sm text-white/50">Tu identidad y cómo quieres que ZODI te hable.</p>

                <div className="mt-5 grid gap-3">
                  <Input label="Nombre visible *" value={data.displayName} onChange={v => update("displayName",v)} placeholder="Tu nombre o alias astral..." />

                  {/* Username con check */}
                  <div>
                    <label className="block cursor-text rounded-xl border border-white/08 bg-black/35 p-3.5 transition focus-within:border-lime-300/40">
                      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-white/40">Usuario (@)</span>
                      <div className="flex items-center gap-2">
                        <input className="flex-1 bg-transparent text-white outline-none placeholder:text-white/25"
                          value={data.username} placeholder="@zodiserpiente"
                          onChange={e => update("username", e.target.value)} autoComplete="off" />
                        {usernameStatus === "checking"  && <Loader2 className="h-4 w-4 animate-spin text-white/40 shrink-0" />}
                        {usernameStatus === "available" && <CheckCircle2 className="h-4 w-4 text-lime-300 shrink-0" />}
                        {usernameStatus === "taken"     && <XCircle className="h-4 w-4 text-red-400 shrink-0" />}
                      </div>
                    </label>
                    {usernameStatus === "available" && (
                      <p className="mt-1.5 text-[11px] text-lime-300/80">✦ Nadie más tiene ese alias. El universo es tuyo.</p>
                    )}
                    {usernameStatus === "taken" && (
                      <div className="mt-2 rounded-xl border border-orange-400/25 bg-orange-400/08 p-3">
                        <p className="text-sm font-bold text-orange-200">Ese alias ya lo reclamó alguien. 👻</p>
                        <p className="mt-0.5 text-xs text-white/55">El cosmos no te esperó, cariño. Prueba con otro: añade un número, una inicial, lo que sea. Sé creativo.</p>
                      </div>
                    )}
                  </div>

                  {/* Foto opcional */}
                  <label className="group flex cursor-pointer items-center gap-4 rounded-xl border border-dashed border-white/15 bg-white/03 p-4 transition hover:border-lime-300/40">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-black/40">
                      {data.avatar.startsWith("data:") ? (
                        <img src={data.avatar} alt="Avatar" className="h-full w-full object-cover" />
                      ) : (
                        <UserCircle className="h-full w-full p-2 text-white/30" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white/70 group-hover:text-lime-200 transition">
                        {data.avatar.startsWith("data:") ? "Cambiar foto" : "Subir foto"} <span className="text-white/35 font-normal text-xs">(opcional)</span>
                      </p>
                      <p className="text-[11px] text-white/35">Si no subes, usamos un avatar ZODI por defecto</p>
                    </div>
                    <ImagePlus className="ml-auto h-5 w-5 text-white/30 group-hover:text-lime-300 transition shrink-0" />
                    <input className="hidden" type="file" accept="image/*" onChange={e => uploadAvatar(e.target.files?.[0])} />
                  </label>
                </div>

                {/* Tono */}
                <div className="mt-5">
                  <p className="mb-2 text-sm font-bold text-white/70">¿Cómo quieres que ZODI te hable?</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {tones.map(tone => (
                      <button key={tone} onClick={() => update("readingTone", tone)}
                        className={`rounded-xl py-3 text-sm font-bold capitalize transition ${
                          data.readingTone === tone
                            ? "bg-lime-300 text-black shadow-[0_0_16px_rgba(184,255,23,0.3)]"
                            : "border border-white/12 text-white/60 hover:border-lime-300/30 hover:text-white"
                        }`}>
                        {tone}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Temas */}
                <div className="mt-4">
                  <p className="mb-2 text-sm font-bold text-white/70">Temas que más te importan</p>
                  <div className="flex flex-wrap gap-2">
                    {topics.map(topic => (
                      <button key={topic} onClick={() => toggleTopic(topic)}
                        className={`rounded-full px-4 py-2 text-sm font-bold capitalize transition ${
                          data.favoriteTopics.includes(topic)
                            ? "bg-violet-500/80 text-white shadow-[0_0_12px_rgba(155,77,255,0.3)]"
                            : "border border-white/12 text-white/60 hover:border-violet-400/40"
                        }`}>
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ─── PASO 1: Nacimiento ─────────────────────────────────────────── */}
            {step === 1 && (
              <div className="p-6 sm:p-8 overflow-y-auto max-h-[75dvh] no-scrollbar">
                <p className="zodi-kicker">Paso 2 de {TOTAL_STEPS}</p>
                <h1 className="mt-2 text-3xl font-black leading-tight">
                  ¿Cuándo y dónde<br />llegaste a este mundo?
                </h1>
                <p className="mt-2 text-sm text-white/50">Con esto calculo tu signo solar, lunar, ascendente y carta natal.</p>

                <div className="mt-5 grid gap-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input label="Fecha de nacimiento *" value={data.birthDate} onChange={v => update("birthDate",v)} type="date" />
                    <div>
                      <Input label="Hora (mejora el ascendente)" value={data.birthTime} onChange={v => update("birthTime",v)} type="time" />
                      <p className="mt-1 text-[11px] text-white/35">Sin hora, calculo igual pero el ascendente será aproximado.</p>
                    </div>
                  </div>
                  <PlacePicker
                    countryLabel="País de nacimiento *" countryValue={data.birthCountry}
                    onCountryChange={v => { update("birthCountry",v); update("birthCity",""); }}
                    cityLabel="Ciudad de nacimiento *" cityValue={data.birthCity}
                    onCityChange={v => update("birthCity",v)}
                  />
                  <PlacePicker
                    countryLabel="País actual (opcional)" countryValue={data.currentCountry}
                    onCountryChange={v => { update("currentCountry",v); update("currentCity",""); }}
                    cityLabel="Ciudad actual (opcional)" cityValue={data.currentCity}
                    onCityChange={v => update("currentCity",v)}
                  />
                </div>
              </div>
            )}

            {/* ─── PASO 2: Reveal astral ──────────────────────────────────────── */}
            {step === 2 && (
              <div className="relative flex h-full min-h-[520px] flex-col overflow-hidden rounded-2xl">
                {/* Imagen de fondo del signo */}
                <div className="absolute inset-0">
                  <Image src={signMeta.img} alt={profile.sunSign} fill
                    sizes="100vw" className="object-cover object-top opacity-45" priority />
                  <div className={`absolute inset-0 bg-gradient-to-t ${signMeta.gradient} via-black/60 to-black/90`} />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90" />
                </div>

                {/* Contenido */}
                <div className="relative z-10 flex flex-1 flex-col justify-between p-6 sm:p-8">
                  {/* Sign reveal */}
                  <motion.div initial={{ opacity:0, scale:0.85 }} animate={{ opacity:1, scale:1 }} transition={{ duration:0.7, ease:[0.22,1,0.36,1] }}>
                    <p className="zodi-kicker">Paso 3 de {TOTAL_STEPS} · Tu firma astral</p>
                    <div className="mt-3 flex items-center gap-3">
                      <span className="text-5xl sm:text-6xl">{signMeta.emoji}</span>
                      <div>
                        <h1 className="text-5xl font-black leading-none sm:text-7xl glitch" style={{ fontFamily:"var(--font-display)" }}>
                          {profile.sunSign}
                        </h1>
                        <p className="mt-1 text-sm text-white/60">{signMeta.element} · Camino {profile.lifePathNumber}</p>
                      </div>
                    </div>

                    {/* Mini stats */}
                    <div className="mt-5 grid grid-cols-3 gap-2">
                      {[
                        ["🌙 Luna", profile.moonSign],
                        ["⬆️ Ascendente", profile.ascendant],
                        ["🐉 Chino", profile.chineseZodiac],
                      ].map(([label, value]) => (
                        <motion.div key={label as string}
                          initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3, duration:0.4 }}
                          className="rounded-xl border border-white/10 bg-black/50 p-3 backdrop-blur-sm text-center"
                        >
                          <p className="text-[10px] text-white/45">{label}</p>
                          <p className="mt-0.5 text-sm font-black text-lime-100">{value}</p>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Resumen + confirm */}
                  <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.5, duration:0.5 }}>
                    <div className="rounded-xl border border-violet-400/20 bg-black/60 p-4 backdrop-blur-sm">
                      <p className="text-xs font-bold text-violet-300">✦ Tu resumen ZODI</p>
                      <p className="mt-1.5 text-sm leading-6 text-white/75">{profile.summary}</p>
                    </div>

                    {/* Identity confirm */}
                    <div className="mt-3 flex items-center gap-3 rounded-xl border border-lime-300/20 bg-black/60 p-3 backdrop-blur-sm">
                      <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-lime-300/30 shrink-0">
                        {data.avatar.startsWith("data:") ? (
                          <img src={data.avatar} alt="Avatar" className="h-full w-full object-cover" />
                        ) : (
                          <Image src={data.avatar} alt="Avatar" fill className="object-cover" />
                        )}
                      </div>
                      <div>
                        <p className="font-black text-lime-100">{data.displayName}</p>
                        {data.username && <p className="text-xs text-lime-200/50">@{data.username}</p>}
                      </div>
                      <div className="ml-auto flex items-center gap-1.5 rounded-full border border-lime-300/20 bg-lime-300/10 px-2.5 py-1">
                        <Gem className="h-3 w-3 text-lime-300" />
                        <span className="text-xs font-black text-lime-200">+300 gemas</span>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div key="error"
            initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            className="mt-3 flex items-center gap-2 rounded-xl border border-orange-400/25 bg-orange-400/10 px-4 py-3 text-sm text-orange-200"
          >
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navegación */}
      <div className="mt-4 flex items-center justify-between gap-3" style={{ paddingBottom: "env(safe-area-inset-bottom, 8px)" }}>
        <button disabled={step === 0} onClick={goBack}
          className="rounded-xl border border-white/12 px-5 py-3.5 font-bold text-white/60 transition hover:border-white/25 disabled:opacity-30">
          Atrás
        </button>

        {step < TOTAL_STEPS - 1 ? (
          <button onClick={goNext}
            className="flex items-center gap-2 rounded-xl bg-lime-300 px-7 py-3.5 font-black text-black transition hover:bg-lime-200 active:scale-95">
            Continuar <span className="text-xs opacity-60">{step+1}/{TOTAL_STEPS}</span>
          </button>
        ) : (
          <button onClick={finish} disabled={finishing}
            className="flex items-center gap-2 rounded-xl bg-lime-300 px-7 py-3.5 font-black text-black transition hover:bg-lime-200 active:scale-95 disabled:opacity-60">
            {finishing ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Abriendo portal...</>
            ) : (
              <><Sparkles className="h-4 w-4" /> Entrar a ZODI</>
            )}
          </button>
        )}
      </div>
    </section>
  );
}

// ── Subcomponentes ─────────────────────────────────────────────────────────────

function Input({ label, value, onChange, type = "text", placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <label className="block cursor-text rounded-xl border border-white/08 bg-black/35 p-3.5 transition focus-within:border-lime-300/40">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-white/40">{label}</span>
      <input className="w-full bg-transparent text-white outline-none placeholder:text-white/25"
        type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} />
    </label>
  );
}

function SearchSelect({ label, value, onChange, options, placeholder, icon: Icon }: {
  label: string; value: string; onChange: (v: string) => void;
  options: string[]; placeholder?: string; icon?: React.ElementType;
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen]   = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value); }, [value]);
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = query.length === 0 ? options : options.filter(o => o.toLowerCase().includes(query.toLowerCase()));

  function select(opt: string) { onChange(opt); setQuery(opt); setOpen(false); }

  return (
    <div ref={ref} className="relative">
      <div className={`flex cursor-text flex-col rounded-xl border bg-black/35 p-3.5 transition ${open ? "border-lime-300/50" : "border-white/08 hover:border-white/20"}`}
        onClick={() => setOpen(true)}>
        <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/40">
          {Icon && <Icon className="h-3 w-3" />} {label}
        </span>
        <div className="flex items-center gap-2">
          <input className="flex-1 bg-transparent text-white outline-none placeholder:text-white/25"
            value={query} placeholder={placeholder ?? "Buscar..."} autoComplete="off"
            onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onKeyDown={e => {
              if (e.key === "Escape") setOpen(false);
              if (e.key === "Enter" && filtered.length === 1) { select(filtered[0]); e.preventDefault(); }
            }}
          />
          <ChevronDown className={`h-4 w-4 shrink-0 text-white/30 transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.ul initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-4 }}
            transition={{ duration:0.15 }}
            className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-[#0e0e14] shadow-2xl no-scrollbar">
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm text-white/40">No encontrado — escríbelo libremente</li>
            ) : filtered.map(opt => (
              <li key={opt}>
                <button type="button" onClick={() => select(opt)}
                  className={`w-full px-4 py-2.5 text-left text-sm transition hover:bg-lime-300/10 hover:text-lime-200 ${opt === value ? "bg-lime-300/08 text-lime-300" : "text-white/80"}`}>
                  {opt === value && <Check className="mr-2 inline h-3 w-3 text-lime-300" />}{opt}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

function PlacePicker({ countryLabel, countryValue, onCountryChange, cityLabel, cityValue, onCityChange }: {
  countryLabel: string; countryValue: string; onCountryChange: (v: string) => void;
  cityLabel: string;    cityValue: string;    onCityChange: (v: string) => void;
}) {
  const cities = getCitiesForCountry(countryValue);
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <SearchSelect label={countryLabel} value={countryValue} onChange={onCountryChange} options={COUNTRY_LIST} placeholder="Buscar país..." />
      <SearchSelect label={cityLabel} value={cityValue} onChange={onCityChange} options={cities}
        placeholder={countryValue ? "Buscar ciudad..." : "Selecciona el país primero"} icon={MapPin} />
    </div>
  );
}
