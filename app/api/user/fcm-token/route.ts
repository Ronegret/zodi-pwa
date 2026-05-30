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

    const { token, userId } = await request.json();

    if (!token || !userId || decoded.uid !== userId) {
      return NextResponse.json({ error: "Faltan parámetros o sin permisos" }, { status: 400 });
    }

    const db = await getFirebaseAdmin();
    if (!db) {
      return NextResponse.json({ error: "DB admin no configurado" }, { status: 500 });
    }

    // Guardar o actualizar el token FCM en el perfil del usuario
    await db.collection("users").doc(userId).set({
      fcmTokens: FieldValue.arrayUnion(token),
      notificationsEnabled: true,
      lastActive: FieldValue.serverTimestamp()
    }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error guardando FCM token:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
