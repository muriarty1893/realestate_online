// Interior door units for the openings this piece owns: 5-panel shaker leaves, black lever
// hardware and casings, mirroring the shell's swing rules (into / hinge) so plans read the same.
import * as THREE from 'three';
import { Frame } from './kit.js';

const PI = Math.PI;

function leaf5(f, M, lw, lh, lt, mat) {
  // leaf spans local x 0..lw from the hinge, y 0..lh, centred on z = 0
  const st = 0.115, rail = 0.1, bot = 0.22, n = 5;
  f.box(mat, st, lh, lt, st / 2, 0, 0);
  f.box(mat, st, lh, lt, lw - st / 2, 0, 0);
  const iw = lw - 2 * st;
  const ph = (lh - bot - rail - (n - 1) * 0.07) / n;
  f.box(mat, iw, bot, lt, lw / 2, 0, 0);
  f.box(mat, iw, rail, lt, lw / 2, lh - rail, 0);
  let y = bot;
  for (let i = 0; i < n; i++) {
    f.box(mat, iw + 0.002, ph, lt * 0.45, lw / 2, y, 0, { cast: false });
    // small sticking profile around each panel
    for (const s of [-1, 1]) {
      f.box(mat, iw, 0.012, 0.006, lw / 2, y, s * lt * 0.24, { cast: false });
      f.box(mat, iw, 0.012, 0.006, lw / 2, y + ph - 0.012, s * lt * 0.24, { cast: false });
    }
    y += ph;
    if (i < n - 1) { f.box(mat, iw, 0.07, lt, lw / 2, y, 0); y += 0.07; }
  }
}

function lever(f, M, x, y, s) {
  // rosette + lever on one face (s = +1 / -1 local z side)
  f.add(new THREE.CylinderGeometry(0.027, 0.027, 0.01, 16), M.black, x, y, s * 0.022, 0, PI / 2, 0, false);
  f.add(new THREE.CylinderGeometry(0.009, 0.009, 0.05, 8), M.black, x, y, s * 0.045, 0, PI / 2, 0, false);
  const lv = new THREE.BoxGeometry(0.12, 0.016, 0.014);
  lv.translate(-0.055, 0, 0);
  f.add(lv, M.black, x, y, s * 0.07, 0, 0, 0, false);
}

function casing(f, M, width, headH, depth, side) {
  const leg = 0.09, t = 0.02, z = side * (depth / 2 + t / 2);
  const mat = M.trimWhite;
  f.box(mat, leg, headH + leg, t, -width / 2 - leg / 2, 0, z, { cast: false });
  f.box(mat, leg, headH + leg, t, width / 2 + leg / 2, 0, z, { cast: false });
  f.box(mat, width + 2 * leg + 0.03, 0.03, t + 0.012, 0, headH + leg, z, { cast: false });   // head cap (farmhouse)
  f.box(mat, width + 2 * leg, leg, t, 0, headH, z, { cast: false });
}

// o: resolved opening (after the shell ran, it carries M/base/horiz/sideA/sideB)
export function doorUnit(B, ctx, M, o, { angle = 88, mat, switchPlate = true } = {}) {
  const P = ctx.plan;
  const R = o.M, horiz = o.horiz;
  const width = horiz ? R.w : R.d, depth = horiz ? R.d : R.w;
  const g = new Frame(B).at(R.cx, o.base, R.cz, horiz ? 0 : PI / 2);
  const headH = P.ft(o.head ?? 8);
  const lw = width - 0.012, lh = headH - 0.01, lt = 0.035;
  const intoB = o.into ? o.sideB.room?.id === o.into : true;
  const s = intoB ? 1 : -1;
  const hingeHigh = (o.hinge === 'b') === horiz;
  const hx = hingeHigh ? width / 2 - 0.02 : -width / 2 + 0.02;
  const th = (angle * PI) / 180;
  const ry = hingeHigh ? PI + s * th : -s * th;
  const lf = g.at(hx, 0.006, s * (depth / 2 - lt / 2), ry);
  leaf5(lf, M, lw, lh, lt, mat ?? M.door);
  lever(lf, M, lw - 0.065, 0.92, 1);
  lever(lf, M, lw - 0.065, 0.92, -1);
  for (const y of [0.18, lh / 2 + 0.05, lh - 0.25]) lf.box(M.black, 0.02, 0.09, lt + 0.004, 0.0, y, 0, { cast: false });
  // jamb liner inside the opening
  g.box(M.trimWhite, 0.016, headH, depth, -width / 2 + 0.008, 0, 0, { cast: false });
  g.box(M.trimWhite, 0.016, headH, depth, width / 2 - 0.008, 0, 0, { cast: false });
  g.box(M.trimWhite, width, 0.016, depth, 0, headH - 0.016, 0, { cast: false });
  casing(g, M, width, headH, depth, 1);
  casing(g, M, width, headH, depth, -1);
  // light switch beside the latch-side casing, on the side the door swings into
  if (switchPlate) {
    const lx = (hingeHigh ? -1 : 1) * (width / 2 + 0.09 + 0.1);
    const zf = s * (depth / 2 + 0.004);
    const sf = g.at(lx, 1.2, zf, s > 0 ? 0 : Math.PI);
    sf.boxC(M.trimWhite, 0.07, 0.115, 0.008, 0, 0, 0, { cast: false });
    sf.boxC(M.trimWhite, 0.018, 0.034, 0.012, 0, 0, 0.004, { cast: false });
  }
}

// closed door on a wall face (stair shaft doors): origin floor, centred, local +z out of the wall
export function doorLeafStatic(f, M, w, h, o = {}) {
  const lf = f.at(-w / 2, 0, 0.02);
  leaf5(lf, M, w, h, 0.035, o.mat ?? M.door);
  lever(lf, M, w - 0.065, 0.92, 1);
  if (o.casing) {
    const leg = 0.09, t = 0.02, mat = M.trimWhite;
    f.box(mat, leg, h + leg, t, -w / 2 - leg / 2, 0, t / 2, { cast: false });
    f.box(mat, leg, h + leg, t, w / 2 + leg / 2, 0, t / 2, { cast: false });
    f.box(mat, w + 2 * leg, leg, t, 0, h, t / 2, { cast: false });
    f.box(mat, w + 2 * leg + 0.03, 0.03, t + 0.012, 0, h + leg, t / 2, { cast: false });
  }
}
