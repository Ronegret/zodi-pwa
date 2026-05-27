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
      updatedAt: serverTimestamp()
    }, { merge: true }),
    setDoc(doc(db, "astralProfiles", uid), {
      ...data,
      ...astralProfile,
      updatedAt: serverTimestamp()
    }, { merge: true })
  ]);

  return { ok: true };
}

export const zodiFirebaseSchema = firebaseCollections.map((collection) => {
  const examples: Record<string, string[]> = {
    users: ["uid", "displayName", "username", "avatar", "onboardingCompleted", "plan", "xp", "level", "streak"],
    astralProfiles: ["uid", "birthDate", "birthTime", "birthCity", "sunSign", "moonSign", "ascendant", "lifePathNumber"],
    readings: ["uid", "kind", "input", "response", "tone", "createdAt"],
    favorites: ["uid", "readingId", "createdAt"],
    history: ["uid", "eventType", "metadata", "createdAt"],
    subscriptions: ["uid", "plan", "status", "renewalDate"],
    communityPosts: ["authorUid", "username", "zodiac", "body", "heat", "createdAt"],
    dailyTopicComments: ["topic", "authorUid", "username", "body", "createdAt"],
    comments: ["postId", "authorUid", "username", "body", "createdAt"],
    reactions: ["targetId", "targetType", "uid", "reaction"],
    friends: ["requesterUid", "receiverUid", "status"],
    chatMessages: ["authorUid", "fromUsername", "toUsername", "body", "createdAt"],
    achievements: ["uid", "achievementId", "xp", "unlockedAt"],
    notifications: ["uid", "type", "title", "body", "read"]
  };
  return { collection, fields: examples[collection] ?? [] };
});
