// Stacked stair around the powder room: an up-flight (west along the north band, winder-free
// quarter landing, then south) toward the bonus room, and a down-flight (west along the south
// band) to a basement landing. Neither upper nor lower floor exists, so the up-flight ends on a
// landing in a closed stair shaft with a door, and the down-flight ends on a landing with a door.
import * as THREE from 'three';
import { Frame } from './kit.js';
import { doorLeafStatic } from './doors.js';
import { pendantDome, recessed } from './furniture.js';

export function buildStair(ctx, M, B, slots) {
  const k = ctx.plan.M_PER_PX;
  const X = (px) => (px - 1500) * k, Z = (py) => (py - 1000) * k;
  const f = new Frame(B);
  const R = 3.353 / 18;            // riser (11' floor to floor)
  const tread = M.stairTread, white = M.trimWhite, wall = M.wall;
  const capT = 0.03, nose = 0.025;
  const walk = [];

  const x674 = X(674), x761 = X(761), x762 = X(762), x772 = X(772), x923 = X(923), x952 = X(952), x983 = X(983);
  const z813 = Z(813), z899 = Z(899), z910 = Z(910), z1054 = Z(1054), z1065 = Z(1065), z1152 = Z(1152), z1166 = Z(1166);
  const zN = z813, zS = z899; // north band

  // block helper in world coords (x0..x1, y0..y1, z0..z1)
  const blk = (mat, x0, x1, y0, y1, z0, z1, o = {}) => f.box(mat, x1 - x0, y1 - y0, z1 - z0, (x0 + x1) / 2, y0, (z0 + z1) / 2, o);

  // ---------------- up flight, leg 1 (rising west)
  const t1 = (x952 - x762) / 8;
  for (let i = 1; i <= 8; i++) {
    const xe = x952 - (i - 1) * t1, xw = xe - t1, y = i * R;
    blk(white, xw, xe, 0, y - capT, zN, zS);
    blk(tread, xw, xe + nose, y - capT, y, zN, zS, { cast: true });
  }
  // bottom landing strip in front of the first riser (floor level, hall side)
  blk(tread, x952 + nose, x983, -0.02, 0.0, zN, zS);
  // quarter landing (NW)
  const yL = 9 * R;
  blk(white, x674, x762, 0, yL - capT, zN, zS);
  blk(tread, x674, x762 + nose, yL - capT, yL, zN, zS, { cast: true });
  // leg 2 (rising south)
  const t2 = (z1065 - z899) / 8;
  for (let j = 1; j <= 8; j++) {
    const zn = z899 + (j - 1) * t2, zs = zn + t2, y = (9 + j) * R;
    blk(white, x674, x761, 0, y - capT, zn, zs);
    blk(tread, x674, x761, y - capT, y, zn - nose, zs, { cast: true });
  }
  // top landing slab (SW corner) at the bonus-room level
  const yT = 18 * R;
  blk(white, x674, x772, yT - 0.3, yT - capT, z1065, z1152);
  blk(tread, x674, x772, yT - capT, yT, z1065 - nose, z1152);

  // ---------------- down flight (descending west) to the basement landing
  const t3 = (x923 - x772) / 6;
  const yB = -7 * R;
  blk(white, x923, x923 + 0.04, -0.4, -0.001, z1065, z1152);            // riser 1 (face of the mud floor edge)
  blk(tread, x923 - nose, x923 + 0.035, -capT, 0.0, z1065, z1152);       // top nosing flush with the mud floor
  for (let i = 1; i <= 6; i++) {
    const xe = x923 - (i - 1) * t3, xw = xe - t3, y = -i * R;
    blk(white, xw, xe, yB - 0.25, y - capT, z1065, z1152);
    blk(tread, xw - nose, xe, y - capT, y, z1065, z1152, { cast: true });
  }
  blk(tread, x674, x772, yB - 0.05, yB, z1065, z1152, { cast: true });
  // pit walls below the shell walls (shell walls stop at -0.57)
  const wb = -0.57;
  blk(wall, x674 - 0.02, x674, yB - 0.1, wb + 0.01, z899, z1152);            // west
  blk(wall, x674, x923, yB - 0.1, wb + 0.01, z1152, z1152 + 0.02);           // south (garage wall)
  blk(wall, x772, x923, yB - 0.1, wb + 0.01, z1065 - 0.02, z1065);           // north under the powder room
  // basement door wall at the top of the down-flight's second (hidden) leg
  blk(wall, x674, x772, yB - 0.1, 0.0, z1065 - 0.03, z1065);
  doorLeafStatic(f.at((x674 + x772) / 2 - 0.05, yB, z1065 + 0.012, 0), M, 0.81, 2.03, { casing: true });
  // skirt boards along the down flight
  for (const z of [z1065 + 0.006, z1152 - 0.006]) {
    const len = x923 - x772, ang = Math.atan2(6 * R, len);
    f.boxC(white, Math.hypot(len, 6 * R) + 0.3, 0.4, 0.012, (x923 + x772) / 2, -3 * R + 0.02, z, { rz: ang, cast: false });
  }
  // baseboard on the landing
  blk(white, x674, x674 + 0.014, yB, yB + 0.135, z1065, z1152, { cast: false });
  blk(white, x674, x772, yB, yB + 0.135, z1152 - 0.014, z1152, { cast: false });
  // skirt boards along the up flight (wall side)
  {
    const len = x952 - x762;
    const ang = Math.atan2(8 * R, len);
    f.boxC(white, Math.hypot(len, 8 * R) + 0.2, 0.4, 0.012, (x952 + x762) / 2, 5 * R + 0.02, zN + 0.006, { rz: -ang, cast: false });
    const len2 = z1065 - z899, ang2 = Math.atan2(8 * R, len2);
    f.boxC(white, 0.012, 0.4, Math.hypot(len2, 8 * R) + 0.2, x674 + 0.006, 14 * R + 0.02, (z899 + z1065) / 2, { rx: -ang2, cast: false });
  }

  // ---------------- handrails (black iron on brackets) + newel at the open bottom of the up flight
  const rail = (x0, y0, z0, x1, y1, z1, wallN) => {
    const a = new THREE.Vector3(x0, y0, z0), b = new THREE.Vector3(x1, y1, z1);
    const len = a.distanceTo(b), mid = a.clone().add(b).multiplyScalar(0.5);
    const g = new THREE.CylinderGeometry(0.021, 0.021, len, 12);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    const m = new THREE.Matrix4().compose(mid, q, new THREE.Vector3(1, 1, 1));
    B.add(g, M.black, m, false);
    // brackets every ~1.1 m
    const n = Math.max(2, Math.round(len / 1.1) + 1);
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n, p = a.clone().lerp(b, t);
      const bm = new THREE.Matrix4().makeTranslation(p.x - wallN[0] * 0.045, p.y - 0.04, p.z - wallN[2] * 0.045);
      B.add(new THREE.BoxGeometry(wallN[0] ? 0.09 : 0.016, 0.016, wallN[2] ? 0.09 : 0.016), M.black, bm, false);
    }
  };
  const H = 0.88;
  rail(x952 + 0.1, R * 0.5 + H, zN + 0.065, x762 - 0.05, 9 * R + H, zN + 0.065, [0, 0, 1]);                  // leg 1, north wall
  rail(x674 + 0.065, 9.5 * R + H, z899 - 0.05, x674 + 0.065, 17.5 * R + H, z1065 + 0.1, [1, 0, 0]);          // leg 2, west wall
  rail(x923 - 0.05, -R * 0.5 + H, z1152 - 0.065, x772 + 0.05, -6.5 * R + H, z1152 - 0.065, [0, 0, -1]);     // down, south wall
  rail(x923 - 0.05, -R * 0.5 + H, z1065 + 0.065, x772 + 0.05, -6.5 * R + H, z1065 + 0.065, [0, 0, 1]);      // down, north wall
  // newel + short guard where the bottom of the up flight is open to the mud room
  {
    const zx = zS - 0.035, nx = x952 - 0.1;
    blk(white, nx - 0.06, nx + 0.06, R, R + 1.0, zx - 0.06, zx + 0.06);
    blk(tread, nx - 0.075, nx + 0.075, R + 1.0, R + 1.04, zx - 0.075, zx + 0.075);
    const x1 = x923 + 0.01, y0 = R + 0.95, y1 = 2.22 * R + H;
    const a = new THREE.Vector3(nx, y0, zx), b = new THREE.Vector3(x1, y1, zx);
    const len = a.distanceTo(b), mid = a.clone().add(b).multiplyScalar(0.5);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), b.clone().sub(a).normalize());
    B.add(boxGeoSafe(len, 0.06, 0.07), tread, new THREE.Matrix4().compose(mid, q, new THREE.Vector3(1, 1, 1)), false);
    for (let i = 1; i <= 2; i++) {
      const t = i / 3, xb = nx + (x1 - nx) * t, yTop = y0 + (y1 - y0) * t, base = (xb > x952 - t1 ? 1 : 2) * R;
      blk(white, xb - 0.017, xb + 0.017, base, yTop, zx - 0.017, zx + 0.017, { cast: false });
    }
  }

  // ---------------- ceilings and the stair shaft
  const c10 = 3.048, top = 5.45;
  const ceil = (x0, x1, z0, z1, y) => {
    f.add(new THREE.PlaneGeometry(x1 - x0, z1 - z0), M.ceilingPaint, (x0 + x1) / 2, y, (z0 + z1) / 2, 0, Math.PI / 2, 0, false);
    blk(M.wall, x0, x1, y + 0.002, y + 0.03, z0, z1, { cast: true });
  };
  const xShaft = -7.0;
  ceil(xShaft, x983, zN, zS, c10);              // over the lower half of leg 1
  ceil(x772, x923, z1065, z1152, c10);          // over the down flight
  ceil(x674, xShaft, zN, zS, top);              // shaft ceiling
  ceil(x674, x761, zS, z1065, top);
  ceil(x674, x772, z1065, z1152, top);
  // shaft walls from 10 ft up to the shaft ceiling
  blk(wall, X(664), x674, c10, top, zN, z1166);
  blk(wall, x674, xShaft, c10, top, Z(801), zN);
  blk(wall, xShaft, xShaft + 0.1, c10, top + 0.03, zN, zS);
  blk(wall, x761, xShaft + 0.1, c10, top, zS, z910);
  blk(wall, x761, x772, c10, top, zS, z1065);
  blk(wall, x772, x772 + 0.1, c10, top, z1065, z1152);
  blk(wall, x674, x772 + 0.1, c10, top, z1152, z1166);
  // bonus-room door at the top landing (south wall of the shaft)
  doorLeafStatic(f.at((x674 + x772) / 2, yT, z1152 - 0.012, Math.PI), M, 0.76, 2.03, { casing: true });
  // lights: pendant in the shaft, can over the down flight
  pendantDome(f.at(-8.35, top, -1.45), M, { drop: 1.1, r: 0.2 });
  recessed(f.at((x772 + x923) / 2, c10, (z1065 + z1152) / 2), M);
  recessed(f.at(-6.3, c10, (zN + zS) / 2), M);
  slots.push({ room: 'stair', p: [-8.35, top - 1.5, -1.3], i: 3.2, d: 5.5 });
  slots.push({ room: 'stair', p: [-6.9, c10 - 0.3, (z1065 + z1152) / 2], i: 2.2, d: 4.5 });

  // walking: block the top landing (and the basement door below it)
  ctx.addCollider({ x0: x674, z0: z1065 - 0.045, x1: x772, z1: z1065 });
  return { walkMats: [tread] };
}

function boxGeoSafe(w, h, d) { return new THREE.BoxGeometry(w, h, d); }
