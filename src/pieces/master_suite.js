// Piece: master_suite. Rooms mstr, mbath, wc, wic_top, wic_mstr and the openings owned by 'master_suite'.
// Photo target: refs/inside_view_2.webp, view `master`.
import * as THREE from 'three';
import { makeMats } from './master_suite/mats.js';
import { buildBedroom } from './master_suite/bedroom.js';
import { buildCeiling } from './master_suite/ceiling.js';
import { buildBath } from './master_suite/bath.js';
import { buildClosets } from './master_suite/closets.js';

export const views = {
  master: {
    label: 'Master suite',
    pos: [-4.948, 1.279, -4.225], target: [-7.846, 1.216, -8.299], fov: 65,
    preset: {
      base: 'golden',
      sun: { az: 70, el: 8, color: 0xffe4c4, intensity: 8.0 },
      hemi: { sky: 0xfff3e6, ground: 0xd2b698, intensity: 0.75 },
      env: { intensity: 0.25 },
      exposure: 1.2, interior: 1.0,
    },
    lighting: { shadowFocus: { center: [-7.2, 1.2, -6.4], radius: 7.5 } },
    post: { ao: true, aoIntensity: 1.4, aoRadius: 0.6 },
    toneMapping: 'neutral',
  },
};

let M = null;
const ROOMS = ['mstr', 'mbath', 'wc', 'wic_top', 'wic_mstr'];

export async function configure(ctx) {
  M = makeMats(ctx);
  for (const id of ROOMS) {
    const rm = ctx.room(id);
    ctx.setRoomMaterial(id, 'floor', rm.floor === 'tile' ? M.porcelain : M.oakFloor);
    ctx.setRoomMaterial(id, 'wall', id === 'mstr' || id.startsWith('wic') ? M.wallMstr : M.wallBath);
    ctx.setRoomMaterial(id, 'ceiling', M.ceiling);
  }
  ctx.customCeiling('mstr');
  const win = { frame: M.winFrame, glass: M.glass };
  ctx.overrideOpening('win_mstr_n1', { mats: win, grid: [2, 2] });
  ctx.overrideOpening('win_mstr_n2', { mats: win, grid: [2, 2] });
  ctx.overrideOpening('win_tub', { mats: win, grid: [2, 2] });
  ctx.overrideOpening('door_mstr_slider', { mats: win, grid: [1, 3] });
  ctx.overrideOpening('door_mstr', { skipUnit: true });
}

export async function build(ctx) {
  const group = new THREE.Group(); group.name = 'piece:master_suite';
  ctx.scene.add(group);
  const P = {};
  buildCeiling(ctx, M, group, P);
  buildBedroom(ctx, M, group, P);
  await buildBath(ctx, M, group, P);
  buildClosets(ctx, M, group, P);
}
