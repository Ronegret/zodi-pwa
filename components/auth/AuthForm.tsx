"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  type User
} from "firebase/auth";
import { AtSign, Chrome, Eye, EyeOff, Lock, UserRound } from "lucide-react";
import { getFirebaseAuth, googleProvider } from "@/lib/firebase/client";
import { getLocalSession, setLocalSession } from "@/lib/session";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [terms, setTerms] = useState(true);
  const [remember, setRemember] = useState(true);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // ── Detectar sesión activa de Firebase al montar ──────────────────
  // Cubre 3 casos:
  //   1. Usuario ya estaba autenticado (Firebase persiste la sesión)
  //   2. Retorno de signInWithRedirect (por si el popup fue bloqueado)
  //   3. Recarga de página tras login reciente
  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) return;

    let handled = false; // evitar doble redirect

    // Primero verificar si hay resultado de redirect pendiente
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user && !handled) {
          handled = true;
          applyFirebaseUser(result.user);
        }
      })
      .catch(() => {
        // Ignorar: simplemente no había redirect pendiente
      });

    // Luego escuchar cambios de auth state (cubre sesión persistida y popup)
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user && !handled) {
        handled = true;
        applyFirebaseUser(user);
      }
    });

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyFirebaseUser(user: User) {
    const preserved = getLocalSession();
    const onboardingCompleted =
      preserved.onboardingCompleted || Boolean(preserved.astralProfile);

    setLocalSession({
      isAuthenticated: true,
      onboardingCompleted,
      displayName: user.displayName || preserved.displayName || "Viajero ZODI",
      email: user.email || preserved.email || "",
      uid: user.uid
    });

    router.push(onboardingCompleted ? "/dashboard" : "/onboarding");
  }

  async function continueFlow(provider: "email" | "google") {
    setMessage("");

    // ── Google OAuth ──────────────────────────────────────────────────
    if (provider === "google") {
      const auth = getFirebaseAuth();
      if (!auth) {
        setMessage("Firebase no está disponible. Inténtalo más tarde.");
        return;
      }
      setLoading(true);
      try {
        // signInWithPopup funciona desde un click del usuario (el navegador lo permite)
        await signInWithPopup(auth, googleProvider);
        // onAuthStateChanged lo detectará y redirigirá automáticamente
      } catch (err) {
        const code = (err as { code?: string }).code ?? "";
        if (code === "auth/popup-blocked") {
          // Fallback: redirect si el popup fue bloqueado
          try {
            await signInWithRedirect(auth, googleProvider);
          } catch {
            setLoading(false);
            setMessage("No se pudo abrir Google. Comprueba que los popups no estén bloqueados.");
          }
        } else if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
          setLoading(false);
          setMessage("Cerraste la ventana de Google antes de completar el acceso.");
        } else if (code === "auth/unauthorized-domain") {
          setLoading(false);
          setMessage("Este dominio no está autorizado en Firebase. Contacta al administrador.");
        } else {
          setLoading(false);
          setMessage("No se pudo iniciar el acceso con Google. Inténtalo de nuevo.");
        }
      }
      return;
    }

    // ── Validaciones email / contraseña ───────────────────────────────
    if (!email.trim()) {
      setMessage("Escribe tu correo para continuar.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage("El correo no tiene un formato válido.");
      return;
    }
    if (!password) {
      setMessage("La contraseña no puede estar vacía.");
      return;
    }
    if (mode === "register") {
      if (password.length < 6) {
        setMessage("La contraseña necesita al menos 6 caracteres.");
        return;
      }
      if (password !== confirm) {
        setMessage("Las contraseñas no coinciden. El cosmos exige consistencia.");
        return;
      }
      if (!terms) {
        setMessage("Acepta los términos para abrir el portal.");
        return;
      }
    }

    setLoading(true);
    try {
      let uid: string | undefined;
      const auth = getFirebaseAuth();

      if (auth) {
        if (mode === "register") {
          // Reset any existing session so new users always go through onboarding
          setLocalSession({ isAuthenticated: false, onboardingCompleted: false, astralProfile: undefined, onboardingData: undefined });
          const result = await createUserWithEmailAndPassword(auth, email, password);
          uid = result.user.uid;
        } else {
          const result = await signInWithEmailAndPassword(auth, email, password);
          uid = result.user.uid;
        }
      }

      // onAuthStateChanged lo manejará si Firebase está activo.
      // Si Firebase no está disponible, guardamos sesión local y redirigimos.
      if (!getFirebaseAuth()) {
        const preserved = getLocalSession();
        const onboardingCompleted =
          preserved.onboardingCompleted || Boolean(preserved.astralProfile);
        setLocalSession({
          isAuthenticated: true,
          onboardingCompleted,
          displayName: name.trim() || preserved.displayName || "Viajero ZODI",
          email,
          uid
        });
        router.push(onboardingCompleted ? "/dashboard" : "/onboarding");
      }
      // Si Firebase está activo, onAuthStateChanged tomará el control.
    } catch (err) {
      const code = (err as { code?: string }).code ?? "";
      if (
        code === "auth/user-not-found" ||
        code === "auth/wrong-password" ||
        code === "auth/invalid-credential"
      ) {
        setMessage("Correo o contraseña incorrectos. Revisa tus datos.");
      } else if (code === "auth/email-already-in-use") {
        setMessage("Ese correo ya tiene una cuenta. Entra en lugar de registrarte.");
      } else if (code === "auth/too-many-requests") {
        setMessage("Demasiados intentos. Espera unos minutos antes de volver a intentarlo.");
      } else {
        setMessage("No pudimos abrir esa puerta. Revisa tus datos e inténtalo de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword() {
    if (!email.trim()) {
      setMessage("Escribe tu correo primero.");
      return;
    }
    try {
      const auth = getFirebaseAuth();
      if (auth) {
        await sendPasswordResetEmail(auth, email);
        setMessage("Correo de recuperación enviado. Revisa tu bandeja (y el spam, por si acaso).");
      } else {
        setMessage("Firebase no está configurado. Usa otra vía para recuperar tu cuenta.");
      }
    } catch {
      setMessage("No se pudo enviar el correo. Verifica que el email sea correcto.");
    }
  }

  return (
    <div className="glass-panel neon-border w-full max-w-xl rounded-md p-5 sm:p-7">
      <p className="text-xs uppercase tracking-[0.32em] text-lime-200/70">
        {mode === "login" ? "Entrada" : "Registro"}
      </p>
      <h1 className="mt-3 text-4xl font-black">
        {mode === "login" ? "Vuelve al oráculo." : "Crea tu cuenta astral."}
      </h1>

      <div className="mt-8 grid gap-3">
        {mode === "register" ? (
          <Field icon={UserRound} label="Nombre" value={name} onChange={setName} type="text" placeholder="Tu nombre visible" />
        ) : null}
        <Field icon={AtSign} label="Correo" value={email} onChange={setEmail} type="email" placeholder="tu@email.com" />
        <div className="relative">
          <Field
            icon={Lock}
            label="Contraseña"
            value={password}
            onChange={setPassword}
            type={showPwd ? "text" : "password"}
            placeholder="Mínimo 6 caracteres"
          />
          <button
            type="button"
            onClick={() => setShowPwd((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
            aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {mode === "register" ? (
          <Field
            icon={Lock}
            label="Confirmar contraseña"
            value={confirm}
            onChange={setConfirm}
            type={showPwd ? "text" : "password"}
            placeholder="Repite tu contraseña"
          />
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-white/62">
        {mode === "login" ? (
          <label className="flex cursor-pointer items-center gap-2">
            <input checked={remember} onChange={(e) => setRemember(e.target.checked)} type="checkbox" />
            Recordar sesión
          </label>
        ) : (
          <label className="flex cursor-pointer items-center gap-2">
            <input checked={terms} onChange={(e) => setTerms(e.target.checked)} type="checkbox" />
            Aceptar términos
          </label>
        )}
        {mode === "login" ? (
          <button onClick={resetPassword} type="button" className="text-lime-200 hover:underline">
            Olvidé mi contraseña
          </button>
        ) : null}
      </div>

      <button
        onClick={() => continueFlow("email")}
        disabled={loading}
        className="mt-6 w-full rounded-md bg-lime-300 px-4 py-3 font-black text-black disabled:opacity-60 active:scale-95 transition"
      >
        {loading ? "Abriendo portal..." : mode === "login" ? "Entrar" : "Crear cuenta"}
      </button>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-xs text-white/40">o</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      {/* ── Botón Google al final ── */}
      <button
        onClick={() => continueFlow("google")}
        disabled={loading}
        className="flex w-full items-center justify-center gap-3 rounded-md border border-white/20 bg-white/5 px-4 py-3 font-bold text-white disabled:opacity-60 hover:bg-white/10 active:scale-95 transition"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        {loading ? "Conectando..." : "Continuar con Google"}
      </button>

      {message ? (
        <p className="mt-4 rounded-md border border-lime-300/20 bg-lime-300/10 p-3 text-sm text-lime-100">
          {message}
        </p>
      ) : null}

      <p className="mt-6 text-sm text-white/55">
        {mode === "login" ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
        <Link
          className="text-lime-200 hover:underline"
          href={mode === "login" ? "/auth/register" : "/auth/login"}
        >
          {mode === "login" ? "Crear cuenta" : "Entrar"}
        </Link>
      </p>
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  value,
  onChange,
  type,
  placeholder
}: {
  icon: typeof AtSign;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type: string;
  placeholder?: string;
}) {
  return (
    <label className="block rounded-md border border-white/10 bg-black/35 p-3 cursor-text">
      <span className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/45">
        <Icon className="h-4 w-4" /> {label}
      </span>
      <input
        className="w-full bg-transparent text-white outline-none placeholder:text-white/30"
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
