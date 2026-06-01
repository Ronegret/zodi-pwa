const clientFirebaseKeys = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
] as const;

const adminFirebaseKeys = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
] as const;

export function getRuntimeEnvStatus() {
  const missingFirebaseClient = clientFirebaseKeys.filter((key) => !process.env[key]);
  const missingFirebaseAdmin = adminFirebaseKeys.filter((key) => !process.env[key]);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  let siteUrlValid = false;

  if (siteUrl) {
    try {
      const parsed = new URL(siteUrl);
      siteUrlValid = parsed.protocol === "https:" || parsed.hostname === "localhost";
    } catch {
      siteUrlValid = false;
    }
  }

  return {
    firebaseClientReady: missingFirebaseClient.length === 0,
    firebaseAdminReady: missingFirebaseAdmin.length === 0,
    siteUrlReady: Boolean(siteUrl && siteUrlValid),
    missingFirebaseClient,
    missingFirebaseAdmin,
    siteUrlValid,
  };
}
