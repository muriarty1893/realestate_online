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
export function makeDrape({ x0, x1, z0, z1, top, r = 0.08, flare = 0.1, maxDrop = 0.5, floorY = 0.02, field = () => 0, foldAmp = 0.012, foldSeed = 1, foldScale = 9 }) {
  const arcL = (Math.PI / 2) * r;
  const o = { x: 0, y: 0, z: 0, nX: 0, nY: 1, nZ: 0, drop: 0, disp: 0 };
  return (s, t) => {
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
    o.x = px + nX * disp; o.y = py + nY * disp; o.z = pz + nZ * disp;
    o.nX = nX; o.nY = nY; o.nZ = nZ; o.drop = drop; o.disp = disp;
    return o;
  };
}

function gridGeo(nu, nv, vert) {
  const n = (nu + 1) * (nv + 1);
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), uv = new Float32Array(n * 2);
  let k = 0, hasCol = false;
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
    const r = vert(i / nu, j / nv);
    pos[k * 3] = r[0]; pos[k * 3 + 1] = r[1]; pos[k * 3 + 2] = r[2];
    uv[k * 2] = r[3]; uv[k * 2 + 1] = r[4];
    if (r[5] !== undefined) { hasCol = true; col[k * 3] = r[5]; col[k * 3 + 1] = r[5]; col[k * 3 + 2] = r[5] * 0.985; }
    k++;
  }
  const idx = [];
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  if (hasCol) g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export function clothGeo(opts) {
  const { x0, x1, z0, z1, hang, density = 70, hem = 0.03, hemIn = 0.012, shade = null } = opts;
  const P = makeDrape(opts);
  const S0 = x0 - hang.w, S1 = x1 + hang.e, T0 = z0 - hang.h, T1 = z1 + hang.f;
  const nx = Math.max(8, Math.round((S1 - S0) * density)), nz = Math.max(8, Math.round((T1 - T0) * density));
  return gridGeo(nx, nz, (u, v) => {
    const s = S0 + (S1 - S0) * u, t = T0 + (T1 - T0) * v;
    const q = P(s, t);
    let px = q.x, py = q.y, pz = q.z;
    // rolled hem: the last few cm curl back under, giving the edge visible thickness
    const ed = Math.min(s - S0 + (hang.w > 0 ? 0 : 9), S1 - s + (hang.e > 0 ? 0 : 9), t - T0 + (hang.h > 0 ? 0 : 9), T1 - t + (hang.f > 0 ? 0 : 9));
    if (ed < hem) { const c = (1 - ed / hem) ** 2; px -= q.nX * hemIn * c; py -= q.nY * hemIn * c; pz -= q.nZ * hemIn * c; }
    return [px, py, pz, s, t, shade ? shade(s, t, q.drop, q.disp, py) : undefined];
  });
}

// A layer lying on a drape `P`, defined in P's cloth coordinates: map(u, v) -> [s, t] over the unit square.
// It follows P's surface (folds and all) but bridges its valleys, sits `thick` above it, adds its own
// creases (lift >= 0), and every free edge rolls down onto the surface below so it shows its thickness.
export function overlayGeo(P, { map, nu, nv, sizeU, sizeV, thick = 0.014, lift = () => 0, hem = 0.035, shade = null }) {
  return gridGeo(nu, nv, (u, v) => {
    const [s, t] = map(u, v);
    const q = P(s, t);
    const own = lift(s, t, q);
    const ed = Math.min(u * sizeU, (1 - u) * sizeU, v * sizeV, (1 - v) * sizeV);
    const roll = ed < hem ? (1 - ed / hem) ** 2 : 0;
    const off = (Math.max(0, 0.004 - 0.5 * q.disp) + thick + own) * (1 - roll) + 0.003 * roll;
    return [q.x + q.nX * off, q.y + q.nY * off, q.z + q.nZ * off, s, t, shade ? shade(s, t, q.drop, q.disp + own * (1 - roll), u, v) : undefined];
  });
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
  const duvOpts = { x0: -hw, x1: hw, z0: zHead, z1: zFoot, top: duvTop, r: 0.1,
    hang: { w: 0.5, e: 0.5, h: 0, f: 0.46 }, density: 92, flare: 0.1, maxDrop: 0.42, hem: 0.035, hemIn: 0.02,
    field: duvField, foldAmp: 0.026, foldSeed: 3, foldScale: 19 };
  const duvP = makeDrape(duvOpts);
  // throw footprint in duvet cloth coords: an angled top edge, a west edge running diagonally from upper
  // left to lower middle, the east part hanging down the side with the duvet
  const lerp = (a, b, x) => a + (b - a) * x;
  const sWest = (v) => lerp(-0.86, 0.06, v * (0.8 + 0.2 * v)) + 0.05 * Math.sin(v * 6.5 + 0.7) + 0.025 * Math.sin(v * 15);
  const thrMap = (u, v) => { const sW = sWest(v), sE = 1.42; const s = lerp(sW, sE, u); return [s, lerp(lerp(0.93, 1.16, u), lerp(2.02, 2.16, u), v)]; };
  const duvShade = shadeFn(0);
  // duvet darkens softly just outside the throw's west and top edges (contact shadow)
  const thrEdgeShade = (s, t) => {
    if (t < 0.85 || t > 2.2) return 1;
    const v = Math.min(1, Math.max(0, (t - 0.93) / 1.11)), dW = sWest(v) - s;
    const uu = Math.min(1, Math.max(0, (s + 0.86) / 2.28)), dT = lerp(0.93, 1.16, uu) - t;
    let k = 1;
    if (dW > -0.01 && dW < 0.07 && t > 0.9) k *= 0.8 + 0.2 * Math.min(1, Math.max(0, dW) / 0.07);
    if (dT > -0.01 && dT < 0.07 && s > -0.86) k *= 0.82 + 0.18 * Math.min(1, Math.max(0, dT) / 0.07);
    return k;
  };
  duvOpts.shade = (s, t, drop, disp, py) => duvShade(s, t, drop, disp, py) * thrEdgeShade(s, t);
  const duv = mesh(clothGeo(duvOpts), M.bedDuvet, { name: 'ms.duvet' });
  b.add(duv);

  // 2. turned-down top edge: the duvet folded back on itself, a band with horizontal creases and a rolled lip
  const bandCr = creaseField(41, 90, { x0: -1.3, x1: 1.3, z0: 0.5, z1: 1.1 }, { len: [0.1, 0.45], width: [0.006, 0.015], amp: [0.002, 0.006], dir: 0, spread: 0.5 });
  const band = mesh(clothGeo({ x0: -hw, x1: hw, z0: 0.6, z1: 0.98, top: duvTop + 0.045, r: 0.13,
    hang: { w: 0.42, e: 0.42, h: 0.05, f: 0.075 }, density: 75, flare: 0.12, maxDrop: 0.4, hem: 0.03, hemIn: 0.015,
    field: (s, t, drop) => bandCr(s, t) + 0.008 * fbm(s * 3, t * 3, 44) * (drop > 0 ? 0.4 : 1), foldAmp: 0.014, foldSeed: 5, foldScale: 10, shade: shadeFn(0) }), M.bedBand, { name: 'ms.duvetBand' });
  b.add(band);

  // 3. pale throw laid loosely over the east half, following the duvet's own folds, spilling down the east side
  const thrCr = creaseField(51, 240, { x0: -0.8, x1: 1.6, z0: 0.8, z1: 2.3 }, { len: [0.15, 0.6], width: [0.01, 0.025], amp: [0.002, 0.007], dir: 0.15, spread: 0.9 });
  const thrShade = shadeFn(0.004);
  const thr = mesh(overlayGeo(duvP, { map: thrMap, nu: 150, nv: 110, sizeU: 1.8, sizeV: 1.1, thick: 0.014,
    lift: (s, t, q) => Math.max(0, thrCr(s, t) + 0.004) + 0.006 * (fbm(s * 3, t * 3, 52) * 0.5 + 0.5),
    shade: (s, t, drop, disp) => thrShade(s, t, drop, disp) }), M.bedThrow, { name: 'ms.throw' });
  b.add(thr);

  // 4. pillows: three euro shams, two sleepers, one accent (the photo's count), in neat rows
  const pil = (w, h, d, mat, x, y, z, tilt, yaw = 0, seed = 0, o = {}) => {
    const m = mesh(pillowGeo(w, h, d, { segs: 30, seed, puff: 1.0, pinch: 0.12, shape: 0.55, crumple: 0.12, sag: 0.05, ...o }), mat);
    m.position.set(x, y, z); m.rotation.set(-tilt, yaw, 0, 'YXZ');
    b.add(m); return m;
  };
  const yb = mTop + 0.03;
  // back row: three euro shams standing against the headboard, slight lean
  pil(0.68, 0.66, 0.22, M.pilEuro, -0.67, yb + 0.31, 0.17, 0.17, 0.0, 1, { crumple: 0.08, sag: 0.03 });
  pil(0.68, 0.66, 0.22, M.pilEuro2, 0.0, yb + 0.315, 0.17, 0.15, 0.0, 2, { crumple: 0.08, sag: 0.03 });
  pil(0.68, 0.66, 0.22, M.pilWhite, 0.67, yb + 0.31, 0.17, 0.18, 0.0, 3, { crumple: 0.08, sag: 0.03 });
  // sleeping pillows leaning on them
  pil(0.92, 0.5, 0.2, M.pilSleepL, -0.47, yb + 0.21, 0.43, 0.42, 0.0, 4, { crumple: 0.1 });
  pil(0.92, 0.5, 0.2, M.pilSleepR, 0.47, yb + 0.21, 0.43, 0.44, 0.0, 5, { crumple: 0.1 });
  // one small muted lumbar pillow at front centre
  pil(0.52, 0.26, 0.13, M.pilLumbar, 0.0, yb + 0.14, 0.66, 0.5, 0.0, 6, { crumple: 0.05 });
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
  M.bedThrow = withMaps(tint(M.throwCream, 0xf4eee5, { name: 'ms.bedThrow' }), throwWeave, 0.9);
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
