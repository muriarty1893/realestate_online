// Light pool. Every room declares light "slots" (fixture positions), but only POOL point lights
// exist, so the shader light count is constant (no recompiles) and the piece stays within the
// 6-light budget. Each frame the pool is assigned to the slots of the room the camera is in, then
// to rooms you can see into from there; unused lights are parked at zero intensity.
import * as THREE from 'three';

const POOL = 6;

// rooms visible from each room (through doorways), most important first
const NEIGHBOURS = {
  bed_ne: ['bath_ne', 'vest', 'wic_ne'], bath_ne: ['bed_ne', 'wic_ne'], wic_ne: ['bath_ne'], vest: ['bed_ne', 'linen_ne'], linen_ne: ['vest'],
  bed_mid: ['hall_e', 'dress', 'wic_mid'], wic_mid: ['bed_mid'], linen_e: ['hall_e'], hall_e: ['bed_front', 'bed_mid', 'linen_e'],
  dress: ['bath_front', 'bed_mid', 'bed_front'], bath_front: ['dress'], wic_front: ['bed_front'], bed_front: ['wic_front', 'hall_e', 'dress'],
  util: ['hall_w'], hall_w: ['util', 'mud', 'stair'], mud: ['hall_w', 'stair', 'pdr', 'garage'], stair: ['hall_w', 'mud'], pdr: ['mud'], garage: ['mud'],
  // other pieces' rooms that open onto ours (one primary slot each, spill only)
  great: ['vest', 'hall_e'],
};
// rooms whose windows read from outside at dusk
const WINDOW_ROOMS = ['bed_front', 'bed_mid', 'bed_ne', 'garage', 'bath_front', 'bath_ne'];

export function lightPool(ctx, slots) {
  const P = ctx.plan;
  const lights = [];
  for (let i = 0; i < POOL; i++) {
    const l = new THREE.PointLight(0xffd9ae, 0, 4, 2);
    l.castShadow = false;
    l.name = 'rest.pool' + i;
    l.position.set(0, -50, 0);
    ctx.scene.add(l);
    ctx.addInteriorLight(l);
    lights.push(l);
  }
  const byRoom = new Map();
  for (const s of slots) { if (!byRoom.has(s.room)) byRoom.set(s.room, []); byRoom.get(s.room).push(s); }
  for (const list of byRoom.values()) list.sort((a, b) => (b.pri ?? 0) - (a.pri ?? 0));
  const roomAt = (x, z) => {
    const px = x / P.M_PER_PX + P.ORIGIN_PX[0], py = z / P.M_PER_PX + P.ORIGIN_PX[1];
    const rm = P.rooms.find((r) => r.rects.some((rc) => px > rc[0] && px < rc[2] && py > rc[1] && py < rc[3]));
    return rm ? rm.id : null;
  };
  let lastKey = '';
  let chosen = [];
  const cam = ctx.camera;
  const choose = () => {
    const here = roomAt(cam.position.x, cam.position.z);
    const out = [];
    const push = (s, scale = 1) => { if (out.length < POOL && !out.some((o) => o.s === s)) out.push({ s, scale }); };
    if (here && byRoom.has(here)) {
      for (const s of byRoom.get(here)) push(s);
      for (const n of NEIGHBOURS[here] || []) { const l = byRoom.get(n); if (l) push(l[0]); }
      for (const n of NEIGHBOURS[here] || []) { const l = byRoom.get(n); if (l && l[1]) push(l[1]); }
    } else if (here && NEIGHBOURS[here]) {
      for (const n of NEIGHBOURS[here]) { const l = byRoom.get(n); if (l) push(l[0], 0.6); }
    } else if (!here) {
      // outside: nearest windowed rooms
      const c = cam.position;
      const rooms = WINDOW_ROOMS.filter((r) => byRoom.has(r)).map((r) => ({ r, d: byRoom.get(r)[0].p[0] - c.x, e: byRoom.get(r)[0].p[2] - c.z })).sort((a, b) => Math.hypot(a.d, a.e) - Math.hypot(b.d, b.e));
      for (const { r } of rooms.slice(0, 4)) push(byRoom.get(r)[0]);
    }
    return { here, out };
  };
  ctx.onUpdate(() => {
    const { here, out } = choose();
    const key = here + ':' + out.map((o) => o.s.id).join(',');
    const mult = ctx.lighting.current?.interior ?? 1;
    if (key !== lastKey) { chosen = out; lastKey = key; }
    for (let i = 0; i < POOL; i++) {
      const l = lights[i], c = chosen[i];
      if (!c) { l.intensity = 0; l.userData.baseIntensity = 0; continue; }
      const s = c.s;
      l.position.set(...s.p);
      l.color.set(s.c ?? 0xffd9ae);
      l.distance = s.d ?? 4;
      l.userData.baseIntensity = s.i * c.scale;
      l.intensity = l.userData.baseIntensity * mult;
    }
  });
  slots.forEach((s, i) => { s.id = i; });
  return lights;
}
