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
import { makeGardenEnv, installEnvSwap } from './exterior/env.js';
import { sunVector } from '../lighting.js';

// Camera matched to refs/front_view.webp: ~65 mm-equivalent from 32 m out, eye ~2.6 m, shift lens
// (principal point right of and below the frame centre, so verticals stay vertical).
export const views = {
  front: {
    label: 'Front exterior',
    pos: [4.6, 2.6, 36.0], target: [4.6, 2.6, 0], fov: 31.2, shift: [0.149, 0.097],
    preset: {
      base: 'golden',
      sun: { az: 25, el: 10, color: 0xffc47e, intensity: 1.8 },
      hemi: { sky: 0xf0f2f2, ground: 0x8a8658, intensity: 2.0 },
      env: { intensity: 0.85 },
      sky: { top: 0x7fb4ea, horizon: 0xe2ecf0, bottom: 0x5a6040 },
      exposure: 1.25, interior: 1.6,
    },
    lighting: { shadowFocus: { center: [2, 3, 6], radius: 30 } },
    post: { ao: true, aoIntensity: 0.9, aoRadius: 0.7, bloom: 0.25, bloomThreshold: 0.85, bloomRadius: 0.45 },
    toneMapping: 'neutral',
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
  const pv = views.front.preset;
  installEnvSwap(ctx, makeGardenEnv(ctx.renderer, sunVector(pv.sun.az, pv.sun.el)));

  const house = buildHouse(ctx, M, root);
  buildCladding(ctx, M, root, house.gables);
  buildOpenings(ctx, M, root);
  freeWindows(M, root, M.glow);
  const site = await buildSite(ctx, M, root);
  await buildVegetation(ctx, M, root, site);

  // warm interior glow tracks the lighting preset's interior multiplier
  ctx.onUpdate(() => {
    const k = ctx.lighting.current?.interior ?? 1;
    for (const m of M.glow) m.emissiveIntensity = m.userData.glowBase * Math.min(1.3, 0.35 + 0.55 * k);
  });
}
