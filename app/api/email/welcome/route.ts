import { NextResponse } from "next/server";
import { sendZodiEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { email, displayName, sunSign } = await req.json();
    if (!email || !displayName) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const sign = sunSign ?? "tu signo";
    const html = `
<body style="margin:0;padding:0;background:#060608;font-family:Helvetica,Arial,sans-serif;">
<table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#060608">
  <tr><td align="center" style="padding:20px 10px;">
    <table width="600" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;background:#0a0a0c;border:1px solid #333;border-radius:12px;overflow:hidden;">
      <!-- Header -->
      <tr>
        <td style="background:#000;padding:25px 30px;border-bottom:2px solid #b8ff17;">
          <table width="100%"><tr>
            <td width="70" valign="middle">
              <img src="https://zodi.aibueno.es/icons/icon-512.png" alt="ZODI" width="60" style="display:block;border-radius:50%;border:2px solid #b8ff17;">
            </td>
            <td valign="middle" style="padding-left:15px;">
              <h1 style="color:#fff;font-size:22px;margin:0;font-weight:800;letter-spacing:1px;">ZODI</h1>
              <p style="color:#b8ff17;font-size:13px;margin:4px 0 0;text-transform:uppercase;font-weight:700;">Tu oráculo astral</p>
            </td>
          </tr></table>
        </td>
      </tr>
      <!-- Body -->
      <tr>
        <td style="padding:40px 30px;background:#050505;">
          <h2 style="color:#fff;font-size:26px;font-weight:800;margin:0 0 8px;">Bienvenido, ${displayName}.</h2>
          <p style="color:#b8ff17;font-size:14px;margin:0 0 24px;font-weight:700;">ZODI ya sabe que eres ${sign}. El cosmos también.</p>
          <table width="100%"><tr>
            <td style="background:#1a1a24;padding:20px;border-radius:0 16px 16px 16px;border-left:4px solid #9b4dff;">
              <p style="color:#fff;font-size:16px;line-height:1.7;margin:0;">
                Tu perfil astral está listo. Tienes acceso a 17 tipos de lectura, 4 tonos de respuesta y la comunidad más honesta del cosmos. Sin postureo. Con humor.
              </p>
            </td>
          </tr></table>
          <br>
          <p style="color:#aaa;font-size:14px;margin:0 0 20px;">Para empezar, prueba estas 3 cosas:</p>
          <table width="100%">
            <tr><td style="padding:10px 0;border-bottom:1px solid #222;">
              <p style="color:#b8ff17;font-size:13px;font-weight:800;margin:0;">01 · Tu horóscopo de hoy</p>
              <p style="color:#888;font-size:12px;margin:4px 0 0;">Elige el tono: suave, directo, brutal o sarcástico.</p>
            </td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #222;">
              <p style="color:#9b4dff;font-size:13px;font-weight:800;margin:0;">02 · Primera tirada de tarot</p>
              <p style="color:#888;font-size:12px;margin:4px 0 0;">Las 7 cartas ZODI te dicen lo que probablemente ya sabes.</p>
            </td></tr>
            <tr><td style="padding:10px 0;">
              <p style="color:#06b6d4;font-size:13px;font-weight:800;margin:0;">03 · Tu carta natal completa</p>
              <p style="color:#888;font-size:12px;margin:4px 0 0;">Sol, Luna, Ascendente y todo lo que define tu energía.</p>
            </td></tr>
          </table>
          <br><br>
          <table border="0" cellspacing="0" cellpadding="0" align="center">
            <tr><td align="center" bgcolor="#b8ff17" style="border-radius:30px;">
              <a href="https://zodi.aibueno.es/dashboard" target="_blank" style="font-size:15px;font-weight:800;color:#000;text-decoration:none;padding:16px 32px;display:inline-block;text-transform:uppercase;letter-spacing:2px;">
                Abrir ZODI →
              </a>
            </td></tr>
          </table>
        </td>
      </tr>
      <!-- Footer -->
      <tr>
        <td style="padding:20px 30px;background:#0e0e14;border-top:1px solid #222;text-align:center;">
          <p style="color:#555;font-size:11px;margin:0;">© 2026 ZODI · Tu futuro, sin filtro. · <a href="https://zodi.aibueno.es/legal/privacidad" style="color:#777;">Privacidad</a></p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>`;

    await sendZodiEmail({
      to: email,
      subject: `🔮 Bienvenido a ZODI, ${displayName}`,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[ZODI] Welcome email error:", err);
    return NextResponse.json({ error: "Email failed" }, { status: 500 });
  }
}
