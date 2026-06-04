import * as admin from "firebase-admin";

// Cache del resultado de inicialización — evita reintentos en cada request
let _initResult: boolean | null = null;

export function initFirebaseAdmin(): boolean {
  if (_initResult !== null) return _initResult;

  if (
    !process.env.FIREBASE_PROJECT_ID ||
    !process.env.FIREBASE_CLIENT_EMAIL ||
    !process.env.FIREBASE_PRIVATE_KEY
  ) {
    _initResult = false;
    return false;
  }

  if (admin.apps.length) {
    _initResult = true;
    return true;
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    });
    _initResult = true;
    return true;
  } catch (e) {
    console.error("[ZODI] Firebase Admin init failed:", e);
    _initResult = false;
    return false;
  }
}

export async function getFirebaseAdmin() {
  if (!initFirebaseAdmin()) return null;
  return admin.firestore();
}

export function getFirebaseAuth() {
  if (!initFirebaseAdmin()) return null;
  return admin.auth();
}

export function getFirebaseMessaging() {
  if (!initFirebaseAdmin()) return null;
  return admin.messaging();
}
