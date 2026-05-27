"use client";

import { useMemo, useState } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { AtSign, Calendar, Chrome, Lock, UserRound } from "lucide-react";
import { getFirebaseAuth, googleProvider, isFirebaseConfigured } from "@/lib/firebase/client";

const zodiacs = ["Aries", "Tauro", "Géminis", "Cáncer", "Leo", "Virgo", "Libra", "Escorpio", "Sagitario", "Capricornio", "Acuario", "Piscis"];

export function AuthOnboarding() {
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [zodiac, setZodiac] = useState("Escorpio");
  const [birthDate, setBirthDate] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const auth = useMemo(() => getFirebaseAuth(), []);

  async function submitEmail() {
    if (!auth) {
      setMessage("La puerta está cerrada por un momento. Puedes seguir explorando y volver a intentarlo en unos minutos.");
      return;
    }

    try {
      if (mode === "signup") {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      setMessage("Listo. Tu perfil queda preparado para completar el ritual.");
    } catch {
      setMessage("No pudimos abrir esa puerta. Revisa tus datos y vuelve a intentarlo.");
    }
  }

  async function submitGoogle() {
    if (!auth) {
      setMessage("Google no está disponible en este momento. Prueba con correo o vuelve en unos minutos.");
      return;
    }

    try {
      await signInWithPopup(auth, googleProvider);
      setMessage("Listo. Ya puedes completar tu perfil astral.");
    } catch {
      setMessage("Google se hizo el misterioso. Inténtalo otra vez en un momento.");
    }
  }

  return (
    <section className="mt-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="glass-panel rounded-md p-4">
        <p className="text-xs uppercase tracking-[0.32em] text-purple-200/70">Acceso + perfil</p>
        <h2 className="mt-2 text-2xl font-black">Tu entrada al oráculo</h2>
        <p className="mt-3 text-sm leading-6 text-white/62">
          Crea tu cuenta, elige tu signo y guarda tus lecturas favoritas. ZODI necesita conocerte un poco antes de empezar a opinar con tanta seguridad.
        </p>
        <div className="mt-4 rounded-md border border-lime-300/20 bg-lime-300/10 p-3 text-sm text-lime-100">
          {isFirebaseConfigured ? "Acceso listo" : "Puedes explorar antes de entrar"}
        </div>
      </div>

      <div className="glass-panel rounded-md p-4">
        <div className="mb-4 grid grid-cols-2 gap-2 rounded-md bg-black/30 p-1">
          {(["signup", "login"] as const).map((item) => (
            <button key={item} onClick={() => setMode(item)} className={`rounded-md px-3 py-2 text-sm font-bold ${mode === item ? "bg-lime-300 text-black" : "text-white/60"}`}>
              {item === "signup" ? "Crear perfil" : "Entrar"}
            </button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field icon={AtSign} value={email} onChange={setEmail} label="Correo" type="email" placeholder="tu@email.com" />
          <Field icon={Lock} value={password} onChange={setPassword} label="Contraseña" type="password" placeholder="Mínimo 6 caracteres" />
          <label className="rounded-md border border-white/10 bg-black/25 p-3">
            <span className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/45"><Calendar className="h-4 w-4" /> Fecha de nacimiento</span>
            <input className="w-full bg-transparent text-white outline-none" type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} />
          </label>
          <label className="rounded-md border border-white/10 bg-black/25 p-3">
            <span className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/45"><UserRound className="h-4 w-4" /> Signo</span>
            <select className="w-full bg-black text-white outline-none" value={zodiac} onChange={(event) => setZodiac(event.target.value)}>
              {zodiacs.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button onClick={submitEmail} className="rounded-md bg-lime-300 px-4 py-3 text-sm font-black text-black">
            {mode === "signup" ? "Crear perfil" : "Entrar"}
          </button>
          <button onClick={submitGoogle} className="flex items-center gap-2 rounded-md border border-white/15 px-4 py-3 text-sm font-bold text-white/80">
            <Chrome className="h-4 w-4" /> Google
          </button>
        </div>
        {message ? <p className="mt-3 text-sm text-lime-200">{message}</p> : null}
      </div>
    </section>
  );
}

function Field({ icon: Icon, label, value, onChange, type, placeholder }: { icon: typeof AtSign; label: string; value: string; onChange: (value: string) => void; type: string; placeholder: string }) {
  return (
    <label className="rounded-md border border-white/10 bg-black/25 p-3">
      <span className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/45"><Icon className="h-4 w-4" /> {label}</span>
      <input className="w-full bg-transparent text-white outline-none placeholder:text-white/30" type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  );
}
