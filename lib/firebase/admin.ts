import * as admin from "firebase-admin";

export function initFirebaseAdmin() {
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    return false;
  }

  if (!admin.apps.length) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
      });
    } catch (e) {
      console.error("[ZODI] Firebase Admin init failed:", e);
      return false;
    }
  }
  return true;
}

export async function getFirebaseAdmin() {
  if (!initFirebaseAdmin()) return null;
  return admin.firestore();
}

export function getFirebaseAuth() {
  if (!initFirebaseAdmin()) return null;
  return admin.auth();
}
