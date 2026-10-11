/**
 * Signo del día: un tótem (caja redondeada toon del color del elemento) con
 * el glifo en sus cuatro caras y 40 chispas en órbita (InstancedMesh: un
 * solo draw call, sin contorno). Al tocarlo da un salto.
 * Draw calls: tótem + contorno + 4 glifos + chispas = 7.
 */
import {
  Color,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Quaternion,
  Vector3,
  type Vector2,
} from 'three';
import type { Sign } from '@/lib/astro-engine';
import { SIGN_GLYPHS, elementOf } from '@/lib/astro-engine/labels';
import { BaseScene, damp } from '../core/base';
import { glyphTexture, hex, roundedBox } from '../geometry/shapes';
import { toonMaterial } from '../materials/toon';

const SPARKS = 40;

export class SignOfDayScene extends BaseScene {
  readonly camera = new PerspectiveCamera(36, 1, 0.1, 50);
  private readonly totem = new Group();
  private body: Mesh | null = null;
  private sparks: InstancedMesh | null = null;
  private readonly seeds = Array.from({ length: SPARKS }, (_, i) => ({
    radius: 1.9 + (i % 5) * 0.18,
    speed: 0.3 + (i % 7) * 0.06,
    phase: (i / SPARKS) * Math.PI * 2,
    height: ((i % 9) - 4) * 0.22,
  }));
  private bounce = 0;
  private pointerNdc: Vector2 | null = null;
  private readonly m = new Matrix4();
  private readonly q = new Quaternion();
  private readonly v = new Vector3();
  private readonly s = new Vector3();

  constructor(private readonly sign: Sign) {
    super();
  }

  protected build() {
    this.camera.position.set(0, 1.2, 7);
    this.camera.lookAt(0, 0, 0);
    const p = this.palette;
    const color = { Fuego: p.hot, Tierra: p.acid, Aire: p.cyan, Agua: p.violetText }[
      elementOf(this.sign)
    ];
    this.body = new Mesh(
      roundedBox(1.8, 1.8, 1.8, 0.32),
      toonMaterial(color, { gradientMap: this.gradient, outline: 0.012 }),
    );
    const plate = new PlaneGeometry(1.25, 1.25);
    const glyph = new MeshBasicMaterial({
      map: glyphTexture(SIGN_GLYPHS[this.sign], hex(p.bg)),
      transparent: true,
    });
    glyph.userData.outlineParameters = { visible: false };
    for (let i = 0; i < 4; i++) {
      const face = new Mesh(plate, glyph);
      face.rotation.y = (i * Math.PI) / 2;
      face.position.set(Math.sin((i * Math.PI) / 2) * 0.91, 0, Math.cos((i * Math.PI) / 2) * 0.91);
      this.body.add(face);
    }
    this.totem.add(this.body);

    const sparkMat = toonMaterial(0xffffff, { gradientMap: this.gradient, outline: 0 });
    this.sparks = new InstancedMesh(roundedBox(0.14, 0.14, 0.14, 0.04, 2), sparkMat, SPARKS);
    const tones = [p.acid, p.violetText, p.hot, p.cyan, p.gold].map((c) => new Color(c));
    for (let i = 0; i < SPARKS; i++) this.sparks.setColorAt(i, tones[i % tones.length]!);
    this.scene.add(this.totem, this.sparks);
  }

  update(dt: number) {
    this.elapsed += dt;
    this.bounce = damp(this.bounce, 0, 4, dt);
    const px = this.pointerNdc?.x ?? 0;
    const py = this.pointerNdc?.y ?? 0;
    this.totem.rotation.y += dt * 0.5;
    this.totem.rotation.x = damp(this.totem.rotation.x, -py * 0.3, 4, dt);
    this.totem.rotation.z = damp(this.totem.rotation.z, px * 0.2, 4, dt);
    this.totem.position.y =
      Math.sin(this.elapsed * 1.5) * 0.1 + Math.sin(this.bounce * Math.PI) * 0.6;
    if (!this.sparks) return;
    this.seeds.forEach((seed, i) => {
      const a = seed.phase + this.elapsed * seed.speed;
      this.v.set(
        Math.cos(a) * seed.radius,
        seed.height + Math.sin(a * 2) * 0.15,
        Math.sin(a) * seed.radius,
      );
      this.q.setFromAxisAngle(this.s.set(0, 1, 0), a * 2);
      this.m.compose(this.v, this.q, this.s.setScalar(1));
      this.sparks!.setMatrixAt(i, this.m);
    });
    this.sparks.instanceMatrix.needsUpdate = true;
  }

  pointer(ndc: Vector2 | null) {
    this.pointerNdc = ndc;
  }

  select(ndc: Vector2): string | null {
    if (!this.body || !this.hit(ndc, [this.body])) return null;
    this.jump();
    return this.sign;
  }

  jump() {
    this.bounce = 1;
  }
}

export function createSignOfDayScene(sign: Sign) {
  return new SignOfDayScene(sign);
}
