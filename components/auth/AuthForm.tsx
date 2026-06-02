"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  signInWithRedirect, getRedirectResult,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendPasswordResetEmail, fetchSignInMethodsForEmail,
  onAuthStateChanged, type User
} from "firebase/auth";
import { ArrowLeft, AtSign, CheckCircle2, Eye, EyeOff, Loader2, Lock, UserRound, XCircle, AlertTriangle } from "lucide-react";
import { getFirebaseAuth, googleProvider, isFirebaseConfigured } from "@/lib/firebase/client";
import { getLocalSession, setLocalSession, getSavedIdentity } from "@/lib/session";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref");

  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [showPwd, setShowPwd]   = useState(false);
  const [terms, setTerms]       = useState(true);
  const [message, setMessage]   = useState("");
  const [msgType, setMsgType]   = useState<"info" | "success" | "error">("info");
  const [loading, setLoading]   = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailStatus, setEmailStatus]     = useState<"idle"|"checking"|"available"|"taken">("idle");
  const [existingMethods, setExistingMethods] = useState<string[]>([]);

  // ── Guard compartido: una sola ruta de auth puede procesar a la vez ──────
  // useRef porque los cambios no necesitan re-render; es solo una guarda interna.
  const authHandledRef = useRef(false);

  // ── Verificar disponibilidad del email en registro ────────────────────────
  useEffect(() => {
    if (mode !== "register") return;
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isValid) { setEmailStatus("idle"); setExistingMethods([]); return; }

    setEmailStatus("checking");
    const t = setTimeout(async () => {
      try {
        const auth = getFirebaseAuth();
        if (!auth) { setEmailStatus("idle"); return; }
        const methods = await fetchSignInMethodsForEmail(auth, email);
        setExistingMethods(methods);
        setEmailStatus(methods.length > 0 ? "taken" : "available");
      } catch { setEmailStatus("idle"); }
    }, 700);
    return () => clearTimeout(t);
  }, [email, mode]);

  // ── Leer errores desde URL ────────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlError = params.get("error");
    if (urlError) {
      setMessage(`Error: ${urlError}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // ── applyFirebaseUser — decide a dónde ir, RÁPIDO ────────────────────────
  //
  // Principio: para usuarios que regresan, navegar INMEDIATAMENTE desde datos
  // locales y sincronizar Firestore en background. Solo bloquear si es usuario
  // genuinamente nuevo (sin datos en ningún lado).
  //
  const applyFirebaseUser = useCallback(async (user: User, forceNewUser = false) => {
    const preserved = getLocalSession();
    const sameUid   = preserved.uid === user.uid;
    const sameEmail = !!(user.email && preserved.email && user.email === preserved.email);
    const sameUser  = sameUid || sameEmail;

    // Mínimas gemas de bienvenida (sin bloquear)
    import("@/lib/gamification").then(g => { if (g.getGems().total === 0) g.addGems(15); }).catch(() => {});

    // ── VÍA RÁPIDA 1: usuario conocido en localStorage ───────────────────
    if (!forceNewUser && sameUser && preserved.onboardingCompleted) {
      setLocalSession({
        isAuthenticated: true, onboardingCompleted: true,
        uid: user.uid, email: user.email || preserved.email || "",
        // Preferir displayName del onboardingData sobre el placeholder "Viajero ZODI"
        displayName: user.displayName || preserved.onboardingData?.displayName || preserved.displayName || "Viajero ZODI",
        loginAt: Date.now(),
        astralProfile: preserved.astralProfile,
        onboardingData: preserved.onboardingData,
      });
      router.push("/dashboard");

      // Sincronizar Firestore en background — no bloquea la navegación
      Promise.all([
        import("firebase/firestore"),
        import("@/lib/firebase/client"),
      ]).then(async ([{ getDoc, doc, setDoc, serverTimestamp }, { getFirebaseDb }]) => {
        const db = getFirebaseDb();
        if (!db) return;
        const [uSnap, aSnap] = await Promise.all([
          getDoc(doc(db, "users", user.uid)),
          getDoc(doc(db, "astralProfiles", user.uid)),
        ]);
        if (uSnap.exists()) {
          const ud = uSnap.data();
          const ad = aSnap.exists() ? aSnap.data() : ud;
          // Fusionar datos de Firestore con lo que ya tenemos localmente
          setLocalSession({
            onboardingData: {
              ...preserved.onboardingData,
              displayName: ud.displayName || preserved.onboardingData?.displayName || "",
              birthDate: ad.birthDate || ud.birthDate || preserved.onboardingData?.birthDate || "",
              birthTime: ad.birthTime || ud.birthTime || preserved.onboardingData?.birthTime || "",
              birthCity: ad.birthCity || ud.birthCity || preserved.onboardingData?.birthCity || "",
              birthCountry: ad.birthCountry || ud.birthCountry || preserved.onboardingData?.birthCountry || "",
              currentCity: ud.currentCity || preserved.onboardingData?.currentCity || "",
              currentCountry: ud.currentCountry || preserved.onboardingData?.currentCountry || "",
              readingTone: ud.readingTone ?? preserved.onboardingData?.readingTone ?? "directo",
              favoriteTopics: ud.favoriteTopics ?? preserved.onboardingData?.favoriteTopics ?? [],
              notificationPreferences: ud.notificationPreferences ?? preserved.onboardingData?.notificationPreferences ?? [],
              lastName: ud.lastName ?? preserved.onboardingData?.lastName ?? "",
              avatar: ud.avatar ?? preserved.onboardingData?.avatar ?? "/zodi-art/perfil/perfil-1.png",
              username: ud.username ?? preserved.onboardingData?.username ?? "",
              genderIdentity: ud.genderIdentity ?? preserved.onboardingData?.genderIdentity ?? "",
              relationshipStatus: ud.relationshipStatus ?? preserved.onboardingData?.relationshipStatus,
              partnerName: ud.partnerName ?? preserved.onboardingData?.partnerName,
              partnerBirthDate: ud.partnerBirthDate ?? preserved.onboardingData?.partnerBirthDate,
              hasKids: ud.hasKids ?? preserved.onboardingData?.hasKids,
              kidsCount: ud.kidsCount ?? preserved.onboardingData?.kidsCount,
              personalBio: ud.personalBio ?? preserved.onboardingData?.personalBio,
            } as any,
            astralProfile: {
              ...preserved.astralProfile,
              sunSign: ad.sunSign ?? preserved.astralProfile?.sunSign ?? "",
              moonSign: ad.moonSign ?? preserved.astralProfile?.moonSign ?? "",
              ascendant: ad.ascendant ?? preserved.astralProfile?.ascendant ?? "",
              lifePathNumber: ad.lifePathNumber ?? preserved.astralProfile?.lifePathNumber ?? 1,
              chineseZodiac: ad.chineseZodiac ?? preserved.astralProfile?.chineseZodiac ?? "",
              mayanSign: ad.mayanSign ?? preserved.astralProfile?.mayanSign ?? "",
              biorhythmBaseline: ad.biorhythmBaseline ?? preserved.astralProfile?.biorhythmBaseline ?? new Date().toISOString(),
              natalChartBase: ad.natalChartBase ?? preserved.astralProfile?.natalChartBase ?? "",
              summary: ad.summary ?? preserved.astralProfile?.summary ?? "",
            } as any,
          });
        }
      }).catch(() => { /* silencioso — datos locales ya disponibles */ });
      return;
    }

    // ── VÍA RÁPIDA 2: identidad duradera local ────────────────────────────
    if (!forceNewUser) {
      const identity = getSavedIdentity();
      if (identity && (identity.uid === user.uid || identity.email === user.email) && identity.onboardingCompleted) {
        setLocalSession({
          isAuthenticated: true, onboardingCompleted: true,
          uid: user.uid, email: user.email || identity.email,
          displayName: user.displayName || identity.onboardingData?.displayName || "Viajero ZODI",
          loginAt: Date.now(),
          onboardingData: identity.onboardingData,
          astralProfile: identity.astralProfile,
        });
        router.push("/dashboard");
        // Sync Firestore en background
        import("@/lib/firebase/profile").then(({ saveOnboardingProfile }) =>
          saveOnboardingProfile(user.uid, identity.onboardingData, identity.astralProfile)
        ).catch(() => {});
        return;
      }
    }

    // ── VÍA LENTA: usuario nuevo o sin datos locales → esperar Firestore ──
    // Timeout de 2.5s: si Firestore no responde, navegamos igual (sin bloquear al usuario)
    let firestoreHasData = false;
    try {
      const timeout = new Promise<null>(res => setTimeout(() => res(null), 2500));
      const firestoreCheck = (async () => {
        const [{ getDoc, doc }, { getFirebaseDb }] = await Promise.all([
          import("firebase/firestore"),
          import("@/lib/firebase/client"),
        ]);
        const db = getFirebaseDb();
        if (!db) return null;
        const [uSnap, aSnap] = await Promise.all([
          getDoc(doc(db, "users", user.uid)),
          getDoc(doc(db, "astralProfiles", user.uid)),
        ]);
        return { uSnap, aSnap };
      })();

      const result = await Promise.race([firestoreCheck, timeout]);
      if (result) {
        const { uSnap, aSnap } = result;
        if (uSnap.exists() && uSnap.data()?.onboardingCompleted) {
          const ud = uSnap.data();
          if (!ud) return;
          const ad = (aSnap.exists() && aSnap.data()) ? aSnap.data()! : ud;
          setLocalSession({
            isAuthenticated: true, onboardingCompleted: true,
            displayName: ud.displayName || user.displayName || "Viajero ZODI",
            email: user.email || "",
            uid: user.uid, loginAt: Date.now(),
            astralProfile: {
              sunSign: ad.sunSign ?? "", moonSign: ad.moonSign ?? "",
              ascendant: ad.ascendant ?? "", lifePathNumber: ad.lifePathNumber ?? 1,
              chineseZodiac: ad.chineseZodiac ?? "", mayanSign: ad.mayanSign ?? "",
              biorhythmBaseline: ad.biorhythmBaseline ?? new Date().toISOString(),
              natalChartBase: ad.natalChartBase ?? "", summary: ad.summary ?? "",
            } as any,
            onboardingData: {
              displayName: ud.displayName || "", lastName: ud.lastName || "",
              username: ud.username || "", avatar: ud.avatar || "/zodi-art/perfil/perfil-1.png",
              genderIdentity: ud.genderIdentity || "",
              birthDate: ad.birthDate || ud.birthDate || "",
              birthTime: ad.birthTime || ud.birthTime || "",
              birthCity: ad.birthCity || ud.birthCity || "",
              birthCountry: ad.birthCountry || ud.birthCountry || "",
              currentCity: ud.currentCity || "", currentCountry: ud.currentCountry || "",
              readingTone: ud.readingTone ?? "directo",
              favoriteTopics: ud.favoriteTopics ?? [],
              notificationPreferences: ud.notificationPreferences ?? [],
              relationshipStatus: ud.relationshipStatus, partnerName: ud.partnerName,
              partnerBirthDate: ud.partnerBirthDate, hasKids: ud.hasKids,
              kidsCount: ud.kidsCount, personalBio: ud.personalBio,
            } as any,
          });
          firestoreHasData = true;
        }
      }
    } catch { /* Firestore no disponible o timeout */ }

    if (!firestoreHasData) {
      // Si es un login de una cuenta Firebase existente, pero no tenemos datos locales
      // ni en Firestore para ESTE usuario, lo mandamos a onboarding para que complete su perfil.
      const sameUserPriorOnboarding = sameUser && preserved.onboardingCompleted === true;
      setLocalSession({
        isAuthenticated: true,
        onboardingCompleted: sameUserPriorOnboarding,
        displayName: user.displayName || (sameUser ? (preserved.displayName || preserved.onboardingData?.displayName) : "") || "Viajero ZODI",
        email: user.email || (sameUser ? preserved.email : "") || "",
        uid: user.uid, loginAt: Date.now(),
        astralProfile: sameUser ? preserved.astralProfile : undefined,
        onboardingData: sameUser ? preserved.onboardingData : undefined,
      });
    }

    // Decisión de navegación:
    // - Si tenemos datos de Firestore → dashboard
    // - Si es el mismo usuario y ya tenía onboarding completado localmente → dashboard
    // - En cualquier otro caso (usuario nuevo o sin datos) → onboarding
    const goToDashboard = firestoreHasData || (sameUser && preserved.onboardingCompleted === true);
    router.push(goToDashboard ? "/dashboard" : "/onboarding");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // ── Procesar redirect de Google + sesión ya activa ────────────────────────
  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) return;

    const redirectPending = sessionStorage.getItem("zodi.google_redirect_pending");
    if (redirectPending) setGoogleLoading(true);

    // Timeout de seguridad: si google sigue cargando tras 14s, mostrar error
    let googleTimeout: ReturnType<typeof setTimeout> | null = null;
    if (redirectPending) {
      googleTimeout = setTimeout(() => {
        if (authHandledRef.current) return; // ya fue procesado
        sessionStorage.removeItem("zodi.google_redirect_pending");
        setGoogleLoading(false);
        setMessage("Google tardó demasiado. Vuelve a intentarlo o usa email.");
        setMsgType("error");
      }, 14000);
    }

    let redirectChecked = false;

    // getRedirectResult: procesa el resultado de un redirect previo de Google
    getRedirectResult(auth)
      .then(async (result) => {
        redirectChecked = true;
        if (googleTimeout) clearTimeout(googleTimeout);
        sessionStorage.removeItem("zodi.google_redirect_pending");
        if (result?.user && !authHandledRef.current) {
          authHandledRef.current = true;
          setGoogleLoading(false);
          try {
            const { getAdditionalUserInfo } = await import("firebase/auth");
            const isNew = getAdditionalUserInfo(result)?.isNewUser ?? false;
            await applyFirebaseUser(result.user, isNew);
          } catch {
            authHandledRef.current = false;
            setGoogleLoading(false);
            setMessage("Error al cargar tu perfil. Recarga e inténtalo de nuevo.");
            setMsgType("error");
          }
        } else if (auth.currentUser && !authHandledRef.current) {
          authHandledRef.current = true;
          setGoogleLoading(false);
          try {
            await applyFirebaseUser(auth.currentUser, false);
          } catch {
            authHandledRef.current = false;
            setGoogleLoading(false);
            setMessage("Error al cargar tu perfil. Recarga e intentalo de nuevo.");
            setMsgType("error");
          }
        } else {
          setGoogleLoading(false);
        }
      })
      .catch((err: any) => {
        redirectChecked = true;
        if (googleTimeout) clearTimeout(googleTimeout);
        sessionStorage.removeItem("zodi.google_redirect_pending");
        setGoogleLoading(false);
        if (authHandledRef.current) return; // ya fue manejado por onAuthStateChanged

        // Solo mostrar error si el usuario HABÍA iniciado un intento de Google
        // (redirectPending estaba en sessionStorage). Sin esto, cualquier error
        // de getRedirectResult al cargar la página se muestra aunque nadie haya
        // pulsado "Continuar con Google" — eso es el bug que veían todos.
        if (!redirectPending) return;

        const code = err?.code ?? "";
        if (code === "auth/unauthorized-domain") {
          setMessage("⚠️ Este dominio no está autorizado en Firebase Console → Authentication → Authorized Domains.");
          setMsgType("error");
        } else if (code === "auth/operation-not-allowed") {
          setMessage("⚠️ Google Sign-In no está activado en Firebase Console → Authentication → Sign-in method.");
          setMsgType("error");
        } else if (code && code !== "auth/popup-closed-by-user") {
          setMessage(`Google no pudo completar el inicio de sesión (${code}). Intenta de nuevo o usa email.`);
          setMsgType("error");
        }
      });

    // Auto-redirect si ya hay sesión activa (Firebase persiste entre visitas)
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (redirectPending && !redirectChecked) return;
      if (user && !authHandledRef.current) {
        authHandledRef.current = true;
        if (googleTimeout) clearTimeout(googleTimeout);
        try {
          await applyFirebaseUser(user);
        } catch (e) {
          authHandledRef.current = false;
          setGoogleLoading(false);
          // Solo mostrar error si venía de un intento de Google
          const pending = sessionStorage.getItem("zodi.google_redirect_pending");
          if (pending) {
            sessionStorage.removeItem("zodi.google_redirect_pending");
            setMessage("No se pudo cargar tu perfil. Recarga la página e inténtalo de nuevo.");
            setMsgType("error");
          }
        }
      }
    });

    return () => {
      if (googleTimeout) clearTimeout(googleTimeout);
      unsub();
    };
  }, [applyFirebaseUser]);

  // ── Google OAuth — popup con fallback automático a redirect ─────────────────
  async function loginWithGoogle() {
    if (authHandledRef.current || googleLoading) return;
    setMessage("");
    setMsgType("info");
    setGoogleLoading(true);

    const auth = getFirebaseAuth();
    if (!auth) {
      setMessage("Firebase no configurado. Revisa las variables de entorno.");
      setMsgType("error");
      setGoogleLoading(false);
      return;
    }

    // Detectar contextos donde el popup siempre falla → ir directo a redirect
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const isIos       = /iphone|ipad|ipod/i.test(ua);
    const isSafari    = /safari/i.test(ua) && !/chrome/i.test(ua) && !/android/i.test(ua);
    const isStandalone = typeof window !== "undefined" &&
                         (window.matchMedia?.("(display-mode: standalone)").matches ||
                          (window.navigator as any).standalone === true);

    // iOS Safari o PWA standalone → popup siempre bloqueado, usar redirect directamente
    if (isIos && (isSafari || isStandalone)) {
      try {
        sessionStorage.setItem("zodi.google_redirect_pending", "1");
        await signInWithRedirect(auth, googleProvider);
        return;
      } catch (err: any) {
        sessionStorage.removeItem("zodi.google_redirect_pending");
        setMessage(`No se pudo iniciar con Google (${err?.code ?? "error"}). Intenta con email.`);
        setMsgType("error");
        setGoogleLoading(false);
        return;
      }
    }

    // Resto de navegadores → intentar popup primero, fallback a redirect
    try {
      const { signInWithPopup, getAdditionalUserInfo } = await import("firebase/auth");
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user && !authHandledRef.current) {
        authHandledRef.current = true;
        setGoogleLoading(false);
        const isNew = getAdditionalUserInfo(result)?.isNewUser ?? false;
        await applyFirebaseUser(result.user, isNew);
      }
    } catch (e: any) {
      const code = e?.code ?? "";
      console.error("[ZODI] Error Google Sign-In:", code, e?.message);

      // Estos códigos = popup no disponible → fallback automático a redirect
      const redirectCodes = [
        "auth/popup-blocked",
        "auth/popup-closed-by-user",
        "auth/cancelled-popup-request",
      ];

      if (redirectCodes.includes(code)) {
        try {
          sessionStorage.setItem("zodi.google_redirect_pending", "1");
          await signInWithRedirect(auth, googleProvider);
          return; // la página navega — no hay más código que ejecutar
        } catch (redirectErr: any) {
          sessionStorage.removeItem("zodi.google_redirect_pending");
          setMessage(`Google no respondió. Intenta de nuevo o usa email. (${redirectErr?.code ?? "redirect-error"})`);
          setMsgType("error");
        }
      } else if (code === "auth/unauthorized-domain") {
        setMessage("⚠️ Dominio no autorizado en Firebase → Authentication → Authorized Domains. Añade tu dominio de producción.");
        setMsgType("error");
      } else if (code === "auth/operation-not-allowed") {
        setMessage("⚠️ Google Sign-In desactivado en Firebase → Authentication → Sign-in method.");
        setMsgType("error");
      } else if (code === "auth/network-request-failed") {
        setMessage("Sin conexión. Comprueba tu red e intenta de nuevo.");
        setMsgType("error");
      } else if (code && code !== "auth/user-cancelled") {
        setMessage(`Error al iniciar con Google (${code}). Intenta de nuevo.`);
        setMsgType("error");
      }
      // Si el usuario simplemente cerró el popup: no mostrar error, solo quitar loading
      setGoogleLoading(false);
    }
  }

  // ── Email / contraseña ────────────────────────────────────────────────────
  async function continueWithEmail() {
    setMessage("");
    if (!email.trim()) { setMessage("El cosmos necesita tu correo."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setMessage("Ese correo tiene más errores que un horóscopo genérico."); return; }
    if (!password) { setMessage("Contraseña vacía. El universo también necesita seguridad."); return; }
    if (mode === "register") {
      if (emailStatus === "checking") { setMessage("Verificando tu correo... espera un segundo."); return; }
      if (password.length < 6) { setMessage("6 caracteres mínimo."); return; }
      if (password !== confirm) { setMessage("Las contraseñas no coinciden."); return; }
      if (!terms) { setMessage("Acepta los términos para continuar."); return; }
    }

    setLoading(true);
    authHandledRef.current = true;

    try {
      const auth = getFirebaseAuth();

      if (auth) {
        try {
          if (mode === "register") {
            setLocalSession({ isAuthenticated: false, onboardingCompleted: false, astralProfile: undefined, onboardingData: undefined });
            if (refCode) localStorage.setItem("zodi_ref_code", refCode);
            const cred = await createUserWithEmailAndPassword(auth, email, password);
            await applyFirebaseUser(cred.user, true);
            return;
          } else {
            const cred = await signInWithEmailAndPassword(auth, email, password);
            await applyFirebaseUser(cred.user, false);
            return;
          }
        } catch (firebaseErr: any) {
          const code = (firebaseErr as { code?: string }).code ?? "";
          authHandledRef.current = false;

          if (isFirebaseConfigured) {
            throw firebaseErr;
          }

          console.warn("[ZODI] Firebase no disponible, probando fallback local:", code);
        }
      }

      // Fallback local
      const usersStr = window.localStorage.getItem("zodi.local_users") || "[]";
      let users: any[] = [];
      try { users = JSON.parse(usersStr); } catch { /* ignore */ }

      if (mode === "register") {
        if (users.find((u: any) => u.email === email)) {
          setMessage("Tu alma ya pertenece a este universo. Entra o recupera tu contraseña.");
          authHandledRef.current = false;
          return;
        }
        const newUser = {
          email, password,
          displayName: name.trim() || "Viajero ZODI",
          uid: "local_" + Date.now(),
          astralProfile: null, onboardingData: null, onboardingCompleted: false,
        };
        users.push(newUser);
        localStorage.setItem("zodi.local_users", JSON.stringify(users));
        setLocalSession({
          isAuthenticated: true, onboardingCompleted: false,
          displayName: newUser.displayName, email: newUser.email,
          uid: newUser.uid, loginAt: Date.now(),
        });
        router.push("/onboarding");
      } else {
        const user = users.find((u: any) => u.email === email && u.password === password);
        if (!user) {
          setMessage("Correo o contraseña incorrectos.");
          authHandledRef.current = false;
          return;
        }
        setLocalSession({
          isAuthenticated: true, onboardingCompleted: user.onboardingCompleted,
          displayName: user.displayName, email: user.email, uid: user.uid,
          loginAt: Date.now(), astralProfile: user.astralProfile, onboardingData: user.onboardingData,
        });
        router.push(user.onboardingCompleted ? "/dashboard" : "/onboarding");
      }
    } catch (err: any) {
      authHandledRef.current = false; // Permitir reintento en error
      const code = (err as { code?: string }).code ?? "";
      if (code === "auth/email-already-in-use") {
        setMessage("Ese correo ya tiene portal. Te llevamos al login..."); setMsgType("info");
        setTimeout(() => router.push("/auth/login"), 2000);
      } else if (code === "auth/account-exists-with-different-credential" || code === "auth/credential-already-in-use") {
        setMessage("Ese correo ya existe con otro metodo. Si es Gmail, entra con el boton de Google.");
        setMsgType("error");
      } else if (code === "auth/too-many-requests") {
        setMessage("Demasiados intentos. Vuelve en unos minutos. ☕"); setMsgType("error");
      } else if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
        setMessage("Correo o contraseña incorrectos. Si creaste la cuenta con Gmail, usa el botón de Google."); setMsgType("error");
      } else if (code === "auth/user-not-found") {
        setMessage("Ese correo no existe en ZODI. ¿Registrarte quizás?"); setMsgType("error");
      } else if (code === "auth/invalid-email") {
        setMessage("Formato de correo inválido."); setMsgType("error");
      } else {
        setMessage("Algo falló. Revisa tus datos e inténtalo de nuevo."); setMsgType("error");
      }
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword() {
    if (!email.trim()) {
      setMessage("Escribe tu correo arriba y luego pulsa este enlace.");
      setMsgType("info");
      return;
    }
    try {
      const auth = getFirebaseAuth();
      if (auth) {
        await sendPasswordResetEmail(auth, email);
        setMessage("Correo de recuperación enviado a " + email + ". Revisa también el spam. ✉️");
        setMsgType("success");
      } else {
        const users = JSON.parse(localStorage.getItem("zodi.local_users") || "[]");
        setMessage(users.find((u: any) => u.email === email)
          ? "Modo local: cuenta existe, recuerda tu contraseña."
          : "Modo local: esa cuenta no existe.");
        setMsgType("info");
      }
    } catch {
      setMessage("No se pudo enviar el correo. Verifica que el correo sea correcto.");
      setMsgType("error");
    }
  }

  const hasGoogleMethod = existingMethods.includes("google.com");
  const isGoogleBusy    = googleLoading;

  return (
    <div className="glass-panel neon-border w-full max-w-xl rounded-md p-4 sm:p-7">
      <Link href="/" className="mb-5 inline-flex items-center gap-2 text-sm text-white/50 hover:text-lime-300 transition group">
        <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-1" />
        Volver al inicio
      </Link>

      <p className="text-[10px] sm:text-xs uppercase tracking-[0.32em] text-lime-200/70">
        {mode === "login" ? "Entrada" : "Registro"}
      </p>
      <h1 className="mt-1 sm:mt-3 text-2xl sm:text-4xl font-black">
        {mode === "login" ? "Vuelve al oráculo." : "Crea tu cuenta astral."}
      </h1>

      {/* ── Google — primer opción ── */}
      <button
        type="button"
        onClick={loginWithGoogle}
        disabled={isGoogleBusy || loading}
        className="mt-5 flex w-full items-center justify-center gap-2.5 rounded-md border border-white/20 bg-white/5 px-4 py-3 font-bold text-white disabled:opacity-60 hover:bg-white/10 active:scale-95 transition"
      >
        {isGoogleBusy ? (
          <Loader2 className="h-5 w-5 animate-spin shrink-0" />
        ) : (
          <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        )}
        {isGoogleBusy ? "Conectando con Google..." : "Continuar con Google"}
      </button>

      <div className="my-4 sm:my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-[10px] sm:text-xs text-white/40">o con email</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      {/* ── Formulario ── */}
      <form
        id="zodi-auth-form"
        className="grid gap-2 sm:gap-3"
        onSubmit={(e) => { e.preventDefault(); void continueWithEmail(); }}
      >
        {mode === "register" && (
          <>
            <Field icon={UserRound} label="Nombre" value={name} onChange={setName} type="text" name="name" autoComplete="name" placeholder="Tu nombre visible" />
            <label className="block rounded-md border border-white/10 bg-black/35 p-2 sm:p-3">
              <span className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/45">Idioma</span>
              <select className="w-full bg-transparent text-white outline-none text-sm" defaultValue="es">
                <option value="es" className="bg-black">Español</option>
                <option value="en" className="bg-black">English</option>
                <option value="ca" className="bg-black">Català</option>
              </select>
            </label>
          </>
        )}

        {/* Email con verificación en tiempo real (registro) */}
        {mode === "register" ? (
          <div>
            <label className="block rounded-md border border-white/10 bg-black/35 p-2 sm:p-3 cursor-text transition focus-within:border-lime-300/40">
              <span className="mb-1 sm:mb-2 flex items-center gap-2 text-[10px] sm:text-xs uppercase tracking-[0.2em] text-white/45">
                <AtSign className="h-3.5 w-3.5" /> Correo
              </span>
              <div className="flex items-center gap-2">
                <input className="flex-1 bg-transparent text-white outline-none placeholder:text-white/30 text-sm"
                  type="email" name="email" autoComplete="email" value={email}
                  placeholder="tu@email.com" onChange={(e) => setEmail(e.target.value)} />
                {emailStatus === "checking"  && <Loader2 className="h-4 w-4 animate-spin text-white/40 shrink-0" />}
                {emailStatus === "available" && <CheckCircle2 className="h-4 w-4 text-lime-300 shrink-0" />}
                {emailStatus === "taken"     && <XCircle className="h-4 w-4 text-orange-400 shrink-0" />}
              </div>
            </label>
            {emailStatus === "available" && (
              <p className="mt-1.5 text-[11px] text-lime-300/80 pl-1">✦ Correo libre. El cosmos te estaba esperando.</p>
            )}
            {emailStatus === "taken" && (
              <div className="mt-2 rounded-xl border border-orange-400/30 bg-orange-400/08 p-4">
                <p className="text-sm font-black text-orange-200">
                  {hasGoogleMethod ? "⚡ Esta cuenta usa Google para entrar." : "🔮 Este correo ya tiene cuenta en ZODI."}
                </p>
                <p className="mt-1 text-xs text-white/55">
                  {hasGoogleMethod ? "Usa el botón de Google de arriba." : "Ya tienes portal abierto. ¿Lo olvidaste?"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {hasGoogleMethod ? (
                    <button type="button" onClick={loginWithGoogle}
                      className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-black text-black hover:bg-white/90 transition">
                      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Entrar con Google
                    </button>
                  ) : (
                    <a href="/auth/login" className="rounded-lg bg-lime-300 px-3 py-2 text-xs font-black text-black hover:bg-lime-200 transition">
                      Entrar a mi cuenta
                    </a>
                  )}
                  <button type="button" onClick={resetPassword}
                    className="rounded-lg border border-white/20 px-3 py-2 text-xs font-bold text-white/70 hover:bg-white/10 transition">
                    Olvidé mi contraseña
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Field icon={AtSign} label="Correo" value={email} onChange={setEmail} type="email" name="email" autoComplete="email" placeholder="tu@email.com" />
        )}

        <div className="relative">
          <Field icon={Lock} label="Contraseña" value={password} onChange={setPassword}
            type={showPwd ? "text" : "password"}
            name={mode === "login" ? "current-password" : "new-password"}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            placeholder="Mínimo 6 caracteres"
          />
          <button type="button" onClick={() => setShowPwd(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
            aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}>
            {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {mode === "register" && (
          <Field icon={Lock} label="Confirmar contraseña" value={confirm} onChange={setConfirm}
            type={showPwd ? "text" : "password"} name="confirm-password" autoComplete="new-password"
            placeholder="Repite tu contraseña" />
        )}
      </form>

      <div className="mt-3 sm:mt-4 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-white/62">
        {mode === "login" ? (
          <label className="flex cursor-pointer items-center gap-2">
            <input type="checkbox" name="remember" defaultChecked />
            Recordar sesión
          </label>
        ) : (
          <label className="flex cursor-pointer items-center gap-2">
            <input checked={terms} onChange={e => setTerms(e.target.checked)} type="checkbox" name="terms" />
            Aceptar <Link href="/legal/terminos" className="text-lime-200 hover:underline">términos</Link>
          </label>
        )}
        {mode === "login" && (
          <button onClick={resetPassword} type="button" className="text-lime-200 hover:underline">
            Olvidé mi contraseña
          </button>
        )}
      </div>

      <button type="submit" form="zodi-auth-form" disabled={loading || isGoogleBusy}
        className="mt-4 sm:mt-5 w-full rounded-md bg-lime-300 px-4 py-2.5 sm:py-3 text-sm sm:text-base font-black text-black disabled:opacity-60 active:scale-95 transition"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {mode === "login" ? "Entrando..." : "Creando cuenta..."}
          </span>
        ) : (
          mode === "login" ? "Entrar" : "Crear cuenta"
        )}
      </button>

      {message && (
        <div className={`mt-4 flex items-start gap-2.5 rounded-md border p-3 text-sm ${
          msgType === "success"
            ? "border-green-400/30 bg-green-400/10 text-green-100"
            : (msgType === "error" || message.startsWith("⚠️"))
            ? "border-orange-400/30 bg-orange-400/10 text-orange-100"
            : "border-lime-300/20 bg-lime-300/10 text-lime-100"
        }`}>
          {(msgType === "error" || message.startsWith("⚠️")) && <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-orange-400" />}
          <span>{message}</span>
        </div>
      )}

      <p className="mt-5 text-sm text-white/55">
        {mode === "login" ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
        <Link className="text-lime-200 hover:underline" href={mode === "login" ? "/auth/register" : "/auth/login"}>
          {mode === "login" ? "Crear cuenta gratis" : "Entrar"}
        </Link>
      </p>

      <div className="mt-4 pt-4 border-t border-white/08 text-center">
        <Link href="/" className="text-xs text-white/35 hover:text-white/60 transition">
          ← Volver a la web sin iniciar sesión
        </Link>
      </div>
    </div>
  );
}

function Field({ icon: Icon, label, value, onChange, type, placeholder, name, autoComplete }: {
  icon: typeof AtSign; label: string; value: string;
  onChange: (v: string) => void; type: string;
  placeholder?: string; name: string; autoComplete: string;
}) {
  return (
    <label className="block rounded-md border border-white/10 bg-black/35 p-2 sm:p-3 cursor-text transition focus-within:border-lime-300/40">
      <span className="mb-1 sm:mb-2 flex items-center gap-2 text-[10px] sm:text-xs uppercase tracking-[0.2em] text-white/45">
        <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> {label}
      </span>
      <input
        className="w-full bg-transparent text-white outline-none placeholder:text-white/30 text-sm sm:text-base"
        type={type} name={name} autoComplete={autoComplete} value={value}
        placeholder={placeholder} onChange={e => onChange(e.target.value)}
      />
    </label>
  );
}
