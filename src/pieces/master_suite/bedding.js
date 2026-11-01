// Layered bedding (round 11): every layer is its own draped cloth mesh.
// Bed-local frame: x across (east +), z from the headboard (0) to the foot (+), y up from the floor.
import * as THREE from 'three';
import { mesh, pillowGeo, rng } from './util.js';
import { linenMaps, knitMaps } from './textiles.js';

// ---------------------------------------------------------------- noise helpers
function hash2(ix, iz, seed) {
  let h = (ix * 374761393 + iz * 668265263 + seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function vnoise(x, z, seed) {
  const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz;
  const sx = fx * fx * (3 - 2 * fx), sz = fz * fz * (3 - 2 * fz);
  const a = hash2(ix, iz, seed), b = hash2(ix + 1, iz, seed), c = hash2(ix, iz + 1, seed), d = hash2(ix + 1, iz + 1, seed);
  return (a + (b - a) * sx + (c - a) * sz + (a - b - c + d) * sx * sz) * 2 - 1;
}
function fbm(x, z, seed, oct = 3) {
  let s = 0, a = 1, f = 1, n = 0;
  for (let i = 0; i < oct; i++) { s += a * vnoise(x * f, z * f, seed + i * 17); n += a; a *= 0.5; f *= 2.03; }
  return s / n;
}

// Random short soft creases (ridges and valleys) over a cloth-space area.
// dir/spread: preferred orientation (radians, 0 = along x) and its spread.
export function creaseField(seed, n, area, { len = [0.12, 0.5], width = [0.008, 0.022], amp = [0.003, 0.009], dir = 0, spread = Math.PI, valley = 0.55 } = {}) {
  const R = rng(seed), lerp = (r, t) => r[0] + (r[1] - r[0]) * t;
  const cs = [];
  for (let i = 0; i < n; i++) {
    const a = dir + (R() - 0.5) * spread;
    cs.push({ cx: lerp([area.x0, area.x1], R()), cz: lerp([area.z0, area.z1], R()), ux: Math.cos(a), uz: Math.sin(a),
      hl: lerp(len, R()) / 2, w: lerp(width, R()), A: (R() < valley ? -1 : 1) * lerp(amp, R()), bend: (R() - 0.5) * 1.6 });
  }
  return (x, z) => {
    let h = 0;
    for (const c of cs) {
      const dx = x - c.cx, dz = z - c.cz;
      const along = dx * c.ux + dz * c.uz;
      if (along > c.hl || along < -c.hl) continue;
      const u = along / c.hl;
      const perp = -dx * c.uz + dz * c.ux - c.bend * c.hl * (u * u - 0.33) * 0.25; // gently curved crease
      const q = perp / c.w;
      if (q > 3 || q < -3) continue;
      const e = 1 - u * u;
      // asymmetric profile: a soft ridge with a sharper valley next to it reads as a fold
      h += c.A * e * e * (Math.exp(-q * q) - 0.45 * Math.exp(-(q - 1.3) * (q - 1.3) * 2.2));
    }
    return h;
  };
}

// ---------------------------------------------------------------- cloth over a rounded box
// Cloth domain (s, t) in metres. The support is the rect [x0,x1]x[z0,z1] at height `top` with edge radius r.
// hang = { w, e, h, f }: cloth length beyond each edge (west, east, head, foot).
// Points beyond the rect wrap over the rounded edge along the radial direction and fall vertically,
// flaring out by `flare` per metre of drop; the drop is softly clamped at `maxDrop`.
// field(s, t, drop) returns a displacement along the base-surface normal.
export function clothGeo({ x0, x1, z0, z1, top, r = 0.08, hang, density = 70, flare = 0.1, maxDrop = 0.5, floorY = 0.02,
  hem = 0.03, hemIn = 0.012, field = () => 0, foldAmp = 0.012, foldSeed = 1, foldScale = 9, shade = null }) {
  const S0 = x0 - hang.w, S1 = x1 + hang.e, T0 = z0 - hang.h, T1 = z1 + hang.f;
  const nx = Math.max(8, Math.round((S1 - S0) * density)), nz = Math.max(8, Math.round((T1 - T0) * density));
  const pos = new Float32Array((nx + 1) * (nz + 1) * 3), col = shade ? new Float32Array((nx + 1) * (nz + 1) * 3) : null, uv = new Float32Array((nx + 1) * (nz + 1) * 2);
  const arcL = (Math.PI / 2) * r;
  let k = 0;
  for (let j = 0; j <= nz; j++) {
    const t = T0 + ((T1 - T0) * j) / nz;
    for (let i = 0; i <= nx; i++) {
      const s = S0 + ((S1 - S0) * i) / nx;
      const cx = Math.min(x1, Math.max(x0, s)), cz = Math.min(z1, Math.max(z0, t));
      const dx = s - cx, dz = t - cz, d = Math.hypot(dx, dz);
      let px = s, py = top, pz = t, nX = 0, nY = 1, nZ = 0, drop = 0;
      if (d > 1e-6) {
        const ux = dx / d, uz = dz / d;
        let h, v;
        if (d <= arcL) { const th = d / r; h = r * Math.sin(th); v = r * (1 - Math.cos(th)); nX = ux * Math.sin(th); nZ = uz * Math.sin(th); nY = Math.cos(th); }
        else {
          let e = d - arcL;
          // soft clamp of the drop so corners don't spear down
          const lim = maxDrop - r, kk = 0.08;
          if (e > lim - kk) e = lim - kk * Math.exp(-(e - (lim - kk)) / kk);
          h = r + e * flare; v = r + e; nX = ux; nZ = uz; nY = 0; drop = e;
        }
        px = cx + ux * h; pz = cz + uz * h; py = top - v;
        if (py < floorY) { const ex = floorY - py; py = floorY; px += ux * ex; pz += uz * ex; }
        // vertical hanging folds: vary along the edge, constant down the drop, growing with depth
        if (drop > 0) {
          const wx = (dx * dx) / (d * d), along = wx * t + (1 - wx) * s;
          const grow = Math.min(1, drop / 0.18);
          const f = foldAmp * grow * (Math.sin(along * foldScale + vnoise(along * 3, 0, foldSeed) * 2.2) * 0.6 + fbm(along * foldScale * 0.45, drop * 1.5, foldSeed + 5) * 0.9);
          px += ux * f; pz += uz * f;
        }
      }
      const disp = field(s, t, drop);
      px += nX * disp; py += nY * disp; pz += nZ * disp;
      // rolled hem: the last few cm curl back under, giving the edge visible thickness
      const ed = Math.min(s - S0 + (hang.w > 0 ? 0 : 9), S1 - s + (hang.e > 0 ? 0 : 9), t - T0 + (hang.h > 0 ? 0 : 9), T1 - t + (hang.f > 0 ? 0 : 9));
      if (ed < hem) { const q = 1 - ed / hem, c = q * q; px -= nX * hemIn * c; py -= nY * hemIn * c; pz -= nZ * hemIn * c; }
      pos[k * 3] = px; pos[k * 3 + 1] = py; pos[k * 3 + 2] = pz;
      if (col) { const c = shade(s, t, drop, disp, py); col[k * 3] = c; col[k * 3 + 1] = c; col[k * 3 + 2] = c * 0.985; }
      uv[k * 2] = s; uv[k * 2 + 1] = t; k++;
    }
  }
  const idx = [];
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  if (col) g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// ---------------------------------------------------------------- the bed's layers
export function buildBedding(ctx, M, b, { W, L, mTop }) {
  const hw = 0.97;                       // duvet support half-width (just outside the 1.86 m mattress)
  const duvTop = mTop + 0.04;            // loft above the fitted sheet
  const zHead = 0.1, zFoot = 2.28;

  // baked light falloff + crease cavity darkening (vertex colours): bright on the upper top where the
  // window light lands, falling into shadow toward the foot, down the hanging sides and in every valley
  const sstep = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
  const shadeFn = (base) => (s, t, drop, disp, py) => {
    const cav = Math.max(-0.22, Math.min(0.08, (disp - base) * 9));
    const lit = 1.1 - 0.26 * sstep(0.9, 2.6, t) + 0.04 * sstep(-0.6, 0.9, s);
    const hangDark = drop > 0 ? 0.9 - 0.22 * sstep(0.05, 0.4, drop) : 1;
    return Math.max(0.45, lit * hangDark * (1 + cav));
  };

  // 1. duvet: light linen, many small soft creases, hanging (not bulging) over the sides and foot
  const fine = creaseField(31, 420, { x0: -1.4, x1: 1.4, z0: 0, z1: 2.8 }, { len: [0.1, 0.4], width: [0.012, 0.022], amp: [0.002, 0.005], dir: 0.6, spread: 2.6 });
  const broad = creaseField(32, 110, { x0: -1.3, x1: 1.3, z0: 0.3, z1: 2.7 }, { len: [0.3, 1.0], width: [0.025, 0.05], amp: [0.009, 0.02], dir: 0.35, spread: 1.4 });
  const duvField = (s, t, drop) => {
    const loft = 0.006 * fbm(s * 2.2, t * 2.2, 7);                // soft puffy undulation
    const edgeSoft = drop > 0 ? 0.5 : 1;
    return loft + edgeSoft * (fine(s, t) + broad(s, t)) + 0.0015 * fbm(s * 14, t * 14, 9);
  };
  const duv = mesh(clothGeo({ x0: -hw, x1: hw, z0: zHead, z1: zFoot, top: duvTop, r: 0.1,
    hang: { w: 0.5, e: 0.5, h: 0, f: 0.46 }, density: 92, flare: 0.1, maxDrop: 0.42, hem: 0.035, hemIn: 0.02,
    field: duvField, foldAmp: 0.026, foldSeed: 3, foldScale: 19, shade: shadeFn(0) }), M.bedDuvet, { name: 'ms.duvet' });
  b.add(duv);

  // 2. turned-down top edge: the duvet folded back on itself, a band with horizontal creases and a rolled lip
  const bandCr = creaseField(41, 90, { x0: -1.3, x1: 1.3, z0: 0.5, z1: 1.1 }, { len: [0.1, 0.45], width: [0.006, 0.015], amp: [0.002, 0.006], dir: 0, spread: 0.5 });
  const band = mesh(clothGeo({ x0: -hw, x1: hw, z0: 0.6, z1: 0.98, top: duvTop + 0.045, r: 0.13,
    hang: { w: 0.42, e: 0.42, h: 0.05, f: 0.075 }, density: 75, flare: 0.12, maxDrop: 0.4, hem: 0.03, hemIn: 0.015,
    field: (s, t, drop) => bandCr(s, t) + 0.008 * fbm(s * 3, t * 3, 44) * (drop > 0 ? 0.4 : 1), foldAmp: 0.014, foldSeed: 5, foldScale: 10, shade: shadeFn(0) }), M.bedBand, { name: 'ms.duvetBand' });
  b.add(band);

  // 3. pale layered throw lengthwise over the east half, spilling down the east side
  const thrCr = creaseField(51, 260, { x0: -0.4, x1: 1.6, z0: 0.6, z1: 2.3 }, { len: [0.15, 0.6], width: [0.008, 0.022], amp: [0.003, 0.009], dir: 0.15, spread: 0.9 });
  const tThr = duvTop + 0.022;
  const thr = mesh(clothGeo({ x0: -0.12, x1: hw, z0: 1.02, z1: 2.14, top: tThr, r: 0.12,
    hang: { w: 0.05, e: 0.56, h: 0.05, f: 0.05 }, density: 80, flare: 0.16, maxDrop: 0.5, hem: 0.03, hemIn: 0.012,
    field: (s, t, drop) => thrCr(s, t) + 0.006 * fbm(s * 3.5, t * 3.5, 52) + (drop > 0 ? 0.01 : 0), foldAmp: 0.03, foldSeed: 7, foldScale: 16, shade: shadeFn(0.004) }), M.bedThrow, { name: 'ms.throw' });
  b.add(thr);
  // its folded-over top layer (a second, shorter thickness of the same throw)
  const thr2 = mesh(clothGeo({ x0: -0.1, x1: hw, z0: 0.98, z1: 1.3, top: tThr + 0.018, r: 0.14,
    hang: { w: 0.05, e: 0.36, h: 0.06, f: 0.04 }, density: 80, flare: 0.18, maxDrop: 0.42, hem: 0.03, hemIn: 0.014,
    field: (s, t, drop) => thrCr(s + 0.3, t + 0.2) * 0.8 + 0.005 * fbm(s * 3, t * 5, 58), foldAmp: 0.022, foldSeed: 9, foldScale: 18, shade: shadeFn(0) }), M.bedThrow, { name: 'ms.throwFold' });
  b.add(thr2);

  // 4. pillows: lighter and varied; euro shams, sleepers, a white sleeper, two decoratives and a lumbar
  const pil = (w, h, d, mat, x, y, z, tilt, yaw = 0, seed = 0, o = {}) => {
    const m = mesh(pillowGeo(w, h, d, { segs: 30, seed, puff: 1.0, pinch: 0.12, shape: 0.55, crumple: 0.12, sag: 0.05, ...o }), mat);
    m.position.set(x, y, z); m.rotation.set(-tilt, yaw, 0, 'YXZ');
    b.add(m); return m;
  };
  const yb = mTop + 0.03;
  pil(0.7, 0.62, 0.3, M.pilEuro, -0.66, yb + 0.28, 0.16, 0.3, 0.05, 1);
  pil(0.7, 0.62, 0.3, M.pilEuro2, 0.0, yb + 0.29, 0.15, 0.27, -0.02, 2);
  pil(0.7, 0.62, 0.3, M.pilEuro, 0.66, yb + 0.28, 0.16, 0.31, -0.06, 3);
  pil(0.86, 0.5, 0.26, M.pilSleepL, -0.44, yb + 0.19, 0.38, 0.52, 0.06, 4);
  pil(0.86, 0.5, 0.26, M.pilSleepR, 0.36, yb + 0.19, 0.38, 0.5, -0.06, 5);
  pil(0.66, 0.46, 0.24, M.pilWhite, 0.78, yb + 0.18, 0.33, 0.45, -0.14, 9);
  pil(0.48, 0.46, 0.2, M.pilDecoL, -0.48, yb + 0.18, 0.58, 0.58, 0.14, 6, { crumple: 0.08 });
  pil(0.48, 0.46, 0.2, M.pilDecoR, 0.45, yb + 0.18, 0.58, 0.58, -0.16, 7, { crumple: 0.08 });
  pil(0.58, 0.32, 0.17, M.pilLumbar, -0.02, yb + 0.13, 0.66, 0.62, 0.02, 8, { crumple: 0.06 });
  return { duvTop };
}

// Bedding materials: cloned from the round-10 linen materials (shared maps), new colours from photo samples.
export function beddingMats(M) {
  const tint = (src, hex, extra = {}) => { const m = src.clone(); m.color = new THREE.Color(hex); if (m.sheenColor) m.sheenColor = m.color.clone().lerp(new THREE.Color(0xffffff), 0.4); Object.assign(m, extra); return m; };
  // fine washed-linen weave at true scale (~1.5 mm threads), no baked creases (the geometry carries them)
  // small crisp creases live in the normal map (1.3 m tile); the mesh carries the medium and broad folds
  const fineLinen = linenMaps({ size: 1024, repeatM: 1.3, pitch: 2, seed: 61, crease: { n: 420, dir: 0.5, spread: 1.4, seed: 71, amount: 1.0 }, creaseStrength: 5, slub: 0.3 });
  const throwWeave = linenMaps({ size: 1024, repeatM: 0.5, pitch: 5, seed: 62, crease: null, slub: 1.2 });
  const withMaps = (m, lm, ns) => { m.map = lm.map; m.normalMap = lm.normalMap; m.normalScale = new THREE.Vector2(ns, ns); return m; };
  M.bedDuvet = tint(M.duvet, 0xd9cbbd, { name: 'ms.bedDuvet' });
  M.bedBand = tint(M.duvet, 0xdfd2c4, { name: 'ms.bedBand' });
  withMaps(M.bedDuvet, fineLinen, 0.8); withMaps(M.bedBand, fineLinen, 0.8);
  for (const m of [M.bedDuvet, M.bedBand]) m.vertexColors = true;
  M.bedThrow = withMaps(tint(M.throwCream, 0xeee6da, { name: 'ms.bedThrow' }), throwWeave, 0.9);
  M.bedThrow.vertexColors = true;
  // bench throw: finer, softer chunky knit (~3 cm loops, lower contrast), two-tone via vertex colours
  const km = knitMaps({ size: 512, repeatM: 0.25, cols: 6, rows: 8, seed: 5, lo: 0.64, nStrength: 4.2 });
  M.knit.map = km.map; M.knit.normalMap = km.normalMap; M.knit.normalScale = new THREE.Vector2(0.9, 0.9);
  M.knit.color = new THREE.Color(0xf1e9de); M.knit.vertexColors = true;
  M.pilEuro = tint(M.pillowA, 0xc2b19d, { name: 'ms.pilEuro' });
  M.pilEuro2 = tint(M.pillowA, 0xc9b9a6, { name: 'ms.pilEuro2' });
  M.pilSleepL = tint(M.pillowC, 0xd3c6b5, { name: 'ms.pilSleepL' });
  M.pilSleepR = tint(M.pillowA, 0xb8a691, { name: 'ms.pilSleepR' });
  M.pilWhite = tint(M.pillowW, 0xf1ede6, { name: 'ms.pilWhite' });
  M.pilDecoL = tint(M.pillowKnit, 0xe0d6c8, { name: 'ms.pilDecoL' });
  M.pilDecoR = tint(M.pillowB, 0xbcaa94, { name: 'ms.pilDecoR' });
  M.pilLumbar = tint(M.pillowC, 0xd8cdbe, { name: 'ms.pilLumbar' });
}
