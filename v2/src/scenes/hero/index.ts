/**
 * Hero: anillo zodiacal de 12 medallones con la ilustración de ZODI de cada
 * signo y un aro de neón del color de su elemento (siempre mirando a la
 * cámara), alrededor de un núcleo que late. Gira despacio, se inclina hacia
 * el puntero y trae al frente el signo elegido.
 * Draw calls: 12 medallones + núcleo (2) + estrellas ≈ 15.
 */
import {
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  IcosahedronGeometry,
  Mesh,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Sprite,
  SpriteMaterial,
  type Vector2,
} from 'three';
import { ELEMENTS, SIGN_GLYPHS, elementOf, signSlug } from '@/lib/astro-engine/labels';
import { SIGNS, type Sign } from '@/lib/astro-engine/types';
import { BaseScene, damp } from '../core/base';
import { hex, medallionTexture } from '../geometry/shapes';
import { toonMaterial } from '../materials/toon';
import { nearestTurn, ringPositions, rotationToFront } from '../math';

export interface HeroOptions {
  /**
   * Modo corona: el anillo flota por encima de la cabeza del personaje ZODI
   * (que va delante, en otra capa), más pequeño y sin núcleo.
   */
  crown?: boolean;
}

export class HeroScene extends BaseScene {
  readonly camera = new PerspectiveCamera(40, 1, 0.1, 100);
  private readonly ring = new Group();
  private readonly tilt = new Group();
  private medals: Sprite[] = [];
  private medalSize = 1;
  private core: Mesh | null = null;
  private targetY = 0;
  private hovered: Sprite | null = null;
  private pointerNdc: Vector2 | null = null;
  private idleSpin = true;
  private readonly baseTilt: number;

  constructor(private readonly opts: HeroOptions = {}) {
    super();
    this.baseTilt = opts.crown ? 0.42 : 0.28;
  }

  protected build() {
    const crown = this.opts.crown === true;
    const radius = crown ? 1.85 : 3.2;
    const size = crown ? 0.95 : 1.4;
    this.medalSize = size;
    // Encuadre: el anillo entero cabe también en un marco estrecho.
    this.camera.position.set(0, 2.4, 11.5);
    this.camera.lookAt(0, 0, 0);
    const colors: Record<(typeof ELEMENTS)[number], number> = {
      Fuego: this.palette.hot,
      Tierra: this.palette.acid,
      Aire: this.palette.cyan,
      Agua: this.palette.violetText,
    };

    ringPositions(12, radius).forEach((pos, i) => {
      const sign = SIGNS[i]!;
      const { texture, cancel } = medallionTexture(
        `/signos/${signSlug(sign)}-avatar-240.webp`,
        SIGN_GLYPHS[sign],
        hex(colors[elementOf(sign)]),
        hex(this.palette.bg),
      );
      this.track({ dispose: cancel });
      const material = new SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
      material.userData.outlineParameters = { visible: false };
      const medal = new Sprite(material);
      medal.position.set(pos.x, 0, pos.z);
      medal.scale.setScalar(size);
      medal.userData = { sign, index: i };
      this.medals.push(medal);
      this.ring.add(medal);
    });

    if (!crown) {
      this.core = new Mesh(
        new IcosahedronGeometry(0.9, 1),
        toonMaterial(this.palette.violet, { gradientMap: this.gradient, outline: 0.01 }),
      );
      this.ring.add(this.core);
    }

    // En modo corona el anillo sube hasta la parte alta del marco (sobre la capucha).
    if (crown) this.tilt.position.y = 2.35;
    this.tilt.rotation.x = this.baseTilt;
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
    this.tilt.rotation.x = damp(this.tilt.rotation.x, this.baseTilt - py * 0.12, 3, dt);
    this.tilt.rotation.z = damp(this.tilt.rotation.z, -px * 0.08, 3, dt);
    this.medals.forEach((m, i) => {
      m.position.y = Math.sin(this.elapsed * 1.4 + i) * 0.12;
      const target = this.medalSize * (m === this.hovered ? 1.3 : 1);
      m.scale.setScalar(damp(m.scale.x, target, 10, dt));
    });
    if (this.core) {
      this.core.rotation.y += dt * 0.4;
      this.core.scale.setScalar(1 + Math.sin(this.elapsed * 2) * 0.04);
    }
  }

  pointer(ndc: Vector2 | null) {
    this.pointerNdc = ndc;
    this.hovered = ndc ? this.hit(ndc, this.medals) : null;
  }

  select(ndc: Vector2): string | null {
    const medal = this.hit(ndc, this.medals);
    if (!medal) return null;
    this.focusSign(medal.userData.sign as Sign);
    return medal.userData.sign as string;
  }

  /** Trae el signo al frente (también desde el teclado). */
  focusSign(sign: Sign) {
    const i = SIGNS.indexOf(sign);
    if (i < 0) return;
    this.idleSpin = false;
    const angle = Math.PI / 2 + (i * 2 * Math.PI) / 12;
    this.targetY = nearestTurn(this.ring.rotation.y, rotationToFront(angle));
    this.hovered = this.medals[i] ?? null;
  }
}

export function createHeroScene(opts: HeroOptions = {}) {
  return new HeroScene(opts);
}
