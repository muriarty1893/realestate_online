// Front-facade windows and the entry door: dark-bronze double-hung units with lit (warm) glass,
// exterior head trim and sills. Built in each opening's local frame (x along wall, y up, z out).
import * as THREE from 'three';
import { Geo, V3 } from './util.js';

const FT = 0.3048;

// opening -> local frame matrix (origin at the opening centre on the exterior wall face, at floor base)
function frameFor(o) {
  const M = o.M;
  const out = (c) => c.kind === 'outside' || c.kind === 'outdoor';
  const extB = out(o.sideB) && !out(o.sideA);
  const m = new THREE.Matrix4();
  let pos, rotY;
  if (o.horiz) { pos = V3(M.cx, o.base, extB ? M.z1 : M.z0); rotY = extB ? 0 : Math.PI; }
  else { pos = V3(extB ? M.x1 : M.x0, o.base, M.cz); rotY = extB ? Math.PI / 2 : -Math.PI / 2; }
  m.compose(pos, new THREE.Quaternion().setFromAxisAngle(V3(0, 1, 0), rotY), V3(1, 1, 1));
  const width = o.horiz ? M.w : M.d, depth = o.horiz ? M.d : M.w;
  return { m, width, depth };
}

// sash: frame bars + muntins + glass (glow outside, clear inside) in local coords
function sash(geo, M, glowMat, x0, x1, y0, y1, z, cols, rows, uvf, { bar = 0.045, mun = 0.02, depth = 0.045 } = {}) {
  const f = M.bronze;
  geo.box(f, x0, y0, z - depth / 2, x1, y0 + bar, z + depth / 2);
  geo.box(f, x0, y1 - bar, z - depth / 2, x1, y1, z + depth / 2);
  geo.box(f, x0, y0 + bar, z - depth / 2, x0 + bar, y1 - bar, z + depth / 2);
  geo.box(f, x1 - bar, y0 + bar, z - depth / 2, x1, y1 - bar, z + depth / 2);
  const ix0 = x0 + bar, ix1 = x1 - bar, iy0 = y0 + bar, iy1 = y1 - bar;
  for (let i = 1; i < cols; i++) { const x = ix0 + ((ix1 - ix0) * i) / cols; geo.box(f, x - mun / 2, iy0, z - 0.004, x + mun / 2, iy1, z + 0.016); }
  for (let j = 1; j < rows; j++) { const y = iy0 + ((iy1 - iy0) * j) / rows; geo.box(f, ix0, y - mun / 2, z - 0.004, ix1, y + mun / 2, z + 0.016); }
  // glass: lit face looking out, clear face looking in
  geo.poly(glowMat, [V3(ix0, iy0, z), V3(ix1, iy0, z), V3(ix1, iy1, z), V3(ix0, iy1, z)], uvf);
  geo.poly(M.glassClear, [V3(ix1, iy0, z - 0.012), V3(ix0, iy0, z - 0.012), V3(ix0, iy1, z - 0.012), V3(ix1, iy1, z - 0.012)]);
}

// local UV for the glow quad must span the whole window so the gradient reads as one room
function windowUnit(geo, M, glowMat, o, { units = 1, cols = 2, rowsTop = 1, rowsBot = 1, sillFt, headFt, trimHead = true, wallDepth }) {
  const { width } = o._frame;
  const sill = sillFt * FT, head = headFt * FT;
  const fw = 0.055, mull = 0.09;
  const zf = -0.05; // frame plane (behind the exterior face)
  const x0 = -width / 2 + 0.005, x1 = width / 2 - 0.005, y0 = sill + 0.005, y1 = head - 0.005;
  const f = M.bronze;
  // outer frame
  geo.box(f, x0, y0, zf - 0.05, x1, y0 + fw, zf + 0.04);
  geo.box(f, x0, y1 - fw, zf - 0.05, x1, y1, zf + 0.04);
  geo.box(f, x0, y0 + fw, zf - 0.05, x0 + fw, y1 - fw, zf + 0.04);
  geo.box(f, x1 - fw, y0 + fw, zf - 0.05, x1, y1 - fw, zf + 0.04);
  const ux0 = x0 + fw, ux1 = x1 - fw, uy0 = y0 + fw, uy1 = y1 - fw;
  const uw = (ux1 - ux0 - mull * (units - 1)) / units;
  for (let u = 0; u < units; u++) {
    const a = ux0 + u * (uw + mull), b = a + uw;
    if (u > 0) geo.box(f, a - mull, uy0, zf - 0.05, a, uy1, zf + 0.04);
    const mid = (uy0 + uy1) / 2 + 0.02;
    // lower sash in front, upper sash behind (double hung)
    const uvf = (p) => [(p.x - x0) / (x1 - x0), (p.y - y0) / (y1 - y0)];
    sash(geo, M, glowMat, a, b, uy0, mid + 0.02, zf + 0.018, cols, rowsBot, uvf);
    sash(geo, M, glowMat, a, b, mid - 0.02, uy1, zf - 0.018, cols, rowsTop, uvf);
  }
  // exterior trim: head casing + sill nose
  if (trimHead) {
    geo.box(f, x0 - 0.07, y1, -0.002, x1 + 0.07, y1 + 0.1, 0.03);
    geo.box(f, x0 - 0.09, y1 + 0.1, -0.002, x1 + 0.09, y1 + 0.125, 0.045);
  }
  geo.box(M.bronzeMatte, x0 - 0.04, y0 - 0.045, -0.002, x1 + 0.04, y0 + 0.005, 0.05);
  // thin side casings
  geo.box(f, x0 - 0.045, y0, -0.002, x0 + 0.005, y1, 0.018);
  geo.box(f, x1 - 0.005, y0, -0.002, x1 + 0.045, y1, 0.018);
  // reveal liner (frame to wall face), stucco-coloured
  void wallDepth;
}

const SPEC = {
  win_garage_front: { units: 1, cols: 2, sill: 3.0, head: 8.0, glow: 0 },
  win_garage_bay: { units: 2, cols: 2, sill: 2.5, head: 7.5, glow: 1, top: 2.26 / 0.3048 },
  win_butler1: { units: 1, cols: 2, sill: 3.5, head: 8.0, glow: 2 },
  win_butler2: { units: 1, cols: 2, sill: 3.5, head: 8.0, glow: 3 },
  win_dining_bay: { units: 2, cols: 2, sill: 1.5, head: 8.5, glow: 4 },
  win_bed_front_bay: { units: 2, cols: 2, sill: 1.5, head: 8.5, glow: 1 },
};

// called from configure(): take over these openings (new sill/head, own units)
export function configureOpenings(ctx) {
  for (const [id, s] of Object.entries(SPEC)) ctx.overrideOpening(id, { sill: s.sill, head: s.head, grid: [s.cols * s.units, 2], skipUnit: true, ...(s.top ? { top: s.top } : {}) });
  for (const id of ['w_bump3', 'w_bump4', 'w_bump5', 'w_bump6']) ctx.hideWall(id);
  ctx.overrideOpening('door_entry', { skipUnit: true });
  ctx.overrideOpening('sidelight_l', { skipUnit: true });
  ctx.overrideOpening('sidelight_r', { skipUnit: true });
}

export function buildOpenings(ctx, M, parent) {
  const geo = new Geo();
  for (const [id, s] of Object.entries(SPEC)) {
    const o = ctx.opening(id);
    o._frame = frameFor(o);
    geo.xf = o._frame.m;
    windowUnit(geo, M, M.glow[s.glow], o, { units: s.units, cols: s.cols, sillFt: s.sill, headFt: s.head });
  }
  // entry door (double, wood with glass lites) + sidelights
  const d = ctx.opening('door_entry');
  d._frame = frameFor(d);
  geo.xf = d._frame.m;
  entryDoor(geo, M, d._frame.width, 8 * FT);
  for (const id of ['sidelight_l', 'sidelight_r']) {
    const o = ctx.opening(id);
    o._frame = frameFor(o);
    geo.xf = o._frame.m;
    sidelight(geo, M, o._frame.width, 8 * FT);
  }
  geo.xf = null;
  return geo.toMeshes(parent, { name: 'openings' });
}

function entryDoor(geo, M, width, h) {
  const W = M.doorWood, f = M.bronze;
  const z = -0.06, t = 0.05;
  // frame / jambs (wood)
  geo.box(W, -width / 2, 0, z - 0.05, -width / 2 + 0.06, h, z + 0.05);
  geo.box(W, width / 2 - 0.06, 0, z - 0.05, width / 2, h, z + 0.05);
  geo.box(W, -width / 2, h - 0.06, z - 0.05, width / 2, h, z + 0.05);
  const lw = (width - 0.12) / 2;
  for (const sx of [-1, 1]) {
    const x0 = sx < 0 ? -width / 2 + 0.06 : 0.002, x1 = sx < 0 ? -0.002 : width / 2 - 0.06;
    const st = 0.12, top = 0.13, bot = 0.3;
    const y1 = h - 0.06;
    geo.box(W, x0, 0.005, z - t / 2, x0 + st, y1, z + t / 2);
    geo.box(W, x1 - st, 0.005, z - t / 2, x1, y1, z + t / 2);
    geo.box(W, x0 + st, y1 - top, z - t / 2, x1 - st, y1, z + t / 2);
    geo.box(W, x0 + st, 0.005, z - t / 2, x1 - st, bot, z + t / 2);
    // glazed panel with simulated divided lites (2 x 4)
    const gx0 = x0 + st, gx1 = x1 - st, gy0 = bot, gy1 = y1 - top;
    for (let i = 1; i < 2; i++) { const x = gx0 + ((gx1 - gx0) * i) / 2; geo.box(W, x - 0.012, gy0, z - 0.01, x + 0.012, gy1, z + 0.02); }
    for (let j = 1; j < 4; j++) { const y = gy0 + ((gy1 - gy0) * j) / 4; geo.box(W, gx0, y - 0.012, z - 0.01, gx1, y + 0.012, z + 0.02); }
    geo.poly(M.glow[5], [V3(gx0, gy0, z), V3(gx1, gy0, z), V3(gx1, gy1, z), V3(gx0, gy1, z)], (p) => [(p.x + width / 2) / width, p.y / h]);
    geo.poly(M.glassClear, [V3(gx1, gy0, z - 0.012), V3(gx0, gy0, z - 0.012), V3(gx0, gy1, z - 0.012), V3(gx1, gy1, z - 0.012)]);
    // long pull handle
    const hx = sx < 0 ? x1 - 0.06 : x0 + 0.06;
    geo.box(f, hx - 0.012, 0.85, z + t / 2, hx + 0.012, 1.25, z + t / 2 + 0.05);
    void lw;
  }
  // exterior casing (white)
  geo.box(M.white, -width / 2 - 0.1, 0, -0.002, -width / 2, h + 0.12, 0.025);
  geo.box(M.white, width / 2, 0, -0.002, width / 2 + 0.1, h + 0.12, 0.025);
  geo.box(M.white, -width / 2 - 0.1, h, -0.002, width / 2 + 0.1, h + 0.14, 0.03);
}

function sidelight(geo, M, width, h) {
  const W = M.doorWood;
  const z = -0.06, t = 0.05, st = 0.08, bot = 0.35, top = 0.12;
  const x0 = -width / 2 + 0.005, x1 = width / 2 - 0.005;
  geo.box(W, x0, 0, z - t / 2, x0 + st, h, z + t / 2);
  geo.box(W, x1 - st, 0, z - t / 2, x1, h, z + t / 2);
  geo.box(W, x0 + st, h - top, z - t / 2, x1 - st, h, z + t / 2);
  geo.box(W, x0 + st, 0, z - t / 2, x1 - st, bot, z + t / 2);
  const gy0 = bot, gy1 = h - top;
  for (let j = 1; j < 4; j++) { const y = gy0 + ((gy1 - gy0) * j) / 4; geo.box(W, x0 + st, y - 0.012, z - 0.01, x1 - st, y + 0.012, z + 0.02); }
  geo.poly(M.glow[5], [V3(x0 + st, gy0, z), V3(x1 - st, gy0, z), V3(x1 - st, gy1, z), V3(x0 + st, gy1, z)], (p) => [0.5 + p.x / 2, p.y / h]);
  geo.poly(M.glassClear, [V3(x1 - st, gy0, z - 0.012), V3(x0 + st, gy0, z - 0.012), V3(x0 + st, gy1, z - 0.012), V3(x1 - st, gy1, z - 0.012)]);
  geo.box(M.white, x0 - 0.03, h, -0.002, x1 + 0.03, h + 0.14, 0.03);
}
