import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase/admin";

export async function POST(req: Request) {
  try {
    const { uid, email, subscribe } = await req.json();

    if (!uid || !email) {
      return NextResponse.json({ error: "Missing user info" }, { status: 400 });
    }

    const adminDb = await getFirebaseAdmin();
    if (!adminDb) {
      return NextResponse.json({ error: "Server error: Firebase admin not configured" }, { status: 500 });
    }

    const userRef = adminDb.collection("users").doc(uid);
    await userRef.set({ 
      email, 
      emailSubscribed: subscribe,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    return NextResponse.json({ success: true, subscribed: subscribe });
  } catch (error: any) {
    console.error("Subscription error:", error.message);
    return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 });
  }
}
