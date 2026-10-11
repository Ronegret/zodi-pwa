/**
 * Rueda natal 3D: disco, anillo de 12 signos (cajas redondeadas toon por
 * elemento) y planetas en su longitud real (Ascendente a la izquierda).
 * Las líneas de aspectos van en un solo LineSegments. Al elegir un planeta
 * la rueda lo trae al frente y lo destaca.
 * Draw calls ≈ 12+12 signos + 12 glifos + 11+11 planetas + 11 etiquetas
 * + disco (2) + aspectos + eje ASC ≈ 75.
 */
import {
  BufferGeometry,
  CylinderGeometry,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Sprite,
  SpriteMaterial,
  type Vector2,
} from 'three';
import type { AspectType, PlanetId, Sign } from '@/lib/astro-engine';
import { ELEMENTS, PLANET_GLYPHS, SIGN_GLYPHS, elementOf } from '@/lib/astro-engine/labels';
import { SIGNS } from '@/lib/astro-engine/types';
import { BaseScene, damp } from '../core/base';
import { glyphTexture, hex, roundedBox } from '../geometry/shapes';
import { toonMaterial } from '../materials/toon';
import { angleOfXZ, eclipticToXZ, nearestTurn, rotationToFront } from '../math';

export interface WheelPlanet {
  id: PlanetId;
  lon: number;
  sign: Sign;
}

export interface WheelInput {
  planets: WheelPlanet[];
  /** Longitud del Ascendente; null si no hay hora de nacimiento. */
  ascendant: number | null;
  aspects: { a: PlanetId; b: PlanetId; type: AspectType }[];
}

const R = { disc: 3.5, signs: 3.05, planets: 2.15, aspects: 1.45 };

export class NatalWheelScene extends BaseScene {
  readonly camera = new PerspectiveCamera(38, 1, 0.1, 100);
  private readonly wheel = new Group();
  private planets = new Map<PlanetId, Mesh>();
  private targetY = 0;
  private selected: PlanetId | null = null;
  private hovered: Mesh | null = null;
  private idleSpin = true;

  constructor(private readonly input: WheelInput) {
    super();
  }

  protected build() {
    // Encuadre: el disco (r 3,5) cabe entero con margen en un marco cuadrado.
    this.camera.position.set(0, 8.4, 7.6);
    this.camera.lookAt(0, -0.4, 0);
    const asc = this.input.ascendant ?? 0;
    const p = this.palette;

    const disc = new Mesh(
      new CylinderGeometry(R.disc, R.disc, 0.16, 96),
      toonMaterial(p.surface, { gradientMap: this.gradient, outline: 0.004 }),
    );
    disc.position.y = -0.12;
    this.wheel.add(disc);

    // Anillo de signos.
    const elementColor = { Fuego: p.hot, Tierra: p.acid, Aire: p.cyan, Agua: p.violetText };
    const mats = Object.fromEntries(
      ELEMENTS.map((e) => [
        e,
        toonMaterial(elementColor[e], { gradientMap: this.gradient, outline: 0.005 }),
      ]),
    ) as Record<(typeof ELEMENTS)[number], ReturnType<typeof toonMaterial>>;
    const tile = roundedBox(1.25, 0.22, 0.62, 0.08);
    const plate = new PlaneGeometry(0.5, 0.5);
    SIGNS.forEach((sign, i) => {
      const pos = eclipticToXZ(i * 30 + 15, R.signs, asc);
      const mesh = new Mesh(tile, mats[elementOf(sign)]);
      mesh.position.set(pos.x, 0, pos.z);
      // Lado largo tangente al anillo.
      mesh.rotation.y = angleOfXZ(pos) + Math.PI / 2;
      const glyph = new Mesh(
        plate,
        new MeshBasicMaterial({
          map: glyphTexture(SIGN_GLYPHS[sign], hex(p.bg)),
          transparent: true,
        }),
      );
      (glyph.material as MeshBasicMaterial).userData.outlineParameters = { visible: false };
      glyph.rotation.x = -Math.PI / 2;
      glyph.position.y = 0.115;
      mesh.add(glyph);
      this.wheel.add(mesh);
    });

    // Planetas.
    const body = roundedBox(0.34, 0.34, 0.34, 0.1);
    const planetMat = toonMaterial(p.ink, { gradientMap: this.gradient, outline: 0.006 });
    const selectedMat = this.track(
      toonMaterial(p.acid, { gradientMap: this.gradient, outline: 0.008 }),
    );
    for (const planet of this.input.planets) {
      const pos = eclipticToXZ(planet.lon, R.planets, asc);
      const mesh = new Mesh(body, planetMat);
      mesh.position.set(pos.x, 0.25, pos.z);
      mesh.userData = { id: planet.id, base: planetMat, selected: selectedMat };
      const label = new Sprite(
        new SpriteMaterial({
          map: glyphTexture(PLANET_GLYPHS[planet.id], hex(p.ink)),
          transparent: true,
        }),
      );
      label.material.userData.outlineParameters = { visible: false };
      label.scale.setScalar(0.5);
      label.position.y = 0.5;
      mesh.add(label);
      this.planets.set(planet.id, mesh);
      this.wheel.add(mesh);
    }

    this.wheel.add(this.aspectLines(asc));
    if (this.input.ascendant !== null) this.wheel.add(this.ascMarker(asc));
    this.scene.add(this.wheel);
  }

  /** Todas las líneas de aspectos en un único draw call (color por vértice). */
  private aspectLines(asc: number) {
    const lonOf = new Map(this.input.planets.map((pl) => [pl.id, pl.lon]));
    const soft = this.palette.cyan;
    const hard = this.palette.hot;
    const positions: number[] = [];
    const colors: number[] = [];
    const rgb = (c: number) => [((c >> 16) & 255) / 255, ((c >> 8) & 255) / 255, (c & 255) / 255];
    for (const a of this.input.aspects) {
      if (a.type === 'conjunction') continue;
      const p1 = eclipticToXZ(lonOf.get(a.a)!, R.aspects, asc);
      const p2 = eclipticToXZ(lonOf.get(a.b)!, R.aspects, asc);
      positions.push(p1.x, 0.02, p1.z, p2.x, 0.02, p2.z);
      const c = rgb(a.type === 'trine' || a.type === 'sextile' ? soft : hard);
      colors.push(...c, ...c);
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
    const material = new LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });
    material.userData.outlineParameters = { visible: false };
    return new LineSegments(geometry, material);
  }

  private ascMarker(asc: number) {
    const pos = eclipticToXZ(asc, R.disc + 0.25, asc);
    const marker = new Mesh(
      roundedBox(0.5, 0.18, 0.18, 0.06),
      toonMaterial(this.palette.acid, { gradientMap: this.gradient }),
    );
    marker.position.set(pos.x, 0, pos.z);
    return marker;
  }

  update(dt: number) {
    this.elapsed += dt;
    if (this.idleSpin) this.targetY += dt * 0.05;
    this.wheel.rotation.y = damp(this.wheel.rotation.y, this.targetY, 3, dt);
    for (const mesh of this.planets.values()) {
      const active = mesh.userData.id === this.selected || mesh === this.hovered;
      mesh.scale.setScalar(damp(mesh.scale.x, active ? 1.5 : 1, 10, dt));
      mesh.position.y = 0.25 + (active ? Math.sin(this.elapsed * 3) * 0.06 + 0.12 : 0);
    }
  }

  pointer(ndc: Vector2 | null) {
    this.hovered = ndc ? this.hit(ndc, [...this.planets.values()]) : null;
  }

  select(ndc: Vector2): string | null {
    const mesh = this.hit(ndc, [...this.planets.values()]);
    if (!mesh) return null;
    this.focusPlanet(mesh.userData.id as PlanetId);
    return mesh.userData.id as string;
  }

  /** Trae el planeta al frente y lo destaca (también desde el teclado). */
  focusPlanet(id: PlanetId | null) {
    for (const mesh of this.planets.values()) {
      mesh.material = mesh.userData.id === id ? mesh.userData.selected : mesh.userData.base;
    }
    this.selected = id;
    const mesh = id ? this.planets.get(id) : null;
    if (!mesh) {
      this.idleSpin = true;
      return;
    }
    this.idleSpin = false;
    const angle = angleOfXZ({ x: mesh.position.x, z: mesh.position.z });
    this.targetY = nearestTurn(this.wheel.rotation.y, rotationToFront(angle));
  }
}

export function createNatalWheelScene(input: WheelInput) {
  return new NatalWheelScene(input);
}
