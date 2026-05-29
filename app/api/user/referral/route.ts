import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: Request) {
  try {
    const { referrerId, newUserId } = await request.json();

    if (!referrerId || !newUserId) {
      return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
    }

    const db = await getFirebaseAdmin();
    if (!db) {
      return NextResponse.json({ error: "DB admin no configurado" }, { status: 500 });
    }

    // Reference to the referrer's gamification document
    const refDoc = db.collection("gamification").doc(referrerId);
    
    // Add 500 gems using an atomic increment operation
    await refDoc.set({
      gems: FieldValue.increment(500),
      referrals: FieldValue.increment(1),
      lastUpdated: FieldValue.serverTimestamp()
    }, { merge: true });

    return NextResponse.json({ success: true, gemsAwarded: 500 });
  } catch (error) {
    console.error("Error procesando referido:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
