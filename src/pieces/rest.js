// Piece: rest of house: service wing (laundry, rear hall, mud room, stair, powder room, garage)
// and the bedroom wing (three bedrooms, two baths, jack-and-jill dressing room, closets, halls).
// No reference photos exist for these rooms; they are extrapolated from the photos' style.
import * as THREE from 'three';
import { Batch } from './rest/kit.js';
import { floorMats, makeMats } from './rest/mats.js';
import { doorUnit } from './rest/doors.js';
import { buildStair } from './rest/stair.js';
import { lightPool } from './rest/lights.js';
import * as R from './rest/rooms.js';

const WOOD = ['hall_w', 'mud', 'bed_ne', 'vest', 'linen_ne', 'wic_ne', 'bed_mid', 'linen_e', 'hall_e', 'wic_mid', 'wic_front', 'bed_front'];
const TILE = ['util', 'pdr', 'bath_ne', 'dress', 'bath_front'];
const DOORS = ['door_wic_util', 'door_util', 'door_pdr', 'door_garage_mud', 'door_bed_ne', 'door_linen_ne', 'door_bed_mid', 'door_wic_mid', 'door_linen_e', 'door_bath_front', 'door_wic_front', 'door_bed_front'];
const DOOR_ANGLE = { door_linen_ne: 0, door_linen_e: 0, door_wic_mid: 0, door_wic_front: 0, door_bath_front: 0, door_pdr: 88, door_garage_mud: 0 };

const shadow = (c, r = 7) => ({ center: c, radius: r });
export const views = {
  bed_front: {
    pos: [9.9, 1.52, 4.2], target: [7.4, 0.95, 7.0], fov: 62, label: 'Front bedroom',
    preset: 'day', lighting: { exposure: 1.05, interior: 1.0, shadowFocus: shadow([8.4, 1, 6.5]) },
    post: { ao: true, aoIntensity: 1.0, aoRadius: 0.5 },
  },
  bed_mid: {
    pos: [7.75, 1.52, 1.35], target: [11.2, 0.95, -0.35], fov: 62, label: 'Middle bedroom',
    preset: 'golden', lighting: { exposure: 1.0, interior: 1.0, shadowFocus: shadow([10, 1, 0]) },
    post: { ao: true, aoIntensity: 1.0, aoRadius: 0.5 },
  },
  bed_ne: {
    pos: [9.85, 1.52, -2.95], target: [7.0, 0.95, -5.25], fov: 62, label: 'Back bedroom',
    preset: 'day', lighting: { exposure: 1.08, interior: 1.0, shadowFocus: shadow([8.4, 1, -4.6]) },
    post: { ao: true, aoIntensity: 1.0, aoRadius: 0.5 },
  },
  bath_front: {
    pos: [10.36, 1.6, 2.97], target: [11.7, 0.95, 4.3], fov: 75, label: 'Hall bath',
    preset: 'day', lighting: { exposure: 1.05, interior: 1.0 },
    post: { ao: true, aoIntensity: 1.0, aoRadius: 0.4 },
  },
  laundry: {
    pos: [-8.62, 1.55, -2.42], target: [-6.0, 1.05, -3.55], fov: 66, label: 'Laundry',
    preset: 'day', lighting: { exposure: 1.05, interior: 1.0 },
    post: { ao: true, aoIntensity: 1.0, aoRadius: 0.4 },
  },
  mud: {
    pos: [-5.95, 1.55, 1.38], target: [-4.7, 1.0, -0.75], fov: 66, label: 'Mud room',
    preset: 'day', lighting: { exposure: 1.05, interior: 1.0 },
    post: { ao: true, aoIntensity: 1.0, aoRadius: 0.45 },
  },
  stair: {
    pos: [-4.75, 1.55, -1.3], target: [-7.5, 1.7, -1.6], fov: 64, label: 'Stair (up to bonus / down to basement)',
    preset: 'day', lighting: { exposure: 1.05, interior: 1.0 },
    post: { ao: true, aoIntensity: 1.0, aoRadius: 0.45 },
  },
  dress: {
    pos: [9.95, 1.55, 1.95], target: [8.6, 1.15, 3.2], fov: 70, label: 'Jack-and-jill vanity',
    preset: 'day', lighting: { exposure: 1.05, interior: 1.0 },
    post: { ao: true, aoIntensity: 1.0, aoRadius: 0.4 },
  },
  bath_ne: {
    pos: [10.32, 1.55, -3.3], target: [11.75, 1.1, -4.6], fov: 72, label: 'Back bath',
    preset: 'day', lighting: { exposure: 1.05, interior: 1.0 },
    post: { ao: true, aoIntensity: 1.0, aoRadius: 0.4 },
  },
  pdr: {
    pos: [-7.05, 1.6, -0.82], target: [-7.05, 1.15, 0.6], fov: 72, label: 'Powder room',
    preset: 'day', lighting: { exposure: 1.05, interior: 1.0 },
    post: { ao: true, aoIntensity: 1.0, aoRadius: 0.4 },
  },
  garage: {
    pos: [-5.25, 1.6, 8.75], target: [-10.6, 0.75, 3.2], fov: 66, label: 'Garage',
    preset: 'day', lighting: { exposure: 0.92, interior: 0.85 },
    post: { ao: true, aoIntensity: 1.0, aoRadius: 0.5 },
  },
};

let FM;
export async function configure(ctx) {
  FM = floorMats(ctx);
  for (const id of WOOD) ctx.setRoomMaterial(id, 'floor', FM.wood);
  for (const id of TILE) ctx.setRoomMaterial(id, 'floor', FM.tile);
  ctx.setRoomMaterial('garage', 'floor', FM.concrete);
  ctx.setRoomMaterial('garage', 'wall', FM.garageWall);
  ctx.setRoomMaterial('stair', 'floor', FM.stairMarker);
  ctx.customCeiling('stair');
  ctx.customCeiling('garage');   // plan rect overlaps the mud/stair; built with the true outline
  ctx.noBaseboard.add('stair');
  for (const id of DOORS) ctx.overrideOpening(id, { skipUnit: true });
  // the pocket into the NE closet is narrower than traced: the vanity sits beside it in the plan
  ctx.overrideOpening('door_wic_ne', { r: [2475, 746, 2537, 757] });
}

function removeShellFloors(ctx, mats) {
  const kill = [];
  ctx.shell.group.traverse((o) => { if (o.isMesh && mats.includes(o.material)) kill.push(o); });
  for (const m of kill) {
    m.parent.remove(m);
    const i = ctx.walkables.indexOf(m);
    if (i >= 0) ctx.walkables.splice(i, 1);
  }
}

export async function build(ctx) {
  const M = makeMats(ctx, FM);
  M.stairTread = FM.wood;
  M.ceilingPaint = ctx.getMat('paint.ceiling');
  removeShellFloors(ctx, [FM.stairMarker, FM.concrete]);

  const root = new THREE.Group();
  root.name = 'rest';
  ctx.scene.add(root);
  const slots = [];
  const H = R.makeHelpers(ctx);
  let tris = 0;
  const zone = (name, fn) => {
    const B = new Batch();
    let out;
    try { out = fn(B); } catch (e) { console.error('[rest] ' + name, e); throw e; }
    B.flush(root, 'rest.' + name);
    tris += B.tris;
    return { B, out };
  };

  zone('bed_front', (B) => R.buildBedFront(ctx, M, B, slots, H));
  zone('bed_mid', (B) => R.buildBedMid(ctx, M, B, slots, H));
  zone('bed_ne', (B) => R.buildBedNE(ctx, M, B, slots, H));
  zone('bath_ne', (B) => R.buildBathNE(ctx, M, B, slots, H));
  zone('small_ne', (B) => R.buildSmallNE(ctx, M, B, slots, H));
  zone('hall_e', (B) => R.buildHallE(ctx, M, B, slots, H));
  zone('dress', (B) => R.buildDress(ctx, M, B, slots, H));
  zone('bath_front', (B) => R.buildBathFront(ctx, M, B, slots, H));
  zone('closets_front', (B) => R.buildClosetsFront(ctx, M, B, slots, H));
  zone('util', (B) => R.buildUtil(ctx, M, B, slots, H));
  zone('hall_w', (B) => R.buildHallW(ctx, M, B, slots, H));
  zone('mud', (B) => R.buildMud(ctx, M, B, slots, H));
  zone('pdr', (B) => R.buildPdr(ctx, M, B, slots, H));
  const st = zone('stair', (B) => buildStair(ctx, M, B, slots));
  for (const m of st.B.meshes) if (st.out.walkMats.includes(m.material)) ctx.addWalkable(m);
  const walk = [];
  const gz = zone('garage', (B) => R.buildGarage(ctx, M, B, slots, H, walk));
  for (const m of [...walk, ...(gz.out || [])]) { if (!m.parent) root.add(m); }
  for (const m of walk) ctx.addWalkable(m);
  zone('doors', (B) => {
    for (const id of DOORS) {
      const o = ctx.opening(id);
      if (!o || !o.M) continue;
      doorUnit(B, ctx, M, o, { angle: DOOR_ANGLE[id] ?? 88, switchPlate: !/linen|wic|bath/.test(id) });
    }
  });
  root.traverse((o) => { if (o.isMesh) { o.updateMatrix(); o.matrixAutoUpdate = false; } });
  lightPool(ctx, slots);
  ctx.restInfo = { tris, slots: slots.length };
  console.warn('[rest] triangles', tris, 'slots', slots.length, 'meshes', root.children.length);
}
