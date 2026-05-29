import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: Request) {
  try {
    const { token, userId } = await request.json();

    if (!token || !userId) {
      return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
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
