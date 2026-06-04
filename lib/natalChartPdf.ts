"use client";

// ── Colores de acento por signo ───────────────────────────────────────────────
const SIGN_COLORS: Record<string, string> = {
  Aries: "#ef4444", Tauro: "#22c55e", "Géminis": "#eab308",
  "Cáncer": "#94a3b8", Leo: "#f59e0b", Virgo: "#84cc16",
  Libra: "#ec4899", Escorpio: "#a855f7", Sagitario: "#8b5cf6",
  Capricornio: "#78716c", Acuario: "#06b6d4", Piscis: "#14b8a6",
};

const SIGN_EMOJI: Record<string, string> = {
  Aries: "♈", Tauro: "♉", "Géminis": "♊", "Cáncer": "♋", Leo: "♌", Virgo: "♍",
  Libra: "♎", Escorpio: "♏", Sagitario: "♐", Capricornio: "♑", Acuario: "♒", Piscis: "♓",
};

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load: ${src}`));
    img.src = src;
  });
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
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = word;
      currentY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) { ctx.fillText(line, x, currentY); currentY += lineHeight; }
  return currentY;
}

export interface NatalChartPdfParams {
  displayName: string;
  sunSign: string;
  moonSign: string;
  ascendant: string;
  lifePathNumber: number;
  chineseZodiac: string;
  mayanSign: string;
  birthDate: string;
  birthCity: string;
  birthCountry: string;
  horoscopeText: string;
}

export async function generateNatalChartPdf(params: NatalChartPdfParams): Promise<void> {
  const {
    displayName, sunSign, moonSign, ascendant,
    lifePathNumber, chineseZodiac, mayanSign,
    birthDate, birthCity, birthCountry, horoscopeText,
  } = params;

  const W = 794;   // A4 width @96dpi
  const H = 1123;  // A4 height @96dpi
  const MARGIN = 48;
  const CONTENT_W = W - MARGIN * 2;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const accent = SIGN_COLORS[sunSign] ?? "#b8ff17";

  // ── Fondo ─────────────────────────────────────────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#06060e");
  bg.addColorStop(1, "#03030a");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Orbe de color del signo
  const orb = ctx.createRadialGradient(W * 0.85, H * 0.12, 0, W * 0.85, H * 0.12, W * 0.5);
  orb.addColorStop(0, `${accent}1a`);
  orb.addColorStop(1, "transparent");
  ctx.fillStyle = orb;
  ctx.fillRect(0, 0, W, H);

  // ── Borde decorativo ──────────────────────────────────────────────────────
  ctx.strokeStyle = `${accent}20`;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(24, 24, W - 48, H - 48);
  ctx.strokeStyle = `${accent}0a`;
  ctx.lineWidth = 1;
  ctx.strokeRect(30, 30, W - 60, H - 60);

  // ── Carga de imágenes ─────────────────────────────────────────────────────
  let logoImg: HTMLImageElement | null = null;
  let characterImg: HTMLImageElement | null = null;
  try { logoImg = await loadImg("/zodi-art/nuevas/1-Identidad-principal-de-marca/Logo-principal-ZODI.webp"); } catch { /* ignore */ }
  try { characterImg = await loadImg("/zodi-art/nuevas/4-Poses-del-personaje-ZODI/ZODI-de-frente.webp"); } catch { /* ignore */ }

  // ── Personaje ZODI (derecha, panel superior) ──────────────────────────────
  if (characterImg) {
    const charW = 220;
    const charH = 300;
    const charX = W - MARGIN - charW;
    const charY = 60;

    // Gradient mask para el personaje
    const charGrad = ctx.createLinearGradient(charX, charY, charX, charY + charH);
    charGrad.addColorStop(0, "rgba(0,0,0,0)");
    charGrad.addColorStop(0.7, "rgba(0,0,0,0)");
    charGrad.addColorStop(1, "rgba(6,6,14,0.95)");

    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.drawImage(characterImg, charX, charY, charW, charH);
    ctx.restore();

    // Fade bottom del personaje
    ctx.fillStyle = charGrad;
    ctx.fillRect(charX, charY, charW, charH);

    // Orbe bajo el personaje
    const baseOrb = ctx.createRadialGradient(charX + charW / 2, charY + charH, 0, charX + charW / 2, charY + charH, 80);
    baseOrb.addColorStop(0, `${accent}25`);
    baseOrb.addColorStop(1, "transparent");
    ctx.fillStyle = baseOrb;
    ctx.fillRect(charX, charY + charH - 80, charW, 80);
  }

  // ── Logo ZODI ─────────────────────────────────────────────────────────────
  let currentY = MARGIN + 10;
  if (logoImg) {
    const logoH = 44;
    const logoW = Math.round(logoImg.width * (logoH / logoImg.height));
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.drawImage(logoImg, MARGIN, currentY, Math.min(logoW, 160), logoH);
    ctx.restore();
    currentY += logoH + 6;
  } else {
    ctx.font = "bold 32px Arial";
    ctx.fillStyle = accent;
    ctx.fillText("ZODI", MARGIN, currentY + 28);
    currentY += 40;
  }

  // Subtítulo del documento
  ctx.font = "11px Arial";
  ctx.fillStyle = "rgba(255,255,255,0.30)";
  ctx.fillText("carta natal personalizada", MARGIN, currentY + 4);
  currentY += 24;

  // ── Separador ─────────────────────────────────────────────────────────────
  const sep = ctx.createLinearGradient(MARGIN, 0, MARGIN + CONTENT_W * 0.6, 0);
  sep.addColorStop(0, `${accent}80`);
  sep.addColorStop(1, "transparent");
  ctx.strokeStyle = sep;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(MARGIN, currentY);
  ctx.lineTo(MARGIN + CONTENT_W * 0.6, currentY);
  ctx.stroke();
  currentY += 20;

  // ── Nombre del usuario ────────────────────────────────────────────────────
  ctx.font = "bold 36px Arial";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(displayName, MARGIN, currentY + 30);
  currentY += 44;

  // Signo solar + emoji grande
  ctx.font = "bold 18px Arial";
  ctx.fillStyle = accent;
  ctx.fillText(`${SIGN_EMOJI[sunSign] ?? "⭐"}  ${sunSign}`, MARGIN, currentY + 4);
  currentY += 18;

  // Fecha y lugar de nacimiento
  ctx.font = "13px Arial";
  ctx.fillStyle = "rgba(255,255,255,0.40)";
  const birthLine = [birthDate, birthCity, birthCountry].filter(Boolean).join(" · ");
  ctx.fillText(birthLine, MARGIN, currentY + 4);
  currentY += 32;

  // ── Panel de datos astrales ───────────────────────────────────────────────
  const astralData = [
    { label: "Sol",        value: sunSign,                  emoji: "☀️" },
    { label: "Luna",       value: moonSign || "—",          emoji: "🌙" },
    { label: "Ascendente", value: ascendant || "—",         emoji: "↑" },
    { label: "Camino de vida", value: String(lifePathNumber || "—"), emoji: "🔢" },
    { label: "Horóscopo chino", value: chineseZodiac || "—",emoji: "🐉" },
    { label: "Signo maya", value: mayanSign || "—",         emoji: "🌿" },
  ];

  const colW = CONTENT_W / 3;
  const rowH = 64;
  const panelX = MARGIN;
  const panelY = currentY;
  const cols = 3;

  astralData.forEach((item, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = panelX + col * colW;
    const y = panelY + row * rowH;

    // Fondo card
    ctx.fillStyle = "rgba(255,255,255,0.035)";
    ctx.beginPath();
    ctx.roundRect(x + 3, y + 3, colW - 6, rowH - 6, 8);
    ctx.fill();

    ctx.strokeStyle = `${accent}18`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x + 3, y + 3, colW - 6, rowH - 6, 8);
    ctx.stroke();

    // Label
    ctx.font = "9px Arial";
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.fillText(item.label.toUpperCase(), x + 14, y + 20);

    // Value
    ctx.font = "bold 16px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`${item.emoji}  ${item.value}`, x + 14, y + 42);
  });

  currentY = panelY + Math.ceil(astralData.length / cols) * rowH + 28;

  // ── Línea separadora ──────────────────────────────────────────────────────
  ctx.strokeStyle = `${accent}28`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(MARGIN, currentY);
  ctx.lineTo(W - MARGIN, currentY);
  ctx.stroke();
  currentY += 20;

  // ── Título sección horóscopo ──────────────────────────────────────────────
  ctx.font = "bold 14px Arial";
  ctx.fillStyle = accent;
  ctx.fillText("✦  LECTURA ASTRAL PERSONALIZADA", MARGIN, currentY);
  currentY += 22;

  // ── Texto del horóscopo ───────────────────────────────────────────────────
  const MAX_HOROSCOPE_Y = H - MARGIN - 72;
  ctx.font = "italic 15px Georgia, Times New Roman, serif";
  ctx.fillStyle = "rgba(255,255,255,0.88)";
  currentY = wrapText(ctx, horoscopeText, MARGIN, currentY, CONTENT_W - 10, 24);
  if (currentY > MAX_HOROSCOPE_Y) currentY = MAX_HOROSCOPE_Y;

  currentY += 16;

  // ── Separador footer ──────────────────────────────────────────────────────
  ctx.strokeStyle = `${accent}20`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(MARGIN, H - MARGIN - 44);
  ctx.lineTo(W - MARGIN, H - MARGIN - 44);
  ctx.stroke();

  // ── Footer ────────────────────────────────────────────────────────────────
  ctx.font = "bold 13px Arial";
  ctx.fillStyle = accent;
  ctx.fillText("🔮 zodi.aibueno.es", MARGIN, H - MARGIN - 18);

  ctx.font = "11px Arial";
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  const today = new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
  ctx.textAlign = "right";
  ctx.fillText(`Generado el ${today}`, W - MARGIN, H - MARGIN - 18);
  ctx.textAlign = "left";

  // ── Abrir ventana de impresión / descarga ─────────────────────────────────
  canvas.toBlob(blob => {
    if (!blob) return;

    // Opción 1: abrir en ventana de impresión para "Guardar como PDF"
    const url = URL.createObjectURL(blob);
    const printWin = window.open(url, "_blank");
    if (printWin) {
      printWin.onload = () => {
        setTimeout(() => {
          printWin.focus();
          printWin.print();
        }, 500);
      };
    } else {
      // Fallback: descarga directa
      const a = document.createElement("a");
      a.href = url;
      a.download = `zodi-carta-natal-${displayName.toLowerCase().replace(/\s+/g, "-")}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }, "image/png", 0.97);
}
