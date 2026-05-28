import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { sendZodiEmail } from "@/lib/email";
import { GoogleGenAI } from "@google/genai";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const adminDb = await getFirebaseAdmin();
    if (!adminDb) {
      return NextResponse.json({ error: "Firebase admin not configured" }, { status: 500 });
    }

    const snapshot = await adminDb.collection("users").where("emailSubscribed", "==", true).get();
    if (snapshot.empty) {
      return NextResponse.json({ message: "No subscribed users found" });
    }

    const emailsSent: string[] = [];
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    for (const doc of snapshot.docs) {
      const user = doc.data();
      if (!user.email) continue;

      const sign = user.profile?.sunSign || "Desconocido";
      const name = user.displayName || "Mortal";

      let horoscopeText = "Las estrellas están confusas hoy, pero tú sigues siendo un caos.";
      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `Genera un horóscopo súper corto (2 oraciones máximo) y muy directo para ${name}, que es de signo ${sign}. Tono: sarcástico, místico, ácido. No uses introducciones.`
        });
        if (response.text) {
          horoscopeText = response.text;
        }
      } catch (e) {}

      const htmlTemplate = `
<body style="margin: 0; padding: 0; background-color: #000000;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#000000" style="background-color: #000000;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #000000; border: 2px solid #b8ff17;">
          <tr>
            <td align="center" style="background-color: #000000; padding: 40px 20px; border-bottom: 2px solid #b8ff17;">
              <img src="https://zodi.aibueno.es/zodi-logo-mark.png" alt="ZODI" width="180" style="display: block; margin: 0 auto;">
              <p style="color: #b8ff17; font-family: 'Courier New', monospace; font-size: 14px; font-weight: bold; letter-spacing: 5px; margin-top: 20px;">LA INTELIGENCIA DEL CAOS</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="background-color: #000000;">
              <img src="https://zodi.aibueno.es/zodi-art/zodi-horoscopo-card.png" alt="Oraculo" width="600" style="display: block; width: 100%; max-width: 600px;">
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 50px 30px; background-color: #050505;">
              <h2 style="color: #b8ff17; font-family: 'Arial Black', Impact, sans-serif; font-size: 30px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 30px 0;">TU LECTURA DIARIA</h2>
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="border-left: 6px solid #b8ff17; background-color: #111111; padding: 25px;">
                    <p style="color: #ffffff; font-family: 'Courier New', monospace; font-size: 18px; line-height: 1.6; margin: 0; font-weight: bold;">
                      "${horoscopeText}"
                    </p>
                  </td>
                </tr>
              </table>
              <br><br><br>
              <table border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" bgcolor="#b8ff17" style="border-radius: 4px;">
                    <a href="https://zodi.aibueno.es/dashboard" target="_blank" style="font-size: 18px; font-family: 'Arial Black', Impact, sans-serif; font-weight: bold; color: #000000; text-decoration: none; padding: 20px 40px; display: inline-block; text-transform: uppercase; letter-spacing: 3px;">
                      CONECTAR AL PORTAL ZODI
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 40px 20px; background-color: #000000; border-top: 1px solid #333333;">
              <img src="https://zodi.aibueno.es/zodi-logo-mark.png" alt="ZODI" width="100" style="display: block; margin: 0 auto; opacity: 0.5;">
              <p style="color: #666666; font-family: 'Courier New', monospace; font-size: 12px; margin-top: 20px; text-transform: uppercase; letter-spacing: 2px;">
                ZODI AI © 2026. EL UNIVERSO ES CAÓTICO.<br><br>
                ESTÁS RECIBIENDO ESTO PORQUE ESTÁS EN LA MATRIX DE ZODI.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
`;

      await sendZodiEmail({
        to: user.email,
        subject: `🔮 ZODI: Tu veredicto de hoy (${sign})`,
        html: htmlTemplate,
      });

      emailsSent.push(user.email);
    }

    return NextResponse.json({ success: true, sentTo: emailsSent });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to run daily email cron" }, { status: 500 });
  }
}
