"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { signInWithPopup, signInWithRedirect, getRedirectResult, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged, type User } from "firebase/auth";
import { ArrowLeft, AtSign, Eye, EyeOff, Lock, UserRound } from "lucide-react";
import { getFirebaseAuth, googleProvider } from "@/lib/firebase/client";
import { getLocalSession, setLocalSession } from "@/lib/session";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref");
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [terms, setTerms] = useState(true);
  const [remember, setRemember] = useState(true);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const explicitAuthFlow = useRef(false);

  // ── Procesar redirect de Google al montar ─────────────────────────
  // IMPORTANTE: Siempre llamar getRedirectResult() en cada mount (recomendación Firebase).
  // En PWAs, Google puede redirigir en un contexto nuevo donde sessionStorage se pierde.
  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) return;

    const redirectPending = sessionStorage.getItem("zodi.google_redirect_pending");

    // Si hay un redirect pendiente (o siempre, para cubrir el caso PWA), marcamos el flujo
    // ANTES de que onAuthStateChanged pueda dispararse.
    if (redirectPending) {
      explicitAuthFlow.current = true;
      setLoading(true);
    }

    // Siempre intentar procesar el resultado del redirect — no solo cuando hay flag en sessionStorage
    getRedirectResult(auth)
      .then(async (result) => {
        sessionStorage.removeItem("zodi.google_redirect_pending");
        if (result?.user) {
          // ✅ Redirect completado correctamente — procesar usuario
          const { getAdditionalUserInfo } = await import("firebase/auth");
          const details = getAdditionalUserInfo(result);
          await applyFirebaseUser(result.user, details?.isNewUser ?? false);
        } else {
          // No había redirect pendiente o ya fue procesado — liberar lock
          if (redirectPending) {
            explicitAuthFlow.current = false;
            setLoading(false);
          }
        }
      })
      .catch((err: any) => {
        sessionStorage.removeItem("zodi.google_redirect_pending");
        explicitAuthFlow.current = false;
        setLoading(false);
        // auth/internal-error se silencia: el usuario puede estar autenticado
        // y onAuthStateChanged lo capturará a continuación
        if (err?.code && err.code !== "auth/popup-closed-by-user" && err.code !== "auth/internal-error") {
          setMessage(`Error Google: ${err.message || err.code}`);
        }
      });

    // ── Sesión activa (previa o recuperada tras redirect) ─────────────
    let handled = false;
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user && !handled && !explicitAuthFlow.current) {
        handled = true;
        await applyFirebaseUser(user);
      }
    });

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function applyFirebaseUser(user: User, forceNewUser: boolean = false) {
    // ── Step 1: Default to what we have locally ──
    const preserved = getLocalSession();
    let localDone = preserved.onboardingCompleted;

    if (forceNewUser) {
      localDone = false;
    }

    // ── Step 2: Always try to restore from Firestore (source of truth) ──
    let firestoreDone = false;
    try {
      const { getDoc, doc } = await import("firebase/firestore");
      const { getFirebaseDb } = await import("@/lib/firebase/client");
      const db = getFirebaseDb();
      if (db && !forceNewUser) {
        const [userSnap, astralSnap] = await Promise.all([
          getDoc(doc(db, "users", user.uid)),
          getDoc(doc(db, "astralProfiles", user.uid)),
        ]);

        if (userSnap.exists() && userSnap.data().onboardingCompleted && astralSnap.exists()) {
          const userData = userSnap.data();
          const astralData = astralSnap.data();

          // Restore full session from Firestore
          const onboardingData = {
            displayName: userData.displayName ?? "",
            username: userData.username ?? "",
            avatar: userData.avatar ?? "/zodi-art/perfil/perfil-1.png",
            genderIdentity: userData.genderIdentity ?? "",
            birthDate: astralData.birthDate ?? "",
            birthTime: astralData.birthTime ?? "",
            birthCity: astralData.birthCity ?? "",
            birthCountry: astralData.birthCountry ?? "",
            readingTone: userData.readingTone ?? "directo",
            favoriteTopics: userData.favoriteTopics ?? [],
            notificationPreferences: userData.notificationPreferences ?? { dailyHoroscope: true, weeklyReport: false, specialEvents: true },
          };

          const astralProfile = {
            sunSign: astralData.sunSign ?? "",
            moonSign: astralData.moonSign ?? "",
            ascendant: astralData.ascendant ?? "",
            lifePathNumber: astralData.lifePathNumber ?? 1,
            chineseZodiac: astralData.chineseZodiac ?? "",
            mayanSign: astralData.mayanSign ?? "",
            biorhythmBaseline: astralData.biorhythmBaseline ?? new Date().toISOString(),
          };

          setLocalSession({
            isAuthenticated: true,
            onboardingCompleted: true,
            displayName: userData.displayName || user.displayName || preserved.displayName || "Viajero ZODI",
            email: user.email || preserved.email || "",
            uid: user.uid,
            loginAt: Date.now(),
            astralProfile: astralProfile as any,
            onboardingData: onboardingData as any,
          });

          firestoreDone = true;
        }
      }
    } catch {
      // Firebase unavailable — fall back to local data
    }

    // ── Step 3: If Firestore didn't resolve, use local data ──
    if (!firestoreDone) {
      setLocalSession({
        isAuthenticated: true,
        onboardingCompleted: localDone,
        displayName: user.displayName || preserved.displayName || "Viajero ZODI",
        email: user.email || preserved.email || "",
        uid: user.uid,
        loginAt: Date.now(),
      });
    }

    // Give initial gems if none
    try {
      const gamification = await import("@/lib/gamification");
      const currentGems = gamification.getGems().total;
      if (currentGems === 0) gamification.addGems(15);
    } catch { /* ignore */ }

    const done = firestoreDone || localDone;
    router.push(done ? "/dashboard" : "/onboarding");
  }


  async function continueFlow(provider: "email" | "google") {
    setMessage("");

    // ── Third-Party OAuth (Google) ────────────────────────────
    if (provider === "google") {
      const auth = getFirebaseAuth();
      if (!auth) {
        setMessage("Firebase no está configurado. Contacta al administrador.");
        return;
      }
      setLoading(true);
      explicitAuthFlow.current = true;

      // Móvil: los popups son bloqueados por el OS → redirect
      const isMobile = /android|iphone|ipad|ipod|mobile/i.test(
        typeof navigator !== "undefined" ? navigator.userAgent : ""
      );

      if (isMobile) {
        try {
          sessionStorage.setItem("zodi.google_redirect_pending", "1");
          await signInWithRedirect(auth, googleProvider);
        } catch (err: any) {
          sessionStorage.removeItem("zodi.google_redirect_pending");
          setLoading(false);
          explicitAuthFlow.current = false;
          setMessage(`Error Google: ${err.message || err.code}`);
        }
        return;
      }

      // Desktop: popup (Google Cloud Console tiene zodi-pwa.vercel.app autorizado)
      try {
        const { getAdditionalUserInfo } = await import("firebase/auth");
        const result = await signInWithPopup(auth, googleProvider);
        const details = getAdditionalUserInfo(result);
        await applyFirebaseUser(result.user, details?.isNewUser ?? false);
      } catch (err: any) {
        explicitAuthFlow.current = false;
        setLoading(false);
        // Log completo para diagnóstico
        console.error("[ZODI AUTH] Google popup error:", {
          code: err.code,
          message: err.message,
          customData: err.customData,
          name: err.name,
          stack: err.stack?.slice(0, 300)
        });
        if (err.code === "auth/popup-closed-by-user" || err.code === "auth/cancelled-popup-request") {
          return;
        }
        if (err.code === "auth/popup-blocked") {
          // Popup bloqueado → redirect
          try {
            sessionStorage.setItem("zodi.google_redirect_pending", "1");
            explicitAuthFlow.current = true;
            setLoading(true);
            await signInWithRedirect(auth, googleProvider);
          } catch {
            sessionStorage.removeItem("zodi.google_redirect_pending");
            explicitAuthFlow.current = false;
            setLoading(false);
            setMessage("No se pudo abrir Google. Permite popups para este sitio.");
          }
        } else {
          // Mostrar error exacto para diagnóstico
          setMessage(`Error [${err.code}]: ${err.message}`);
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
      const auth = getFirebaseAuth();
      let firebaseSuccess = false;

      if (auth) {
        try {
          if (mode === "register") {
            setLocalSession({ isAuthenticated: false, onboardingCompleted: false, astralProfile: undefined, onboardingData: undefined });
            if (refCode) localStorage.setItem("zodi_ref_code", refCode);
            await createUserWithEmailAndPassword(auth, email, password);
          } else {
            await signInWithEmailAndPassword(auth, email, password);
          }
          firebaseSuccess = true;
          // Si Firebase tuvo éxito, el onAuthStateChanged (arriba) se encargará del redirect.
          return;
        } catch (firebaseErr: any) {
          // Si es registro y el email ya está en Firebase, lanzamos el error
          if (mode === "register" && firebaseErr.code === "auth/email-already-in-use") {
            throw firebaseErr;
          }
          // Si no, ignoramos y probamos el fallback local por si la cuenta existe en localStorage
          console.warn("Firebase auth falló, intentando fallback local...", firebaseErr);
        }
      }

      // FALLBACK LOCAL
      if (!firebaseSuccess) {
        const usersStr = window.localStorage.getItem("zodi.local_users") || "[]";
        let users: any[] = [];
        try { users = JSON.parse(usersStr); } catch(e) {}

        if (mode === "register") {
          if (users.find(u => u.email === email)) {
            setMessage("Tu alma ya pertenece a este universo. Usa otro correo o inicia sesión.");
            setLoading(false);
            return;
          }
          const newUser = {
            email,
            password,
            displayName: name.trim() || "Viajero ZODI",
            uid: "local_" + Date.now(),
            astralProfile: null,
            onboardingData: null,
            onboardingCompleted: false
          };
          users.push(newUser);
          window.localStorage.setItem("zodi.local_users", JSON.stringify(users));

          setLocalSession({
            isAuthenticated: true,
            onboardingCompleted: false,
            displayName: newUser.displayName,
            email: newUser.email,
            uid: newUser.uid,
            loginAt: Date.now(),
          });
          router.push("/onboarding");
        } else {
          // Login mode local
          const user = users.find(u => u.email === email && u.password === password);
          if (!user) {
            setMessage("Correo o contraseña incorrectos. Revisa tus datos.");
            setLoading(false);
            return;
          }
          
          setLocalSession({
            isAuthenticated: true,
            onboardingCompleted: user.onboardingCompleted,
            displayName: user.displayName,
            email: user.email,
            uid: user.uid,
            loginAt: Date.now(),
            astralProfile: user.astralProfile,
            onboardingData: user.onboardingData
          });
          router.push(user.onboardingCompleted ? "/dashboard" : "/onboarding");
        }
      }
    } catch (err) {
      const code = (err as { code?: string }).code ?? "";
      if (code === "auth/email-already-in-use") {
        setMessage("Tu alma ya pertenece a este universo. Redirigiendo a inicio de sesión...");
        setTimeout(() => router.push("/auth/login"), 2500);
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
        const usersStr = window.localStorage.getItem("zodi.local_users") || "[]";
        let users: any[] = [];
        try { users = JSON.parse(usersStr); } catch(e) {}
        if (users.find(u => u.email === email)) {
          setMessage("Modo Local: No podemos enviar correos. Tu cuenta existe, ¡recuerda tu contraseña!");
        } else {
          setMessage("Modo Local: Esta cuenta no existe en nuestros registros.");
        }
      }
    } catch {
      setMessage("No se pudo enviar el correo. Verifica que el email sea correcto.");
    }
  }

  return (
    <div className="glass-panel neon-border w-full max-w-xl rounded-md p-4 sm:p-7">
      {/* Back to home — always visible */}
      <Link
        href="/"
        className="mb-5 inline-flex items-center gap-2 text-sm text-white/50 hover:text-lime-300 transition group"
      >
        <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-1" />
        Volver al inicio
      </Link>

      <p className="text-[10px] sm:text-xs uppercase tracking-[0.32em] text-lime-200/70">
        {mode === "login" ? "Entrada" : "Registro"}
      </p>
      <h1 className="mt-1 sm:mt-3 text-2xl sm:text-4xl font-black">
        {mode === "login" ? "Vuelve al oráculo." : "Crea tu cuenta astral."}
      </h1>

      <form id="zodi-auth-form" className="mt-4 sm:mt-8 grid gap-2 sm:gap-3" onSubmit={(event) => { event.preventDefault(); void continueFlow("email"); }}>
        {mode === "register" ? (
          <>
            <Field icon={UserRound} label="Nombre" value={name} onChange={setName} type="text" name="name" autoComplete="name" placeholder="Tu nombre visible" />
            <div className="block rounded-md border border-white/10 bg-black/35 p-2 sm:p-3">
              <span className="mb-1 sm:mb-2 flex items-center gap-2 text-[10px] sm:text-xs uppercase tracking-[0.2em] text-white/45">
                 Idioma de la App
              </span>
              <select className="w-full bg-transparent text-white outline-none text-sm sm:text-base" defaultValue="es">
                <option value="es" className="bg-black text-white">Español</option>
                <option value="en" className="bg-black text-white">English</option>
                <option value="ca" className="bg-black text-white">Català</option>
              </select>
            </div>
          </>
        ) : null}
        <Field icon={AtSign} label="Correo" value={email} onChange={setEmail} type="email" name="email" autoComplete="email" placeholder="tu@email.com" />
        <div className="relative">
          <Field
            icon={Lock}
            label="Contraseña"
            value={password}
            onChange={setPassword}
            type={showPwd ? "text" : "password"}
            name={mode === "login" ? "current-password" : "new-password"}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
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
            name="confirm-password"
            autoComplete="new-password"
            placeholder="Repite tu contraseña"
          />
        ) : null}
      </form>

      <div className="mt-3 sm:mt-4 flex flex-wrap items-center justify-between gap-2 sm:gap-3 text-xs sm:text-sm text-white/62">
        {mode === "login" ? (
          <label className="flex cursor-pointer items-center gap-2">
            <input checked={remember} onChange={(e) => setRemember(e.target.checked)} type="checkbox" name="remember" />
            Recordar sesión
          </label>
        ) : (
          <label className="flex cursor-pointer items-center gap-2">
            <input checked={terms} onChange={(e) => setTerms(e.target.checked)} type="checkbox" name="terms" />
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
        type="submit"
        form="zodi-auth-form"
        disabled={loading}
        className="mt-4 sm:mt-6 w-full rounded-md bg-lime-300 px-4 py-2.5 sm:py-3 text-sm sm:text-base font-black text-black disabled:opacity-60 active:scale-95 transition"
      >
        {loading ? "Abriendo portal..." : mode === "login" ? "Entrar" : "Crear cuenta"}
      </button>

      <div className="my-4 sm:my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-[10px] sm:text-xs text-white/40">o</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      {/* ── Botones sociales al final ── */}
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <button
          onClick={() => continueFlow("google")}
          disabled={loading}
          className="flex flex-1 items-center justify-center gap-2.5 rounded-md border border-white/20 bg-white/5 px-4 py-3 font-bold text-white disabled:opacity-60 hover:bg-white/10 active:scale-95 transition"
        >
          <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google
        </button>
      </div>

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

      {/* Extra escape hatch */}
      <div className="mt-4 pt-4 border-t border-white/08 text-center">
        <Link href="/" className="text-xs text-white/35 hover:text-white/60 transition">
          ← Regresar a la web principal sin iniciar sesión
        </Link>
      </div>
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  value,
  onChange,
  type,
  placeholder,
  name,
  autoComplete
}: {
  icon: typeof AtSign;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type: string;
  placeholder?: string;
  name: string;
  autoComplete: string;
}) {
  return (
    <label className="block rounded-md border border-white/10 bg-black/35 p-2 sm:p-3 cursor-text">
      <span className="mb-1 sm:mb-2 flex items-center gap-2 text-[10px] sm:text-xs uppercase tracking-[0.2em] text-white/45">
        <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> {label}
      </span>
      <input
        className="w-full bg-transparent text-white outline-none placeholder:text-white/30 text-sm sm:text-base"
        type={type}
        name={name}
        autoComplete={autoComplete}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
