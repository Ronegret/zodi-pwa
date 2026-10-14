/**
 * Tarot: una carta (RoundedBox fina) que flota y se voltea con resorte.
 * Anverso y reverso son texturas de canvas (≤ 1024 px de alto) pintadas con
 * las fuentes y colores de Zodi. Draw calls: carta + contorno + 2 caras = 4.
 */
import {
  CanvasTexture,
  Group,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  SRGBColorSpace,
  type Vector2,
} from 'three';
import type { TarotCard } from '@/lib/tarot/daily';
import { BaseScene, damp } from '../core/base';
import { hex, roundedBox } from '../geometry/shapes';
import { toonMaterial } from '../materials/toon';
import type { Palette } from '../core/types';

const W = 1.5;
const H = 2.4;
const TEX_W = 512;
const TEX_H = 820;

export class TarotScene extends BaseScene {
  readonly camera = new PerspectiveCamera(34, 1, 0.1, 50);
  private readonly card = new Group();
  private body: Mesh | null = null;
  private flipped = false;
  private flipY = 0;
  private pointerNdc: Vector2 | null = null;

  constructor(private readonly data: TarotCard) {
    super();
  }

  protected build() {
    this.camera.position.set(0, 0, 6.2);
    const p = this.palette;
    this.body = new Mesh(
      roundedBox(W, H, 0.05, 0.08),
      toonMaterial(p.surface, { gradientMap: this.gradient, outline: 0.01 }),
    );
    const face = new PlaneGeometry(W * 0.92, H * 0.94);
    const front = new Mesh(face, faceMaterial(drawFront(this.data, p)));
    // El anverso mira hacia atrás hasta que la carta se voltea.
    front.rotation.y = Math.PI;
    front.position.z = -0.026;
    const back = new Mesh(face, faceMaterial(drawBack(p)));
    back.position.z = 0.026;
    this.card.add(this.body, front, back);
    this.scene.add(this.card);
  }

  update(dt: number) {
    this.elapsed += dt;
    this.flipY = damp(this.flipY, this.flipped ? Math.PI : 0, 7, dt);
    const px = this.pointerNdc?.x ?? 0;
    const py = this.pointerNdc?.y ?? 0;
    this.card.rotation.y = this.flipY + px * 0.25;
    this.card.rotation.x = damp(this.card.rotation.x, -py * 0.2, 5, dt);
    this.card.position.y = Math.sin(this.elapsed * 1.6) * 0.08;
    this.card.rotation.z = Math.sin(this.elapsed * 0.9) * 0.03;
  }

  pointer(ndc: Vector2 | null) {
    this.pointerNdc = ndc;
  }

  select(ndc: Vector2): string | null {
    if (!this.body || !this.hit(ndc, [this.body])) return null;
    this.flip();
    return this.flipped ? 'front' : 'back';
  }

  flip(show?: boolean) {
    this.flipped = show ?? !this.flipped;
  }
}

function faceMaterial(canvas: HTMLCanvasElement) {
  const map = new CanvasTexture(canvas);
  map.colorSpace = SRGBColorSpace;
  const material = new MeshBasicMaterial({ map });
  material.userData.outlineParameters = { visible: false };
  return material;
}

function canvas2d() {
  const c = document.createElement('canvas');
  c.width = TEX_W;
  c.height = TEX_H;
  return [c, c.getContext('2d')!] as const;
}

function drawBack(p: Palette) {
  const [c, g] = canvas2d();
  g.fillStyle = hex(p.surface);
  g.fillRect(0, 0, TEX_W, TEX_H);
  g.strokeStyle = hex(p.violet);
  g.lineWidth = 10;
  g.strokeRect(24, 24, TEX_W - 48, TEX_H - 48);
  // Constelación aleatoria pero fija (semilla por índice).
  g.fillStyle = hex(p.acid);
  for (let i = 0; i < 70; i++) {
    const x = 50 + ((i * 97) % (TEX_W - 100));
    const y = 50 + ((i * 163) % (TEX_H - 100));
    g.beginPath();
    g.arc(x, y, i % 5 === 0 ? 4 : 2, 0, Math.PI * 2);
    g.fill();
  }
  g.font = `800 120px 'Syne Variable', 'Syne', sans-serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = hex(p.acid);
  g.fillText('ZODI', TEX_W / 2, TEX_H / 2);
  return c;
}

function drawFront(card: TarotCard, p: Palette) {
  const [c, g] = canvas2d();
  g.fillStyle = hex(p.bg);
  g.fillRect(0, 0, TEX_W, TEX_H);
  g.strokeStyle = hex(p.acid);
  g.lineWidth = 8;
  g.strokeRect(24, 24, TEX_W - 48, TEX_H - 48);
  g.textAlign = 'center';
  g.fillStyle = hex(p.acid);
  g.font = `800 96px 'Syne Variable', 'Syne', sans-serif`;
  g.fillText(card.numeral, TEX_W / 2, 170);
  g.beginPath();
  g.arc(TEX_W / 2, TEX_H / 2, 120, 0, Math.PI * 2);
  g.lineWidth = 6;
  g.strokeStyle = hex(p.violetText);
  g.stroke();
  g.fillStyle = hex(p.ink);
  g.font = `800 52px 'Syne Variable', 'Syne', sans-serif`;
  wrap(g, card.name.toUpperCase(), TEX_W / 2, TEX_H - 190, TEX_W - 90, 58);
  return c;
}

function wrap(
  g: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  max: number,
  line: number,
) {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (g.measureText(test).width > max && current) {
      lines.push(current);
      current = word;
    } else current = test;
  }
  lines.push(current);
  lines.forEach((l, i) => g.fillText(l, x, y + (i - (lines.length - 1) / 2) * line));
}

export function createTarotScene(card: TarotCard) {
  return new TarotScene(card);
}
