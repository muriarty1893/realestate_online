// Kitchen: shaker cabinets (wood, brass bar pulls), dark leathered granite, subway backsplash,
// 36" pro range + chimney hood, oven tower, built-in fridge in its niche, island with sink, stools,
// glass pendants. Positions follow plan.marks, adjusted where the photo shows the built layout.
import * as THREE from 'three';
import { boxMM, box, cyl, mesh, rbox, mergeByMaterial, cushionGeo } from './util.js';

const KIT = { x0: -4.421, x1: -0.357, z0: -2.627, z1: 3.578 };
export const CTR = 0.914;      // counter top
const TOE = 0.1, BASE_D = 0.61, UP_D = 0.33, UP_Y0 = 1.39, UP_Y1 = 2.45, CROWN = 2.55;

// --------------------------------------------------------------- local-frame cabinet kit
// A run is built in a local frame: +x along the wall, +z out of the wall, y up, origin on the wall face.
class Run {
  constructor(M) { this.M = M; this.g = new THREE.Group(); }
  add(m) { this.g.add(m); return m; }
  bx(x0, y0, z0, x1, y1, z1, mat, grain = 'y') { return this.add(boxMM(x0, y0, z0, x1, y1, z1, mat, { grain })); }
  // shaker door / drawer front: slab + raised frame. zf = front plane of the carcass
  front(x0, x1, y0, y1, zf, { pull = 'v', pullSide = 'r', gap = 0.003 } = {}) {
    const M = this.M, t = 0.012, fr = Math.min(0.065, (x1 - x0) / 4, (y1 - y0) / 4), ft = 0.013;
    x0 += gap; x1 -= gap; y0 += gap; y1 -= gap;
    this.bx(x0, y0, zf, x1, y1, zf + t, M.cab, 'y');
    const z0 = zf + t, z1 = zf + t + ft;
    this.bx(x0, y0, z0, x0 + fr, y1, z1, M.cab, 'y');
    this.bx(x1 - fr, y0, z0, x1, y1, z1, M.cab, 'y');
    this.bx(x0 + fr, y0, z0, x1 - fr, y0 + fr, z1, M.cab, 'x');
    this.bx(x0 + fr, y1 - fr, z0, x1 - fr, y1, z1, M.cab, 'x');
    // brass bar pull
    const zp = z1 + 0.028;
    if (pull === 'v') {
      const L = Math.min(0.2, (y1 - y0) * 0.5);
      const px = pullSide === 'r' ? x1 - fr / 2 : x0 + fr / 2;
      const yc = pull === 'v' && y0 > 1.2 ? y0 + 0.04 + L / 2 + fr : y1 - fr - L / 2 - 0.03;
      this.pull(px, yc, zp, L, 'y', z1);
    } else if (pull === 'h') {
      const L = Math.min(0.2, (x1 - x0) * 0.45);
      this.pull((x0 + x1) / 2, (y0 + y1) / 2 + ((y1 - y0) > 0.2 ? (y1 - y0) / 2 - fr - 0.03 : 0), zp, L, 'x', z1);
    }
  }
  pull(x, y, z, L, axis, zBack) {
    const M = this.M, r = 0.0065;
    const bar = mesh(new THREE.CylinderGeometry(r, r, L, 10), M.brass);
    if (axis === 'x') bar.rotation.z = Math.PI / 2;
    bar.position.set(x, y, z); this.add(bar);
    for (const s of [-1, 1]) {
      const post = mesh(new THREE.CylinderGeometry(0.005, 0.005, z - zBack, 8), M.brass);
      post.rotation.x = Math.PI / 2;
      post.position.set(axis === 'x' ? x + s * (L / 2 - 0.012) : x, axis === 'y' ? y + s * (L / 2 - 0.012) : y, (z + zBack) / 2);
      this.add(post);
    }
  }
  // base cabinet section with counter left to the caller
  base(x0, x1, { drawers = 'top', doors = 2, d = BASE_D, y1 = CTR - 0.03, bank = false } = {}) {
    const M = this.M;
    this.bx(x0, TOE, 0, x1, y1, d - 0.005, M.cabDark, 'y');   // carcass
    this.bx(x0, 0, 0, x1, TOE, d - 0.075, M.black, 'x');     // toe kick
    const zf = d - 0.005;
    if (bank) {
      const hs = [0.2, 0.25, (y1 - TOE) - 0.45];
      let y = y1;
      for (const h of hs) { this.front(x0, x1, y - h, y, zf, { pull: 'h' }); y -= h; }
      return;
    }
    const dh = 0.16;
    const n = doors || 1;
    const w = (x1 - x0) / n;
    for (let i = 0; i < n; i++) {
      const a = x0 + i * w, b = a + w;
      if (drawers === 'top') this.front(a, b, y1 - dh, y1, zf, { pull: 'h' });
      if (doors) this.front(a, b, TOE, drawers === 'top' ? y1 - dh : y1, zf, { pull: 'v', pullSide: n === 1 ? 'r' : (i % 2 ? 'l' : 'r') });
    }
  }
  counter(x0, x1, d = BASE_D + 0.025, { y = CTR, t = 0.03, backX0 = null } = {}) {
    this.bx(x0, y - t, 0, x1, y, d, this.M.granite, 'x');
  }
  upper(x0, x1, { doors = 2, y0 = UP_Y0, y1 = UP_Y1, d = UP_D, crown = true, light = true } = {}) {
    const M = this.M;
    this.bx(x0, y0, 0, x1, y1, d - 0.005, M.cabDark, 'y');
    const w = (x1 - x0) / doors;
    for (let i = 0; i < doors; i++) this.front(x0 + i * w, x0 + (i + 1) * w, y0, y1, d - 0.005, { pull: 'v', pullSide: doors === 1 ? 'r' : (i % 2 ? 'l' : 'r') });
    if (crown) this.crown(x0, x1, y1, d);
    // light rail + LED strip
    this.bx(x0, y0 - 0.025, d - 0.03, x1, y0, d + 0.022, M.cab, 'x');
    if (light) this.add(boxMM(x0 + 0.03, y0 - 0.004, 0.04, x1 - 0.03, y0 - 0.001, 0.08, M.ledStrip, { cast: false }));
  }
  crown(x0, x1, y, d, { ends = [true, true] } = {}) {
    const M = this.M;
    const o1 = 0.025, o2 = 0.06;
    this.bx(x0 - (ends[0] ? o1 : 0), y, 0, x1 + (ends[1] ? o1 : 0), y + 0.04, d + o1, M.cab, 'x');
    this.bx(x0 - (ends[0] ? o2 : 0), y + 0.04, 0, x1 + (ends[1] ? o2 : 0), y + 0.1, d + o2, M.cab, 'x');
  }
  tall(x0, x1, { d = 0.63, y1 = UP_Y1, split = UP_Y0, lowerDoors = true } = {}) {
    const M = this.M;
    this.bx(x0, TOE, 0, x1, y1, d - 0.005, M.cabDark, 'y');
    this.bx(x0, 0, 0, x1, TOE, d - 0.075, M.black, 'x');
    const n = (x1 - x0) > 0.62 ? 2 : 1, w = (x1 - x0) / n;
    for (let i = 0; i < n; i++) {
      this.front(x0 + i * w, x0 + (i + 1) * w, split, y1, d - 0.005, { pull: 'v', pullSide: n === 1 ? 'l' : (i % 2 ? 'l' : 'r') });
      if (lowerDoors) this.front(x0 + i * w, x0 + (i + 1) * w, TOE, split, d - 0.005, { pull: 'v', pullSide: n === 1 ? 'l' : (i % 2 ? 'l' : 'r') });
    }
    this.crown(x0, x1, y1, d);
  }
  // finished end panel
  endPanel(x, y0, y1, d, side = 1) {
    this.bx(x - (side > 0 ? 0 : 0.019), y0, 0, x + (side > 0 ? 0.019 : 0), y1, d + 0.02, this.M.cab, 'y');
  }
}

function place(run, { x, z, rot }) {
  run.g.position.set(x, 0, z); run.g.rotation.y = rot;
  return run.g;
}

// --------------------------------------------------------------- appliances
function rangeUnit(M, w = 0.914, d = 0.7) {
  // local: x along wall (0..w), z out of wall (0..d), y up
  const g = new THREE.Group();
  const add = (m) => (g.add(m), m);
  add(boxMM(0.003, 0.0, 0.02, w - 0.003, 0.88, d - 0.02, M.steelBrushed));
  // control panel and oven door
  add(boxMM(0.003, 0.73, d - 0.03, w - 0.003, 0.88, d, M.steelBrushed));
  add(boxMM(0.02, 0.1, d - 0.03, w - 0.02, 0.71, d - 0.005, M.steel));
  add(boxMM(0.02, 0.0, d - 0.1, w - 0.02, 0.1, d - 0.02, M.black));
  // door handle
  const h = mesh(new THREE.CylinderGeometry(0.012, 0.012, w - 0.12, 12), M.steel); h.rotation.z = Math.PI / 2; h.position.set(w / 2, 0.66, d + 0.045); add(h);
  for (const s of [0.07, w - 0.07]) add(boxMM(s - 0.01, 0.65, d - 0.01, s + 0.01, 0.672, d + 0.045, M.steel));
  // red knobs (Wolf style)
  const nk = 6;
  for (let i = 0; i < nk; i++) {
    const k = mesh(new THREE.CylinderGeometry(0.022, 0.024, 0.03, 16), M.redKnob);
    k.rotation.x = Math.PI / 2; k.position.set(0.1 + (i * (w - 0.2)) / (nk - 1), 0.805, d + 0.015); add(k);
  }
  // cooktop + cast iron grates
  add(boxMM(0.0, 0.88, 0.02, w, 0.9, d, M.steelBrushed));
  add(boxMM(0.03, 0.9, 0.06, w - 0.03, 0.935, d - 0.04, M.iron));
  // backguard
  add(boxMM(0.0, 0.88, 0.0, w, 1.0, 0.06, M.steelBrushed));
  return g;
}

function hoodUnit(M, w = 0.914, d = 0.53, yb = 1.63, ytop = 3.048) {
  const g = new THREE.Group();
  // canopy front band
  g.add(boxMM(0, yb, 0, w, yb + 0.075, d, M.steelBrushed));
  // sloped canopy (frustum) from the band to the chimney
  const cw = 0.29, cd = 0.27, yc = yb + 0.36;
  const geo = new THREE.BufferGeometry();
  const b = [[0, yb + 0.075, 0], [w, yb + 0.075, 0], [w, yb + 0.075, d], [0, yb + 0.075, d]];
  const xm = (w - cw) / 2;
  const t = [[xm, yc, 0], [xm + cw, yc, 0], [xm + cw, yc, cd], [xm, yc, cd]];
  const pos = [];
  const quad = (a, bb, c, dd) => pos.push(...a, ...bb, ...c, ...a, ...c, ...dd);
  quad(b[3], b[2], t[2], t[3]); // front
  quad(b[2], b[1], t[1], t[2]); // right
  quad(b[0], b[3], t[3], t[0]); // left
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  g.add(mesh(geo, M.steelBrushed));
  // underside (dark with filters)
  g.add(boxMM(0.01, yb - 0.002, 0.01, w - 0.01, yb, d - 0.01, M.steelBrushed));
  // chimney
  g.add(boxMM(xm, yc, 0, xm + cw, ytop, cd, M.steelBrushed));
  return g;
}

function wallOven(M, w, y0, y1, zf) {
  // stacked double oven in a tall cabinet. local: x 0..w, front plane zf
  const g = new THREE.Group();
  const hh = (y1 - y0) / 2;
  for (let i = 0; i < 2; i++) {
    const a = y0 + i * hh, b = a + hh;
    // stainless frame + door
    g.add(boxMM(0.015, a + 0.005, zf - 0.01, w - 0.015, b - 0.005, zf + 0.022, M.steelBrushed));
    // black control strip (top oven only) / vent slot
    g.add(boxMM(0.04, b - 0.075, zf + 0.022, w - 0.04, b - 0.025, zf + 0.025, i ? M.ovenGlass : M.black));
    // window: dark glass, inset
    g.add(boxMM(0.09, a + 0.11, zf + 0.022, w - 0.09, b - 0.19, zf + 0.026, M.ovenGlass));
    // handle bar on stand-offs
    const h = mesh(new THREE.CylinderGeometry(0.011, 0.011, w - 0.1, 12), M.steel);
    h.rotation.z = Math.PI / 2; h.position.set(w / 2, b - 0.12, zf + 0.07); g.add(h);
    for (const s of [0.06, w - 0.06]) g.add(boxMM(s - 0.008, b - 0.13, zf + 0.022, s + 0.008, b - 0.11, zf + 0.07, M.steel));
  }
  return g;
}

function fridgeUnit(M, w, h = 2.13, d = 0.62) {
  // local: x 0..w along the niche, z 0..d out of the back wall, front at z=d
  const g = new THREE.Group();
  const add = (m) => (g.add(m), m);
  add(boxMM(0, 0, 0, w, h, d - 0.03, M.steelBrushed));
  const zf = d - 0.03;
  // grille
  add(boxMM(0.005, h - 0.26, zf, w - 0.005, h - 0.005, zf + 0.02, M.steel));
  for (let i = 0; i < 6; i++) add(boxMM(0.03, h - 0.235 + i * 0.035, zf + 0.02, w - 0.03, h - 0.22 + i * 0.035, zf + 0.024, M.black));
  // french doors
  const y0 = 0.82, y1 = h - 0.27;
  add(boxMM(0.004, y0, zf, w / 2 - 0.003, y1, zf + 0.045, M.steel));
  add(boxMM(w / 2 + 0.003, y0, zf, w - 0.004, y1, zf + 0.045, M.steel));
  // freezer drawer
  add(boxMM(0.004, 0.1, zf, w - 0.004, y0 - 0.006, zf + 0.045, M.steel));
  add(boxMM(0.004, 0.0, zf - 0.05, w - 0.004, 0.1, zf, M.black));
  // tubular handles
  const hl = 0.85;
  for (const s of [-1, 1]) {
    const x = w / 2 + s * 0.045;
    const bar = mesh(new THREE.CylinderGeometry(0.013, 0.013, hl, 12), M.steel); bar.position.set(x, (y0 + y1) / 2, zf + 0.1); add(bar);
    for (const t of [-1, 1]) add(boxMM(x - 0.009, (y0 + y1) / 2 + t * (hl / 2 - 0.05) - 0.012, zf + 0.045, x + 0.009, (y0 + y1) / 2 + t * (hl / 2 - 0.05) + 0.012, zf + 0.1, M.steel));
  }
  const dh = mesh(new THREE.CylinderGeometry(0.013, 0.013, w * 0.7, 12), M.steel); dh.rotation.z = Math.PI / 2; dh.position.set(w / 2, y0 - 0.09, zf + 0.1); add(dh);
  return g;
}

function faucet(M, { h = 0.42, reach = 0.22 } = {}) {
  // gooseneck faucet, spout toward local +z
  const g = new THREE.Group();
  g.add(cyl(0.025, 0.03, 0.06, M.brass, 0, 0.03, 0));
  const pts = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    if (t < 0.55) pts.push(new THREE.Vector3(0, 0.06 + (h - 0.08) * (t / 0.55), 0));
    else { const a = ((t - 0.55) / 0.45) * Math.PI; pts.push(new THREE.Vector3(0, h - 0.02 + Math.sin(a) * 0.06 - 0.06 * (a > Math.PI / 2 ? 0 : 0), (1 - Math.cos(a)) / 2 * reach)); }
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  g.add(mesh(new THREE.TubeGeometry(curve, 40, 0.012, 10), M.brass));
  const lever = cyl(0.006, 0.006, 0.1, M.brass, 0.035, 0.12, 0); lever.rotation.z = -1.0; g.add(lever);
  return g;
}

// --------------------------------------------------------------- stools / pendants
function stool(M) {
  // counter stool: dark metal frame, cognac leather saddle seat with a low curved back. faces local +z
  const g = new THREE.Group();
  const sh = 0.66, sw = 0.44, sd = 0.42;
  const legR = 0.011;
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const leg = mesh(new THREE.CylinderGeometry(legR, legR, sh, 8), M.iron);
    leg.position.set(x * (sw / 2 - 0.03), sh / 2, z * (sd / 2 - 0.03)); leg.rotation.z = x * 0.04; leg.rotation.x = -z * 0.04; g.add(leg);
  }
  // footrest ring (square)
  for (const [x0, z0, x1, z1] of [[-1, 1, 1, 1], [-1, -1, 1, -1], [-1, -1, -1, 1], [1, -1, 1, 1]]) {
    const a = new THREE.Vector3(x0 * (sw / 2 - 0.025), 0.25, z0 * (sd / 2 - 0.025)), b = new THREE.Vector3(x1 * (sw / 2 - 0.025), 0.25, z1 * (sd / 2 - 0.025));
    const L = a.distanceTo(b); const r = mesh(new THREE.CylinderGeometry(0.009, 0.009, L, 8), M.iron);
    r.position.copy(a).add(b).multiplyScalar(0.5); r.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); g.add(r);
  }
  g.add(boxMM(-sw / 2 + 0.02, sh - 0.03, -sd / 2 + 0.02, sw / 2 - 0.02, sh - 0.01, sd / 2 - 0.02, M.iron));
  const seat = mesh(cushionGeo(sw, 0.06, sd, { segs: 8, bulge: 0.35, round: 0.6 }), M.leather);
  seat.position.set(0, sh + 0.02, 0); g.add(seat);
  // back posts + curved sling back
  for (const x of [-1, 1]) {
    const p = mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.34, 8), M.iron); p.position.set(x * (sw / 2 - 0.03), sh + 0.17, -sd / 2 + 0.03); p.rotation.x = -0.12; g.add(p);
  }
  const bg = new THREE.CylinderGeometry(0.34, 0.34, 0.17, 20, 1, true, -0.62, 1.24);
  const back = mesh(bg, M.leather);
  back.position.set(0, sh + 0.25, 0.12); back.rotation.y = Math.PI; g.add(back);
  back.material = M.leatherSide;
  return g;
}

function pendant(M, cordTop, bottomY) {
  const g = new THREE.Group();
  const H = 0.3, R = 0.1;
  // clear glass bell (lathe)
  const pts = [];
  for (let i = 0; i <= 14; i++) { const t = i / 14; pts.push(new THREE.Vector2(0.035 + (R - 0.035) * Math.pow(t, 1.6), H * (1 - t))); }
  const glass = mesh(new THREE.LatheGeometry(pts, 28), M.glass, { cast: false, receive: false });
  glass.position.y = bottomY; g.add(glass);
  g.add(cyl(0.035, 0.038, 0.05, M.brass, 0, bottomY + H + 0.02, 0));
  g.add(cyl(0.004, 0.004, cordTop - (bottomY + H + 0.04), M.brass, 0, (cordTop + bottomY + H + 0.04) / 2, 0, { cast: false }));
  g.add(cyl(0.06, 0.06, 0.02, M.brass, 0, cordTop - 0.01, 0));
  const bulb = mesh(new THREE.SphereGeometry(0.03, 12, 10), M.bulb, { cast: false });
  bulb.scale.y = 1.4; bulb.position.y = bottomY + H - 0.08; g.add(bulb);
  return g;
}

// --------------------------------------------------------------- build
export function buildKitchen(ctx, M, group) {
  const P = ctx.plan.marks;
  const parts = new THREE.Group();

  // ---------- west wall run (face x = -4.421), local x runs north from the south wall (z = 3.578)
  const W = new Run(M);
  const zs = (z) => KIT.z1 - z; // world z -> local x
  const zTallS = 3.573, zOven = 3.06, zTallN = 2.29, zRangeS = 1.222, zRangeN = 0.308, zHallS = -0.746;
  W.tall(zs(zTallS), zs(zOven), {});
  // oven tower: cabinet above, double oven, drawer below
  W.bx(zs(zOven), TOE, 0, zs(zTallN), UP_Y1, 0.625, M.cabDark);
  W.bx(zs(zOven), 0, 0, zs(zTallN), TOE, 0.555, M.black, 'x');
  W.front(zs(zOven), zs(zTallN), UP_Y0, UP_Y1, 0.625, { pull: 'v', pullSide: 'l' });
  W.front(zs(zOven), zs(zTallN), TOE, 0.27, 0.625, { pull: 'h' });
  const ov = wallOven(M, zs(zTallN) - zs(zOven), 0.27, UP_Y0, 0.625); ov.position.x = zs(zOven); W.add(ov);
  W.crown(zs(zOven), zs(zTallN), UP_Y1, 0.63);
  W.endPanel(zs(zTallN), 0, UP_Y1 + 0.0, 0.63, 1);
  // base + counter between tower and range
  W.base(zs(zTallN), zs(zRangeS), { doors: 2 });
  W.counter(zs(zTallN), zs(zRangeS));
  // range + hood
  const rg = rangeUnit(M, zs(zRangeN) - zs(zRangeS)); rg.position.x = zs(zRangeS); W.add(rg);
  const hd = hoodUnit(M, zs(zRangeN) - zs(zRangeS)); hd.position.x = zs(zRangeS); W.add(hd);
  // base + counter north of the range up to the hall opening
  W.base(zs(zRangeN), zs(zHallS), { bank: false, doors: 2 });
  W.counter(zs(zRangeN), zs(zHallS));
  W.endPanel(zs(zHallS), 0, CTR - 0.03, BASE_D, 1);
  // uppers
  W.upper(zs(zTallN), zs(zRangeS) - 0.06, { doors: 2 });
  W.upper(zs(zRangeN) + 0.06, zs(zHallS), { doors: 2 });
  // backsplash: subway tile counter -> uppers, and up to the hood behind the range
  W.add(boxMM(zs(zTallN), CTR, 0.0, zs(zHallS), UP_Y0, 0.008, M.subway, { grain: 'y', worldUV: false }));
  W.add(boxMM(zs(zRangeS) - 0.06, UP_Y0, 0.0, zs(zRangeN) + 0.06, 1.70, 0.008, M.subway, { grain: 'y' }));
  // corner piece north of the hall opening (z -1.643 .. -2.627)
  const zHallN = -1.643;
  W.base(zs(zHallN), zs(KIT.z0) - BASE_D, { doors: 1 });
  W.bx(zs(KIT.z0) - BASE_D, TOE, 0, zs(KIT.z0), CTR - 0.03, BASE_D, M.cabDark);
  W.counter(zs(zHallN), zs(KIT.z0));
  W.upper(zs(zHallN), zs(KIT.z0), { doors: 2 });
  W.add(boxMM(zs(zHallN), CTR, 0.0, zs(KIT.z0), UP_Y0, 0.008, M.subway, { grain: 'y' }));
  W.endPanel(zs(zHallN), 0, CTR - 0.03, BASE_D, -1);
  parts.add(place(W, { x: KIT.x0, z: KIT.z1, rot: Math.PI / 2 }));

  // ---------- north wall run (face z = -2.627), local x = world x - x0
  const N = new Run(M);
  const xs = (x) => x - KIT.x0;
  const winX0 = -3.341, winX1 = -1.547, runEnd = -0.95;
  N.base(xs(KIT.x0) + BASE_D, xs(-3.0), { doors: 1 });
  N.base(xs(-3.0), xs(-1.9), { doors: 2, drawers: 'none' });   // sink base
  N.base(xs(-1.9), xs(-1.3), { bank: true });                   // dishwasher-width drawers
  N.base(xs(-1.3), xs(runEnd), { doors: 1 });
  N.counter(xs(KIT.x0) + BASE_D, xs(runEnd));
  N.endPanel(xs(runEnd), 0, CTR - 0.03, BASE_D, 1);
  N.upper(xs(KIT.x0) + UP_D, xs(winX0) - 0.08, { doors: 1 });
  N.upper(xs(winX1) + 0.08, xs(runEnd), { doors: 2 });
  N.add(boxMM(xs(KIT.x0), CTR, 0.0, xs(runEnd), UP_Y0, 0.008, M.subway, { grain: 'y' }));
  // farmhouse sink basin (dark recess) + faucet
  N.bx(xs(-2.85), CTR - 0.005, 0.12, xs(-2.05), CTR + 0.001, 0.55, M.sinkDark);
  const nf = faucet(M); nf.position.set(xs(-2.45), CTR, 0.07); N.add(nf);
  parts.add(place(N, { x: KIT.x0, z: KIT.z0, rot: 0 }));

  // ---------- fridge niche (back wall z = 4.237, room toward -z). local x runs west from x = -1.135
  const F = new Run(M);
  const nx = (x) => -1.135 - x;
  const fx0 = -1.14, fx1 = -2.086, nW = -2.648, nBack = 4.237;
  const nD = nBack - KIT.z1; // niche depth 0.659
  const fr = fridgeUnit(M, nx(fx1) - nx(fx0), 2.13, nD + 0.012); fr.position.x = nx(fx0); F.add(fr);
  // cabinet above the fridge
  F.bx(nx(fx0), 2.13, 0, nx(fx1), UP_Y1, nD - 0.01, M.cabDark);
  const fw = nx(fx1) - nx(fx0);
  F.front(nx(fx0), nx(fx0) + fw / 2, 2.13, UP_Y1, nD - 0.01, { pull: 'v', pullSide: 'l' });
  F.front(nx(fx0) + fw / 2, nx(fx1), 2.13, UP_Y1, nD - 0.01, { pull: 'v', pullSide: 'r' });
  F.crown(nx(fx0), nx(nW), UP_Y1, nD - 0.01, { ends: [false, false] });
  // counter section west of the fridge: base, counter, upper, coffee maker
  F.base(nx(fx1), nx(nW), { doors: 1 });
  F.counter(nx(fx1), nx(nW));
  F.upper(nx(fx1), nx(nW), { doors: 1, crown: false });
  F.add(boxMM(nx(fx1), CTR, 0, nx(nW), UP_Y0, 0.008, M.subway));
  // coffee maker
  const cm = new THREE.Group();
  cm.add(boxMM(-0.11, 0, -0.18, 0.11, 0.36, 0.12, M.black));
  cm.add(boxMM(-0.08, 0.06, 0.12, 0.08, 0.3, 0.13, M.steel));
  cm.position.set(nx(fx1) + 0.22, CTR, 0.3); F.add(cm);
  parts.add(place(F, { x: -1.135, z: nBack, rot: Math.PI }));

  // ---------- island
  const isl = ctx.rectM(P.island);
  const I = buildIsland(ctx, M, isl);
  parts.add(I);

  // merge static cabinetry by material for fewer draw calls
  const merged = mergeByMaterial(parts);
  merged.name = 'kitchen:cabinetry';
  group.add(merged);

  // stools (4, great-room side of the island)
  const st = stool(M);
  const stMerged = mergeByMaterial(st);
  const zs4 = [isl.z0 + 0.38, isl.z0 + 1.03, isl.z0 + 1.68, isl.z0 + 2.33];
  for (const z of zs4) {
    const s = stMerged.clone(); s.position.set(isl.x1 + 0.08, 0, z); s.rotation.y = Math.PI / 2 + 0.06 * Math.sin(z * 7);
    // face west (toward the island): local +z -> world -x
    s.rotation.y = -Math.PI / 2 + 0.08 * Math.sin(z * 7);
    group.add(s);
  }
  ctx.addCollider({ x0: isl.x0, z0: isl.z0, x1: isl.x1 + 0.3, z1: isl.z1 });

  // pendants over the island
  // the photo hangs them slightly south of the island centre
  const pz = [0.19, 1.11, 2.03];
  for (const z of pz) { const p = pendant(M, 3.048, 1.93); p.position.set(isl.cx, 0, z); group.add(p); }

  // ---------- props
  kitchenProps(ctx, M, group);

  // colliders: perimeter cabinets
  ctx.addCollider({ x0: KIT.x0, z0: zTallN, x1: KIT.x0 + 0.65, z1: KIT.z1 });
  ctx.addCollider({ x0: KIT.x0, z0: zHallS, x1: KIT.x0 + 0.7, z1: zTallN });
  ctx.addCollider({ x0: KIT.x0, z0: KIT.z0, x1: KIT.x0 + 0.65, z1: zHallN });
  ctx.addCollider({ x0: KIT.x0, z0: KIT.z0, x1: runEnd, z1: KIT.z0 + 0.65 });
  ctx.addCollider({ x0: nW, z0: 3.58, x1: -1.135, z1: nBack });
  return { island: isl, pendants: pz.map((z) => [isl.cx, 1.95, z]) };
}

function buildIsland(ctx, M, isl) {
  // isl: plan rect (top footprint). overhang 0.32 on the east (stool) side, 0.04 elsewhere
  const g = new THREE.Group();
  const ov = 0.04, ovE = 0.32;
  const bx0 = isl.x0 + ov, bx1 = isl.x1 - ovE, bz0 = isl.z0 + ov, bz1 = isl.z1 - ov;
  // base carcass
  g.add(boxMM(bx0, TOE, bz0, bx1, CTR - 0.04, bz1, M.cabDark));
  g.add(boxMM(bx0 + 0.07, 0, bz0 + 0.07, bx1 - 0.07, TOE, bz1 - 0.07, M.black));
  // west face (working side) drawers/doors via a Run in local frame facing -x
  const R = new Run(M);
  // local: x along the island from north to south? facing -x: rot = -PI/2 -> local +z -> world -x, local x -> world +z
  const L = bz1 - bz0;
  const segs = [[0, 0.6, 'bank'], [0.6, 1.4, 'doors'], [1.4, L - 0.6, 'sink'], [L - 0.6, L, 'bank']];
  for (const [a, b, t] of segs) {
    if (t === 'bank') { const hs = [0.2, 0.25, (CTR - 0.04 - TOE) - 0.45]; let y = CTR - 0.04; for (const h of hs) { R.front(a, b, y - h, y, 0, { pull: 'h' }); y -= h; } }
    else if (t === 'doors') { R.front(a, (a + b) / 2, TOE, CTR - 0.04, 0, { pull: 'v', pullSide: 'r' }); R.front((a + b) / 2, b, TOE, CTR - 0.04, 0, { pull: 'v', pullSide: 'l' }); }
    else { R.front(a, (a + b) / 2, TOE, CTR - 0.04 - 0.16, 0, { pull: 'v', pullSide: 'r' }); R.front((a + b) / 2, b, TOE, CTR - 0.04 - 0.16, 0, { pull: 'v', pullSide: 'l' }); R.front(a, b, CTR - 0.2, CTR - 0.04, 0, { pull: 'none' }); }
  }
  R.g.position.set(bx0, 0, bz0); R.g.rotation.y = -Math.PI / 2;
  g.add(R.g);
  // end panels (north/south) and the stool-side back panel: shaker panels
  const panel = (run, a, b) => { run.front(a, b, TOE * 0.2, CTR - 0.04, 0, { pull: 'none', gap: 0.0 }); };
  const NR = new Run(M); panel(NR, 0, bx1 - bx0); NR.g.position.set(bx1, 0, bz0); NR.g.rotation.y = Math.PI; g.add(NR.g);
  const SR = new Run(M); panel(SR, 0, bx1 - bx0); SR.g.position.set(bx0, 0, bz1); g.add(SR.g);
  const ER = new Run(M);
  const n = 3, w = (bz1 - bz0) / n;
  for (let i = 0; i < n; i++) panel(ER, i * w, (i + 1) * w);
  ER.g.position.set(bx1, 0, bz1); ER.g.rotation.y = Math.PI / 2; g.add(ER.g);
  // corbels/legs under the overhang at the ends
  // granite top
  g.add(boxMM(isl.x0, CTR - 0.04, isl.z0, isl.x1, CTR, isl.z1, M.granite, { grain: 'x', worldUV: true }));
  // sink basin + faucet (marks.islandSink)
  // sink basin on the working (west) half, faucet on the centre line (where the photo shows it)
  const fz = 1.44, fxc = -1.64;
  g.add(boxMM(fxc - 0.62, CTR - 0.003, fz - 0.36, fxc - 0.1, CTR + 0.0015, fz + 0.36, M.sinkDark));
  const f = faucet(M, { h: 0.43, reach: 0.24 }); f.position.set(fxc, CTR, fz); f.rotation.y = -Math.PI / 2; g.add(f);
  return g;
}

// --------------------------------------------------------------- props (as staged in the photo)
async function kitchenProps(ctx, M, group) {
  const g = new THREE.Group(); g.name = 'kitchen:props';
  // large shallow bowl with a woven ball on the island
  const pts = []; for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push(new THREE.Vector2(0.06 + 0.17 * Math.sin(t * Math.PI / 2), 0.075 * (1 - Math.cos(t * Math.PI / 2)))); }
  const bowl = mesh(new THREE.LatheGeometry(pts, 32), M.ceramicSide); bowl.position.set(-1.46, CTR, 0.61); g.add(bowl);
  for (const [dx, dz] of [[0.04, 0.02], [-0.06, -0.03]]) { const b = mesh(new THREE.SphereGeometry(0.07, 14, 10), M.wicker); b.position.set(-1.46 + dx, CTR + 0.08, 0.61 + dz); g.add(b); }
  // open magazine
  const mg = boxMM(-0.16, 0, -0.12, 0.16, 0.01, 0.12, M.paper); mg.position.set(-1.25, CTR, -0.15); mg.rotation.y = 0.3; g.add(mg);
  // cookbook on a stand against the backsplash, utensil crock, boards by the range
  const cb = boxMM(-0.012, 0, -0.12, 0.012, 0.3, 0.12, M.paper); cb.position.set(-4.33, CTR + 0.02, 1.6); cb.rotation.z = 0.25; g.add(cb);
  g.add(cyl(0.06, 0.055, 0.16, M.ceramic, -4.25, CTR + 0.08, 0.05, { seg: 20 }));
  for (let i = 0; i < 5; i++) { const u = cyl(0.006, 0.006, 0.3, M.tableWood, -4.25 + (i - 2) * 0.01, CTR + 0.26, 0.05 + ((i * 7) % 3 - 1) * 0.012); u.rotation.z = (i - 2) * 0.12; g.add(u); }
  const board = cyl(0.2, 0.2, 0.02, M.tableWood, -4.38, CTR + 0.21, -0.32, { seg: 32 }); board.rotation.z = Math.PI / 2 - 0.2; g.add(board);
  g.add(cyl(0.11, 0.12, 0.14, M.pumpkin, -4.15, CTR + 0.07, -0.5, { seg: 20 }));
  group.add(g);
  // potted herb on the island (Poly Haven potted_plant_02, white pot)
  try {
    const gl = await ctx.loadGLTF(new URL('../../../assets/great_room/models/potted_plant_02/potted_plant_02.gltf', import.meta.url).href);
    const p = gl.scene;
    p.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; if (/pot/i.test(o.material.name)) { o.material = o.material.clone(); o.material.map = null; o.material.color.set(0xf0ece4); o.material.roughness = 0.4; } } });
    const bb = new THREE.Box3().setFromObject(p); const sz = bb.getSize(new THREE.Vector3());
    const sc = 0.36 / sz.y; p.scale.setScalar(sc); p.position.set(-1.98, CTR - bb.min.y * sc, 0.0);
    g.add(p);
  } catch (e) { /* optional prop */ }
}
