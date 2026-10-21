// Piece: exterior. Roof, cladding, front windows/doors, entry porch, dormer, chimney, back porch,
// bonus-room massing over the garage, site (lawn, walk, beds, path lights), trees and planting.
import * as THREE from 'three';
import { makeMaterials } from './exterior/mats.js';
import { buildHouse, freeWindows } from './exterior/house.js';
import { buildCladding } from './exterior/cladding.js';
import { configureOpenings, buildOpenings } from './exterior/openings.js';
import { installLensShift } from './exterior/camera.js';
import { buildSite } from './exterior/site.js';
import { buildVegetation } from './exterior/veg.js';

// Camera matched to refs/front_view.webp: ~65 mm-equivalent from 32 m out, eye ~2.6 m, shift lens
// (principal point right of and below the frame centre, so verticals stay vertical).
export const views = {
  front: {
    label: 'Front exterior',
    pos: [4.6, 2.6, 36.0], target: [4.6, 2.6, 0], fov: 31.2, shift: [0.149, 0.097],
    preset: {
      base: 'dusk',
      sun: { az: 335, el: 9, color: 0xffc58a, intensity: 1.4 },
      hemi: { sky: 0xc7d8ee, ground: 0x6b7448, intensity: 1.05 },
      env: { intensity: 0.55 },
      sky: { top: 0x7eaee6, horizon: 0xf3e8d2, bottom: 0x55603f },
      exposure: 1.0, interior: 1.6,
    },
    lighting: { shadowFocus: { center: [2, 3, 8], radius: 26 } },
    post: { ao: true, aoIntensity: 0.9, aoRadius: 0.7, bloom: 0.22, bloomThreshold: 0.82, bloomRadius: 0.45 },
    toneMapping: 'agx',
  },
};

let M = null;

export async function configure(ctx) {
  M = makeMaterials(ctx);
  ctx.setMat('exterior.wall', M.stucco);
  ctx.setMat('exterior.top', new THREE.MeshStandardMaterial({ color: 0x3d3833, roughness: 0.95 }));
  ctx.setMat('window.frame', M.bronze);
  ctx.setMat('window.glass', M.glassClear);
  ctx.setMat('door.entry', M.doorWood);
  ctx.setMat('door.garage', new THREE.MeshStandardMaterial({ color: 0xe6e0d2, roughness: 0.6, metalness: 0.05 }));
  ctx.setRoomMaterial('entry', 'floor', M.brickStep);
  ctx.setRoomMaterial('porch', 'floor', M.pavers);
  ctx.setRoomMaterial('porch', 'ceiling', M.porchCeiling);
  ctx.customCeiling('entry');
  configureOpenings(ctx);
}

export async function build(ctx) {
  const root = new THREE.Group();
  root.name = 'exterior';
  ctx.scene.add(root);
  installLensShift(ctx);

  const house = buildHouse(ctx, M, root);
  buildCladding(ctx, M, root, house.gables);
  buildOpenings(ctx, M, root);
  freeWindows(M, root, M.glow);
  await buildSite(ctx, M, root);
  await buildVegetation(ctx, M, root);

  // warm interior glow tracks the lighting preset's interior multiplier
  ctx.onUpdate(() => {
    const k = ctx.lighting.current?.interior ?? 1;
    for (const m of M.glow) m.emissiveIntensity = m.userData.glowBase * Math.min(1.3, 0.35 + 0.55 * k);
  });
}
