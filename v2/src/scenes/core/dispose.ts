import type { Material, Mesh, Object3D, Texture } from 'three';

/**
 * Libera geometrías, materiales y texturas de un árbol de objetos. Las
 * geometrías y materiales compartidos se liberan una sola vez.
 */
export function disposeTree(root: Object3D) {
  const seen = new Set<unknown>();
  root.traverse((obj) => {
    const mesh = obj as Partial<Mesh>;
    if (mesh.geometry && !seen.has(mesh.geometry)) {
      seen.add(mesh.geometry);
      mesh.geometry.dispose();
    }
    const materials = Array.isArray(mesh.material)
      ? mesh.material
      : mesh.material
        ? [mesh.material]
        : [];
    for (const material of materials) disposeMaterial(material, seen);
  });
}

function disposeMaterial(material: Material, seen: Set<unknown>) {
  if (seen.has(material)) return;
  seen.add(material);
  for (const value of Object.values(material)) {
    const tex = value as Partial<Texture> | null;
    if (tex && typeof tex === 'object' && tex.isTexture && !seen.has(tex)) {
      seen.add(tex);
      tex.dispose!();
    }
  }
  material.dispose();
}
