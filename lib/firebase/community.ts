import { addDoc, collection, serverTimestamp, setDoc, doc } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase/client";

type CommunityPostInput = {
  username: string;
  sign: string;
  body: string;
};

type CommentInput = {
  postId: string;
  username: string;
  body: string;
};

type TopicCommentInput = {
  topic: string;
  username: string;
  body: string;
};

type ChatMessageInput = {
  fromUsername: string;
  toUsername: string;
  body: string;
};

export async function saveCommunityPost(input: CommunityPostInput) {
  const db = getFirebaseDb();
  if (!db) return { ok: false };

  const auth = getFirebaseAuth();
  const uid = auth?.currentUser?.uid;
  if (!uid) return { ok: false, reason: "auth-required" };

  await addDoc(collection(db, "communityPosts"), {
    authorId: uid,
    username: input.username,
    zodiac: input.sign,
    body: input.body,
    heat: 0,
    createdAt: serverTimestamp()
  });

  return { ok: true };
}

export async function saveCommunityComment(input: CommentInput) {
  const db = getFirebaseDb();
  if (!db) return { ok: false };

  const auth = getFirebaseAuth();
  const uid = auth?.currentUser?.uid;
  if (!uid) return { ok: false, reason: "auth-required" };

  await addDoc(collection(db, "comments"), {
    postId: input.postId,
    authorId: uid,
    username: input.username,
    body: input.body,
    createdAt: serverTimestamp()
  });

  return { ok: true };
}

export async function saveDailyTopicComment(input: TopicCommentInput) {
  const db = getFirebaseDb();
  if (!db) return { ok: false };

  const auth = getFirebaseAuth();
  const uid = auth?.currentUser?.uid;
  if (!uid) return { ok: false, reason: "auth-required" };

  await addDoc(collection(db, "dailyTopicComments"), {
    topic: input.topic,
    authorId: uid,
    username: input.username,
    body: input.body,
    createdAt: serverTimestamp()
  });

  return { ok: true };
}

export async function saveChatMessage(input: ChatMessageInput) {
  const db = getFirebaseDb();
  if (!db) return { ok: false };

  const auth = getFirebaseAuth();
  const uid = auth?.currentUser?.uid;
  if (!uid) return { ok: false, reason: "auth-required" };

  await addDoc(collection(db, "chatMessages"), {
    userId: uid,
    authorId: uid,
    fromUsername: input.fromUsername,
    toUsername: input.toUsername,
    body: input.body,
    createdAt: serverTimestamp()
  });

  return { ok: true };
}

export async function deletePrivateChat(fromUsername: string, toUsername: string) {
  const db = getFirebaseDb();
  if (!db) return { ok: false };

  const auth = getFirebaseAuth();
  const uid = auth?.currentUser?.uid;
  if (!uid) return { ok: false };

  const chatId = [fromUsername, toUsername].sort().join("--");
  await setDoc(
    doc(db, "deletedChats", `${uid}--${chatId}`),
    { userId: uid, fromUsername, toUsername, deletedAt: serverTimestamp() },
    { merge: true }
  );

  return { ok: true };
}
