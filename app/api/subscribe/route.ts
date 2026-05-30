import { NextResponse } from "next/server";
import { getFirebaseAdmin, getFirebaseAuth } from "@/lib/firebase/admin";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const idToken = authHeader.split("Bearer ")[1];
    const auth = getFirebaseAuth();
    if (!auth) {
      return NextResponse.json({ error: "Server config error" }, { status: 500 });
    }
    let decoded;
    try {
      decoded = await auth.verifyIdToken(idToken);
    } catch (e) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const { uid, email, subscribe } = await req.json();

    if (!uid || !email || decoded.uid !== uid) {
      return NextResponse.json({ error: "Missing user info or unauthorized" }, { status: 400 });
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
