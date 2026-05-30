import { NextResponse } from "next/server";
import { getFirebaseAdmin, getFirebaseAuth } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
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

    const { referrerId, newUserId } = await request.json();

    if (!referrerId || !newUserId || decoded.uid !== newUserId) {
      return NextResponse.json({ error: "Faltan parámetros o sin permisos" }, { status: 400 });
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
