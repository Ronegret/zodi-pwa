/**
 * Hero: anillo zodiacal de 12 cajas redondeadas toon (color por elemento),
 * cada una con su glifo, alrededor de un núcleo que late. Gira despacio,
 * se inclina hacia el puntero y trae al frente el signo elegido.
 * Draw calls: 12 cajas + 12 contornos + 12 glifos + núcleo (2) + estrellas ≈ 39.
 */
import {
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  PointsMaterial,
  type Vector2,
} from 'three';
import { ELEMENTS, SIGN_GLYPHS, elementOf } from '@/lib/astro-engine/labels';
import { SIGNS, type Sign } from '@/lib/astro-engine/types';
import { BaseScene, damp } from '../core/base';
import { glyphTexture, hex, roundedBox } from '../geometry/shapes';
import { toonMaterial } from '../materials/toon';
import { nearestTurn, ringPositions, rotationToFront } from '../math';

const RADIUS = 3.2;

export class HeroScene extends BaseScene {
  readonly camera = new PerspectiveCamera(40, 1, 0.1, 100);
  private readonly ring = new Group();
  private readonly tilt = new Group();
  private boxes: Mesh[] = [];
  private core: Mesh | null = null;
  private targetY = 0;
  private hovered: Mesh | null = null;
  private pointerNdc: Vector2 | null = null;
  private idleSpin = true;

  protected build() {
    // Encuadre: el anillo entero cabe también en un marco cuadrado estrecho.
    this.camera.position.set(0, 2.4, 11.5);
    this.camera.lookAt(0, 0, 0);
    const colors: Record<(typeof ELEMENTS)[number], number> = {
      Fuego: this.palette.hot,
      Tierra: this.palette.acid,
      Aire: this.palette.cyan,
      Agua: this.palette.violetText,
    };
    const materials = Object.fromEntries(
      ELEMENTS.map((e) => [
        e,
        toonMaterial(colors[e], { gradientMap: this.gradient, outline: 0.008 }),
      ]),
    ) as Record<(typeof ELEMENTS)[number], ReturnType<typeof toonMaterial>>;
    const box = roundedBox(0.9, 0.9, 0.9, 0.16);
    const plate = new PlaneGeometry(0.62, 0.62);

    ringPositions(12, RADIUS).forEach((pos, i) => {
      const sign = SIGNS[i]!;
      const mesh = new Mesh(box, materials[elementOf(sign)]);
      mesh.position.set(pos.x, 0, pos.z);
      mesh.lookAt(pos.x * 2, 0, pos.z * 2);
      mesh.userData = { sign, index: i };
      const glyph = new Mesh(
        plate,
        new MeshBasicMaterial({
          map: glyphTexture(SIGN_GLYPHS[sign], hex(this.palette.bg)),
          transparent: true,
        }),
      );
      (glyph.material as MeshBasicMaterial).userData.outlineParameters = { visible: false };
      glyph.position.z = 0.46;
      mesh.add(glyph);
      this.boxes.push(mesh);
      this.ring.add(mesh);
    });

    this.core = new Mesh(
      new IcosahedronGeometry(0.9, 1),
      toonMaterial(this.palette.violet, { gradientMap: this.gradient, outline: 0.01 }),
    );
    this.ring.add(this.core);

    this.tilt.rotation.x = 0.28;
    this.tilt.add(this.ring);
    this.scene.add(this.tilt, this.stars(260));
  }

  private stars(count: number) {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 9 + Math.random() * 10;
      const a = Math.random() * Math.PI * 2;
      positions.set(
        [Math.cos(a) * r, (Math.random() - 0.5) * 12, -Math.abs(Math.sin(a) * r)],
        i * 3,
      );
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    const material = new PointsMaterial({
      color: this.palette.ink,
      size: 0.05,
      transparent: true,
      opacity: 0.7,
    });
    material.userData.outlineParameters = { visible: false };
    return new Points(geometry, material);
  }

  update(dt: number) {
    this.elapsed += dt;
    if (this.idleSpin) this.targetY -= dt * 0.12;
    this.ring.rotation.y = damp(this.ring.rotation.y, this.targetY, 4, dt);
    // Parallax: el anillo se inclina hacia el puntero.
    const px = this.pointerNdc?.x ?? 0;
    const py = this.pointerNdc?.y ?? 0;
    this.tilt.rotation.x = damp(this.tilt.rotation.x, 0.28 - py * 0.12, 3, dt);
    this.tilt.rotation.z = damp(this.tilt.rotation.z, -px * 0.08, 3, dt);
    this.boxes.forEach((b, i) => {
      b.position.y = Math.sin(this.elapsed * 1.4 + i) * 0.12;
      const s = b === this.hovered ? 1.18 : 1;
      b.scale.setScalar(damp(b.scale.x, s, 10, dt));
    });
    if (this.core) {
      this.core.rotation.y += dt * 0.4;
      this.core.scale.setScalar(1 + Math.sin(this.elapsed * 2) * 0.04);
    }
  }

  pointer(ndc: Vector2 | null) {
    this.pointerNdc = ndc;
    this.hovered = ndc ? this.hit(ndc, this.boxes) : null;
  }

  select(ndc: Vector2): string | null {
    const box = this.hit(ndc, this.boxes);
    if (!box) return null;
    this.focusSign(box.userData.sign as Sign);
    return box.userData.sign as string;
  }

  /** Trae el signo al frente (también desde el teclado). */
  focusSign(sign: Sign) {
    const i = SIGNS.indexOf(sign);
    if (i < 0) return;
    this.idleSpin = false;
    const angle = Math.PI / 2 + (i * 2 * Math.PI) / 12;
    this.targetY = nearestTurn(this.ring.rotation.y, rotationToFront(angle));
    this.hovered = this.boxes[i] ?? null;
  }
}

export function createHeroScene() {
  return new HeroScene();
}
