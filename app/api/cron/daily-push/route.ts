import { NextResponse } from "next/server";
import { getFirebaseAdmin, getFirebaseMessaging } from "@/lib/firebase/admin";
import { GoogleGenAI } from "@google/genai";

// Tránsitos semanales simplificados (día de la semana → planeta activo)
const WEEKLY_TRANSITS: Record<number, string> = {
  0: "Sol en el punto más alto — energía de apertura y visibilidad",
  1: "Luna en tránsito — día de intuición y memoria emocional",
  2: "Marte activo — energía de acción y decisiones directas",
  3: "Mercurio en movimiento — comunicación y claridad mental",
  4: "Júpiter en expansión — día de suerte y oportunidades",
  5: "Venus en tránsito — amor, dinero y atracción en primer plano",
  6: "Saturno marcando límites — día de revisión y estructura",
};

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const adminDb = await getFirebaseAdmin();
    const messaging = getFirebaseMessaging();

    if (!adminDb || !messaging) {
      return NextResponse.json({ error: "Firebase admin not configured" }, { status: 500 });
    }

    const snapshot = await adminDb
      .collection("users")
      .where("notificationsEnabled", "==", true)
      .get();

    // Lunes y jueves: enviar notificación de tránsito semanal
    const dayOfWeek = new Date().getDay();
    const isTransitDay = dayOfWeek === 1 || dayOfWeek === 4;
    const weeklyTransit = WEEKLY_TRANSITS[dayOfWeek];

    if (snapshot.empty) {
      return NextResponse.json({ message: "No users with push enabled" });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    let sent = 0;
    let failed = 0;

    for (const doc of snapshot.docs) {
      const user = doc.data();
      const tokens: string[] = user.fcmTokens ?? [];
      if (tokens.length === 0) continue;

      const sign = user.profile?.sunSign || user.sunSign || "Desconocido";
      const name = (user.displayName || "Mortal").split(" ")[0];

      let body = "El cosmos tiene algo que decirte. Abre ZODI. 🔮";
      try {
        const promptText = isTransitDay
          ? `En 90 caracteres máximo, di algo ácido y útil a ${name} (${sign}) sobre este tránsito: "${weeklyTransit}". Sin comillas.`
          : `Genera UNA frase corta (máx 100 caracteres) de horóscopo ácido y directo para ${name}, ${sign}. Sin comillas. Sin emojis al inicio. Solo la frase.`;
        const response = await ai.models.generateContent({
          model: "gemini-1.5-flash",
          contents: promptText,
        });
        if (response.text) {
          body = response.text.trim().slice(0, 120);
        }
      } catch {
        if (isTransitDay) body = `Tránsito de hoy: ${weeklyTransit.split("—")[0].trim()}. Tu energía habla.`;
      }

      try {
        const response = await messaging.sendEachForMulticast({
          tokens,
          notification: {
            title: `🔮 ZODI para ${name}`,
            body,
          },
          webpush: {
            notification: {
              icon: "/icons/icon-512.png",
              badge: "/icons/icon-512.png",
              requireInteraction: false,
            },
            fcmOptions: {
              link: "https://zodi.aibueno.es/dashboard",
            },
          },
          data: {
            type: "daily-horoscope",
            sign,
          },
        });

        sent += response.successCount;
        failed += response.failureCount;

        // Limpiar tokens inválidos de Firestore
        const invalidTokens: string[] = [];
        response.responses.forEach((r, i) => {
          if (!r.success && r.error?.code === "messaging/registration-token-not-registered") {
            invalidTokens.push(tokens[i]);
          }
        });
        if (invalidTokens.length > 0) {
          const { FieldValue } = await import("firebase-admin/firestore");
          await adminDb.collection("users").doc(doc.id).update({
            fcmTokens: FieldValue.arrayRemove(...invalidTokens),
          });
        }
      } catch (e) {
        console.error(`[ZODI push] Error sending to ${doc.id}:`, e);
        failed++;
      }
    }

    return NextResponse.json({ success: true, sent, failed, total: snapshot.size });
  } catch (error) {
    console.error("[ZODI push cron] Fatal error:", error);
    return NextResponse.json({ error: "Push cron failed" }, { status: 500 });
  }
}
