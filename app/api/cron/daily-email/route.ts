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
<body style="margin: 0; padding: 0; background-color: #060608; font-family: Helvetica, Arial, sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#060608" style="background-color: #060608;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #0a0a0c; border: 1px solid #333333; border-radius: 12px; overflow: hidden;">
          <tr>
            <td style="background-color: #000000; padding: 25px 30px; border-bottom: 2px solid #b8ff17;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="70" valign="middle">
                    <img src="https://zodi.aibueno.es/icons/icon-512.png" alt="ZODI Profile" width="60" style="display: block; border-radius: 50%; border: 2px solid #b8ff17;">
                  </td>
                  <td valign="middle" style="padding-left: 15px;">
                    <h1 style="color: #ffffff; font-size: 20px; margin: 0; font-weight: 800; letter-spacing: 1px;">ZODI</h1>
                    <p style="color: #b8ff17; font-size: 13px; margin: 5px 0 0 0; text-transform: uppercase; font-weight: bold;">En línea - El Oráculo</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px; background-color: #050505;">
              <p style="color: #9b4dff; font-size: 14px; text-transform: uppercase; margin: 0 0 10px 0; font-weight: bold; letter-spacing: 1px;">Mensaje Directo:</p>
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="background-color: #1a1a24; padding: 25px; border-radius: 0px 20px 20px 20px; border-left: 4px solid #9b4dff;">
                    <p style="color: #ffffff; font-size: 18px; line-height: 1.7; margin: 0;">
                      "${horoscopeText}"
                    </p>
                  </td>
                </tr>
              </table>
              <br><br>
              <table border="0" cellspacing="0" cellpadding="0" align="center">
                <tr>
                  <td align="center" bgcolor="#b8ff17" style="border-radius: 30px;">
                    <a href="https://zodi.aibueno.es/dashboard" target="_blank" style="font-size: 16px; font-weight: 800; color: #000000; text-decoration: none; padding: 18px 36px; display: inline-block; text-transform: uppercase; letter-spacing: 2px;">
                      RESPONDER EN LA APP
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px; background-color: #0e0e14; border-top: 1px solid #222222;">
              <h3 style="color: #b8ff17; font-size: 18px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 25px 0; font-weight: 800; text-align: center;">ADEMÁS DEL HORÓSCOPO...</h3>
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="80" valign="top">
                    <img src="https://zodi.aibueno.es/zodi-art/zodi-us.png" width="70" style="display:block; border-radius: 10px; border: 1px solid #9b4dff;">
                  </td>
                  <td valign="top" style="padding-left: 15px;">
                    <h4 style="color: #ffffff; font-size: 16px; margin: 0 0 5px 0; text-transform: uppercase;">Habla con ZODI</h4>
                    <p style="color: #aaaaaa; font-size: 14px; margin: 0; line-height: 1.5;">Hazle una pregunta directa al oráculo. Tarot, numerología, destino o simplemente un consejo brutalmente honesto. ZODI no se guarda nada.</p>
                  </td>
                </tr>
              </table>
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
