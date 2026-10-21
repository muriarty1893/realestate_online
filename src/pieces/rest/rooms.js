// Room-by-room layouts for the rest-of-house piece, placed exactly where the plan draws fixtures.
import * as THREE from 'three';
import { Frame, boxGeo, softBox, pillowGeo, openBasin } from './kit.js';
import * as F from './furniture.js';

const PI = Math.PI;

export function makeHelpers(ctx) {
  const k = ctx.plan.M_PER_PX;
  const X = (px) => (px - 1500) * k, Z = (py) => (py - 1000) * k;
  // frame on a wall face; local +z points into the room, local +x to the right when facing the wall
  const W = (B, side, face, along, y = 0) => {
    const f = new Frame(B);
    if (side === 'n') return f.at(along, y, face, 0);
    if (side === 's') return f.at(along, y, face, PI);
    if (side === 'w') return f.at(face, y, along, PI / 2);
    return f.at(face, y, along, -PI / 2);
  };
  const wp = (f, x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z).applyMatrix4(f.m).toArray();
  // collider for a local footprint (x centred, z from z0 to z0+d)
  const col = (f, w, d, x = 0, z0 = 0) => {
    const pts = [[x - w / 2, z0], [x + w / 2, z0], [x - w / 2, z0 + d], [x + w / 2, z0 + d]].map(([a, b]) => new THREE.Vector3(a, 0, b).applyMatrix4(f.m));
    ctx.addCollider({ x0: Math.min(...pts.map((p) => p.x)), x1: Math.max(...pts.map((p) => p.x)), z0: Math.min(...pts.map((p) => p.z)), z1: Math.max(...pts.map((p) => p.z)) });
  };
  return { X, Z, W, wp, col };
}

// tile panel on a wall: local frame of the wall, rect in local x (x0..x1) and y (y0..y1); holes [{x0,x1,y0,y1}]
function tileWall(f, mat, x0, x1, y0, y1, holes = []) {
  const t = 0.008;
  const put = (a0, a1, b0, b1) => { if (a1 - a0 > 1e-3 && b1 - b0 > 1e-3) f.box(mat, a1 - a0, b1 - b0, t, (a0 + a1) / 2, b0, t / 2, { cast: false, grain: 'b', seed: 1 }); };
  if (!holes.length) return put(x0, x1, y0, y1);
  const h = holes[0];
  put(x0, x1, y0, h.y0); put(x0, x1, h.y1, y1); put(x0, h.x0, h.y0, h.y1); put(h.x1, x1, h.y0, h.y1);
  // tile return (bullnose) around the window reveal
  f.box(mat, h.x1 - h.x0, 0.012, 0.05, (h.x0 + h.x1) / 2, h.y0 - 0.012, 0.025, { cast: false, grain: 'b' });
}

// board and batten wainscot along a wall: local x0..x1, height h
function wainscot(f, M, x0, x1, h = 1.07) {
  const mat = M.trimWhite;
  f.box(mat, x1 - x0, h, 0.01, (x0 + x1) / 2, 0, 0.005, { cast: false });
  const n = Math.max(1, Math.round((x1 - x0) / 0.4));
  for (let i = 0; i <= n; i++) {
    const x = Math.min(x1 - 0.03, Math.max(x0 + 0.03, x0 + ((x1 - x0) * i) / n));
    f.box(mat, 0.06, h - 0.2, 0.012, x, 0.12, 0.016, { cast: false });
  }
  f.box(mat, x1 - x0, 0.09, 0.014, (x0 + x1) / 2, h - 0.09, 0.017, { cast: false });
  f.box(mat, x1 - x0, 0.025, 0.045, (x0 + x1) / 2, h, 0.0225, { cast: false });
  f.box(mat, x1 - x0, 0.14, 0.014, (x0 + x1) / 2, 0, 0.017, { cast: false });
}

// ================================================================ bedroom wing
export function buildBedFront(ctx, M, B, slots, H) {
  const { X, Z, W, wp, col } = H;
  const x0 = X(2119), x1 = X(2437), z0 = Z(1343), z1 = Z(1708), bx0 = X(2188), bx1 = X(2367), bz1 = Z(1756);
  const clg = ctx.plan.ft(9);
  const bc = 5.72;
  const fb = W(B, 'w', x0, bc);
  F.bed(fb, M, { W: 1.52, duvet: M.linenWhite, throw: M.knitOat, euro: M.linenOat, pillow: M.linenWhite, lumbar: M.linenTaupe, head: M.upholstery, seed: 3 });
  col(fb, 1.7, 2.25);
  for (const s of [-1, 1]) {
    const fn = fb.at(s * 1.13, 0, 0);
    F.nightstand(fn, M, { style: 'legs', mat: M.oak, w: 0.5, d: 0.42, h: 0.62, seed: 4 + s });
    const lp = F.tableLamp(fn.at(0, 0.62, 0.22), M, { h: 0.6, base: M.ceramic });
    slots.push({ room: 'bed_front', p: wp(fn, 0, 0.62 + lp[1] + 0.05, 0.42), i: 0.55, d: 3.2, c: 0xffc98f, pri: s > 0 ? 1 : 0.5 });
  }
  F.rug(fb.at(0, 0, 1.42), M.jute, 2.45, 2.0, { border: M.juteLight });
  F.art(fb.at(0, 1.78, 0), M, { w: 1.05, h: 0.72, art: M.art[1], frame: M.oakWarm });
  // dresser on the east wall
  const fd = W(B, 'e', x1, 6.62);
  F.dresser(fd, M, { w: 1.42, d: 0.5, h: 0.82, mat: M.oak, pull: 'cup', pullMat: M.bronze });
  col(fd, 1.42, 0.5);
  F.art(fd.at(0, 1.48, 0), M, { w: 0.72, h: 0.92, art: M.art[3], frame: M.black, fw: 0.018 });
  F.tableLamp(fd.at(-0.48, 0.82, 0.25), M, { h: 0.55, base: M.ceramicSage, rt: 0.1, rb: 0.17 });
  F.vase(fd.at(0.42, 0.82, 0.25), M, { h: 0.3, r: 0.085, n: 6, len: 0.5, seed: 21 });
  F.books(fd.at(0.05, 0.82, 0.22), M, { n: 3, flat: true, seed: 22 });
  F.tray(fd.at(0.08, 0.82 + 0.07, 0.22), M, 0.25, 0.16);
  // window seat in the bay
  const bw = bx1 - bx0, bd = bz1 - z1;
  const fs = W(B, 's', bz1, (bx0 + bx1) / 2);
  fs.box(M.paint, bw, 0.4, bd + 0.03, 0, 0, (bd + 0.03) / 2);
  fs.box(M.paint, bw + 0.02, 0.035, bd + 0.06, 0, 0.4, (bd + 0.06) / 2);
  for (let i = 0; i < 3; i++) F.shakerPanel(fs.at(-bw / 2 + bw / 6 + (i * bw) / 3, 0.08, bd + 0.03), M.paint, bw / 3 - 0.03, 0.29, 0.02, 0.05);
  fs.add(softBox(bw - 0.03, 0.09, bd - 0.02, 0.035, { n: 10, noise: 0.003, seed: 31 }), M.linenOat, 0, 0.48, (bd - 0.02) / 2 + 0.01);
  for (let i = 0; i < 3; i++) {
    const x = -bw / 2 + 0.36 + i * ((bw - 0.72) / 2);
    fs.add(pillowGeo(0.46, 0.46, 0.16, 30 + i), i === 1 ? M.linenTaupe : M.linenCream, x, 0.76, 0.13, (i - 1) * 0.08, -0.28);
  }
  col(fs, bw, bd + 0.06);
  // bay curtains framing the seat
  F.curtains(W(B, 's', z1, (bx0 + bx1) / 2), M, { W: bw, top: 2.56, ext: 0.26, pw: 0.46, seed: 7 });
  // basket + throw in the corner
  F.basketBox(new Frame(B).at(x1 - 0.3, 0, z1 - 0.28), M, 0.42, 0.42, 0.38);
  new Frame(B).at(x1 - 0.3, 0.4, z1 - 0.28).add(softBox(0.4, 0.12, 0.34, 0.05, { n: 4, noise: 0.012, seed: 9 }), M.knitBlue, 0, 0.03, 0);
  // fan + recessed
  const fp = F.ceilingFan(new Frame(B).at((x0 + x1) / 2, clg, 5.68), M, { phase: 0.4 });
  slots.push({ room: 'bed_front', p: [(x0 + x1) / 2, clg - 0.55, 5.68], i: 3.4, d: 5.2, pri: 2 });
  return { x0, x1, z0, z1, bx0, bx1, bz1, clg };
}

export function buildBedMid(ctx, M, B, slots, H) {
  const { X, Z, W, wp, col } = H;
  const x0 = X(2184), x1 = X(2587), z0 = Z(874), z1 = Z(1152);
  const clg = ctx.plan.ft(9);
  const bc = (Z(946) + Z(1072)) / 2;
  const fb = W(B, 'e', x1, bc);
  F.bed(fb, M, { W: 1.37, headW: 1.4, headH: 1.12, duvet: M.linenOat, sheet: M.linenWhite, throw: M.knitBlue, euro: M.linenCream, pillow: M.linenWhite, lumbar: M.linenSage, head: M.upholsteryLight, seed: 5 });
  col(fb, 1.55, 2.25);
  for (const s of [-1, 1]) {
    const fn = fb.at(s * 0.98, 0, 0);
    F.nightstand(fn, M, { style: 'legs', mat: M.paint, front: M.paint, w: 0.48, d: 0.4, h: 0.58, pull: 'knob', pullMat: M.bronze, seed: 7 + s });
    const lp = F.tableLamp(fn.at(0, 0.58, 0.2), M, { h: 0.5, base: M.ceramicCharcoal, rt: 0.09, rb: 0.16 });
    slots.push({ room: 'bed_mid', p: wp(fn, 0, 0.58 + lp[1] + 0.05, 0.4), i: 0.5, d: 3.0, c: 0xffc98f, pri: s > 0 ? 1 : 0.5 });
  }
  // roman shades on the two east windows
  for (const [a, b] of [[880, 946], [1072, 1145]]) F.romanShade(W(B, 'e', x1, (Z(a) + Z(b)) / 2).at(0, ctx.plan.ft(7.5) + 0.06, 0), M, { W: Z(b) - Z(a), drop: 0.42, mat: M.linenCream });
  F.art(fb.at(0, 1.72, 0), M, { w: 0.62, h: 0.46, art: M.art[0], frame: M.oakWarm, fw: 0.02 });
  F.rug(fb.at(0, 0, 1.45), M.juteLight, 2.2, 2.05);
  // dresser on the west wall (back of the fireplace)
  const fd = W(B, 'w', x0, -0.12);
  F.dresser(fd, M, { w: 1.3, d: 0.48, h: 0.8, mat: M.paint, front: M.paint, pull: 'cup', pullMat: M.bronze, legs: true, rows: 3, cols: 2 });
  col(fd, 1.3, 0.48);
  F.mirror(fd.at(0, 1.42, 0), M, { w: 0.72, h: 0.98, shape: 'arch', frame: M.oakWarm, t: 0.04 });
  F.tableLamp(fd.at(-0.45, 0.8, 0.24), M, { h: 0.52, base: M.ceramic });
  F.vase(fd.at(0.45, 0.8, 0.24), M, { h: 0.22, r: 0.07, n: 4, len: 0.38, seed: 31, mat: M.ceramicSage });
  F.books(fd.at(0.12, 0.8, 0.22), M, { n: 2, flat: true, seed: 32 });
  // desk niche (north)
  const nx = (X(2297) + X(2411)) / 2;
  const fdk = W(B, 'n', Z(812), nx);
  F.builtinDesk(fdk, M, { w: X(2411) - X(2297), d: 0.58, mat: M.paint, top: M.oakWarm });
  F.deskLamp(fdk.at(0.38, 0.76, 0.2), M);
  F.chair(fdk.at(0.12, 0, 0.78, PI + 0.15), M, { mat: M.oak });
  col(fdk, X(2411) - X(2297), 0.58);
  F.ceilingFan(new Frame(B).at((x0 + x1) / 2, clg, (z0 + z1) / 2), M, { phase: 0.1 });
  slots.push({ room: 'bed_mid', p: [(x0 + x1) / 2, clg - 0.55, (z0 + z1) / 2], i: 3.4, d: 5.4, pri: 2 });
  slots.push({ room: 'bed_mid', p: wp(fdk, 0.3, 1.1, 0.35), i: 0.35, d: 2.0, c: 0xffd8a8, pri: 0 });
  return { x0, x1, z0, z1, clg };
}

export function buildBedNE(ctx, M, B, slots, H) {
  const { X, Z, W, wp, col } = H;
  const x0 = X(2118), x1 = X(2437), z0 = Z(403), z1 = Z(746);
  const clg = ctx.plan.ft(9);
  const bc = -4.92;
  const fb = W(B, 'w', x0, bc);
  F.bed(fb, M, { W: 1.52, style: 'wood', duvet: M.linenWhite, sheet: M.linenWhite, throw: M.knitBlue, euro: M.linenCream, pillow: M.linenWhite, lumbar: M.linenBlue, seed: 8 });
  col(fb, 1.7, 2.22);
  for (const s of [-1, 1]) {
    const fn = fb.at(s * 1.13, 0, 0);
    F.nightstand(fn, M, { style: 'float', mat: M.oak, w: 0.5, d: 0.38, h: 0.6 });
    const lp = F.tableLamp(fn.at(0, 0.6, 0.2), M, { h: 0.58, base: M.ceramic });
    slots.push({ room: 'bed_ne', p: wp(fn, 0, 0.6 + lp[1] + 0.05, 0.4), i: 0.55, d: 3.2, c: 0xffc98f, pri: s > 0 ? 1 : 0.5 });
  }
  F.art(fb.at(0, 1.82, 0), M, { w: 1.1, h: 0.74, art: M.art[5], frame: M.black, fw: 0.02 });
  F.rug(fb.at(0, 0, 1.4), M.jute, 2.45, 2.0, { border: M.juteLight });
  // north window curtains
  const wx = (X(2210) + X(2347)) / 2;
  F.curtains(W(B, 'n', z0, wx), M, { W: X(2347) - X(2210), top: 2.5, ext: 0.24, pw: 0.42, seed: 11 });
  // dresser on the east wall, north of the bath pocket door
  const fd = W(B, 'e', x1, -5.42);
  F.dresser(fd, M, { w: 1.3, d: 0.5, h: 0.84, mat: M.oakWarm, cols: 2, rows: 3, pullMat: M.black });
  col(fd, 1.3, 0.5);
  F.mirror(fd.at(0, 1.5, 0), M, { w: 0.78, shape: 'round', frame: M.black, t: 0.03 });
  F.tableLamp(fd.at(0.42, 0.84, 0.25), M, { h: 0.55, base: M.ceramicCharcoal });
  F.vase(fd.at(-0.4, 0.84, 0.25), M, { h: 0.3, r: 0.08, n: 5, len: 0.48, seed: 41 });
  // desk niche (south of the room)
  const nx = (X(2297) + X(2411)) / 2;
  const fdk = W(B, 's', Z(801), nx);
  F.builtinDesk(fdk, M, { w: X(2411) - X(2297), d: 0.58, mat: M.paint, top: M.oakWarm });
  F.deskLamp(fdk.at(-0.4, 0.76, 0.2), M);
  F.chair(fdk.at(-0.1, 0, 0.8, PI - 0.2), M, { mat: M.oak });
  col(fdk, X(2411) - X(2297), 0.58);
  F.ceilingFan(new Frame(B).at((x0 + x1) / 2, clg, (z0 + z1) / 2), M, { phase: 0.7 });
  slots.push({ room: 'bed_ne', p: [(x0 + x1) / 2, clg - 0.55, (z0 + z1) / 2], i: 3.4, d: 5.2, pri: 2 });
  return { x0, x1, z0, z1, clg };
}

export function buildBathNE(ctx, M, B, slots, H) {
  const { X, Z, W, wp, col } = H;
  const x0 = X(2448), x1 = X(2587), z0 = Z(530), z1 = Z(746), cx = (x0 + x1) / 2;
  const clg = ctx.plan.ft(9);
  const tw = 0.76;
  // tub along the north wall with the window above
  const ft = W(B, 'n', z0 + 0.008, cx);
  F.alcoveTub(ft, M, { L: x1 - x0, W: tw });
  col(ft, x1 - x0, tw);
  const wx0 = X(2493) - cx, wx1 = X(2546) - cx, sill = ctx.plan.ft(5), head = ctx.plan.ft(7);
  tileWall(W(B, 'n', z0, cx), M.subway, -(x1 - x0) / 2, (x1 - x0) / 2, 0.5, 2.13, [{ x0: wx0, x1: wx1, y0: sill, y1: head + 0.01 }]);
  tileWall(W(B, 'w', x0, z0 + tw / 2), M.subway, -tw / 2, tw / 2 + 0.002, 0, 2.13);
  tileWall(W(B, 'e', x1, z0 + tw / 2), M.subway, -tw / 2 - 0.002, tw / 2, 0, 2.13);
  F.showerSet(W(B, 'e', x1 - 0.008, z0 + 0.38), M);
  F.showerCurtain(new Frame(B).at(cx, 2.02, z0 + tw - 0.03, PI), M, { L: x1 - x0, h: 1.86, pw: 0.5, mat: M.linenWhite });
  F.romanShade(W(B, 'n', z0 + 0.008, (X(2493) + X(2546)) / 2).at(0, head + 0.05, 0), M, { W: X(2546) - X(2493), drop: 0.26, mat: M.linenCream });
  // toilet on the east wall with shelves above (plan "lin")
  const tz = Z(635);
  const fto = W(B, 'e', x1, tz);
  F.toilet(fto, M);
  col(fto, 0.45, 0.7);
  const sh = fto.at(0, 1.18, 0);
  F.wallShelves(sh, M, { w: 0.55, d: 0.22, n: 2, gap: 0.34, mat: M.oakWarm });
  F.foldedTowels(sh.at(-0.12, 0.03, 0.11), M, { n: 3 });
  F.basketBox(sh.at(0.14, 0.03, 0.11), M, 0.2, 0.14, 0.18);
  F.vase(sh.at(0.0, 0.37, 0.11), M, { h: 0.16, r: 0.05, n: 3, len: 0.24, seed: 51, mat: M.ceramicSage });
  F.books(sh.at(-0.2, 0.37, 0.12), M, { n: 2, flat: true, seed: 52 });
  // vanity in the SE corner (plan oval sink)
  const vz = (Z(668) + Z(746)) / 2;
  const fv = W(B, 'e', x1, vz);
  F.vanity(fv, M, { w: Z(746) - Z(668) - 0.01, d: 0.53, h: 0.86, cab: M.paint, top: M.quartz, sinks: [0], layout: 'doors', sinkW: 0.4, sinkD: 0.3 });
  col(fv, 0.82, 0.53);
  F.mirror(fv.at(0, 1.45, 0), M, { w: 0.56, h: 0.82, shape: 'arch', frame: M.black, t: 0.022 });
  F.vanityLight(fv.at(0, 2.0, 0), M, { n: 2, w: 0.5 });
  F.tpHolder(new Frame(B).at(x1 - 0.5, 0.66, vz - 0.41, PI), M);
  F.towelRing(new Frame(B).at(x1 - 0.3, 1.28, vz - 0.41, PI).at(0, 0, 0), M);
  F.rug(new Frame(B).at(cx - 0.1, 0, z0 + tw + 0.34), M.towel, 0.85, 0.5);
  F.recessed(new Frame(B).at(cx, clg, z0 + 0.38), M);
  F.flushMount(new Frame(B).at(cx - 0.15, clg, Z(640)), M, { r: 0.16 });
  slots.push({ room: 'bath_ne', p: [cx - 0.15, clg - 0.35, Z(640)], i: 1.8, d: 3.4, pri: 2 });
  slots.push({ room: 'bath_ne', p: wp(fv, 0, 1.95, 0.25), i: 0.5, d: 2.0, pri: 1 });
  return { x0, x1, z0, z1, clg };
}

export function buildSmallNE(ctx, M, B, slots, H) {
  const { X, Z, W, wp } = H;
  const clg = ctx.plan.ft(9);
  // WIC off the NE bath (rod + shelf along the south wall, shelves on the west end)
  {
    const x0 = X(2422), x1 = X(2587), z0 = Z(757), z1 = Z(853);
    F.closetRod(W(B, 's', z1, (x0 + x1) / 2 + 0.1), M, { w: x1 - x0 - 0.22, rodY: 1.72, d: 0.34, seed: 61, fill: 0.85 });
    F.shelfStack(W(B, 'w', x0, (z0 + z1) / 2 - 0.12), M, { w: 0.6, d: 0.33, ys: [0.35, 0.7, 1.05, 1.4, 1.75], seed: 62 });
    F.recessed(new Frame(B).at((x0 + x1) / 2, clg, (z0 + z1) / 2), M);
    slots.push({ room: 'wic_ne', p: [(x0 + x1) / 2, clg - 0.3, (z0 + z1) / 2], i: 0.9, d: 2.4 });
    // wall filler beside the narrowed pocket opening (the pocket the door slides into)
    new Frame(B).box(M.wall, X(2575) - X(2537), 3.048 + 0.57, Z(757) - Z(746), (X(2537) + X(2575)) / 2, -0.57, (Z(746) + Z(757)) / 2);
    ctx.addCollider({ x0: X(2537), x1: X(2575), z0: Z(746), z1: Z(757) });
  }
  // vestibule
  {
    const x0 = X(2118), x1 = X(2222), z0 = Z(757), z1 = Z(853), cx = (x0 + x1) / 2;
    F.art(W(B, 's', z1, cx).at(0, 1.55, 0), M, { w: 0.55, h: 0.75, art: M.art[2], frame: M.oakWarm, fw: 0.02 });
    F.flushMount(new Frame(B).at(cx, clg, (z0 + z1) / 2), M, { r: 0.15 });
    F.rug(new Frame(B).at(cx + 0.05, 0, (z0 + z1) / 2), M.juteLight, 0.6, 0.9);
    slots.push({ room: 'vest', p: [cx, clg - 0.35, (z0 + z1) / 2], i: 1.2, d: 2.8 });
  }
  // linen closets
  F.shelfStack(W(B, 'e', X(2287), (Z(757) + Z(865)) / 2), M, { w: Z(865) - Z(757) - 0.02, d: 0.4, seed: 71 });
  F.shelfStack(W(B, 'n', Z(1163), (X(2118) + X(2184)) / 2), M, { w: X(2184) - X(2118) - 0.02, d: 0.4, seed: 72 });
}

export function buildHallE(ctx, M, B, slots, H) {
  const { X, Z, W } = H;
  const clg = ctx.plan.ft(9);
  const x0 = X(2118), x1 = X(2270), z0 = Z(1244), z1 = Z(1331), cz = (z0 + z1) / 2;
  F.rug(new Frame(B).at((x0 + x1) / 2 + 0.05, 0, cz), M.juteLight, 1.35, 0.68);
  F.art(W(B, 'e', x1, cz).at(0, 1.55, 0), M, { w: 0.6, h: 0.8, art: M.art[4], frame: M.black, fw: 0.018 });
  F.flushMount(new Frame(B).at(7.55, clg, cz), M, { r: 0.16 });
  F.recessed(new Frame(B).at((X(2195) + X(2270)) / 2, clg, (Z(1163) + Z(1244)) / 2), M);
  slots.push({ room: 'hall_e', p: [7.55, clg - 0.35, cz], i: 1.3, d: 3.2 });
}

export function buildDress(ctx, M, B, slots, H) {
  const { X, Z, W, wp, col } = H;
  const clg = ctx.plan.ft(9);
  const x0 = X(2281), x1 = X(2437), z0 = Z(1163), z1 = Z(1331), cz = (z0 + z1) / 2;
  // jack-and-jill double vanity along the west wall (plan: two ovals)
  const fv = W(B, 'w', x0, cz);
  F.vanity(fv, M, { w: 1.42, d: 0.56, h: 0.87, cab: M.oak, top: M.quartz, sinks: [-0.4, 0.4] });
  col(fv, 1.42, 0.56);
  for (const s of [-0.4, 0.4]) F.mirror(fv.at(s, 1.48, 0), M, { w: 0.55, h: 0.86, shape: 'arch', frame: M.black, t: 0.022 });
  for (const s of [-0.71, 0, 0.71]) F.sconce(fv.at(s, 1.62, 0), M, { shade: M.shade });
  F.rug(fv.at(0, 0, 0.92), M.towel, 1.1, 0.55);
  F.towelRing(W(B, 'e', x1, z0 + 0.45).at(0, 1.3, 0), M);
  F.basketBox(new Frame(B).at(x1 - 0.25, 0, z0 + 0.25), M, 0.36, 0.5, 0.34);
  F.recessed(new Frame(B).at((x0 + x1) / 2 + 0.1, clg, cz), M);
  slots.push({ room: 'dress', p: [(x0 + x1) / 2 + 0.15, clg - 0.4, cz], i: 1.5, d: 3.0, pri: 2 });
  slots.push({ room: 'dress', p: wp(fv, 0, 1.62, 0.3), i: 0.5, d: 2.2, pri: 1 });
}

export function buildBathFront(ctx, M, B, slots, H) {
  const { X, Z, W, wp, col } = H;
  const clg = ctx.plan.ft(9);
  const x0 = X(2448), x1 = X(2617), z0 = Z(1262), z1 = Z(1402), cz = (z0 + z1) / 2;
  const tw = 0.76;
  const ft = W(B, 'e', x1 - 0.008, cz);
  F.alcoveTub(ft, M, { L: z1 - z0, W: tw });
  col(ft, z1 - z0, tw);
  const wz0 = Z(1307) - cz, wz1 = Z(1359) - cz, sill = ctx.plan.ft(4), head = ctx.plan.ft(7);
  tileWall(W(B, 'e', x1, cz), M.subway, -(z1 - z0) / 2, (z1 - z0) / 2, 0.5, 2.13, [{ x0: wz0, x1: wz1, y0: sill, y1: head + 0.01 }]);
  tileWall(W(B, 'n', z0, x1 - tw / 2), M.subway, -tw / 2 - 0.002, tw / 2, 0, 2.13);
  tileWall(W(B, 's', z1, x1 - tw / 2), M.subway, -tw / 2, tw / 2 + 0.002, 0, 2.13);
  F.showerSet(W(B, 'n', z0 + 0.008, x1 - 0.38), M);
  F.showerCurtain(new Frame(B).at(x1 - tw + 0.03, 2.02, cz, PI / 2), M, { L: z1 - z0, h: 1.86, pw: 0.5, mat: M.linenWhite });
  F.romanShade(W(B, 'e', x1 - 0.008, (Z(1307) + Z(1359)) / 2).at(0, head + 0.05, 0), M, { W: Z(1359) - Z(1307), drop: 0.28, mat: M.linenCream });
  // toilet on the south wall with shelves above
  const fto = W(B, 's', z1, X(2488));
  F.toilet(fto, M);
  col(fto, 0.45, 0.7);
  const sh = fto.at(0, 1.18, 0);
  F.wallShelves(sh, M, { w: 0.55, d: 0.22, n: 2, gap: 0.34, mat: M.oakWarm });
  F.foldedTowels(sh.at(0.12, 0.03, 0.11), M, { n: 3 });
  F.basketBox(sh.at(-0.14, 0.03, 0.11), M, 0.2, 0.14, 0.18);
  F.vase(sh.at(0.05, 0.37, 0.11), M, { h: 0.16, r: 0.05, n: 3, len: 0.24, seed: 81 });
  F.tpHolder(W(B, 'w', x0, z1 - 0.32).at(0, 0.66, 0), M);
  F.towelBar(W(B, 'n', z0, x0 + 0.5).at(0, 1.25, 0), M, { w: 0.55 });
  F.rug(new Frame(B).at(x1 - tw - 0.3, 0, cz - 0.05), M.towel, 0.5, 0.82);
  F.flushMount(new Frame(B).at(x0 + 0.5, clg, cz), M, { r: 0.15 });
  slots.push({ room: 'bath_front', p: [x0 + 0.5, clg - 0.35, cz], i: 1.6, d: 3.2, pri: 2 });
  slots.push({ room: 'bath_front', p: [x1 - 0.4, 1.9, cz], i: 0.5, d: 2.0, pri: 1 });
}

export function buildClosetsFront(ctx, M, B, slots, H) {
  const { X, Z, W } = H;
  const clg = ctx.plan.ft(9);
  {
    const x0 = X(2448), x1 = X(2587), z1 = Z(1234), z0 = Z(1163);
    F.closetRod(W(B, 's', z1, (x0 + x1) / 2), M, { w: x1 - x0 - 0.02, rodY: 1.72, d: 0.33, seed: 91, fill: 0.8 });
    F.recessed(new Frame(B).at((x0 + x1) / 2, clg, (z0 + z1) / 2), M);
    slots.push({ room: 'wic_mid', p: [(x0 + x1) / 2, clg - 0.3, (z0 + z1) / 2], i: 0.8, d: 2.2 });
  }
  {
    const x0 = X(2448), x1 = X(2588), z0 = Z(1427), z1 = Z(1564);
    F.closetRod(W(B, 'n', z0, (x0 + x1) / 2), M, { w: x1 - x0 - 0.02, rodY: 1.75, d: 0.33, seed: 92, fill: 0.9 });
    F.closetRod(W(B, 's', z1, (x0 + x1) / 2 - 0.25), M, { w: x1 - x0 - 0.5, rodY: 1.05, shelfY: 2.0, d: 0.33, seed: 93, short: true, fill: 0.8 });
    F.closetRod(W(B, 's', z1, (x0 + x1) / 2 - 0.25), M, { w: x1 - x0 - 0.5, rodY: 1.95, shelfY: 2.05, d: 0.33, seed: 94, short: true, fill: 0.7 });
    F.shelfStack(W(B, 'e', x1, (z0 + z1) / 2 + 0.02), M, { w: 0.5, d: 0.33, ys: [0.3, 0.62, 0.94, 1.26, 1.58, 1.9], seed: 95 });
    F.recessed(new Frame(B).at((x0 + x1) / 2, clg, (z0 + z1) / 2), M);
    slots.push({ room: 'wic_front', p: [(x0 + x1) / 2, clg - 0.3, (z0 + z1) / 2], i: 0.9, d: 2.4 });
  }
}

// ================================================================ service wing
export function buildUtil(ctx, M, B, slots, H) {
  const { X, Z, W, wp, col } = H;
  const x0 = X(674), x1 = X(972), z0 = Z(643), z1 = Z(801), cx = (x0 + x1) / 2;
  const clg = 3.048, wdW = X(822) - X(752);
  const fc = W(B, 'n', z0, cx);
  const run = x1 - x0, h = 0.99, d = 0.66;
  const sinkW = X(752) - x0, eastW = x1 - X(895);
  // cabinets: sink base (west), W/D bay, drawer stack (east)
  F.baseCabinets(fc.at(-run / 2 + sinkW / 2, 0, 0), M, { w: sinkW, h, d, cab: M.paint, noTop: true, units: [{ w: sinkW, kind: 'door2' }] });
  F.baseCabinets(fc.at(run / 2 - eastW / 2, 0, 0), M, { w: eastW, h, d, cab: M.paint, noTop: true, units: [{ w: eastW, kind: 'drawers' }] });
  const sinkX = -run / 2 + sinkW / 2;
  F.slabWithHoles(fc, M.oakWarm, run, d, h - 0.04, 0.04, [{ x: sinkX, z: d / 2 + 0.02, w: 0.56, d: 0.4 }], { cast: true });
  fc.add(openBasin(0.56, 0.24, 0.4, 0.05), M.porcelainIn, sinkX, h, d / 2 + 0.02, 0, 0, 0, false);
  F.faucet(fc.at(sinkX, h, 0.07), M);
  // washer + dryer under the counter (plan: two boxes)
  F.frontLoader(fc.at(X(787) - cx, 0, 0.0), M);
  F.frontLoader(fc.at(X(859) - cx, 0, 0.0), M, { dryer: true });
  col(fc, run, 0.72);
  // backsplash
  tileWall(fc, M.subway, -run / 2, run / 2, h, 1.5);
  // uppers at the ends, open oak shelves over the W/D
  F.upperCabinets(fc.at(-run / 2 + sinkW / 2, 1.55, 0.008), M, { w: sinkW, h: 0.85, d: 0.33, cab: M.paint, doors: 2 });
  F.upperCabinets(fc.at(run / 2 - eastW / 2, 1.55, 0.008), M, { w: eastW, h: 0.85, d: 0.33, cab: M.paint, doors: 2 });
  const shX = (X(752) + X(895)) / 2 - cx, shW = X(895) - X(752) - 0.02;
  for (const y of [1.62, 2.02]) F.wallShelves(fc.at(shX, y, 0.008), M, { w: shW, d: 0.28, n: 1, mat: M.oakWarm });
  F.basketBox(fc.at(shX - 0.45, 1.65, 0.16), M, 0.34, 0.24, 0.26);
  F.basketBox(fc.at(shX - 0.05, 1.65, 0.16), M, 0.34, 0.24, 0.26);
  F.foldedTowels(fc.at(shX + 0.4, 1.65, 0.15), M, { n: 4 });
  F.vase(fc.at(shX + 0.45, 2.05, 0.14), M, { h: 0.2, r: 0.06, n: 4, len: 0.3, seed: 101 });
  F.books(fc.at(shX - 0.5, 2.05, 0.14), M, { n: 6, seed: 102 });
  // hanging rod under the shelves
  fc.rodX(M.black, 0.012, shW - 0.1, shX, 1.5, 0.22);
  for (let i = 0; i < 4; i++) fc.box(M.cloth[(i * 3 + 1) % M.cloth.length], 0.02, 0.62, 0.42, shX - 0.25 + i * 0.07, 0.83, 0.22, { cast: false });
  // countertop items
  F.basketBox(fc.at(X(822) - cx + 0.2, h, 0.3), M, 0.4, 0.2, 0.3, M.basket);
  F.vase(fc.at(-run / 2 + 0.18, h, 0.2), M, { h: 0.14, r: 0.05, stems: false, mat: M.ceramicCharcoal });
  // south wall: peg rail
  const fs = W(B, 's', z1, cx);
  fs.box(M.oakWarm, 1.2, 0.09, 0.02, 0, 1.7, 0.01, { cast: false });
  for (let i = 0; i < 5; i++) fs.rodZ(M.oakWarm, 0.012, 0.08, -0.48 + i * 0.24, 1.745, 0.05);
  fs.add(softBox(0.36, 0.42, 0.06, 0.03, { n: 4, noise: 0.008 }), M.linenOat, -0.24, 1.47, 0.08);
  F.rug(new Frame(B).at(cx, 0, (z0 + z1) / 2 + 0.33), M.juteLight, 1.8, 0.62);
  F.flushMount(new Frame(B).at(cx, clg, (z0 + z1) / 2), M, { r: 0.2 });
  slots.push({ room: 'util', p: [cx, clg - 0.45, (z0 + z1) / 2 + 0.1], i: 2.6, d: 4.2, pri: 2 });
  slots.push({ room: 'util', p: wp(fc, 0, 1.5, 0.45), i: 0.6, d: 2.2, pri: 1 });
}

export function buildHallW(ctx, M, B, slots, H) {
  const { X, Z, W } = H;
  const x0 = X(983), x1 = X(1080), z0 = Z(643), z1 = Z(899), cx = (x0 + x1) / 2;
  F.rug(new Frame(B).at(cx, 0, -2.55), M.juteLight, 0.66, 1.9);
  F.art(W(B, 'e', x1, -2.95).at(0, 1.58, 0), M, { w: 0.62, h: 0.82, art: M.art[1], frame: M.oakWarm, fw: 0.02 });
  F.flushMount(new Frame(B).at(cx, 3.048, -2.55), M, { r: 0.17 });
  slots.push({ room: 'hall_w', p: [cx, 2.6, -2.55], i: 1.6, d: 3.6 });
}

export function buildMud(ctx, M, B, slots, H) {
  const { X, Z, W, wp, col } = H;
  const x0 = X(923), x1 = X(1080), z0 = Z(899), z1 = Z(1152), cx = (x0 + x1) / 2;
  const lz = (Z(942) + Z(1145)) / 2;
  const fl = W(B, 'e', x1, lz);
  F.lockers(fl, M, { n: 4, bw: (Z(1145) - Z(942)) / 4, d: 0.46, h: 2.35, cab: M.paint, seat: M.oakWarm, cushion: M.linenCharcoal });
  col(fl, Z(1145) - Z(942), 0.46);
  F.rug(new Frame(B).at(cx - 0.18, 0, 0.25), M.jute, 0.75, 1.7, { border: M.juteLight });
  F.pendantDome(new Frame(B).at(cx - 0.15, 3.048, 0.25), M, { drop: 0.7, r: 0.18 });
  slots.push({ room: 'mud', p: [cx - 0.15, 2.1, 0.25], i: 2.0, d: 4.0 });
}

export function buildPdr(ctx, M, B, slots, H) {
  const { X, Z, W, wp, col } = H;
  const x0 = X(772), x1 = X(912), z0 = Z(910), z1 = Z(1054);
  const clg = ctx.plan.ft(8);
  // wainscot on all walls (door on the east wall, north part)
  wainscot(W(B, 'n', z0, (x0 + x1) / 2), M, -(x1 - x0) / 2, (x1 - x0) / 2);
  wainscot(W(B, 's', z1, (x0 + x1) / 2), M, -(x1 - x0) / 2, (x1 - x0) / 2);
  wainscot(W(B, 'w', x0, (z0 + z1) / 2), M, -(z1 - z0) / 2, (z1 - z0) / 2);
  wainscot(W(B, 'e', x1, (Z(984) + z1) / 2), M, -(z1 - Z(984)) / 2 + 0.1, (z1 - Z(984)) / 2);
  const fto = W(B, 's', z1 + 0.017, (X(782) + X(827)) / 2);
  F.toilet(fto, M);
  col(fto, 0.45, 0.7);
  const vx = (X(842) + x1) / 2, vw = x1 - X(842);
  const fv = W(B, 's', z1 + 0.017, vx);
  F.vanity(fv, M, { w: vw - 0.02, d: 0.5, h: 0.84, cab: M.oakWarm, top: M.quartz, sinks: [0], layout: 'doors', sinkW: 0.38, sinkD: 0.3, pullMat: M.black });
  col(fv, vw, 0.5);
  F.mirror(fv.at(0, 1.5, -0.017), M, { w: 0.56, shape: 'round', frame: M.black, t: 0.025 });
  F.sconce(fv.at(0, 1.98, -0.017), M, { shade: M.shade });
  F.towelRing(W(B, 'e', x1, Z(1010)).at(0, 1.32, 0.02), M);
  F.tpHolder(W(B, 'w', x0, z1 - 0.55).at(0, 0.66, 0.02), M);
  F.art(W(B, 'n', z0, (x0 + x1) / 2 - 0.15).at(0, 1.62, 0), M, { w: 0.42, h: 0.56, art: M.art[2], frame: M.oakWarm, fw: 0.018 });
  slots.push({ room: 'pdr', p: wp(fv, 0, 1.9, 0.3), i: 0.9, d: 2.6, pri: 2 });
  slots.push({ room: 'pdr', p: [(x0 + x1) / 2, clg - 0.3, (z0 + z1) / 2 - 0.2], i: 0.8, d: 2.4, pri: 1 });
}

// ================================================================ garage
export function buildGarage(ctx, M, B, slots, H, walk) {
  const { X, Z, W, wp, col } = H;
  const fy = -0.2, clg = fy + ctx.plan.ft(8);
  const rects = [[392, 1065, 664, 1784], [664, 1166, 1080, 1784], [760, 1784, 1080, 1840], [831, 1840, 1009, 1888]].map(([a, b, c, d]) => ({ x0: X(a), z0: Z(b), x1: X(c), z1: Z(d) }));
  // floor (world UVs like the shell so the slab reads continuous) and ceiling
  const pos = [], uv = [], cpos = [];
  for (const r of rects) {
    const q = [[r.x0, r.z1], [r.x1, r.z1], [r.x1, r.z0], [r.x0, r.z0]];
    for (const i of [0, 1, 2, 0, 2, 3]) { pos.push(q[i][0], fy, q[i][1]); uv.push(q[i][0], -q[i][1]); }
    for (const i of [0, 2, 1, 0, 3, 2]) cpos.push(q[i][0], clg, q[i][1]);
  }
  const fg = new THREE.BufferGeometry();
  fg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  fg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  fg.computeVertexNormals();
  const floor = new THREE.Mesh(fg, M.concrete);
  floor.receiveShadow = true; floor.name = 'rest:garage.floor';
  walk.push(floor);
  const cg = new THREE.BufferGeometry();
  cg.setAttribute('position', new THREE.Float32BufferAttribute(cpos, 3));
  cg.computeVertexNormals();
  B.add(cg, M.ceilingPaint, new THREE.Matrix4(), false);
  for (const r of rects) new Frame(B).box(M.wall, r.x1 - r.x0, 0.03, r.z1 - r.z0, (r.x0 + r.x1) / 2, clg + 0.003, (r.z0 + r.z1) / 2, { cast: true });
  // saw-cut control joints
  const joint = M.joint;
  new Frame(B).box(joint, 0.006, 0.0015, Z(1784) - Z(1166), -8.25, fy, (Z(1166) + Z(1784)) / 2, { cast: false });
  new Frame(B).box(joint, X(1080) - X(392), 0.0015, 0.006, (X(392) + X(1080)) / 2, fy, 4.6, { cast: false });
  // thresholds rebuilt (the shell's used the removed floor material)
  const thr = [];
  {
    const o = ctx.opening('door_garage');
    new Frame(B).box(M.concrete, o.M.w + 0.02, 0.05, o.M.d, o.M.cx, fy - 0.05, o.M.cz, { cast: false });
    const m = ctx.opening('door_garage_mud');
    const t = new THREE.Mesh(boxGeo(m.M.w, 0.03, m.M.d), M.oakWarm); t.position.set(m.M.cx, -0.015, m.M.cz); t.receiveShadow = true; thr.push(t);
    // concrete step up to the mud room door
    const st = new THREE.Mesh(boxGeo(m.M.w + 0.25, 0.1, 0.34), M.concrete); st.position.set(m.M.cx, fy + 0.05, m.M.z1 + 0.17); st.receiveShadow = true; st.castShadow = true; thr.push(st);
    walk.push(t, st);
  }
  // storage alcove: shelving units along the north wall
  for (const [x, seed] of [[-11.3, 3], [-9.95, 4]]) {
    const fsu = W(B, 'n', Z(1065), x, fy);
    F.shelvingUnit(fsu, M, { w: 1.22, d: 0.6, h: 1.83, n: 5, seed });
    col(fsu, 1.22, 0.6);
  }
  // workbench + pegboard on the east wall near the front
  const fw = W(B, 'e', X(1080), 7.3, fy);
  fw.box(M.steel, 1.8, 0.86, 0.6, 0, 0, 0.3);
  fw.box(M.oakWarm, 1.84, 0.05, 0.64, 0, 0.86, 0.32);
  fw.box(M.galv, 1.7, 0.02, 0.5, 0, 0.18, 0.3, { cast: false });
  for (let i = 0; i < 3; i++) F.shakerPanel(fw.at(-0.6 + i * 0.6, 0.3, 0.6), M.steel, 0.56, 0.5, 0.012, 0.03);
  fw.box(M.pegboard, 1.8, 0.9, 0.012, 0, 1.1, 0.006, { cast: false });
  for (let i = 0; i < 7; i++) fw.box(i % 2 ? M.black : M.steel, 0.04 + (i % 3) * 0.03, 0.18 + (i % 4) * 0.05, 0.03, -0.7 + i * 0.22, 1.45, 0.03, { cast: false });
  F.basketBox(fw.at(0.55, 0.91, 0.3), M, 0.4, 0.22, 0.3, M.binGrey);
  fw.box(M.cardboard, 0.3, 0.2, 0.25, -0.5, 0.91, 0.3);
  col(fw, 1.84, 0.64);
  // trash + recycling carts by the mud room door
  for (const [z, m] of [[2.25, M.binGrey], [2.95, M.binLid]]) {
    const fc = W(B, 'e', X(1080), z, fy);
    fc.box(m, 0.6, 1.0, 0.72, 0, 0.0, 0.38);
    fc.box(m, 0.64, 0.05, 0.76, 0, 1.0, 0.38);
    for (const s of [-1, 1]) fc.add(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 14), M.rubber, s * 0.27, 0.1, 0.1, 0, 0, Math.PI / 2, false);
    col(fc, 0.64, 0.76);
  }
  // bike leaning against the north wall of the main bay
  {
    const fbk = W(B, 'n', Z(1166), -8.1, fy);
    const tor = new THREE.TorusGeometry(0.33, 0.018, 8, 36);
    for (const s of [-1, 1]) {
      fbk.add(tor, M.rubber, s * 0.52, 0.35, 0.25, 0, 0, 0, false);
      fbk.add(new THREE.CylinderGeometry(0.015, 0.015, 0.06, 8), M.galv, s * 0.52, 0.35, 0.25, 0, Math.PI / 2, 0, false);
    }
    const tube = (a, b, r = 0.016) => {
      const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b), len = va.distanceTo(vb);
      const g = new THREE.CylinderGeometry(r, r, len, 8);
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize());
      B.add(g, M.paintSage, fbk.m.clone().multiply(new THREE.Matrix4().compose(va.clone().add(vb).multiplyScalar(0.5), q, new THREE.Vector3(1, 1, 1))), false);
    };
    const rr = [-0.52, 0.35, 0.25], fr = [0.52, 0.35, 0.25], bb = [-0.05, 0.33, 0.25], st = [-0.18, 0.88, 0.25], hd = [0.38, 0.92, 0.25];
    tube(rr, bb); tube(bb, st); tube(st, rr); tube(st, hd); tube(hd, bb, 0.019); tube(hd, fr);
    fbk.box(M.rubber, 0.24, 0.05, 0.1, -0.2, 0.92, 0.25, { cast: false });
    fbk.rodZ(M.black, 0.012, 0.5, 0.36, 1.0, 0.25);
  }
  // garage door hardware: vertical + horizontal tracks, opener with rail, strut on each section
  {
    const o = ctx.opening('door_garage');
    const xi = X(392), zA = o.M.z0, zB = o.M.z1, top = clg - 0.06;
    for (const z of [zA - 0.03, zB + 0.03]) {
      new Frame(B).box(M.galv, 0.05, top - fy - 0.1, 0.05, xi + 0.03, fy, z, { cast: false });
      new Frame(B).box(M.galv, 3.0, 0.05, 0.05, xi + 1.55, top - 0.05, z, { cast: false });
    }
    new Frame(B).box(M.galv, 3.2, 0.035, 0.035, xi + 1.65, top - 0.035, (zA + zB) / 2, { cast: false });
    new Frame(B).box(M.appliance, 0.42, 0.18, 0.34, xi + 3.4, top - 0.2, (zA + zB) / 2);
    new Frame(B).box(M.glowSoft, 0.2, 0.01, 0.12, xi + 3.4, top - 0.21, (zA + zB) / 2, { cast: false });
    new Frame(B).box(M.galv, 0.03, 0.08, 0.6, xi + 3.4, top - 0.04, (zA + zB) / 2, { cast: false });
    const sec = (clg - fy) / 4;
    for (let i = 0; i < 4; i++) new Frame(B).box(M.galv, 0.03, 0.06, zB - zA - 0.1, xi - 0.01, fy + sec * (i + 1) - 0.1, (zA + zB) / 2, { cast: false });
  }
  // LED shop lights
  for (const [x, z] of [[-10.2, 3.2], [-6.9, 3.2], [-10.2, 6.6], [-6.9, 6.6]]) {
    new Frame(B).box(M.appliance, 1.22, 0.04, 0.12, x, clg - 0.045, z, { cast: false });
    new Frame(B).box(M.ledStrip, 1.18, 0.006, 0.08, x, clg - 0.05, z, { cast: false });
  }
  slots.push({ room: 'garage', p: [-9.6, clg - 0.35, 3.6], i: 4.5, d: 7.5, c: 0xf3f1ff, pri: 2 });
  slots.push({ room: 'garage', p: [-6.9, clg - 0.35, 6.6], i: 4.5, d: 7.5, c: 0xf3f1ff, pri: 1 });
  return thr;
}
