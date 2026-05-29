import { NextResponse } from "next/server";
import { getFirebaseAdmin, getFirebaseAuth } from "@/lib/firebase/admin";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const auth = getFirebaseAuth();
    const db = await getFirebaseAdmin();

    if (!auth || !db) {
      return NextResponse.json({ error: "Configuración del servidor incompleta" }, { status: 500 });
    }

    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch (e) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const uid = decodedToken.uid;

    // 1. Eliminar datos de Firestore
    await db.collection("users").doc(uid).delete();

    // 2. Eliminar usuario de Firebase Auth
    await auth.deleteUser(uid);

    return NextResponse.json({ success: true, message: "Cuenta y datos eliminados correctamente." });
  } catch (error: any) {
    console.error("Error al eliminar cuenta:", error);
    return NextResponse.json({ error: "Error interno al procesar la eliminación." }, { status: 500 });
  }
}
