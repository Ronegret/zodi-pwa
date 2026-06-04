import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

// Rate limit: max 3 demos por IP por día (in-memory, se resetea al reiniciar server)
const ipDemoCount = new Map<string, { count: number; date: string }>();
const MAX_DEMOS = 3;

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

const SIGN_NAMES: Record<string, string> = {
  "01": "Capricornio", "02": "Acuario", "03": "Piscis", "04": "Aries",
  "05": "Tauro", "06": "Géminis", "07": "Cáncer", "08": "Leo",
  "09": "Virgo", "10": "Libra", "11": "Escorpio", "12": "Sagitario",
};

function getSunSign(birthDate: string): string {
  const d = new Date(birthDate + "T12:00:00");
  const m = d.getMonth() + 1;
  const day = d.getDate();
  if ((m === 3  && day >= 21) || (m === 4  && day <= 19)) return "Aries";
  if ((m === 4  && day >= 20) || (m === 5  && day <= 20)) return "Tauro";
  if ((m === 5  && day >= 21) || (m === 6  && day <= 20)) return "Géminis";
  if ((m === 6  && day >= 21) || (m === 7  && day <= 22)) return "Cáncer";
  if ((m === 7  && day >= 23) || (m === 8  && day <= 22)) return "Leo";
  if ((m === 8  && day >= 23) || (m === 9  && day <= 22)) return "Virgo";
  if ((m === 9  && day >= 23) || (m === 10 && day <= 22)) return "Libra";
  if ((m === 10 && day >= 23) || (m === 11 && day <= 21)) return "Escorpio";
  if ((m === 11 && day >= 22) || (m === 12 && day <= 21)) return "Sagitario";
  if ((m === 12 && day >= 22) || (m === 1  && day <= 19)) return "Capricornio";
  if ((m === 1  && day >= 20) || (m === 2  && day <= 18)) return "Acuario";
  return "Piscis";
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const today = todayISO();

  // Rate limit check
  const entry = ipDemoCount.get(ip);
  if (entry && entry.date === today && entry.count >= MAX_DEMOS) {
    return NextResponse.json(
      { error: "Has alcanzado el límite de demos de hoy. Crea una cuenta gratis para lecturas ilimitadas." },
      { status: 429 }
    );
  }

  const { birthDate } = await req.json().catch(() => ({}));
  if (!birthDate || typeof birthDate !== "string") {
    return NextResponse.json({ error: "Fecha de nacimiento requerida" }, { status: 400 });
  }

  const sunSign = getSunSign(birthDate);

  // Update rate limit
  ipDemoCount.set(ip, {
    count: entry && entry.date === today ? entry.count + 1 : 1,
    date: today,
  });

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: `Genera un horóscopo demo de ZODI para alguien nacido el ${birthDate} (${sunSign}). Máximo 4 frases. Tono: directo, ácido, con humor. Empieza con algo sobre su signo solar. Sin introducciones largas. Sin "basado en tu carta natal" ni textos genéricos. Que parezca personalizado aunque sea corto.`,
    });

    return NextResponse.json({
      sign: sunSign,
      reading: response.text?.trim() ?? `Eres ${sunSign}. El cosmos tiene mucho más que decirte, pero para eso necesitas tu perfil completo.`,
    });
  } catch {
    return NextResponse.json({
      sign: sunSign,
      reading: `Eres ${sunSign}, y eso ya dice algo. El universo guarda más detalles para cuando crees tu perfil completo.`,
    });
  }
}
