// House exterior: roof system (main hip/gable roof, west wing gable over garage + master, front
// gables, garage bump-out), entry porch, shed dormer, chimney, window awnings, gable vents,
// soffits, back porch posts/beam, bonus-room gable window.
import * as THREE from 'three';
import { Geo, V3, clip, wallUV, slopeUV, polyNormal } from './util.js';
import { roofBlock, emitRoof, eaveTrim, underGableZClipper } from './roof.js';

export const WALL_TOP = 3.048;
const P_MAIN = 10 / 12, P_FRONT = 13 / 12, P_WEST = 12 / 12, P_BUMP = 12 / 12;

// remove axis-aligned boxes (in plan) from a polygon -> convex pieces
function removeBox(pts, b) {
  const pieces = [];
  const c = (arr, f) => clip(arr, f);
  const P = () => pts.map((q) => q.clone());
  const a = c(P(), (q) => b.x0 - q.x); if (a.length >= 3) pieces.push(a);
  const d = c(P(), (q) => q.x - b.x1); if (d.length >= 3) pieces.push(d);
  const mid = c(c(P(), (q) => q.x - b.x0), (q) => b.x1 - q.x);
  const e = c(mid.map((q) => q.clone()), (q) => b.z0 - q.z); if (e.length >= 3) pieces.push(e);
  const f = c(mid.map((q) => q.clone()), (q) => q.z - b.z1); if (f.length >= 3) pieces.push(f);
  return pieces;
}

export function buildHouse(ctx, M, parent) {
  const geo = new Geo();
  const metal = new Geo();
  const upPoly = (g, mat, pts, uvf) => { if (polyNormal(pts).y < 0) pts.reverse(); g.poly(mat, pts, uvf); };
  const gables = [];

  // ---------------- west wing (garage + master suite): one long gable, ridge N-S
  const west = roofBlock({ ridge: 'z', a0: -9.155, a1: 8.593, b0: -12.095, b1: -4.421, ys: 3.448, pitch: P_WEST, ov: 0.35, rake: 0.3,
    ends: ['gable', 'gable'], gableBottom: WALL_TOP - 0.002, gableStyle: ['stucco', 'stucco'] });
  emitRoof(geo, west, M, { eaveRanges: { b0: [[-10, 10]], b1: [[-9.5, -6.961], [7.253, 9]] } });
  gables.push(...west.gables);

  // ---------------- main roof: hip at the west (dies into the west wing), gable at the east
  const main = roofBlock({ ridge: 'x', a0: -8.258, a1: 11.868, b0: -6.561, b1: 6.853, ys: 3.298, pitch: P_MAIN, ov: 0.4, rake: 0.35,
    ends: ['hip', 'gable'], gableBottom: 2.785, gableStyle: ['stucco', 'stucco'] });
  const wingClip = underGableZClipper({ xr: (-12.095 - 4.421) / 2, H: west.H, p: P_WEST, xEdge: -4.421 + 0.35 });
  const porchCut = { x0: 2.724, x1: 6.442, z0: 6.853, z1: 99 };
  const mainClip = (pts) => wingClip(pts).flatMap((q) => removeBox(q, porchCut));
  emitRoof(geo, main, M, { clipper: mainClip, eaveRanges: { b1: [[-4.071, -1.535], [10.646, 12.3]], b0: [[-4.071, 12.3]] } });
  gables.push(...main.gables);

  // ---------------- front gables (dining, bedroom) and the garage bump-out
  const fg = (x0, x1, name) => roofBlock({ ridge: 'z', a0: 3.82, a1: 7.771, b0: x0, b1: x1, ys: 3.72, pitch: P_FRONT, ov: 0.4, rake: 0.3,
    ends: ['none', 'gable'], gableBottom: WALL_TOP - 0.002, gableStyle: ['bb', 'bb'], name });
  const dining = fg(-1.135, 2.724, 'dining');
  const bed = fg(6.442, 10.246, 'bed');
  emitRoof(geo, dining, M, { eaveRanges: { b0: [[6.85, 8.2]], b1: [[7.9, 8.2]] } });
  emitRoof(geo, bed, M, { eaveRanges: { b0: [[7.9, 8.2]], b1: [[6.85, 8.2]] } });
  gables.push(...dining.gables, ...bed.gables);
  const bump = roofBlock({ ridge: 'z', a0: 8.593, a1: 9.198, b0: -8.128, b1: -4.421, ys: 3.298, pitch: P_BUMP, ov: 0.35, rake: 0.3,
    ends: ['none', 'gable'], gableBottom: WALL_TOP - 0.002, gableStyle: ['bb', 'bb'] });
  emitRoof(geo, bump, M, { eaveRanges: { b0: [[8.593, 9.6]], b1: [[8.593, 9.6]] } });
  gables.push(...bump.gables);

  // ---------------- extra soffits where walls step back under the main eaves
  const soffitY = main.ye + 0.02 - 0.2 + 0.004;
  const soffit = (x0, x1, z0, z1, y) => geo.poly(M.soffit, [V3(x0, y, z0), V3(x1, y, z0), V3(x1, y, z1), V3(x0, y, z1)], (q) => [q.x, q.z]);
  soffit(-4.421, -1.135, 6.204, 7.253, soffitY);      // butler front
  soffit(10.246, 11.868, 6.204, 6.853, soffitY);      // front closet, east end
  soffit(10.246, 11.868, -6.561, -5.188, soffitY);    // NE notch at the back
  // bands closing the gap between the shell wall top and the raised front-gable soffits
  const fgSoff = dining.ye + 0.02 - 0.2 + 0.01;
  const band = (axis, plane, a0, a1, sgn, mat) => {
    const y0 = WALL_TOP - 0.05, y1 = fgSoff;
    const pts = axis === 'x'
      ? [V3(plane, y0, a0), V3(plane, y0, a1), V3(plane, y1, a1), V3(plane, y1, a0)]
      : [V3(a0, y0, plane), V3(a1, y0, plane), V3(a1, y1, plane), V3(a0, y1, plane)];
    const n = axis === 'x' ? V3(sgn, 0, 0) : V3(0, 0, sgn);
    if (polyNormal(pts).dot(n) < 0) pts.reverse();
    geo.poly(mat, pts, wallUV(n), n);
  };
  band('x', -1.135 - 0.003, 6.204, 7.771, -1, M.board);
  band('x', 2.724 + 0.003, 6.55, 7.771, 1, M.porchWall);
  band('x', 6.442 - 0.003, 6.853, 7.771, -1, M.porchWall);
  band('x', 10.246 + 0.003, 6.204, 7.771, 1, M.board);
  // foyer wall extension above the porch roof up to the main roof edge
  {
    const z = 6.853 + 0.004;
    const pts = [V3(2.724, WALL_TOP - 0.05, z), V3(6.442, WALL_TOP - 0.05, z), V3(6.442, 3.36, z), V3(2.724, 3.36, z)];
    geo.poly(M.board, pts, wallUV(V3(0, 0, 1)), V3(0, 0, 1));
  }

  // ---------------- entry porch: shed metal roof, ceiling, beam, columns, brick steps
  const porch = { x0: 2.724, x1: 6.442, zw: 6.853, zb: 7.912, zf: 8.15, yBack: 3.06, yFront: 2.66 };
  {
    const { x0, x1, zw, zf, yBack, yFront } = porch;
    const pts = [V3(x0, yFront, zf), V3(x1, yFront, zf), V3(x1, yBack, zw), V3(x0, yBack, zw)];
    upPoly(metal, M.metalRoof, pts, (q) => [q.x, -q.z * 1.03]);
    eaveTrim(geo, M, V3(x0, yFront, zf), V3(x1, yFront, zf), V3(0, 0, 1), yFront, zf - porch.zb, 0.18, true);
    // porch ceiling (beadboard tone) and beam on the columns
    const yc = 2.62;
    geo.poly(M.porchCeiling, [V3(x0, yc, zw), V3(x1, yc, zw), V3(x1, yc, porch.zb), V3(x0, yc, porch.zb)], (q) => [q.x, q.z]);
    geo.box(M.white, x0, 2.40, 7.642, x1, yc + 0.005, porch.zb + 0.01);
    // closing the space between ceiling and roof at the beam line
    geo.poly(M.white, [V3(x0, yc, porch.zb + 0.01), V3(x1, yc, porch.zb + 0.01), V3(x1, yFront + (yBack - yFront) * (zf - porch.zb) / (zf - zw), porch.zb + 0.01), V3(x0, yFront + (yBack - yFront) * (zf - porch.zb) / (zf - zw), porch.zb + 0.01)]);
    for (const c of ctx.plan.marks.entryColumns) {
      const r = ctx.rectM(c);
      geo.box(M.white, r.x0, -0.04, r.z0, r.x1, 2.40, r.z1);
      geo.box(M.white, r.x0 - 0.035, -0.04, r.z0 - 0.035, r.x1 + 0.035, 0.18, r.z1 + 0.035);
      geo.box(M.white, r.x0 - 0.03, 2.28, r.z0 - 0.03, r.x1 + 0.03, 2.40, r.z1 + 0.03);
      ctx.addCollider({ x0: r.x0, z0: r.z0, x1: r.x1, z1: r.z1 });
    }
    // steps (two treads below the porch floor)
    const st = ctx.rectM(ctx.plan.marks.entrySteps);
    const stepGeo = new Geo();
    const tread = (z0, z1, y) => stepGeo.box(M.brickStep, st.x0, -0.6, z0, st.x1, y, z1, { skip: 'ny' });
    tread(st.z0 - 0.02, st.z0 + 0.313, -0.177);
    tread(st.z0 + 0.313, st.z1, -0.313);
    const steps = stepGeo.toMeshes(parent, { name: 'steps' });
    steps.forEach((m) => ctx.addWalkable(m));
  }

  // ---------------- shed dormer above the entry
  {
    const x0 = 3.26, x1 = 5.90, zf = 6.853, yb = 2.98, yE = 4.85, zTop = 4.087, yTop = 5.60, ovF = 0.25, ovS = 0.12;
    const k = (yTop - yE) / (zf - zTop);
    // front wall (board and batten)
    gables.push({ pts: [V3(x0, yb, zf), V3(x1, yb, zf), V3(x1, yE - 0.02, zf), V3(x0, yE - 0.02, zf)], n: V3(0, 0, 1), style: 'bb' });
    // cheeks
    const yMain = (z) => 3.298 + (6.853 - z) * P_MAIN;
    for (const [x, s] of [[x0, -1], [x1, 1]]) {
      const pts = [V3(x, yMain(zf) - 0.3, zf), V3(x, yE - 0.02, zf), V3(x, yTop - 0.02, zTop), V3(x, yMain(zTop) - 0.05, zTop)];
      gables.push({ pts: s > 0 ? pts : pts.reverse(), n: V3(s, 0, 0), style: 'smooth' });
    }
    // roof
    const yF = yE - ovF * k;
    upPoly(metal, M.metalRoof, [V3(x0 - ovS, yF, zf + ovF), V3(x1 + ovS, yF, zf + ovF), V3(x1 + ovS, yTop, zTop), V3(x0 - ovS, yTop, zTop)], (q) => [q.x, -q.z]);
    eaveTrim(geo, M, V3(x0 - ovS, yF, zf + ovF), V3(x1 + ovS, yF, zf + ovF), V3(0, 0, 1), yF, ovF, 0.16, false);
    for (const [x, s] of [[x0 - ovS, -1], [x1 + ovS, 1]]) {
      geo.beam(M.bronze, V3(x - s * 0.015, yF - 0.06, zf + ovF), V3(x - s * 0.015, yTop - 0.06, zTop), 0.03, 0.14);
      // side soffit under the overhang
      const pts = [V3(x, yF - 0.13, zf + ovF), V3(x, yTop - 0.13, zTop), V3(x + s * -ovS, yTop - 0.13, zTop), V3(x + s * -ovS, yF - 0.13, zf + ovF)];
      if (polyNormal(pts).y > 0) pts.reverse();
      geo.poly(M.soffit, pts);
    }
  }

  // ---------------- chimney (stucco, from the fireplace mass) with crown and metal cap
  {
    const x0 = 6.2, x1 = 7.06, z0 = -0.34, z1 = 0.96, yTop = 9.5;
    geo.box(M.stucco, x0, 6.2, z0, x1, yTop, z1, { skip: 'ny' });
    geo.box(M.stoneCap, x0 - 0.06, yTop, z0 - 0.06, x1 + 0.06, yTop + 0.08, z1 + 0.06);
    geo.box(M.bronze, x0 + 0.12, yTop + 0.08, z0 + 0.15, x1 - 0.12, yTop + 0.36, z1 - 0.15);
    geo.box(M.bronze, x0 + 0.04, yTop + 0.36, z0 + 0.08, x1 - 0.04, yTop + 0.42, z1 - 0.08);
  }

  // ---------------- standing-seam awnings over the three bay windows
  const awning = (x0, x1, zw, zb, ov, side) => {
    const zf = zb + ov, yTop = 3.62, yF = 3.2, yBot = 3.0;
    upPoly(metal, M.metalRoof, [V3(x0, yF, zf), V3(x1, yF, zf), V3(x1, yTop, zw), V3(x0, yTop, zw)], (q) => [q.x, -q.z]);
    geo.box(M.bronze, x0 - 0.005, yBot, zf - 0.03, x1 + 0.005, yF + 0.02, zf + 0.005);
    // sides (wedge cheeks)
    for (const x of [x0, x1]) {
      const s = x === x0 ? -1 : 1;
      const pts = [V3(x, yBot, zw), V3(x, yBot, zf), V3(x, yF, zf), V3(x, yTop, zw)];
      if (polyNormal(pts).x * s < 0) pts.reverse();
      geo.poly(M.bronze, pts);
    }
    // soffit only over the overhang (outside the bay walls)
    soffit(x0, x1, zb, zf - 0.03, yBot);
    const r = side;
    soffit(x0, r[0], zw, zb, yBot); soffit(r[1], x1, zw, zb, yBot);
  };
  awning(-0.313 - 0.14, 1.837 + 0.14, 7.771, 8.279, 0.22, [-0.313, 1.837]);
  awning(7.317 - 0.14, 9.490 + 0.14, 7.771, 8.279, 0.22, [7.317, 9.490]);
  // garage bay: its walls are rebuilt lower (see garageBay) so the awning sits right over the window
  {
    const x0 = -7.361 - 0.14, x1 = -5.188 + 0.14, zw = 9.198, zb = 9.706, zf = zb + 0.22, yTop = 2.98, yF = 2.42, yBot = 2.22;
    upPoly(metal, M.metalRoof, [V3(x0, yF, zf), V3(x1, yF, zf), V3(x1, yTop, zw), V3(x0, yTop, zw)], (q) => [q.x, -q.z]);
    geo.box(M.bronze, x0 - 0.005, yBot, zf - 0.03, x1 + 0.005, yF + 0.02, zf + 0.005);
    for (const x of [x0, x1]) {
      const s2 = x === x0 ? -1 : 1;
      const pts = [V3(x, yBot, zw), V3(x, yBot, zf), V3(x, yF, zf), V3(x, yTop, zw)];
      if (polyNormal(pts).x * s2 < 0) pts.reverse();
      geo.poly(M.bronze, pts);
    }
    soffit(x0, x1, zb, zf - 0.03, yBot); soffit(x0, -7.361, zw, zb, yBot); soffit(-5.188, x1, zw, zb, yBot);
    garageBay(ctx, M, geo, 2.26);
  }

  // ---------------- gable vents (louvred) on the board-and-batten gables
  const vent = (cx, cy, z) => {
    const w = 0.34, h = 0.62;
    geo.box(M.bronze, cx - w / 2 - 0.05, cy + h / 2, z, cx + w / 2 + 0.05, cy + h / 2 + 0.09, z + 0.05);
    geo.box(M.bronze, cx - w / 2, cy - h / 2 - 0.04, z, cx + w / 2, cy - h / 2, z + 0.045);
    geo.box(M.bronzeMatte, cx - w / 2, cy - h / 2, z, cx + w / 2, cy + h / 2, z + 0.01);
    for (let i = 0; i < 9; i++) {
      const y = cy - h / 2 + 0.04 + i * (h - 0.08) / 8;
      geo.beam(M.bronze, V3(cx - w / 2 + 0.02, y, z + 0.025), V3(cx + w / 2 - 0.02, y, z + 0.025), 0.03, 0.012);
    }
    geo.box(M.bronze, cx - w / 2 - 0.03, cy - h / 2, z, cx - w / 2, cy + h / 2, z + 0.04);
    geo.box(M.bronze, cx + w / 2, cy - h / 2, z, cx + w / 2 + 0.03, cy + h / 2, z + 0.04);
  };
  vent(0.795, 4.55, 7.771 + 0.03);
  vent(8.344, 4.55, 7.771 + 0.03);
  vent(-6.27, 3.95, 9.198 + 0.03);

  // ---------------- back porch: posts + beam (main roof covers it)
  for (const pp of ctx.plan.marks.porchPosts) {
    const r = ctx.rectM(pp);
    geo.box(M.white, r.x0, -0.1, r.z0, r.x1, 2.75, r.z1);
    geo.box(M.white, r.x0 - 0.03, -0.1, r.z0 - 0.03, r.x1 + 0.03, 0.12, r.z1 + 0.03);
    ctx.addCollider({ x0: r.x0, z0: r.z0, x1: r.x1, z1: r.z1 });
  }
  geo.box(M.white, -4.421, 2.75, -6.561, 6.561, WALL_TOP - 0.004, -6.345);

  // small shed roof over the east bath bump-out (x 11.87..12.19)
  {
    const x0 = 11.868, x1 = 12.192 + 0.25, z0 = 2.529 - 0.25, z1 = 4.615 + 0.25, yw = 3.2, ye = 3.0;
    upPoly(metal, M.metalRoof, [V3(x1, ye, z0), V3(x1, ye, z1), V3(x0, yw, z1), V3(x0, yw, z0)], (q) => [q.z, q.x]);
    eaveTrim(geo, M, V3(x1, ye, z0), V3(x1, ye, z1), V3(1, 0, 0), ye, 0.25, 0.15, true);
  }

  const meshes = geo.toMeshes(parent, { name: 'house' });
  metal.toMeshes(parent, { name: 'metal' });
  return { gables, meshes, blocks: { main, west, dining, bed, bump } };
}

// windows that are not plan openings: bonus-room gable window and the dormer window
export function freeWindows(M, parent, glowMats) {
  const geo = new Geo();
  const unit = (cx, y0, y1, w, z, units, cols, glow) => {
    const f = M.bronze, fw = 0.055, mull = 0.08;
    const x0 = cx - w / 2, x1 = cx + w / 2;
    // frame proud of the wall
    geo.box(f, x0, y0, z, x1, y0 + fw, z + 0.06);
    geo.box(f, x0, y1 - fw, z, x1, y1, z + 0.06);
    geo.box(f, x0, y0, z, x0 + fw, y1, z + 0.06);
    geo.box(f, x1 - fw, y0, z, x1, y1, z + 0.06);
    const ux0 = x0 + fw, ux1 = x1 - fw, uy0 = y0 + fw, uy1 = y1 - fw;
    const uw = (ux1 - ux0 - mull * (units - 1)) / units;
    const uvf = (p) => [(p.x - x0) / w, (p.y - y0) / (y1 - y0)];
    const zg = z + 0.015;
    geo.poly(glow, [V3(ux0, uy0, zg), V3(ux1, uy0, zg), V3(ux1, uy1, zg), V3(ux0, uy1, zg)], uvf);
    const mid = (uy0 + uy1) / 2;
    for (let u = 0; u < units; u++) {
      const a = ux0 + u * (uw + mull), b = a + uw;
      if (u > 0) geo.box(f, a - mull, uy0, z, a, uy1, z + 0.05);
      geo.box(f, a, mid - 0.025, z, b, mid + 0.025, z + 0.045);
      for (let i = 1; i < cols; i++) { const x = a + (uw * i) / cols; geo.box(f, x - 0.011, uy0, z, x + 0.011, uy1, z + 0.035); }
      geo.box(f, a, uy0, z, a + 0.035, uy1, z + 0.04); geo.box(f, b - 0.035, uy0, z, b, uy1, z + 0.04);
    }
    geo.box(f, x0 - 0.07, y1, z, x1 + 0.07, y1 + 0.1, z + 0.035);
    geo.box(f, x0 - 0.09, y1 + 0.1, z, x1 + 0.09, y1 + 0.125, z + 0.05);
    geo.box(M.bronzeMatte, x0 - 0.04, y0 - 0.05, z, x1 + 0.04, y0, z + 0.06);
  };
  unit(-8.10, 3.90, 5.12, 0.68, 8.593, 1, 2, glowMats[2]);           // bonus room, garage gable
  unit(4.58, 3.36, 4.60, 1.96, 6.853 + 0.035, 3, 2, glowMats[0]);    // shed dormer
  return geo.toMeshes(parent, { name: 'freewin' });
}

// the garage bay walls (w_bump3..6) are hidden in configure() and rebuilt to top out under the awning
export const GARAGE_BAY_WALLS = ['w_bump3', 'w_bump4', 'w_bump5', 'w_bump6'];
function garageBay(ctx, M, geo, top) {
  const inner = ctx.roomMat('garage', 'wall');
  const bot = -0.57;
  const side = { w_bump3: 'px', w_bump6: 'nx', w_bump4: 'nz', w_bump5: 'nz' };
  for (const id of GARAGE_BAY_WALLS) {
    const w = ctx.plan.walls.find((q) => q.id === id);
    const r = ctx.rectM(w.r);
    geo.box(M.stucco, r.x0, bot, r.z0, r.x1, top, r.z1, { skip: side[id] + 'ny' });
    const f = side[id];
    const pts = f === 'px' ? [V3(r.x1, bot, r.z1), V3(r.x1, bot, r.z0), V3(r.x1, top, r.z0), V3(r.x1, top, r.z1)]
      : f === 'nx' ? [V3(r.x0, bot, r.z0), V3(r.x0, bot, r.z1), V3(r.x0, top, r.z1), V3(r.x0, top, r.z0)]
        : [V3(r.x1, bot, r.z0), V3(r.x0, bot, r.z0), V3(r.x0, top, r.z0), V3(r.x1, top, r.z0)];
    geo.poly(inner, pts);
    ctx.addCollider({ x0: r.x0, z0: r.z0, x1: r.x1, z1: r.z1, id });
  }
}
