import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { firebaseCollections } from "@/lib/astral";
import { getFirebaseDb } from "@/lib/firebase/client";
import type { AstralProfile, OnboardingData, UserProfile } from "@/types/zodi";

export async function upsertProfile(profile: UserProfile) {
  const db = getFirebaseDb();
  if (!db) {
    return { ok: false, reason: "Firebase env vars are not configured." };
  }

  await setDoc(
    doc(db, "users", profile.uid),
    {
      ...profile,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );

  return { ok: true };
}

export async function getProfile(uid: string) {
  const db = getFirebaseDb();
  if (!db) {
    return undefined;
  }

  const snapshot = await getDoc(doc(db, "users", uid));
  return snapshot.exists() ? (snapshot.data() as UserProfile) : undefined;
}

export async function saveOnboardingProfile(uid: string, data: OnboardingData, astralProfile: AstralProfile) {
  const db = getFirebaseDb();
  if (!db) {
    return { ok: false, reason: "Firebase env vars are not configured." };
  }

  // Generate a unique referral code based on UID
  const referralCode = uid.substring(0, 8).toUpperCase();

  await Promise.all([
    setDoc(doc(db, "users", uid), {
      displayName: data.displayName,
      username: data.username,
      avatar: data.avatar,
      genderIdentity: data.genderIdentity ?? null,
      onboardingCompleted: true,
      readingTone: data.readingTone,
      favoriteTopics: data.favoriteTopics,
      notificationPreferences: data.notificationPreferences,
      // Guardar datos clave también en users como respaldo (permite recuperar si astralProfiles falla)
      birthDate: data.birthDate ?? null,
      birthTime: data.birthTime ?? null,
      birthCity: data.birthCity ?? null,
      birthCountry: data.birthCountry ?? null,
      currentCity: data.currentCity ?? null,
      currentCountry: data.currentCountry ?? null,
      referralCode,
      updatedAt: serverTimestamp()
    }, { merge: true }),
    setDoc(doc(db, "astralProfiles", uid), {
      ...data,
      ...astralProfile,
      updatedAt: serverTimestamp()
    }, { merge: true })
  ]);

  return { ok: true, referralCode };
}

export async function updateGems(uid: string, amount: number) {
  const db = getFirebaseDb();
  if (!db) return { ok: false };
  
  // En producción, esto debería usar runTransaction o increment para seguridad,
  // pero usaremos merge temporalmente mientras se integra Stripe.
  const profile = await getProfile(uid);
  const currentGems = profile?.gems ?? 0;
  
  await setDoc(doc(db, "users", uid), {
    gems: currentGems + amount,
    updatedAt: serverTimestamp()
  }, { merge: true });
  
  return { ok: true, newTotal: currentGems + amount };
}

import { collection, query, where, getDocs, runTransaction } from "firebase/firestore";

export async function applyReferralCode(newUid: string, referralCode: string) {
  const db = getFirebaseDb();
  if (!db) return { ok: false };

  const usersRef = collection(db, "users");
  const q = query(usersRef, where("referralCode", "==", referralCode));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return { ok: false, reason: "Invalid referral code" };
  }

  const referrerDoc = querySnapshot.docs[0];
  const referrerUid = referrerDoc.id;

  if (referrerUid === newUid) {
    return { ok: false, reason: "Can't refer yourself" };
  }

  try {
    await runTransaction(db, async (transaction) => {
      const newRef = doc(db, "users", newUid);
      const newDocSnap = await transaction.get(newRef);
      if (newDocSnap.exists() && newDocSnap.data().referredBy) {
        throw new Error("Already referred");
      }

      // Add 100 gems to referrer
      const referrerRef = doc(db, "users", referrerUid);
      const refSnap = await transaction.get(referrerRef);
      const currentRefGems = refSnap.data()?.gems ?? 0;
      transaction.update(referrerRef, { gems: currentRefGems + 100 });

      // Add 50 gems to new user, mark as referred
      const currentNewGems = newDocSnap.data()?.gems ?? 0;
      transaction.set(newRef, { 
        gems: currentNewGems + 50,
        referredBy: referrerUid,
        updatedAt: serverTimestamp()
      }, { merge: true });
    });
    return { ok: true };
  } catch (e: any) {
    return { ok: false, reason: e.message };
  }
}

export const zodiFirebaseSchema = firebaseCollections.map((collection) => {
  const examples: Record<string, string[]> = {
    users: ["uid", "displayName", "username", "avatar", "onboardingCompleted", "plan", "xp", "level", "streak"],
    astralProfiles: ["uid", "birthDate", "birthTime", "birthCity", "sunSign", "moonSign", "ascendant", "lifePathNumber"],
    readings: ["uid", "kind", "input", "response", "tone", "createdAt"],
    favorites: ["uid", "readingId", "createdAt"],
    history: ["uid", "eventType", "metadata", "createdAt"],
    subscriptions: ["uid", "plan", "status", "renewalDate"],
    communityPosts: ["authorId", "username", "zodiac", "body", "heat", "createdAt"],
    dailyTopicComments: ["topic", "authorId", "username", "body", "createdAt"],
    comments: ["postId", "authorId", "username", "body", "createdAt"],
    reactions: ["targetId", "targetType", "uid", "reaction"],
    friends: ["requesterUid", "receiverUid", "status"],
    chatMessages: ["userId", "authorId", "fromUsername", "toUsername", "body", "createdAt"],
    achievements: ["uid", "achievementId", "xp", "unlockedAt"],
    notifications: ["uid", "type", "title", "body", "read"]
  };
  return { collection, fields: examples[collection] ?? [] };
});
