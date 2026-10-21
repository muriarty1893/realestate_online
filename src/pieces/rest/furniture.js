// Furniture and fixture builders. Every builder takes a Frame (local origin, +z = front/into room,
// +x = right when facing the item's back wall, y = up from the floor) and the material set M.
// Dimensions are real-world metres.
import * as THREE from 'three';
import { softBox, pillowGeo, curtainGeo, latheGeo, boxGeo, rng, openBasin } from './kit.js';

const PI = Math.PI;

// ---------------------------------------------------------------- small parts
export function shakerPanel(f, mat, w, h, t = 0.02, rail = 0.065, o = {}) {
  // front face at local z = t; panel recessed
  const r = Math.min(rail, w / 4, h / 4);
  f.box(mat, w, r, t, 0, 0, t / 2, { cast: false });
  f.box(mat, w, r, t, 0, h - r, t / 2, { cast: false });
  f.box(mat, r, h - 2 * r, t, -w / 2 + r / 2, r, t / 2, { cast: false });
  f.box(mat, r, h - 2 * r, t, w / 2 - r / 2, r, t / 2, { cast: false });
  f.box(mat, w - 2 * r + 0.002, h - 2 * r + 0.002, t * 0.5, 0, r - 0.001, t * 0.25, { cast: false });
  if (o.pull) pull(f, o.pullMat, o.pull, o.pullX ?? 0, o.pullY ?? h / 2, t);
}
export function pull(f, mat, kind, x, y, z) {
  if (kind === 'bar') { // horizontal bar pull 128 mm
    f.rodX(mat, 0.0055, 0.14, x, y, z + 0.032, { seg: 8 });
    f.boxC(mat, 0.012, 0.012, 0.03, x - 0.064, y, z + 0.016, { cast: false });
    f.boxC(mat, 0.012, 0.012, 0.03, x + 0.064, y, z + 0.016, { cast: false });
  } else if (kind === 'vbar') {
    f.add(new THREE.CylinderGeometry(0.0055, 0.0055, 0.14, 8), mat, x, y, z + 0.032, 0, 0, 0, false);
    f.boxC(mat, 0.012, 0.012, 0.03, x, y - 0.064, z + 0.016, { cast: false });
    f.boxC(mat, 0.012, 0.012, 0.03, x, y + 0.064, z + 0.016, { cast: false });
  } else if (kind === 'cup') {
    f.add(new THREE.CylinderGeometry(0.035, 0.035, 0.03, 12, 1, true, 0, PI), mat, x, y, z + 0.012, 0, PI / 2, 0, false);
  } else { // knob
    f.add(new THREE.SphereGeometry(0.014, 10, 8), mat, x, y, z + 0.022, 0, 0, 0, false);
    f.add(new THREE.CylinderGeometry(0.005, 0.007, 0.02, 8), mat, x, y, z + 0.01, 0, PI / 2, 0, false);
  }
}

// ---------------------------------------------------------------- bed
export function bed(f, M, o = {}) {
  const W = o.W ?? 1.52, L = o.L ?? 2.03, s = o.seed ?? 1;
  const head = o.head ?? M.upholstery, frame = o.frame ?? head;
  const hb = o.headH ?? 1.25;
  if (o.style === 'wood') {
    // oak panel headboard with posts
    f.box(M.oak, W + 0.12, hb - 0.1, 0.05, 0, 0.1, 0.03);
    f.box(M.oak, 0.07, hb + 0.05, 0.07, -(W + 0.12) / 2, 0, 0.035);
    f.box(M.oak, 0.07, hb + 0.05, 0.07, (W + 0.12) / 2, 0, 0.035);
    f.box(M.oak, W + 0.26, 0.04, 0.09, 0, hb + 0.03, 0.035);
    f.box(M.oak, W + 0.08, 0.2, L + 0.04, 0, 0.12, 0.07 + (L + 0.04) / 2);
    for (const sx of [-1, 1]) f.box(M.oak, 0.06, 0.14, 0.06, sx * (W / 2), 0, L + 0.06);
  } else {
    f.add(softBox(o.headW ?? W + 0.16, hb - 0.05, 0.1, 0.035, { n: 6, noise: 0.002, seed: s }), head, 0, 0.05 + (hb - 0.05) / 2, 0.05);
    f.add(softBox(W + 0.1, 0.3, L + 0.06, 0.03, { n: 6 }), frame, 0, 0.06 + 0.15, 0.1 + (L + 0.06) / 2);
    for (const [sx, sz] of [[-1, 0.15], [1, 0.15], [-1, L + 0.1], [1, L + 0.1]]) f.box(M.oakDark, 0.05, 0.06, 0.05, sx * (W / 2 - 0.02), 0, sz, { cast: false });
  }
  const mTop = 0.6; // mattress top
  f.add(softBox(W, 0.25, L, 0.05, { n: 6 }), M.linenWhite, 0, mTop - 0.125, 0.11 + L / 2);
  // duvet draped over the mattress
  const dz0 = 0.62, dz1 = L + 0.16;
  f.add(softBox(W + 0.2, 0.34, dz1 - dz0, 0.07, { n: 14, ny: 2, noise: 0.009, seed: s + 1, sag: 0.012 }), o.duvet ?? M.linenWhite, 0, mTop + 0.05 - 0.17, dz0 + (dz1 - dz0) / 2);
  // turned-down sheet / duvet fold
  f.add(softBox(W + 0.21, 0.09, 0.3, 0.04, { n: 8, noise: 0.006, seed: s + 2 }), o.sheet ?? M.linenWhite, 0, mTop + 0.04, dz0 + 0.06);
  // throw across the foot
  if (o.throw !== false) f.add(softBox(W + 0.3, 0.4, 0.55, 0.05, { n: 10, ny: 2, noise: 0.012, seed: s + 3 }), o.throw ?? M.knitOat, 0, mTop + 0.075 - 0.2, L - 0.22);
  // pillows: euro shams upright against the headboard, sleeping pillows, lumbar
  const nE = W > 1.45 ? 2 : 2;
  const eW = Math.min(0.66, (W - 0.04) / nE);
  for (let i = 0; i < nE; i++) {
    const x = -W / 2 + eW / 2 + 0.02 + i * eW;
    f.add(pillowGeo(eW - 0.02, 0.62, 0.2, s * 7 + i), o.euro ?? M.linenOat, x, mTop + 0.3, 0.24, 0, -0.18);
  }
  const nS = 2, sW = Math.min(0.68, (W - 0.06) / nS);
  for (let i = 0; i < nS; i++) {
    const x = -W / 2 + sW / 2 + 0.03 + i * sW;
    f.add(pillowGeo(sW - 0.02, 0.48, 0.17, s * 11 + i), o.pillow ?? M.linenWhite, x, mTop + 0.24, 0.42, 0, -0.62);
  }
  f.add(pillowGeo(0.55, 0.32, 0.13, s * 13), o.lumbar ?? M.linenTaupe, 0, mTop + 0.2, 0.56, 0, -0.55);
}

// ---------------------------------------------------------------- casegoods
export function nightstand(f, M, o = {}) {
  const w = o.w ?? 0.55, d = o.d ?? 0.42, h = o.h ?? 0.62, mat = o.mat ?? M.oak, pm = o.pullMat ?? M.black;
  if (o.style === 'float') {
    // floating oak box with drawer and open shelf (as in the master photo)
    const y0 = h - 0.36;
    f.box(mat, w, 0.03, d, 0, h - 0.03, d / 2);
    f.box(mat, w, 0.03, d, 0, y0, d / 2);
    f.box(mat, 0.025, 0.33, d, -w / 2 + 0.0125, y0 + 0.03, d / 2);
    f.box(mat, 0.025, 0.33, d, w / 2 - 0.0125, y0 + 0.03, d / 2);
    f.box(mat, w - 0.05, 0.13, 0.02, 0, h - 0.17, d - 0.01);
    f.box(mat, w - 0.05, 0.3, 0.01, 0, y0 + 0.03, 0.005);
    pull(f, pm, 'bar', 0, h - 0.105, d);
    return h;
  }
  // case on tapered legs: drawer + open shelf
  const leg = 0.16;
  for (const [sx, sz] of [[-1, 0.03], [1, 0.03], [-1, d - 0.03], [1, d - 0.03]]) f.add(new THREE.CylinderGeometry(0.018, 0.012, leg, 8), mat, sx * (w / 2 - 0.03), leg / 2, sz, 0, 0, 0, false);
  const y0 = leg, ch = h - leg;
  f.box(mat, w, 0.025, d, 0, h - 0.025, d / 2);
  f.box(mat, w, 0.02, d, 0, y0, d / 2);
  f.box(mat, 0.02, ch - 0.045, d, -w / 2 + 0.01, y0 + 0.02, d / 2);
  f.box(mat, 0.02, ch - 0.045, d, w / 2 - 0.01, y0 + 0.02, d / 2);
  f.box(mat, w - 0.04, ch - 0.045, 0.01, 0, y0 + 0.02, 0.005);
  f.box(mat, w - 0.04, 0.018, d - 0.02, 0, y0 + ch * 0.42, d / 2);
  const dh = ch - 0.045 - ch * 0.42 - 0.01;
  shakerPanel(f.at(0, y0 + ch * 0.42 + 0.02, d - 0.02), o.front ?? mat, w - 0.05, dh, 0.02, 0.04);
  pull(f, pm, o.pull ?? 'knob', 0, y0 + ch * 0.42 + 0.02 + dh / 2, d);
  // a couple of books on the open shelf
  books(f.at(-0.05, y0 + 0.02, d / 2), M, { n: 3, flat: true, seed: o.seed });
  return h;
}

export function dresser(f, M, o = {}) {
  const w = o.w ?? 1.5, d = o.d ?? 0.5, h = o.h ?? 0.82, mat = o.mat ?? M.oak, front = o.front ?? mat;
  const cols = o.cols ?? 2, rows = o.rows ?? 3, pm = o.pullMat ?? M.black;
  const plinth = o.legs ? 0.14 : 0.07;
  if (o.legs) for (const [sx, sz] of [[-1, 0.04], [1, 0.04], [-1, d - 0.04], [1, d - 0.04]]) f.add(new THREE.CylinderGeometry(0.02, 0.014, plinth, 8), mat, sx * (w / 2 - 0.04), plinth / 2, sz, 0, 0, 0, false);
  else f.box(mat, w - 0.04, plinth, d - 0.04, 0, 0, d / 2 - 0.02);
  f.box(mat, w, 0.03, d, 0, h - 0.03, d / 2);
  f.box(mat, 0.022, h - plinth - 0.03, d - 0.01, -w / 2 + 0.011, plinth, d / 2);
  f.box(mat, 0.022, h - plinth - 0.03, d - 0.01, w / 2 - 0.011, plinth, d / 2);
  f.box(mat, w - 0.04, h - plinth - 0.03, d - 0.03, 0, plinth, d / 2 - 0.01, { cast: true });
  const ih = h - plinth - 0.03, iw = w - 0.044;
  const dw = iw / cols, dh = ih / rows;
  for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
    const x = -iw / 2 + dw * (c + 0.5), y = plinth + r * dh + 0.003;
    shakerPanel(f.at(x, y, d - 0.022), front, dw - 0.006, dh - 0.006, 0.02, 0.045);
    if (o.pull === 'cup') pull(f, pm, 'cup', x, y + dh * 0.62, d);
    else pull(f, pm, 'bar', x, y + dh / 2, d);
  }
  return h;
}

// ---------------------------------------------------------------- decor
export function books(f, M, o = {}) {
  const r = rng(o.seed ?? 3);
  const n = o.n ?? 4;
  let y = 0, x = 0;
  for (let i = 0; i < n; i++) {
    const mat = M.books[Math.floor(r() * M.books.length)];
    if (o.flat) {
      const bw = 0.17 + r() * 0.08, bt = 0.02 + r() * 0.025, bd = 0.22 + r() * 0.05;
      f.box(mat, bw, bt, bd, (r() - 0.5) * 0.02, y, 0, { ry: (r() - 0.5) * 0.2, cast: false });
      y += bt;
    } else {
      const bt = 0.02 + r() * 0.03, bh = 0.18 + r() * 0.09, bd = 0.15 + r() * 0.06;
      f.box(mat, bt, bh, bd, x + bt / 2, 0, 0, { cast: false });
      x += bt + 0.002;
    }
  }
  return o.flat ? y : x;
}

export function vase(f, M, o = {}) {
  const h = o.h ?? 0.28, r = o.r ?? 0.08;
  const pts = [[0, 0], [r * 0.55, 0], [r * 0.85, h * 0.12], [r, h * 0.38], [r * 0.85, h * 0.66], [r * 0.42, h * 0.86], [r * 0.4, h], [r * 0.36, h], [r * 0.34, h * 0.9]];
  f.add(latheGeo(pts, 20), o.mat ?? M.ceramic, 0, 0, 0, 0, 0, 0, false);
  if (o.stems !== false) stems(f.at(0, h * 0.9, 0), M, { n: o.n ?? 5, len: o.len ?? 0.45, seed: o.seed ?? 5, leaf: o.leaf });
}
export function stems(f, M, o = {}) {
  const r = rng(o.seed ?? 5);
  const leaf = new THREE.PlaneGeometry(0.035, 0.06);
  leaf.translate(0, 0.03, 0);
  for (let i = 0; i < o.n; i++) {
    const a = r() * PI * 2, tilt = 0.15 + r() * 0.35, len = o.len * (0.7 + r() * 0.5);
    const st = f.at(0, 0, 0, a, tilt, 0);
    st.add(new THREE.CylinderGeometry(0.0025, 0.003, len, 4), M.stem, 0, len / 2, 0, 0, 0, 0, false);
    const nl = 7;
    for (let k = 0; k < nl; k++) {
      const t = 0.25 + (k / nl) * 0.75;
      st.add(leaf, k % 3 ? M.plant : M.plantDark, 0, len * t, 0, r() * PI * 2, 0.6 + r() * 0.5, 0, false);
    }
  }
}

export function tray(f, M, w = 0.3, d = 0.2, mat) {
  const m = mat ?? M.oakWarm;
  f.box(m, w, 0.008, d, 0, 0, 0, { cast: false });
  f.box(m, w, 0.025, 0.008, 0, 0, -d / 2, { cast: false });
  f.box(m, w, 0.025, 0.008, 0, 0, d / 2, { cast: false });
  f.box(m, 0.008, 0.025, d, -w / 2, 0, 0, { cast: false });
  f.box(m, 0.008, 0.025, d, w / 2, 0, 0, { cast: false });
}

export function rug(f, mat, w, d, o = {}) {
  f.box(mat, w, 0.012, d, 0, 0.001, 0, { cast: false, grain: 'b' });
  if (o.border) {
    const b = 0.05;
    f.box(o.border, w, 0.0135, b, 0, 0.001, -d / 2 + b / 2, { cast: false });
    f.box(o.border, w, 0.0135, b, 0, 0.001, d / 2 - b / 2, { cast: false });
    f.box(o.border, b, 0.0135, d, -w / 2 + b / 2, 0.001, 0, { cast: false });
    f.box(o.border, b, 0.0135, d, w / 2 - b / 2, 0.001, 0, { cast: false });
  }
}

// framed art: origin at wall surface at the art centre
export function art(f, M, o = {}) {
  const w = o.w ?? 0.8, h = o.h ?? 0.6, fr = o.frame ?? M.oakWarm, fw = o.fw ?? 0.025, fd = o.fd ?? 0.035;
  const matW = o.mat === false ? 0 : (o.matW ?? 0.06);
  f.boxC(fr, w, fw, fd, 0, h / 2 - fw / 2, fd / 2, { cast: false });
  f.boxC(fr, w, fw, fd, 0, -h / 2 + fw / 2, fd / 2, { cast: false });
  f.boxC(fr, fw, h - 2 * fw, fd, -w / 2 + fw / 2, 0, fd / 2, { cast: false });
  f.boxC(fr, fw, h - 2 * fw, fd, w / 2 - fw / 2, 0, fd / 2, { cast: false });
  f.boxC(M.paper, w - 2 * fw, h - 2 * fw, 0.01, 0, 0, 0.012, { cast: false });
  const g = new THREE.PlaneGeometry(w - 2 * fw - 2 * matW, h - 2 * fw - 2 * matW);
  f.add(g, o.art ?? M.art[0], 0, 0, 0.0175, 0, 0, 0, false);
}

export function mirror(f, M, o = {}) {
  const w = o.w ?? 0.6, h = o.h ?? 0.8, fr = o.frame ?? M.black, t = o.t ?? 0.025;
  if (o.shape === 'round') {
    const r = w / 2;
    f.add(new THREE.TorusGeometry(r - t / 2, t / 2, 8, 40), fr, 0, 0, t / 2, 0, 0, 0, false);
    f.add(new THREE.CircleGeometry(r - t * 0.6, 40), M.mirror, 0, 0, 0.012, 0, 0, 0, false);
    return;
  }
  if (o.shape === 'arch') {
    const s = new THREE.Shape();
    const r = w / 2, hs = h - r;
    s.moveTo(-r, -h / 2); s.lineTo(r, -h / 2); s.lineTo(r, -h / 2 + hs); s.absarc(0, -h / 2 + hs, r, 0, PI, false); s.lineTo(-r, -h / 2);
    const hole = new THREE.Path();
    const ri = r - t;
    hole.moveTo(-ri, -h / 2 + t); hole.lineTo(-ri, -h / 2 + hs); hole.absarc(0, -h / 2 + hs, ri, PI, 0, true); hole.lineTo(ri, -h / 2 + t); hole.lineTo(-ri, -h / 2 + t);
    s.holes.push(hole);
    const fg = new THREE.ExtrudeGeometry(s, { depth: 0.025, bevelEnabled: false, curveSegments: 20 });
    f.add(fg, fr, 0, 0, 0, 0, 0, 0, false);
    const ms = new THREE.Shape();
    ms.moveTo(-ri, -h / 2 + t); ms.lineTo(ri, -h / 2 + t); ms.lineTo(ri, -h / 2 + hs); ms.absarc(0, -h / 2 + hs, ri, 0, PI, false); ms.lineTo(-ri, -h / 2 + t);
    f.add(new THREE.ShapeGeometry(ms, 20), M.mirror, 0, 0, 0.012, 0, 0, 0, false);
    return;
  }
  f.boxC(fr, w, t, 0.025, 0, h / 2 - t / 2, 0.0125, { cast: false });
  f.boxC(fr, w, t, 0.025, 0, -h / 2 + t / 2, 0.0125, { cast: false });
  f.boxC(fr, t, h - 2 * t, 0.025, -w / 2 + t / 2, 0, 0.0125, { cast: false });
  f.boxC(fr, t, h - 2 * t, 0.025, w / 2 - t / 2, 0, 0.0125, { cast: false });
  f.add(new THREE.PlaneGeometry(w - 2 * t, h - 2 * t), M.mirror, 0, 0, 0.01, 0, 0, 0, false);
}

// window treatment: rod + two pleated linen panels. origin = wall surface, centred on the window, floor.
export function curtains(f, M, o = {}) {
  const W = o.W ?? 1.2, top = o.top ?? 2.4, ext = o.ext ?? 0.22, pw = o.pw ?? 0.42, mat = o.mat ?? M.curtain;
  const rodL = W + 2 * ext + 0.1, z = 0.09;
  f.rodX(M.black, 0.011, rodL, 0, top, z);
  for (const sx of [-1, 1]) {
    f.add(new THREE.SphereGeometry(0.022, 10, 8), M.black, sx * rodL / 2, top, z, 0, 0, 0, false);
    f.box(M.black, 0.015, 0.02, z, sx * (rodL / 2 - 0.08), top - 0.015, z / 2, { cast: false });
  }
  const h = top - 0.03 - (o.floor ?? 0.005);
  for (const sx of [-1, 1]) {
    const x = sx * (W / 2 + ext - pw / 2 + 0.06);
    f.add(curtainGeo(pw, h, 5, 0.03, (o.seed ?? 1) + sx), mat, x, top - 0.03, z, 0, 0, 0, true);
    // rings
    for (let k = 0; k < 7; k++) f.add(new THREE.TorusGeometry(0.016, 0.003, 4, 10), M.black, x - pw / 2 + (k + 0.5) * pw / 7, top, z, 0, 0, 0, false);
  }
}

// roman shade for bath windows: origin wall surface centred on the window, at the window head
export function romanShade(f, M, o = {}) {
  const W = o.W ?? 0.6, drop = o.drop ?? 0.35;
  for (let k = 0; k < 4; k++) f.add(softBox(W + 0.04, drop / 4 + 0.015, 0.035, 0.012, { n: 4 }), o.mat ?? M.linenCream, 0, -k * drop / 4 - drop / 8, 0.03 + k * 0.004, 0, 0, 0, false);
}

// ---------------------------------------------------------------- lighting fixtures (geometry only)
export function tableLamp(f, M, o = {}) {
  const h = o.h ?? 0.6, base = o.base ?? M.ceramic;
  const bh = h * 0.48;
  f.add(latheGeo([[0, 0], [0.06, 0], [0.085, bh * 0.15], [0.1, bh * 0.45], [0.09, bh * 0.75], [0.05, bh * 0.95], [0.025, bh], [0, bh]], 22), base, 0, 0, 0, 0, 0, 0, false);
  f.cyl(o.neck ?? M.brass, 0.007, h * 0.3, 0, bh, 0);
  f.add(new THREE.SphereGeometry(0.03, 10, 8), M.glow, 0, bh + h * 0.28, 0, 0, 0, 0, false);
  const sh = h * 0.36, rt = o.rt ?? 0.11, rb = o.rb ?? 0.19;
  f.add(new THREE.CylinderGeometry(rt, rb, sh, 28, 1, true), M.shade, 0, h - sh / 2, 0, 0, 0, 0, false);
  return [0, bh + h * 0.28, 0];
}
export function ceilingFan(f, M, o = {}) {
  const drop = o.drop ?? 0.3;
  f.cyl(M.bronze, 0.07, 0.04, 0, -0.04, 0, { seg: 20 });
  f.cyl(M.bronze, 0.012, drop, 0, -drop, 0);
  f.cyl(M.bronze, 0.13, 0.12, 0, -drop - 0.1, 0, { seg: 24, r2: 0.11 });
  f.cyl(M.bronze, 0.1, 0.04, 0, -drop - 0.14, 0, { seg: 24, r2: 0.13 });
  f.add(new THREE.SphereGeometry(0.1, 20, 8, 0, PI * 2, PI / 2, PI / 2), M.glowSoft, 0, -drop - 0.14, 0, 0, 0, 0, false);
  const blade = new THREE.BoxGeometry(0.56, 0.008, 0.14);
  blade.translate(0.43, 0, 0);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * PI * 2 + (o.phase ?? 0.3);
    f.add(blade, o.bladeMat ?? M.oakDark, 0, -drop - 0.07, 0, a, 0, 0.08, false);
    const arm = new THREE.BoxGeometry(0.16, 0.012, 0.04); arm.translate(0.17, 0, 0);
    f.add(arm, M.bronze, 0, -drop - 0.065, 0, a, 0, 0, false);
  }
  return [0, -drop - 0.2, 0];
}
export function flushMount(f, M, o = {}) {
  const r = o.r ?? 0.18;
  f.cyl(o.mat ?? M.black, r + 0.01, 0.02, 0, -0.02, 0, { seg: 28 });
  f.cyl(M.glowSoft, r, 0.08, 0, -0.1, 0, { seg: 28 });
  f.cyl(o.mat ?? M.black, r + 0.008, 0.008, 0, -0.104, 0, { seg: 28 });
  return [0, -0.25, 0];
}
export function pendantDome(f, M, o = {}) {
  const drop = o.drop ?? 0.5, r = o.r ?? 0.16;
  f.cyl(M.black, 0.05, 0.02, 0, -0.02, 0);
  f.cyl(M.black, 0.003, drop, 0, -drop, 0, { seg: 4 });
  const pts = [[0.02, 0], [0.03, -0.02], [r * 0.5, -r * 0.35], [r * 0.85, -r * 0.6], [r, -r * 0.75]];
  f.add(latheGeo(pts.map(([x, y]) => [x, y]), 28), o.mat ?? M.black, 0, -drop, 0, 0, 0, 0, false);
  f.add(new THREE.SphereGeometry(0.04, 10, 8), M.glow, 0, -drop - r * 0.4, 0, 0, 0, 0, false);
  return [0, -drop - r * 0.6, 0];
}
export function recessed(f, M) {
  f.add(new THREE.RingGeometry(0.055, 0.075, 24), M.trimWhite, 0, -0.002, 0, 0, PI / 2, 0, false);
  f.add(new THREE.CircleGeometry(0.056, 24), M.glow, 0, -0.004, 0, 0, PI / 2, 0, false);
}
// wall sconce: origin on the wall at the fixture centre height
export function sconce(f, M, o = {}) {
  f.cyl(o.metal ?? M.black, 0.04, 0.012, 0, 0, 0.006, { rx: PI / 2, seg: 16 });
  f.rodZ(o.metal ?? M.black, 0.006, 0.12, 0, 0, 0.07);
  f.add(new THREE.CylinderGeometry(0.055, 0.07, 0.15, 20, 1, true), o.shade ?? M.shade, 0, 0.02, 0.15, 0, 0, 0, false);
  f.add(new THREE.SphereGeometry(0.025, 8, 6), M.glow, 0, 0.0, 0.15, 0, 0, 0, false);
  return [0, 0, 0.15];
}
// vanity bar light
export function vanityLight(f, M, o = {}) {
  const n = o.n ?? 2, w = o.w ?? 0.6;
  f.boxC(o.metal ?? M.black, w, 0.03, 0.02, 0, 0, 0.01, { cast: false });
  for (let i = 0; i < n; i++) {
    const x = n === 1 ? 0 : -w / 2 + 0.06 + (i * (w - 0.12)) / (n - 1);
    f.rodZ(o.metal ?? M.black, 0.005, 0.1, x, 0, 0.05);
    f.add(latheGeo([[0.015, 0], [0.05, -0.02], [0.065, -0.11], [0.06, -0.12]], 18), M.glowSoft, x, 0.1, 0.1, 0, 0, 0, false);
  }
}

// ---------------------------------------------------------------- seating / desks
export function chair(f, M, o = {}) {
  const mat = o.mat ?? M.oak, sh = 0.46;
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) f.add(new THREE.CylinderGeometry(0.017, 0.014, sh, 8), mat, sx * 0.2, sh / 2, sz * 0.19, 0, 0, 0, false);
  f.add(softBox(0.46, 0.05, 0.44, 0.012, { n: 3 }), o.seat ?? mat, 0, sh + 0.02, 0);
  // spindle back (back at -z)
  for (const sx of [-1, 1]) f.add(new THREE.CylinderGeometry(0.016, 0.016, 0.42, 8), mat, sx * 0.2, sh + 0.25, -0.2, 0, -0.08, 0, false);
  f.boxC(mat, 0.44, 0.08, 0.025, 0, sh + 0.42, -0.215, { rx: -0.08, cast: false });
  for (let i = -2; i <= 2; i++) f.add(new THREE.CylinderGeometry(0.007, 0.007, 0.3, 6), mat, i * 0.07, sh + 0.2, -0.205, 0, -0.08, 0, false);
}

// built-in desk niche: origin centre of the back wall, floor. w spans wall to wall.
export function builtinDesk(f, M, o = {}) {
  const w = o.w ?? 1.24, d = o.d ?? 0.58, top = 0.76, mat = o.mat ?? M.paint, topMat = o.top ?? M.oakWarm;
  f.box(topMat, w, 0.035, d, 0, top - 0.035, d / 2);
  // drawer box hanging under the top on the right, pedestal on the left
  f.box(mat, 0.42, 0.55, d - 0.02, -w / 2 + 0.21, 0.0, d / 2);
  shakerPanel(f.at(-w / 2 + 0.21, 0.08, d - 0.02), mat, 0.4, 0.3, 0.02, 0.05);
  shakerPanel(f.at(-w / 2 + 0.21, 0.4, d - 0.02), mat, 0.4, 0.15, 0.02, 0.04);
  pull(f, M.black, 'bar', -w / 2 + 0.21, 0.475, d);
  pull(f, M.black, 'bar', -w / 2 + 0.21, 0.32, d);
  f.box(mat, 0.42, 0.06, d - 0.02, -w / 2 + 0.21, 0.0, d / 2);
  f.box(mat, w - 0.44, 0.1, 0.02, 0.22, top - 0.135, d - 0.02);
  // floating shelves
  for (const y of [1.25, 1.62]) f.box(topMat, w, 0.035, 0.26, 0, y, 0.13);
  books(f.at(-w / 2 + 0.1, 1.285, 0.12), M, { n: 7, seed: 9 });
  vase(f.at(w / 2 - 0.2, 1.285, 0.13), M, { h: 0.16, r: 0.055, n: 3, len: 0.2, seed: 12 });
  books(f.at(0.1, 1.655, 0.12), M, { n: 5, seed: 13 });
  basketBox(f.at(-w / 2 + 0.25, 1.655, 0.13), M, 0.3, 0.16, 0.22);
  return top;
}
export function deskLamp(f, M) {
  f.cyl(M.black, 0.07, 0.015, 0, 0, 0, { seg: 18 });
  f.add(new THREE.CylinderGeometry(0.006, 0.006, 0.38, 6), M.black, 0, 0.19, 0, 0, 0, -0.25, false);
  f.add(new THREE.CylinderGeometry(0.006, 0.006, 0.26, 6), M.black, 0.15, 0.42, 0, 0, 0, 0.9, false);
  f.add(latheGeo([[0.01, 0], [0.03, -0.02], [0.065, -0.09], [0.07, -0.095]], 16), M.black, 0.26, 0.48, 0, 0, 0, 0.5, false);
}

export function basketBox(f, M, w = 0.35, h = 0.25, d = 0.3, mat) {
  const m = mat ?? M.basket;
  f.box(m, w, h, d, 0, 0, 0, { cast: false });
  f.box(M.oakDark, w + 0.01, 0.02, d + 0.01, 0, h - 0.02, 0, { cast: false });
}

export function bench(f, M, o = {}) {
  const w = o.w ?? 1.2, d = o.d ?? 0.4, h = o.h ?? 0.46;
  f.add(softBox(w, 0.12, d, 0.03, { n: 6, noise: 0.003 }), o.cushion ?? M.upholsteryLight, 0, h - 0.06, 0);
  f.box(o.mat ?? M.oak, w, h - 0.12, 0.05, 0, 0, -d / 2 + 0.025);
  f.box(o.mat ?? M.oak, 0.05, h - 0.12, d, -w / 2 + 0.025, 0, 0);
  f.box(o.mat ?? M.oak, 0.05, h - 0.12, d, w / 2 - 0.025, 0, 0);
}

// ---------------------------------------------------------------- bath fixtures
export function toilet(f, M, o = {}) {
  // origin at the wall behind the tank; faces +z
  f.add(softBox(0.42, 0.36, 0.18, 0.035, { n: 3 }), M.porcelain, 0, 0.6, 0.11);
  f.add(softBox(0.44, 0.04, 0.2, 0.015, { n: 3 }), M.porcelain, 0, 0.8, 0.11);
  f.box(o.metal ?? M.black, 0.05, 0.012, 0.03, -0.15, 0.7, 0.215, { cast: false });
  // pedestal and bowl
  f.add(latheGeo([[0, 0], [0.13, 0], [0.12, 0.08], [0.11, 0.25], [0.15, 0.33], [0.19, 0.38], [0.19, 0.4], [0, 0.4]], 22), M.porcelain, 0, 0, 0.42, 0, 0, 0, true);
  const bowl = latheGeo([[0, 0.4], [0.19, 0.4], [0.2, 0.41], [0.0, 0.41]], 22);
  bowl.scale(1, 1, 1.25);
  f.add(bowl, M.porcelain, 0, 0, 0.42, 0, 0, 0, false);
  const seat = new THREE.TorusGeometry(0.155, 0.025, 8, 28);
  seat.scale(1, 1.25, 0.5);
  f.add(seat, M.porcelain, 0, 0.425, 0.44, 0, -PI / 2, 0, false);
  const lid = new THREE.CircleGeometry(0.18, 24); lid.scale(1, 1.25, 1);
  f.add(lid, M.porcelainIn, 0, 0.41, 0.44, 0, PI / 2, 0, false);
  f.box(M.porcelain, 0.3, 0.2, 0.2, 0, 0.2, 0.26);
}

// slab with rectangular cut-outs (counter tops / tub decks). Slab spans x -w/2..w/2, z 0..d.
// holes: [{x, z, w, d}] centres in local coords.
export function slabWithHoles(f, mat, w, d, y, t, holes, o = {}) {
  const xs = [-w / 2, w / 2];
  for (const h of holes) xs.push(h.x - h.w / 2, h.x + h.w / 2);
  xs.sort((a, b) => a - b);
  for (let i = 0; i < xs.length - 1; i++) {
    const x0 = xs[i], x1 = xs[i + 1];
    if (x1 - x0 < 1e-4) continue;
    const cx = (x0 + x1) / 2;
    const hole = holes.find((h) => cx > h.x - h.w / 2 && cx < h.x + h.w / 2);
    if (!hole) { f.box(mat, x1 - x0, t, d, cx, y, d / 2, { cast: o.cast ?? false }); continue; }
    const zb = hole.z - hole.d / 2, zf = hole.z + hole.d / 2;
    if (zb > 1e-4) f.box(mat, x1 - x0, t, zb, cx, y, zb / 2, { cast: false });
    if (d - zf > 1e-4) f.box(mat, x1 - x0, t, d - zf, cx, y, (zf + d) / 2, { cast: false });
  }
}

// alcove tub; origin at the back wall centre, length along local x, depth along +z
export function alcoveTub(f, M, o = {}) {
  const L = o.L ?? 1.52, W = o.W ?? 0.76, H = 0.5;
  const bl = L - 0.3, bw = W - 0.2, bz = 0.1 + bw / 2, bx = 0.03;
  f.add(softBox(L, H - 0.03, 0.06, 0.02, { n: 6 }), M.porcelain, 0, (H - 0.03) / 2, W - 0.03);   // apron
  slabWithHoles(f, M.porcelain, L, W, H - 0.035, 0.035, [{ x: bx, z: bz, w: bl, d: bw }]);
  f.add(softBox(L, 0.03, 0.04, 0.015, { n: 6 }), M.porcelain, 0, H - 0.012, W - 0.02);              // rounded front lip
  f.add(openBasin(bl, 0.4, bw, 0.13), M.porcelainIn, bx, H, bz, 0, 0, 0, false);
  f.add(new THREE.CircleGeometry(0.028, 16), M.chrome, bx - bl / 2 + 0.12, H - 0.398, bz, 0, -PI / 2, 0, false);
  f.cyl(M.chrome, 0.035, 0.01, -L / 2 + 0.005, H - 0.15, bz, { rz: PI / 2 });
}

// vanity cabinet with top and undermount sinks. origin = wall centre, floor. sinks = local x list.
export function vanity(f, M, o = {}) {
  const w = o.w ?? 0.9, d = o.d ?? 0.56, h = o.h ?? 0.87, cab = o.cab ?? M.paint, top = o.top ?? M.quartz, pm = o.pullMat ?? M.black;
  const sinks = o.sinks ?? [0];
  const sw = o.sinkW ?? 0.44, sd = o.sinkD ?? 0.34, sz = d / 2 + 0.03;
  f.box(cab, w - 0.02, 0.09, d - 0.06, 0, 0, d / 2 - 0.04);
  f.box(cab, w - 0.01, h - 0.12 - 0.2, d - 0.03, 0, 0.09, d / 2 - 0.015, { cast: true });   // body stops below the basins
  f.box(cab, 0.018, h - 0.12, d - 0.03, -w / 2 + 0.014, 0.09, d / 2 - 0.015);
  f.box(cab, 0.018, h - 0.12, d - 0.03, w / 2 - 0.014, 0.09, d / 2 - 0.015);
  f.box(cab, w - 0.01, h - 0.12, 0.012, 0, 0.09, 0.006);
  slabWithHoles(f, top, w, d, h - 0.03, 0.03, sinks.map((x) => ({ x, z: sz, w: sw, d: sd })), { cast: true });
  if (o.splash !== false) f.box(top, w, 0.1, 0.02, 0, h, 0.01, { cast: false });
  // fronts: drawers on the ends, doors under sinks
  const fh = h - 0.12 - 0.09;
  const n = o.bays ?? sinks.length * 2 + (sinks.length > 1 ? 1 : 0);
  if (o.layout === 'doors') {
    const bw = (w - 0.03) / 2;
    for (const sx of [-1, 1]) { shakerPanel(f.at(sx * bw / 2, 0.095, d - 0.03), cab, bw - 0.006, fh - 0.004, 0.02, 0.06); pull(f, pm, 'vbar', sx * 0.05, 0.095 + fh * 0.75, d - 0.01); }
  } else {
    // generic: centre doors under each sink, drawer stack between/ends
    const bays = [];
    if (sinks.length === 1) bays.push({ x0: -w / 2 + 0.015, x1: w / 2 - 0.015, kind: 'doors' });
    else {
      const mid = (w - 0.03) * 0.28;
      bays.push({ x0: -w / 2 + 0.015, x1: -mid / 2, kind: 'doors' }, { x0: -mid / 2, x1: mid / 2, kind: 'drawers' }, { x0: mid / 2, x1: w / 2 - 0.015, kind: 'doors' });
    }
    for (const b of bays) {
      const bw = b.x1 - b.x0, cx = (b.x0 + b.x1) / 2;
      if (b.kind === 'drawers') {
        for (let k = 0; k < 3; k++) { const dh = fh / 3; shakerPanel(f.at(cx, 0.095 + k * dh, d - 0.03), cab, bw - 0.006, dh - 0.006, 0.02, 0.04); pull(f, pm, 'bar', cx, 0.095 + k * dh + dh / 2, d - 0.01); }
      } else {
        const nd = bw > 0.5 ? 2 : 1, dw = bw / nd;
        // false drawer front at top
        shakerPanel(f.at(cx, 0.095 + fh - 0.16, d - 0.03), cab, bw - 0.006, 0.156, 0.02, 0.04);
        for (let k = 0; k < nd; k++) {
          const x = b.x0 + dw * (k + 0.5);
          shakerPanel(f.at(x, 0.095, d - 0.03), cab, dw - 0.006, fh - 0.166, 0.02, 0.055);
          pull(f, pm, 'vbar', nd === 2 ? x + (k ? -1 : 1) * (dw / 2 - 0.05) : x + dw / 2 - 0.05, 0.095 + fh - 0.26, d - 0.01);
        }
      }
    }
  }
  for (const sx of sinks) {
    f.add(openBasin(sw, 0.17, sd, 0.06), M.porcelainIn, sx, h, sz, 0, 0, 0, false);
    f.add(new THREE.CircleGeometry(0.02, 12), M.chrome, sx, h - 0.168, sz, 0, -PI / 2, 0, false);
    faucet(f.at(sx, h, 0.06), M, o.faucet);
  }
}
export function faucet(f, M, o = {}) {
  const m = o?.mat ?? M.black;
  f.cyl(m, 0.022, 0.03, 0, 0, 0, { seg: 14 });
  f.cyl(m, 0.012, 0.22, 0, 0.03, 0);
  const arc = new THREE.TorusGeometry(0.07, 0.011, 8, 16, PI);
  f.add(arc, m, 0, 0.25, 0.07, PI / 2, 0, 0, false);
  f.cyl(m, 0.011, 0.05, 0, 0.2, 0.14);
  for (const sx of [-1, 1]) { f.cyl(m, 0.016, 0.03, sx * 0.1, 0, 0, { seg: 12 }); f.boxC(m, 0.012, 0.012, 0.07, sx * 0.1, 0.045, 0.02, { cast: false }); }
}
export function towelBar(f, M, o = {}) {
  const w = o.w ?? 0.6, m = o.mat ?? M.black;
  f.rodX(m, 0.008, w, 0, 0, 0.065);
  for (const sx of [-1, 1]) { f.rodZ(m, 0.008, 0.06, sx * w / 2, 0, 0.035); f.cyl(m, 0.022, 0.012, sx * w / 2, 0, 0.006, { rx: PI / 2 }); }
  if (o.towel !== false) {
    const tw = w * 0.75;
    f.add(softBox(tw, 0.55, 0.03, 0.012, { n: 4, noise: 0.003 }), M.towel, 0, -0.27 + 0.01, 0.08);
    f.add(softBox(tw, 0.05, 0.06, 0.02, { n: 4 }), M.towel, 0, 0.0, 0.065);
  }
}
export function towelRing(f, M, o = {}) {
  const m = o.mat ?? M.black;
  f.cyl(m, 0.025, 0.012, 0, 0, 0.006, { rx: PI / 2, seg: 14 });
  f.rodZ(m, 0.006, 0.05, 0, 0, 0.03);
  f.add(new THREE.TorusGeometry(0.08, 0.006, 6, 28), m, 0, -0.08, 0.055, 0, 0, 0, false);
  f.add(softBox(0.26, 0.42, 0.03, 0.012, { n: 3, noise: 0.003 }), M.towel, 0, -0.38, 0.06);
}
export function tpHolder(f, M, o = {}) {
  const m = o.mat ?? M.black;
  f.cyl(m, 0.022, 0.012, 0, 0, 0.006, { rx: PI / 2, seg: 12 });
  f.rodZ(m, 0.006, 0.05, 0, 0, 0.03);
  f.rodX(m, 0.006, 0.14, 0.07, 0, 0.055);
  f.add(new THREE.CylinderGeometry(0.055, 0.055, 0.1, 16), M.paper, 0.08, -0.03, 0.06, 0, 0, PI / 2, false);
}
export function robeHook(f, M, mat) {
  const m = mat ?? M.black;
  f.cyl(m, 0.015, 0.01, 0, 0, 0.005, { rx: PI / 2, seg: 10 });
  f.rodZ(m, 0.005, 0.06, 0, 0, 0.03);
  f.add(new THREE.SphereGeometry(0.009, 8, 6), m, 0, 0, 0.06, 0, 0, 0, false);
}

// over-the-toilet shelving ("lin" in the plan): origin wall centre at the bottom shelf height
export function wallShelves(f, M, o = {}) {
  const w = o.w ?? 0.6, d = o.d ?? 0.22, n = o.n ?? 2, gap = o.gap ?? 0.32, mat = o.mat ?? M.oakWarm;
  for (let i = 0; i < n; i++) {
    f.box(mat, w, 0.03, d, 0, i * gap, d / 2);
    f.box(M.black, 0.02, 0.06, 0.02, -w / 2 + 0.08, i * gap - 0.06, 0.01, { cast: false });
    f.box(M.black, 0.02, 0.06, 0.02, w / 2 - 0.08, i * gap - 0.06, 0.01, { cast: false });
  }
  return mat;
}
export function foldedTowels(f, M, o = {}) {
  const n = o.n ?? 3;
  for (let i = 0; i < n; i++) f.add(softBox(0.3, 0.045, 0.2, 0.02, { n: 3, noise: 0.002, seed: i }), o.mat ?? M.towel, 0, 0.023 + i * 0.046, 0);
}

// shower curtain on a straight black rod: origin = centre of the rod at its height, rod along x
export function showerCurtain(f, M, o = {}) {
  const L = o.L ?? 1.52, h = o.h ?? 1.75;
  f.rodX(M.black, 0.012, L, 0, 0, 0);
  const pw = o.pw ?? 0.55;
  f.add(curtainGeo(pw, h, 6, 0.035, 9), o.mat ?? M.curtain, -L / 2 + pw / 2 + 0.02, -0.02, 0, 0, 0, 0, true);
  for (let k = 0; k < 9; k++) f.add(new THREE.TorusGeometry(0.02, 0.003, 4, 10), M.black, -L / 2 + 0.03 + k * (pw / 9), 0, 0, 0, 0, 0, false);
}
export function showerSet(f, M, o = {}) {
  // origin on the wall (tile face), centred on the valve; head above
  const m = o.mat ?? M.black;
  f.cyl(m, 0.08, 0.012, 0, 1.05, 0.006, { rx: PI / 2, seg: 20 });
  f.boxC(m, 0.02, 0.02, 0.09, 0, 1.05, 0.05, { cast: false });
  f.rodZ(m, 0.01, 0.28, 0, 1.95, 0.14);
  f.cyl(m, 0.1, 0.012, 0, 1.94, 0.27, { seg: 24 });
  f.cyl(m, 0.022, 0.06, 0, 0.62, 0.0, { rx: PI / 2 });
  f.rodZ(m, 0.012, 0.15, 0, 0.62, 0.08);
}

// ---------------------------------------------------------------- cabinetry
// base cabinet run: origin wall centre, floor. Returns counter top height.
export function baseCabinets(f, M, o = {}) {
  const w = o.w ?? 1.0, d = o.d ?? 0.62, h = o.h ?? 0.91, cab = o.cab ?? M.paint, top = o.top ?? M.quartz, pm = o.pullMat ?? M.black;
  f.box(cab, w, 0.1, d - 0.07, 0, 0, d / 2 - 0.05);
  f.box(cab, w, h - 0.14, d - 0.04, 0, 0.1, d / 2 - 0.02, { cast: true });
  if (o.noTop !== true) f.box(top, w + 0.02, 0.04, d, 0, h - 0.04, d / 2);
  const units = o.units ?? [{ w, kind: 'door2' }];
  let x = -w / 2;
  const fh = h - 0.14 - 0.1;
  for (const u of units) {
    const cx = x + u.w / 2;
    if (u.kind === 'drawers') {
      const hs = [0.18, (fh - 0.18) / 2, (fh - 0.18) / 2];
      let y = 0.1;
      for (const dh of hs) { shakerPanel(f.at(cx, y + 0.002, d - 0.02), cab, u.w - 0.006, dh - 0.004, 0.02, 0.045); pull(f, pm, 'bar', cx, y + dh / 2, d); y += dh; }
    } else if (u.kind === 'gap') { /* appliance space */ } else {
      shakerPanel(f.at(cx, 0.1 + fh - 0.16, d - 0.02), cab, u.w - 0.006, 0.156, 0.02, 0.04);
      pull(f, pm, 'bar', cx, 0.1 + fh - 0.08, d);
      const nd = u.kind === 'door1' ? 1 : 2, dw = u.w / nd;
      for (let k = 0; k < nd; k++) {
        const dx = x + dw * (k + 0.5);
        shakerPanel(f.at(dx, 0.102, d - 0.02), cab, dw - 0.006, fh - 0.166, 0.02, 0.06);
        pull(f, pm, 'vbar', nd === 2 ? dx + (k ? -1 : 1) * (dw / 2 - 0.045) : dx + dw / 2 - 0.045, 0.1 + fh - 0.25, d);
      }
    }
    x += u.w;
  }
  return h;
}
export function upperCabinets(f, M, o = {}) {
  // origin wall centre at the cabinet bottom height
  const w = o.w ?? 1.0, d = o.d ?? 0.33, h = o.h ?? 0.76, cab = o.cab ?? M.paint, pm = o.pullMat ?? M.black;
  f.box(cab, w, h, d - 0.02, 0, 0, (d - 0.02) / 2, { cast: true });
  const n = o.doors ?? Math.max(1, Math.round(w / 0.45)), dw = w / n;
  for (let k = 0; k < n; k++) {
    const x = -w / 2 + dw * (k + 0.5);
    shakerPanel(f.at(x, 0.003, d - 0.02), cab, dw - 0.006, h - 0.006, 0.02, 0.06);
    pull(f, pm, 'vbar', x + (k % 2 ? -1 : 1) * (dw / 2 - 0.045), 0.12, d);
  }
  f.box(cab, w + 0.02, 0.04, d + 0.02, 0, h, (d + 0.02) / 2, { cast: false });
}

// front-load washer or dryer (origin floor, back centre)
export function frontLoader(f, M, o = {}) {
  const w = 0.686, d = 0.78, h = 0.97;
  f.add(softBox(w, h, d, 0.02, { n: 3 }), M.appliance, 0, h / 2, d / 2);
  f.box(M.darkGlass, w - 0.04, 0.1, 0.01, 0, h - 0.13, d, { cast: false });
  f.add(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 16), M.chrome, w / 2 - 0.12, h - 0.08, d + 0.005, 0, PI / 2, 0, false);
  f.add(new THREE.TorusGeometry(0.2, 0.035, 10, 32), o.dryer ? M.appliance : M.chrome, 0, 0.48, d + 0.01, 0, 0, 0, false);
  f.add(new THREE.CircleGeometry(0.19, 32), M.darkGlass, 0, 0.48, d + 0.012, 0, 0, 0, false);
}

// adjustable steel shelving unit (garage): origin back centre
export function shelvingUnit(f, M, o = {}) {
  const w = o.w ?? 1.2, d = o.d ?? 0.6, h = o.h ?? 1.83, n = o.n ?? 5, mat = o.mat ?? M.steel;
  for (const [sx, sz] of [[-1, 0], [1, 0], [-1, 1], [1, 1]]) f.box(mat, 0.035, h, 0.035, sx * (w / 2 - 0.018), 0, 0.018 + sz * (d - 0.036), { cast: true });
  const r = rng(o.seed ?? 7);
  for (let i = 0; i < n; i++) {
    const y = 0.12 + (i * (h - 0.16)) / (n - 1);
    f.box(o.shelf ?? M.galv, w, 0.02, d, 0, y, d / 2, { cast: true });
    if (i === n - 1) continue;
    // contents
    let x = -w / 2 + 0.05;
    while (x < w / 2 - 0.25) {
      const k = r();
      if (k < 0.45) {
        const bw = 0.4, bh = 0.3; if (x + bw > w / 2 - 0.03) break;
        f.box(k < 0.25 ? M.binGrey : M.binClear, bw, bh, d - 0.12, x + bw / 2, y + 0.02, d / 2, { cast: false });
        f.box(M.binLid, bw + 0.02, 0.03, d - 0.1, x + bw / 2, y + 0.02 + bh, d / 2, { cast: false });
        x += bw + 0.04;
      } else if (k < 0.85) {
        const bw = 0.25 + r() * 0.2, bh = 0.18 + r() * 0.2; if (x + bw > w / 2 - 0.03) break;
        f.box(M.cardboard, bw, bh, d * (0.6 + r() * 0.3), x + bw / 2, y + 0.02, d / 2, { cast: false });
        x += bw + 0.03;
      } else x += 0.15;
    }
  }
}

// mudroom lockers: origin wall centre floor; n bays of bw width
export function lockers(f, M, o = {}) {
  const n = o.n ?? 4, bw = o.bw ?? 0.5, d = o.d ?? 0.46, h = o.h ?? 2.3, cab = o.cab ?? M.paint, seat = o.seat ?? M.oakWarm;
  const w = n * bw, t = 0.022;
  // sides and dividers
  for (let i = 0; i <= n; i++) f.box(cab, t, h, d, -w / 2 + i * bw, 0, d / 2, { cast: true });
  f.box(cab, w + t, 0.05, d + 0.02, 0, h - 0.05, (d + 0.02) / 2);
  f.box(cab, w + t + 0.06, 0.06, d + 0.05, 0, h, (d + 0.05) / 2); // crown
  f.box(cab, w, h, 0.012, 0, 0, 0.006);                          // back (beadboard look via shiplap)
  f.box(M.shiplap, w - 0.01, 1.2, 0.004, 0, 0.5, 0.014, { cast: false });
  // bench, lower cubbies with baskets, upper cubbies with doors
  f.box(cab, w, 0.1, d - 0.02, 0, 0, d / 2 - 0.01);
  f.box(seat, w + t, 0.04, d + 0.02, 0, 0.44, (d + 0.02) / 2);
  f.box(cab, w, 0.03, d - 0.04, 0, 1.75, d / 2);
  f.box(cab, w, 0.03, d - 0.04, 0, 1.98, d / 2);
  const r = rng(o.seed ?? 17);
  for (let i = 0; i < n; i++) {
    const cx = -w / 2 + bw * (i + 0.5);
    basketBox(f.at(cx, 0.1, d / 2 + 0.02), M, bw - 0.08, 0.28, d - 0.12);
    // upper door
    shakerPanel(f.at(cx, 1.985, d - 0.01), cab, bw - 0.026, h - 0.05 - 1.985 - 0.006, 0.02, 0.05);
    pull(f, M.black, 'knob', cx, 2.06, d + 0.01);
    // hooks
    for (const sx of [-1, 1]) {
      const hk = f.at(cx + sx * bw * 0.22, 1.5, 0.014);
      hk.cyl(M.black, 0.015, 0.01, 0, 0, 0.005, { rx: PI / 2, seg: 10 });
      hk.add(new THREE.TorusGeometry(0.035, 0.005, 6, 12, PI), M.black, 0, -0.03, 0.04, PI / 2, 0, PI / 2, false);
    }
    // hanging bag / jacket on some hooks
    const k = r();
    if (k < 0.45) f.add(softBox(0.3, 0.55, 0.1, 0.04, { n: 4, noise: 0.01, seed: i }), M.cloth[Math.floor(r() * M.cloth.length)], cx - bw * 0.1, 1.2, 0.08, 0, 0.05, 0);
    else if (k < 0.75) f.add(softBox(0.28, 0.3, 0.12, 0.05, { n: 4, noise: 0.006, seed: i + 9 }), M.basket, cx + bw * 0.12, 1.3, 0.08);
    // shoes under the bench
    if (r() < 0.7) for (const sx of [-1, 1]) f.add(softBox(0.1, 0.08, 0.27, 0.035, { n: 3 }), M.cloth[(i * 3) % M.cloth.length], cx + sx * 0.07 + 0.05 * (r() - 0.5), 0.1 + 0.0 - 0.1 + 0.04 + 0.0, d - 0.12, (r() - 0.5) * 0.3);
  }
  // bench cushion
  f.add(softBox(w - 0.04, 0.06, d - 0.06, 0.025, { n: 8, noise: 0.003 }), o.cushion ?? M.linenCharcoal, 0, 0.51, d / 2);
}

// closet: rod + shelf along a wall with hanging clothes. origin wall centre, floor
export function closetRod(f, M, o = {}) {
  const w = o.w ?? 1.5, rodY = o.rodY ?? 1.75, shelfY = o.shelfY ?? rodY + 0.08, d = o.d ?? 0.35, fill = o.fill ?? 0.7;
  f.box(o.shelf ?? M.paint, w, 0.02, d, 0, shelfY, d / 2, { cast: false });
  f.box(o.shelf ?? M.paint, w, 0.08, 0.02, 0, shelfY - 0.08, 0.01, { cast: false });
  f.rodX(M.black, 0.014, w - 0.02, 0, rodY, 0.3);
  const r = rng(o.seed ?? 4);
  let x = -w / 2 + 0.06;
  const end = -w / 2 + w * fill;
  while (x < end) {
    const th = 0.012 + r() * 0.03;
    const len = o.short ? 0.5 + r() * 0.3 : 0.6 + r() * 0.55;
    const mat = M.cloth[Math.floor(r() * M.cloth.length)];
    f.box(mat, th, len, 0.46, x, rodY - 0.05 - len, 0.3, { cast: false, rz: (r() - 0.5) * 0.04 });
    f.add(new THREE.TorusGeometry(0.02, 0.0025, 4, 8, PI), M.black, x, rodY + 0.005, 0.3, PI / 2, 0, 0, false);
    x += th + 0.01 + r() * 0.02;
  }
  // boxes / folded stacks on the shelf
  let sx = -w / 2 + 0.05;
  while (sx < w / 2 - 0.3) {
    const k = r();
    if (k < 0.4) { basketBox(f.at(sx + 0.17, shelfY + 0.02, d / 2), M, 0.32, 0.22, d - 0.06); sx += 0.4; }
    else if (k < 0.75) { const m = M.cloth[Math.floor(r() * M.cloth.length)]; for (let i = 0; i < 4; i++) f.add(softBox(0.3, 0.05, 0.25, 0.02, { n: 3, seed: i }), m, sx + 0.15, shelfY + 0.045 + i * 0.05, d / 2); sx += 0.38; }
    else sx += 0.25;
  }
}
export function shelfStack(f, M, o = {}) {
  // linen / closet shelves: origin wall centre floor
  const w = o.w ?? 0.6, d = o.d ?? 0.4, ys = o.ys ?? [0.4, 0.75, 1.1, 1.45, 1.8], mat = o.mat ?? M.paint;
  const r = rng(o.seed ?? 8);
  for (const y of ys) {
    f.box(mat, w, 0.02, d, 0, y, d / 2, { cast: false });
    if (o.items === false) continue;
    let x = -w / 2 + 0.04;
    while (x < w / 2 - 0.2) {
      const k = r();
      if (k < 0.6) { const m = r() < 0.6 ? M.towel : M.cloth[Math.floor(r() * M.cloth.length)]; const n = 3 + Math.floor(r() * 3); for (let i = 0; i < n; i++) f.add(softBox(0.28, 0.05, d * 0.75, 0.02, { n: 3, seed: i }), m, x + 0.14, y + 0.045 + i * 0.05, d / 2); x += 0.32; }
      else if (k < 0.85) { basketBox(f.at(x + 0.16, y + 0.02, d / 2), M, 0.3, 0.2, d - 0.08); x += 0.36; }
      else x += 0.15;
    }
  }
}
