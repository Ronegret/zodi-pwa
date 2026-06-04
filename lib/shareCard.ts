"use client";

// Colores de acento por signo (para el orbe de fondo de la tarjeta)
const SIGN_COLORS: Record<string, string> = {
  Aries: "#ef4444", Tauro: "#22c55e", "Géminis": "#eab308",
  "Cáncer": "#94a3b8", Leo: "#f59e0b", Virgo: "#84cc16",
  Libra: "#ec4899", Escorpio: "#a855f7", Sagitario: "#8b5cf6",
  Capricornio: "#78716c", Acuario: "#06b6d4", Piscis: "#14b8a6",
};

const SECTION_EMOJIS: Record<string, string> = {
  "Horóscopo diario": "🌟", "Horóscopo semanal": "📅", "Horóscopo mensual": "🗓️",
  "Tarot": "🃏", "Tirada celta": "🃏", "Compatibilidad": "💫",
  "Numerología": "🔢", "Lectura de nombre": "✨", "Runas vikingas": "ᚱ",
  "Cristales": "💎", "Lectura de mano": "🖐️", "Biorritmo": "📈",
  "Horóscopo chino": "🐲", "Horóscopo maya": "🌿", "Sueños": "🌙",
  "Carta natal": "⭐", "Compatibilidad de amigos": "👥",
};

// Extrae las 2-3 frases más impactantes del texto de respuesta
function extractBestLines(text: string, maxChars = 240): string {
  // Quitar markdown
  const clean = text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/#{1,3}\s/g, "")
    .replace(/`[^`]+`/g, "")
    .trim();

  // Dividir en frases
  const sentences = clean
    .split(/[.!?]/)
    .map(s => s.trim())
    .filter(s => s.length > 20);

  // Tomar las mejores hasta llegar a maxChars
  let result = "";
  for (const s of sentences) {
    const candidate = result ? `${result}. ${s}` : s;
    if (candidate.length <= maxChars) {
      result = candidate;
    } else break;
  }

  return result ? `${result}.` : clean.slice(0, maxChars) + "…";
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const words = text.split(" ");
  let line = "";
  let currentY = y;

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    const { width } = ctx.measureText(testLine);
    if (width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = word;
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) ctx.fillText(line, x, currentY);
  return currentY + lineHeight;
}

export async function generateReadingCard(params: {
  sectionTitle: string;
  reading: string;
  zodiac?: string;
  displayName?: string;
}): Promise<Blob | null> {
  const { sectionTitle, reading, zodiac = "", displayName = "" } = params;

  const SIZE = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const accentColor = zodiac ? (SIGN_COLORS[zodiac] ?? "#b8ff17") : "#b8ff17";
  const accentHex = accentColor;

  // ── Fondo ─────────────────────────────────────────────────────────────────
  const bgGrad = ctx.createLinearGradient(0, 0, SIZE, SIZE);
  bgGrad.addColorStop(0, "#080812");
  bgGrad.addColorStop(1, "#04040a");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Orbe de color del signo (fondo difuso)
  const orb = ctx.createRadialGradient(SIZE * 0.75, SIZE * 0.2, 0, SIZE * 0.75, SIZE * 0.2, SIZE * 0.55);
  orb.addColorStop(0, `${accentHex}22`);
  orb.addColorStop(1, "transparent");
  ctx.fillStyle = orb;
  ctx.fillRect(0, 0, SIZE, SIZE);

  const orb2 = ctx.createRadialGradient(SIZE * 0.15, SIZE * 0.85, 0, SIZE * 0.15, SIZE * 0.85, SIZE * 0.4);
  orb2.addColorStop(0, "#9b4dff18");
  orb2.addColorStop(1, "transparent");
  ctx.fillStyle = orb2;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // ── Borde interior sutil ───────────────────────────────────────────────────
  ctx.strokeStyle = `${accentHex}22`;
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, SIZE - 80, SIZE - 80);

  // ── Header ZODI ───────────────────────────────────────────────────────────
  ctx.font = "bold 52px 'Arial', sans-serif";
  ctx.fillStyle = accentHex;
  ctx.fillText("ZODI", 80, 130);

  ctx.font = "28px 'Arial', sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fillText("oráculo astral", 82, 172);

  // Línea separadora
  const lineGrad = ctx.createLinearGradient(80, 0, SIZE - 80, 0);
  lineGrad.addColorStop(0, `${accentHex}88`);
  lineGrad.addColorStop(0.5, `${accentHex}44`);
  lineGrad.addColorStop(1, "transparent");
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(80, 200);
  ctx.lineTo(SIZE - 80, 200);
  ctx.stroke();

  // ── Sección tipo ──────────────────────────────────────────────────────────
  const emoji = SECTION_EMOJIS[sectionTitle] ?? "🔮";
  ctx.font = "bold 38px 'Arial', sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fillText(`${emoji}  ${sectionTitle.toUpperCase()}`, 80, 258);

  // Signo + nombre si disponible
  if (zodiac || displayName) {
    ctx.font = "32px 'Arial', sans-serif";
    ctx.fillStyle = accentHex;
    const label = [displayName.split(" ")[0], zodiac].filter(Boolean).join(" · ");
    ctx.fillText(label, 80, 304);
  }

  // ── Texto de la lectura ───────────────────────────────────────────────────
  const bestLines = extractBestLines(reading, 280);
  ctx.font = "italic 44px 'Georgia', 'Times New Roman', serif";
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  wrapText(ctx, `"${bestLines}"`, 80, 390, SIZE - 160, 62);

  // ── Footer ────────────────────────────────────────────────────────────────
  ctx.strokeStyle = `${accentHex}22`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(80, SIZE - 140);
  ctx.lineTo(SIZE - 80, SIZE - 140);
  ctx.stroke();

  ctx.font = "bold 30px 'Arial', sans-serif";
  ctx.fillStyle = accentHex;
  ctx.fillText("🔮 zodi.aibueno.es", 80, SIZE - 90);

  ctx.font = "24px 'Arial', sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.fillText("Tu oráculo astral personalizado", 80, SIZE - 52);

  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob), "image/png", 0.95);
  });
}

export async function shareReading(params: {
  sectionTitle: string;
  reading: string;
  zodiac?: string;
  displayName?: string;
}): Promise<"shared" | "downloaded" | "copied" | "error"> {
  try {
    const blob = await generateReadingCard(params);
    if (!blob) return "error";

    const file = new File([blob], "zodi-lectura.png", { type: "image/png" });

    // Web Share API con imagen (nivel 2)
    if (
      typeof navigator !== "undefined" &&
      "share" in navigator &&
      "canShare" in navigator &&
      navigator.canShare({ files: [file] })
    ) {
      await navigator.share({
        title: `Mi lectura ZODI — ${params.sectionTitle}`,
        text: `Descubre tu oráculo personalizado en zodi.aibueno.es 🔮`,
        files: [file],
      });
      return "shared";
    }

    // Fallback: descargar imagen
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zodi-${params.sectionTitle.toLowerCase().replace(/\s+/g, "-")}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return "downloaded";
  } catch {
    return "error";
  }
}
