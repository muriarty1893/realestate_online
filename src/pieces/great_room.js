// Piece: great_room — great room, kitchen, dining, foyer, butler pantry, niche.
// Also owns the house-wide interior keys: trim, paint.wall, paint.ceiling, reveal, door.interior.
import * as THREE from 'three';
import { makeMats } from './great_room/mats.js';
import { buildVault, buildBeams, buildFireplace } from './great_room/arch.js';
import { buildKitchen } from './great_room/kitchen.js';

// Camera matched to refs/inside_view_1.webp (solved from vanishing points + plan geometry).
// shiftY: the photo is level (verticals vertical) with the horizon above centre, i.e. a shift lens;
// applied with camera.setViewOffset while this view is active.
const CAM = { pos: [3.225, 1.422, -2.600], yawDeg: 127.46, f: 1271.8, cy: 499.6, s: 1.0725 };
const fwd = [Math.cos((CAM.yawDeg * Math.PI) / 180), 0, Math.sin((CAM.yawDeg * Math.PI) / 180)];
const FOV = (2 * Math.atan(600 / (CAM.f * CAM.s)) * 180) / Math.PI;

export const views = {
  great_room: {
    pos: CAM.pos,
    target: [CAM.pos[0] + fwd[0] * 5, CAM.pos[1], CAM.pos[2] + fwd[2] * 5],
    fov: FOV, shiftY: (600 - CAM.cy) / 1200, pixelAspect: CAM.s, label: 'Great room',
    preset: 'day',
    lighting: { exposure: 1.0, interior: 1.0 },
    post: { ao: true, aoIntensity: 1.0, aoRadius: 0.5 },
    toneMapping: 'agx',
  },
};

let M = null;
export async function configure(ctx) {
  M = makeMats();
  ctx.setMat('paint.wall', M.wall);
  ctx.setMat('paint.ceiling', M.ceiling);
  ctx.setMat('trim', M.trim);
  ctx.setMat('reveal', M.reveal);
  ctx.setMat('door.interior', M.doorInt);
  for (const r of ['great', 'kitchen', 'dining', 'foyer', 'butler', 'niche']) ctx.setRoomMaterial(r, 'floor', M.floor);
  // the photo shows an east-west ridge (south wall top is level at 10 ft): build our own vault
  ctx.customCeiling('great');
}

export async function build(ctx) {
  const group = new THREE.Group();
  group.name = 'great_room';
  buildVault(ctx, M, group);
  buildBeams(ctx, M, group);
  buildFireplace(ctx, M, group);
  buildKitchen(ctx, M, group);
  ctx.scene.add(group);
  installLensShift(ctx);
}

// ------------------------------------------------------------ shift lens for the photo view
function installLensShift(ctx) {
  const cam = ctx.camera;
  let active = false;
  const apply = (v) => {
    const el = ctx.renderer.domElement;
    const w = el.width, h = el.height;
    if (v && (v.shiftY || v.pixelAspect)) {
      // pixelAspect: the photo is ~7% taller than a pinhole image of the plan (vertical "aspect"
      // correction in post); reproduce it by widening the camera aspect
      cam.setViewOffset(w, h, 0, (v.shiftY || 0) * h, w, h); // (sets aspect = w/h)
      cam.aspect = (w / h) * (v.pixelAspect || 1);
      cam.updateProjectionMatrix();
      active = true;
    } else if (active) { drop(); }
  };
  const drop = () => { if (!active) return; cam.clearViewOffset(); cam.aspect = ctx.renderer.domElement.width / ctx.renderer.domElement.height; cam.updateProjectionMatrix(); active = false; };
  window.addEventListener('viewchange', (e) => apply(e.detail));
  // walking/looking around drops the shift so walk mode behaves like a normal camera
  if (!ctx.shot) {
    window.addEventListener('keydown', (e) => { if (/^(Key[WASDQE]|Arrow)/.test(e.code)) drop(); });
    ctx.renderer.domElement.addEventListener('pointerdown', drop);
  }
}
