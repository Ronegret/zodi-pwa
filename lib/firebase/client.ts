import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, onAuthStateChanged } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId
);

let app: FirebaseApp | undefined;

export function getFirebaseApp() {
  if (!isFirebaseConfigured) {
    return undefined;
  }

  if (!app) {
    app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  }

  return app;
}

export function getFirebaseAuth() {
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) {
    return undefined;
  }

  const auth = getAuth(firebaseApp);
  auth.useDeviceLanguage();
  return auth;
}

export function getFirebaseDb() {
  const firebaseApp = getFirebaseApp();
  return firebaseApp ? getFirestore(firebaseApp) : undefined;
}

// Obtiene el token esperando el estado de auth (hasta 3s).
// Nunca bloquea — si Firebase no está listo devuelve "local_session".
export async function getFirebaseToken(): Promise<string> {
  const auth = getFirebaseAuth();
  if (!auth) return "local_session";
  if (auth.currentUser) return auth.currentUser.getIdToken();

  return new Promise((resolve) => {
    const timeout = setTimeout(() => { unsub(); resolve("local_session"); }, 3000);
    const unsub = onAuthStateChanged(auth, (user) => {
      clearTimeout(timeout);
      unsub();
      if (user) {
        user.getIdToken()
          .then(token => resolve(token))
          .catch(() => resolve("local_session")); // nunca swallow la excepción
      } else {
        resolve("local_session");
      }
    });
  });
}

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });
googleProvider.addScope("email");
googleProvider.addScope("profile");
