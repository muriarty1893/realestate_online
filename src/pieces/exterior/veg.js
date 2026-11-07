// Vegetation: procedural live oaks (tube limbs + alpha leaf-cluster cards + Spanish moss),
// background tree masses, foundation shrubs, flowering mounds, sago palms, liriope, ferns (glTF).
import * as THREE from 'three';
import { rng, V3, ASSET } from './util.js';
import { foliageAtlas, oakDenseAtlas, DENSE, ATLAS, atlasUV, mossTexture, frondTexture, strapTexture } from './vegtex.js';

// ---------------------------------------------------------------- geometry accumulators
class Acc {
  constructor() { this.pos = []; this.nor = []; this.uv = []; this.idx = []; this.col = []; this.glw = []; this.cards = []; this.shade = 1; }
  get n() { return this.pos.length / 3; }
  vert(p, n, u, v) { this.pos.push(p.x, p.y, p.z); this.nor.push(n.x, n.y, n.z); this.uv.push(u, v); const k = this.shade; this.col.push(k, k, k); this.glw.push(0); }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.setAttribute('glow', new THREE.Float32BufferAttribute(this.glw, 1));
    g.setIndex(this.idx);
    g.computeBoundingSphere();
    return g;
  }
}

// tube along a polyline with per-point radius (parallel transport frames), bark UVs in metres
function tube(acc, pts, rad, sides, furrow = 0) {
  const N = pts.length;
  const T = [], Nn = [];
  for (let i = 0; i < N; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(N - 1, i + 1)];
    T.push(new THREE.Vector3().subVectors(b, a).normalize());
  }
  let n0 = new THREE.Vector3(0, 1, 0);
  if (Math.abs(T[0].dot(n0)) > 0.9) n0 = new THREE.Vector3(1, 0, 0);
  n0 = new THREE.Vector3().crossVectors(T[0], n0).cross(T[0]).normalize();
  Nn.push(n0);
  for (let i = 1; i < N; i++) {
    const axis = new THREE.Vector3().crossVectors(T[i - 1], T[i]);
    const nn = Nn[i - 1].clone();
    if (axis.lengthSq() > 1e-10) { const ang = Math.acos(THREE.MathUtils.clamp(T[i - 1].dot(T[i]), -1, 1)); nn.applyAxisAngle(axis.normalize(), ang); }
    Nn.push(nn);
  }
  const base = acc.n;
  let vlen = 0;
  for (let i = 0; i < N; i++) {
    if (i > 0) vlen += pts[i].distanceTo(pts[i - 1]);
    const B = new THREE.Vector3().crossVectors(T[i], Nn[i]);
    const circ = 2 * Math.PI * rad[i];
    for (let k = 0; k <= sides; k++) {
      const a = (k / sides) * Math.PI * 2;
      const dir = Nn[i].clone().multiplyScalar(Math.cos(a)).addScaledVector(B, Math.sin(a));
      // furrowed bark: irregular vertical ridges that drift around the trunk
      const fr = furrow ? 1 + furrow * (0.5 * Math.sin(7 * a + 0.9 * Math.sin(i * 0.6)) + 0.3 * Math.sin(13 * a + i * 0.4) + 0.2 * Math.sin(3 * a + 1.7)) : 1;
      acc.vert(pts[i].clone().addScaledVector(dir, rad[i] * fr), dir, (k / sides) * Math.max(0.3, circ), vlen);
    }
  }
  for (let i = 0; i < N - 1; i++) for (let k = 0; k < sides; k++) {
    const a = base + i * (sides + 1) + k, b = a + sides + 1;
    acc.idx.push(a, a + 1, b, b, a + 1, b + 1);   // outward-facing (counter-clockwise seen from outside)
  }
}

// camera-independent leaf card: quad centred at c with axes u,v (half sizes), normal nrm, atlas cell
function card(acc, c, u, v, nrm, cell) {
  const { u0, u1, v0, v1 } = atlasUV(cell);
  const b = acc.n;
  acc.cards.push(c.x, c.y, c.z, b);
  acc.vert(c.clone().sub(u).sub(v), nrm, u0, v0);
  acc.vert(c.clone().add(u).sub(v), nrm, u1, v0);
  acc.vert(c.clone().add(u).add(v), nrm, u1, v1);
  acc.vert(c.clone().sub(u).add(v), nrm, u0, v1);
  acc.idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
}
function randomCardAxes(R, size, tiltUp = 0.4) {
  // random orientation, biased toward facing up/out
  const n = new THREE.Vector3(R() - 0.5, R() * tiltUp + 0.15, R() - 0.5).normalize();
  let t = new THREE.Vector3(0, 1, 0);
  if (Math.abs(n.dot(t)) > 0.95) t = new THREE.Vector3(1, 0, 0);
  const u = new THREE.Vector3().crossVectors(n, t).normalize();
  const v = new THREE.Vector3().crossVectors(u, n).normalize();
  const rot = R() * Math.PI * 2;
  const uu = u.clone().multiplyScalar(Math.cos(rot)).addScaledVector(v, Math.sin(rot));
  const vv = new THREE.Vector3().crossVectors(n, uu).normalize();
  return { u: uu.multiplyScalar(size / 2), v: vv.multiplyScalar(size / 2) };
}

// ---------------------------------------------------------------- canopy light
// Per-card occlusion and translucency from the card cloud itself: cards with many cards above them sit
// in the canopy's shade (darker, cooler); cards in thin, sparse foliage let the low sun through
// (warm yellow-green glow). Written into the vertex colour (tint * shade) and the `glow` attribute.
function shadeCanopy(acc, seed, { dark = 0.34, warm = [1.0, 0.97, 0.80], cool = [0.68, 0.72, 0.70], glow = 0.7 } = {}) {
  const R = rng(seed), C = acc.cards, N = C.length / 4, cell = 1.3, grid = new Map();
  const key = (x, y, z) => `${Math.floor(x / cell)},${Math.floor(y / cell)},${Math.floor(z / cell)}`;
  for (let i = 0; i < N; i++) { const k = key(C[i * 4], C[i * 4 + 1], C[i * 4 + 2]); (grid.get(k) ?? grid.set(k, []).get(k)).push(i); }
  const dens = new Float32Array(N), above = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const x = C[i * 4], y = C[i * 4 + 1], z = C[i * 4 + 2];
    const gx = Math.floor(x / cell), gy = Math.floor(y / cell), gz = Math.floor(z / cell);
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 2; b++) for (let c = -1; c <= 1; c++) {
      const L = grid.get(`${gx + a},${gy + b},${gz + c}`); if (!L) continue;
      for (const j of L) {
        if (j === i) continue;
        const dx = C[j * 4] - x, dy = C[j * 4 + 1] - y, dz = C[j * 4 + 2] - z, h = Math.hypot(dx, dz);
        if (h < 1.3 && Math.abs(dy) < 1.3) dens[i] += 1;
        if (dy > 0.15 && h < 0.5 + dy * 0.6) above[i] += 1;
      }
    }
  }
  const pct = (arr, q) => { const s = Array.from(arr).sort((p, q2) => p - q2); return Math.max(1, s[Math.floor(q * (s.length - 1))]); };
  const dMax = pct(dens, 0.9), aMax = pct(above, 0.85);
  for (let i = 0; i < N; i++) {
    const e = 1 - Math.min(1, above[i] / aMax), sp = 1 - Math.min(1, dens[i] / dMax);
    const sh = (dark + (1 - dark) * e * e) * (0.85 + R() * 0.3);
    const t = THREE.MathUtils.clamp(e * 0.8 + (R() - 0.5) * 0.5, 0, 1);
    const g = glow * Math.pow(sp, 1.3) * (0.35 + 0.65 * e) * (0.6 + R() * 0.8);
    const b = C[i * 4 + 3];
    for (let v = b; v < b + 4; v++) {
      for (let k = 0; k < 3; k++) acc.col[v * 3 + k] = sh * (cool[k] + (warm[k] - cool[k]) * t);
      acc.glw[v] = g;
    }
  }
}

// foliage material: two-sided cards without normal flipping (card normals point out of the crown, so
// undersides seen from below fall into shade), mip-aware alpha so fine leaves don't thin out at a
// distance, and a warm transmitted-light glow (`glow` attribute) scaled by the leaf's own albedo.
function leafMaterial(atlas, name, glowCol, glowK) {
  const m = new THREE.MeshStandardMaterial({ map: atlas, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.9, metalness: 0, vertexColors: true, alphaToCoverage: true, name });
  const uGlow = { value: new THREE.Color(glowCol).multiplyScalar(glowK) };
  m.userData.uGlow = uGlow;
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uGlow = uGlow;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float glow;\nvarying float vGlow;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvGlow = glow;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uGlow;\nvarying float vGlow;')
      .replace('#include <alphatest_fragment>', `{
          vec2 sz = vec2(textureSize(map, 0));
          vec2 dx = dFdx(vMapUv * sz), dy = dFdy(vMapUv * sz);
          float lod = 0.5 * log2(max(max(dot(dx, dx), dot(dy, dy)), 1e-6));
          diffuseColor.a *= 1.0 + max(lod, 0.0) * 0.28;
          float aw = max(fwidth(diffuseColor.a), 0.02);
          diffuseColor.a = clamp((diffuseColor.a - alphaTest) / aw + 0.5, 0.0, 1.0);
          if (diffuseColor.a < 0.003) discard;
        }`)
      .replace('#include <normal_fragment_begin>', THREE.ShaderChunk.normal_fragment_begin.replace('normal *= faceDirection;', ''))
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * uGlow * vGlow;');
  };
  m.customProgramCacheKey = () => 'leafmat-v2';
  m.userData.depth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: atlas, alphaTest: 0.5, side: THREE.DoubleSide });
  return m;
}

// ---------------------------------------------------------------- live oak
// limbs: [{az (deg, 0 = +x, 90 = +z), el0, el1 (deg), len, r}]
function liveOak(seed, base, { trunkH = 3.8, trunkR = 0.6, lean = [0, 0], limbs, leafScale = 1.25, leafDensity = 1, moss = 0, twigLen = 1, leafBand = [0.25, 1], bare = 0.3, furrow = 0.1 }) {
  const R = rng(seed);
  const bark = new Acc(), leaves = new Acc(), mossA = new Acc(), trunk = new Acc();
  const center = base.clone().add(V3(0, trunkH + 3, 0));
  const leafCells = ATLAS.oak;
  const addLeaves = (p, size) => {
    const { u, v } = randomCardAxes(R, size * leafScale);
    const dc = p.clone().sub(center);
    leaves.shade = THREE.MathUtils.clamp(0.42 + 0.07 * dc.length() + 0.05 * dc.y + (R() - 0.5) * 0.2, 0.35, 1.05);
    const nrm = p.clone().sub(center).normalize().lerp(V3(0, 1, 0), 0.35).normalize();
    // live-oak foliage sits on top of its limbs: lift the card so limbs read from below instead of being papered over
    card(leaves, p.clone().add(V3(0, 0.3 * size * leafScale, 0)), u, v, nrm, leafCells[Math.floor(R() * leafCells.length)]);
  };
  const addMoss = (p) => {
    const len = 1.3 + R() * 1.8, w = 0.3 + R() * 0.3;
    const a = R() * Math.PI;
    for (const k of [0, 1]) {
      const ang = a + k * Math.PI / 2;
      const u = V3(Math.cos(ang) * w / 2, 0, Math.sin(ang) * w / 2), v = V3(0, len / 2, 0);
      const c = p.clone().add(V3(0, -len / 2 + 0.05, 0));
      const nrm = V3(Math.sin(ang), 0.3, -Math.cos(ang)).normalize();
      const b = mossA.n;
      mossA.vert(c.clone().sub(u).sub(v), nrm, 0, 0); mossA.vert(c.clone().add(u).sub(v), nrm, 1, 0);
      mossA.vert(c.clone().add(u).add(v), nrm, 1, 1); mossA.vert(c.clone().sub(u).add(v), nrm, 0, 1);
      mossA.idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    }
  };

  // branch: grows from p with az/el profile; spawns children; returns nothing
  function branch(p0, az0, el0, el1, len, r0, depth, path = null, leafy = 1) {
    const seg = depth === 0 ? 0.55 : depth === 1 ? 0.45 : 0.35;
    let pts, rad;
    if (path) {
      // explicit limb: smooth curve through control points (with a little wobble)
      const curve = new THREE.CatmullRomCurve3([p0.clone(), ...path.map((q) => V3(...q))], false, 'centripetal');
      len = curve.getLength();
      const n = Math.max(4, Math.ceil(len / seg));
      pts = curve.getSpacedPoints(n).map((q, i) => (i ? q.add(V3((R() - 0.5) * 0.2, (R() - 0.5) * 0.2, (R() - 0.5) * 0.2)) : q));
      // live-oak limbs stay thick far out, then thin quickly at the tip
      rad = pts.map((q, i) => { const t = i / n; return Math.max(0.04, r0 * (1 - 0.45 * t - 0.4 * t * t * t)); });
      const d = new THREE.Vector3().subVectors(pts[n], pts[n - 1]);
      az0 = THREE.MathUtils.radToDeg(Math.atan2(d.z, d.x));
    } else {
      const n = Math.max(3, Math.ceil(len / seg));
      pts = [p0.clone()]; rad = [r0];
      let p = p0.clone(), az = az0;
      for (let i = 1; i <= n; i++) {
        const t = i / n;
        az += (R() - 0.5) * (depth === 0 ? 10 : 22);
        const el = el0 + (el1 - el0) * t + (R() - 0.5) * 10;
        const a = THREE.MathUtils.degToRad(az), e = THREE.MathUtils.degToRad(el);
        const d = V3(Math.cos(a) * Math.cos(e), Math.sin(e), Math.sin(a) * Math.cos(e));
        p = p.clone().addScaledVector(d, len / n);
        pts.push(p);
        rad.push(Math.max(0.012, r0 * (1 - 0.82 * t)));
      }
    }
    tube(bark, pts, rad, depth === 0 ? 12 : depth === 1 ? 7 : 4, depth === 0 ? 0.06 : 0);
    if (depth >= 2) {
      // twig: leaves along it
      for (let i = 1; i < pts.length; i++) {
        const t = i / (pts.length - 1);
        if (t < leafBand[0]) continue;
        for (let k = 0; k < Math.round(2 * leafDensity); k++) if (R() < leafy) addLeaves(pts[i].clone().add(V3((R() - 0.5) * 0.5, (R() - 0.3) * 0.4, (R() - 0.5) * 0.5)), 0.9 + R() * 0.6);
      }
      return;
    }
    // children along the branch
    const step = depth === 0 ? 1.1 : 0.7;
    for (let s = (depth === 0 ? (path ? 0 : bare * len) : 0) + step * (0.6 + R() * 0.5); s < len * 0.97; s += step * (0.7 + R() * 0.6)) {
      const i = Math.min(pts.length - 1, Math.round((s / len) * (pts.length - 1)));
      const side = R() < 0.5 ? -1 : 1;
      const caz = az0 + side * (30 + R() * 55);
      const cl = (depth === 0 ? 2.2 + R() * 2.8 : 1.0 + R() * 1.4) * twigLen;
      const sub = (s / len);
      if (sub < (depth === 0 ? bare : 0)) continue;
      branch(pts[i], caz, 10 + R() * 40, -15 + R() * 30, cl, rad[i] * 0.55, depth + 1, null, leafy);
      if (moss && R() < moss) addMoss(pts[i].clone().add(V3(0, -rad[i], 0)));
    }
    // leaves on the terminal end of limbs too
    if (depth === 1) for (let i = Math.floor(pts.length * 0.5); i < pts.length; i++) if (R() < leafy) addLeaves(pts[i], 1.0 + R() * 0.5);
    if (moss && depth === 1) for (let i = 1; i < pts.length; i += 2) if (R() < moss) addMoss(pts[i]);
  }

  // trunk
  const tp = [], tr = [];
  const top = base.clone().add(V3(lean[0], trunkH, lean[1]));
  for (let i = 0; i <= 14; i++) {
    const t = i / 14;
    const q = base.clone().lerp(top, t).add(V3(0.22 * Math.sin(t * Math.PI * 1.4) + (R() - 0.5) * 0.08, 0, (R() - 0.5) * 0.08));
    tp.push(q); tr.push(trunkR * (1.35 - 0.45 * t + (t < 0.12 ? 0.35 * (0.12 - t) / 0.12 : 0)));
  }
  tube(trunk, tp, tr, 28, furrow);
  for (const L of limbs) {
    const start = top.clone().add(V3(0, -0.4 * R(), 0));
    branch(start, L.az ?? 0, L.el0 ?? 0, L.el1 ?? 0, L.len ?? 0, L.r ?? trunkR * 0.55, 0, L.path ?? null, L.leafy ?? 1);
  }
  return { bark, leaves, moss: mossA, trunk };
}

// background tree mass: trunk + many leaf cards on a few ellipsoid lobes
function bgTree(seed, base, { h = 14, w = 10, lobes = 6, cards = 450, trunkR = 0.35 }) {
  const R = rng(seed);
  const bark = new Acc(), leaves = new Acc();
  tube(bark, [base.clone(), base.clone().add(V3(0, h * 0.45, 0)), base.clone().add(V3((R() - 0.5) * 2, h * 0.7, 0))], [trunkR, trunkR * 0.75, trunkR * 0.4], 7);
  const centers = [];
  for (let i = 0; i < lobes; i++) centers.push(base.clone().add(V3((R() - 0.5) * w * 0.8, h * (0.45 + R() * 0.45), (R() - 0.5) * w * 0.6)));
  const mid = base.clone().add(V3(0, h * 0.65, 0));
  for (let i = 0; i < cards; i++) {
    const c = centers[Math.floor(R() * lobes)];
    const d = V3(R() - 0.5, R() - 0.4, R() - 0.5).normalize().multiplyScalar(w * (0.12 + R() * 0.22));
    const p = c.clone().add(d);
    leaves.shade = THREE.MathUtils.clamp(0.45 + 0.55 * (d.length() / (w * 0.34)) + 0.03 * (p.y - mid.y) + (R() - 0.5) * 0.2, 0.35, 1.1);
    const { u, v } = randomCardAxes(R, 1.2 + R() * 1.2, 0.8);
    const nrm = p.clone().sub(mid).normalize().lerp(V3(0, 1, 0), 0.3).normalize();
    card(leaves, p, u, v, nrm, R() < 0.5 ? ATLAS.bg[0] : ATLAS.oak[Math.floor(R() * 3)]);
  }
  return { bark, leaves };
}

// shrub geometry (unit-ish ellipsoid of cards), instanced later
function shrubGeo(seed, cells, { cards = 120, rx = 0.5, ry = 0.45, size = 0.42, flat = 0 } = {}) {
  const R = rng(seed);
  const acc = new Acc();
  for (let i = 0; i < cards; i++) {
    const d = V3(R() - 0.5, R() * 0.9 - 0.15, R() - 0.5).normalize();
    const k = 0.55 + R() * 0.45;
    const p = V3(d.x * rx * k, Math.max(0.05, (d.y * 0.5 + 0.5) * ry * 2 * k * (1 - flat)), d.z * rx * k);
    const { u, v } = randomCardAxes(R, size * (0.7 + R() * 0.6), 1.0);
    const nrm = V3(d.x, d.y * 0.8 + 0.5, d.z).normalize();
    acc.shade = THREE.MathUtils.clamp(0.3 + 0.75 * k * (0.55 + 0.45 * d.y) + (R() - 0.5) * 0.15, 0.25, 1.05);
    card(acc, p, u, v, nrm, cells[Math.floor(R() * cells.length)]);
  }
  return acc.geometry();
}

// sago palm / fan plant: arching fronds radiating from the centre
function sagoGeo(seed, { fronds = 16, len = 1.1, w = 0.32, rise = 0.5 } = {}) {
  const R = rng(seed);
  const acc = new Acc();
  for (let i = 0; i < fronds; i++) {
    const a = (i / fronds) * Math.PI * 2 + R() * 0.3;
    const L = len * (0.75 + R() * 0.4);
    const dir = V3(Math.cos(a), 0, Math.sin(a));
    const side = V3(-Math.sin(a), 0, Math.cos(a)).multiplyScalar(w / 2);
    const segs = 5, b = acc.n;
    const el0 = 0.9 + R() * 0.5;
    for (let s = 0; s <= segs; s++) {
      const t = s / segs;
      const p = dir.clone().multiplyScalar(L * t).add(V3(0, 0.12 + L * (Math.sin(el0) * t - 0.55 * t * t) * rise * 2, 0));
      const nrm = V3(dir.x * 0.3, 1, dir.z * 0.3).normalize();
      const ww = 1 - 0.2 * t;
      acc.vert(p.clone().addScaledVector(side, -ww), nrm, 0, t);
      acc.vert(p.clone().addScaledVector(side, ww), nrm, 1, t);
    }
    for (let s = 0; s < segs; s++) { const q = b + s * 2; acc.idx.push(q, q + 1, q + 3, q, q + 3, q + 2); }
  }
  return acc.geometry();
}

// strap-leaf clump: 3 crossed vertical cards
function strapGeo(h = 0.55, w = 0.75) {
  const acc = new Acc();
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI;
    const u = V3(Math.cos(a) * w / 2, 0, Math.sin(a) * w / 2), v = V3(0, h / 2, 0);
    const nrm = V3(Math.sin(a), 0.6, -Math.cos(a)).normalize();
    const c = V3(0, h / 2, 0), b = acc.n;
    acc.vert(c.clone().sub(u).sub(v), nrm, 0, 0); acc.vert(c.clone().add(u).sub(v), nrm, 1, 0);
    acc.vert(c.clone().add(u).add(v), nrm, 1, 1); acc.vert(c.clone().sub(u).add(v), nrm, 0, 1);
    acc.idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
  }
  return acc.geometry();
}

function instanced(geo, mat, list, name, { cast = true } = {}) {
  const im = new THREE.InstancedMesh(geo, mat, list.length);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion();
  list.forEach((it, i) => {
    q.setFromAxisAngle(V3(0, 1, 0), it.rot ?? 0);
    m.compose(V3(...it.p), q, V3(it.s[0], it.s[1], it.s[2]));
    im.setMatrixAt(i, m);
  });
  im.instanceMatrix.needsUpdate = true;
  im.castShadow = cast; im.receiveShadow = true; im.name = name;
  im.computeBoundingSphere();
  return im;
}

// GTAO renders a normal pass with scene.overrideMaterial, which ignores alphaTest: alpha-cut cards would
// show up as solid quads in the AO. Skip foliage in any override pass (shadow maps are unaffected).
export function skipInOverride(obj) {
  obj.traverse((m) => {
    if (!m.isMesh) return;
    m.onBeforeRender = (r, scene, cam, geo) => { if (scene.overrideMaterial) { m.userData._dr = geo.drawRange.count; geo.drawRange.count = 0; } };
    m.onAfterRender = (r, scene, cam, geo) => { if (m.userData._dr !== undefined) { geo.drawRange.count = m.userData._dr; delete m.userData._dr; } };
  });
}

function inPoly(poly, x, z) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i], [xj, zj] = poly[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c;
  }
  return c;
}
function scatter(poly, n, R, fn, filter = () => true) {
  const xs = poly.map((p) => p[0]), zs = poly.map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs);
  let k = 0, guard = 0;
  while (k < n && guard++ < n * 50) {
    const x = x0 + R() * (x1 - x0), z = z0 + R() * (z1 - z0);
    if (inPoly(poly, x, z) && filter(x, z)) { fn(x, z); k++; }
  }
}

// ---------------------------------------------------------------- canopy traced from the photo
// The front view's camera (views.front in exterior.js: pos [4.6, 2.6, 36], fov 31.2, shift [0.149, 0.097],
// 1789x1013 frame). px2w maps a photo pixel and a world depth z back to the world point that lands there,
// so limbs, foliage masses and moss can be laid out where refs/front_view.webp has them.
const CAM = { x: 4.6, y: 2.6, z: 36, W: 1789, H: 1013 };
CAM.f = CAM.H / 2 / Math.tan(THREE.MathUtils.degToRad(31.2) / 2);
CAM.cx = CAM.W * (0.5 + 0.149); CAM.cy = CAM.H * (0.5 + 0.097);
const px2w = (px, py, z) => { const d = CAM.z - z; return V3(CAM.x + (px - CAM.cx) * d / CAM.f, CAM.y + (CAM.cy - py) * d / CAM.f, z); };
const wpx = (z) => (CAM.z - z) / CAM.f;   // metres per pixel at depth z

// foliage coverage of the photo's top 456 px in 24 px cells (0 = sky / roof, 9 = solid leaves)
const CANOPY = [
  '964998417996999999932400174445989998079779999999997999996877322003728999999',
  '999999999999965999979231193698957999368259976778856725498971261029899999999',
  '979999999999734799997986875898863598112016983588999585597994122349999699999',
  '989999999999713999987650555156641698600012795585886059955755736769999899999',
  '999999999999759689617916884027786142140002841568966297206121578899999999999',
  '999999999999996169989978998635539674696463311379860383001330039998899999999',
  '999999999999998889999989878866529993799943000298832854300110139999899999999',
  '999999999999999999997837588811379987599988225257531857600000289999999999899',
  '999999999999999999998489999810379845698899799511033124500004899999999999999',
  '999999999999999999999697999940296932664599977910174311100116999999999999999',
  '999999999999999999999999999986699932924996499900284943001779999999999999999',
  '999999999999999999999999999999994425963995999971267773124589999999999999999',
  '999999999999999999999899999999995658999999999981137300000069999999999999999',
  '999999999999976999999899999999999889999799999820002000000012526599999999999',
  '999999999999996999999999999999999859887499999500000000000000404199999999999',
  '999999999999999999999999999998899528971299983000000000000000100079999999999',
  '999999999999835999999999999779882029430016940000000000000043000039999999999',
  '999999999999845899999999999969731001462000330111100000000599400008999999999',
  '999999999999899999999971222201100004998200000001110100004999840005999999999',
];
// lowest photo row the near canopy may reach at each x (above the roofs, gables and the lit trees behind)
function canopyFloor(px) {
  const L = (x0, y0, x1, y1) => y0 + (y1 - y0) * (px - x0) / (x1 - x0);
  if (px < 150) return 456;
  if (px < 330) return L(150, 420, 330, 250);
  if (px < 790) return 260;
  if (px < 1010) return 430;     // foliage hanging in front of the main ridge and chimney
  if (px < 1520) return 250;
  return 280;                    // right edge: lit trees and moss further back
}
function canopyFill(seed, { k = 0.62 } = {}) {
  const R = rng(seed), acc = new Acc(), C = 24;
  CANOPY.forEach((row, j) => {
    for (let i = 0; i < row.length; i++) {
      const f = +row[i] / 9;
      if (!f) continue;
      let n = Math.pow(f, 1.4) * k * (i * C > 1250 ? 0.45 : 1); n = Math.floor(n) + (R() < n % 1 ? 1 : 0);
      for (let c = 0; c < n; c++) {
        const px = (i + R()) * C, py = (j + R()) * C;
        if (py > canopyFloor(px) - 30) continue;
        // depth: left oak crown, overhanging middle, right trees
        // (low on the left edge they belong to trees behind the big trunk)
        const z = px < 260 && py > 200 ? 10 + R() * 4 : px < 450 ? 14 + R() * 5 : px > 1350 ? 13.5 + R() * 6 : 11 + R() * 6;
        const p = px2w(px, py, z);
        const size = (55 + R() * 70) * wpx(z);
        const nf = V3((R() - 0.5) * 1.1, (R() - 0.5) * 0.9 + 0.1, 0.85).normalize();
        let t = V3(0, 1, 0); const u = new THREE.Vector3().crossVectors(nf, t).normalize(); const v = new THREE.Vector3().crossVectors(u, nf).normalize();
        const rot = R() * Math.PI * 2;
        const uu = u.clone().multiplyScalar(Math.cos(rot)).addScaledVector(v, Math.sin(rot)).multiplyScalar(size / 2);
        const vv = new THREE.Vector3().crossVectors(nf, uu).normalize().multiplyScalar(size / 2);
        acc.shade = 0.75 + R() * 0.3;
        const nrm = V3(nf.x * 0.5, 0.35 + (R() - 0.5) * 0.6, 0.6).normalize();
        card(acc, p, uu, vv, nrm, DENSE[Math.floor(R() * DENSE.length)]);
      }
    }
  });
  return acc;
}
// Spanish moss strand: two crossed ribbons that taper to a point and hang with a curve and sway
function mossStrand(acc, R, p, len, w) {
  const a = R() * Math.PI, N = 5, bend = (R() - 0.5) * 0.35 * len, sway = (R() - 0.5) * 0.15 * len;
  for (const k of [0, 1]) {
    const ang = a + k * Math.PI / 2, ax = Math.cos(ang), az = Math.sin(ang);
    const nrm = V3(az, 0.3, -ax).normalize();
    const b0 = acc.n;
    for (let i = 0; i <= N; i++) {
      const t = i / N, hw = (w / 2) * (1 - 0.82 * t * t) * (0.7 + 0.3 * Math.sin(t * 3.1 + a));
      const dx = bend * t * t + sway * Math.sin(t * 5 + a * 3), c = p.clone().add(V3(dx * ax, -len * t, dx * az));
      acc.vert(c.clone().add(V3(-ax * hw, 0, -az * hw)), nrm, 0, 1 - t);
      acc.vert(c.clone().add(V3(ax * hw, 0, az * hw)), nrm, 1, 1 - t);
    }
    for (let i = 0; i < N; i++) { const q = b0 + i * 2; acc.idx.push(q, q + 1, q + 3, q, q + 3, q + 2); }
  }
}

// ---------------------------------------------------------------- build
export async function buildVegetation(ctx, M, parent, site) {
  const G = -0.45;
  const atlas = foliageAtlas();
  const leafMat = leafMaterial(atlas, 'veg.leaves', 0xffc870, 1.4);
  const bgLeafMat = leafMaterial(atlas, 'veg.bgleaves', 0xffd890, 1.1);
  const shrubMat = new THREE.MeshStandardMaterial({ map: atlas, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.8, vertexColors: true, name: 'veg.shrub' });
  // Spanish moss: soft blended grey veils (unlit so the hanging strands stay pale from both sides)
  const mossMat = new THREE.MeshBasicMaterial({ map: mossTexture(), transparent: true, depthWrite: false, alphaTest: 0.02, side: THREE.DoubleSide, color: 0x74766a, opacity: 0.85, name: 'veg.moss' });
  const frondMat = new THREE.MeshStandardMaterial({ map: frondTexture(), alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.75, name: 'veg.frond' });
  const strapMat = new THREE.MeshStandardMaterial({ map: strapTexture(), alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.8, name: 'veg.strap' });
  const group = new THREE.Group(); group.name = 'vegetation'; parent.add(group);
  // the big left trunk reads mid grey-brown in the photo (skylight off the lawn); lift it by its own bark texture
  const trunkMat = M.bark.clone(); trunkMat.name = 'ext.trunk';
  // (the neutral tone map's toe subtracts the darkest channel, so dark bark needs a bluish lift to stay grey)
  trunkMat.color = new THREE.Color(0x8c8e94);
  trunkMat.emissive = new THREE.Color().setRGB(0.2, 0.22, 0.34); trunkMat.emissiveMap = M.bark.map; trunkMat.emissiveIntensity = 1.0;

  const addTree = (t, name, lm, shadeOpts = {}) => {
    shadeCanopy(t.leaves, name.length * 31 + t.leaves.cards.length, shadeOpts);
    const b = new THREE.Mesh(t.bark.geometry(), M.bark); b.castShadow = true; b.receiveShadow = true; b.name = name + ':bark'; group.add(b);
    if (t.trunk) { const tk = new THREE.Mesh(t.trunk.geometry(), shadeOpts.trunkMat ?? M.bark); tk.castShadow = true; tk.receiveShadow = true; tk.name = name + ':trunk'; group.add(tk); }
    const l = new THREE.Mesh(t.leaves.geometry(), lm); l.castShadow = true; l.receiveShadow = true; l.customDepthMaterial = lm.userData.depth; l.name = name + ':leaves'; group.add(l); skipInOverride(l);
    if (t.moss && t.moss.idx.length) { const m = new THREE.Mesh(t.moss.geometry(), mossMat); m.name = name + ':moss'; m.castShadow = false; m.renderOrder = 2; group.add(m); skipInOverride(m); }
  };

  // left foreground live oak, traced from the photo: a massive trunk at the left edge rising to ~7 m, then
  // thick limbs: one arching right across the top of the frame, a lower one sagging over the roof, one
  // continuing up out of frame, and limbs reaching back over the garage wing, out left and toward the camera
  const PX = (pts) => pts.map(([x, y, z]) => px2w(x, y, z).toArray());
  addTree(liveOak(101, V3(-7.07, G - 0.3, 17), {
    trunkH: 6.45, trunkR: 0.62, lean: [0.2, 0], furrow: 0.14,
    limbs: [
      // two stems from the fork: a leaning one going straight up out of frame on the left, the main one up and right
      { path: PX([[70, 230, 17.2], [55, 80, 17.4], [50, -100, 17.6]]), r: 0.42, leafy: 0.4 },
      { path: PX([[140, 230, 17], [195, 140, 17], [240, 40, 17.2], [275, -100, 17.4]]), r: 0.46, leafy: 0.4 },
      { path: PX([[190, 200, 16.9], [300, 135, 16.6], [420, 98, 16.2], [560, 82, 15.7], [700, 58, 15.2], [820, 22, 14.7], [950, -25, 14.2], [1080, -70, 13.8]]), r: 0.34, leafy: 0.7 },
      { path: PX([[150, 260, 17], [290, 215, 16.8], [400, 168, 16.4], [520, 140, 15.9], [650, 148, 15.4], [770, 190, 14.9], [870, 245, 14.4]]), r: 0.25, leafy: 0.8 },
      { path: [[-6.4, 6.6, 14.5], [-5.4, 8.6, 11], [-4.4, 9.6, 8]], r: 0.28, leafy: 0.6 },
      { path: [[-8.5, 6.6, 16], [-10.5, 8.0, 14], [-12.5, 9.0, 12.5]], r: 0.26 },
      { path: [[-7.0, 6.8, 19.5], [-6.6, 8.2, 22], [-6.2, 9.0, 24.5]], r: 0.26 },
    ], leafScale: 1.25, leafDensity: 0.35, moss: 0.06, bare: 0.2,
  }), 'oakL', leafMat, { trunkMat });
  // right live oak with Spanish moss beside the bedroom wing, limbs high over the east roof
  addTree(liveOak(202, V3(18.0, G - 0.3, 5.5), {
    trunkH: 5.6, trunkR: 0.5, lean: [-0.3, 0],
    limbs: [
      { path: [[13.4, 8.0, 0.2], [11, 10, -0.5], [8.5, 11, -0.8]], r: 0.34, leafy: 0.8 },
      { path: [[13.6, 8.6, 4.5], [12, 10.2, 9], [10, 10.8, 13]], r: 0.32 },
      { path: [[16.5, 8, 2], [18.5, 10, 4], [20, 11, 7]], r: 0.32 },
      { path: [[16, 8, -2], [17.5, 10, -5], [18.5, 11, -8]], r: 0.3 },
      { path: [[14, 8.5, -2.5], [12.5, 10.5, -5], [11, 11.2, -7]], r: 0.3 },
    ], leafScale: 1.15, leafDensity: 0.4, moss: 0.2, bare: 0.3,
  }), 'oakR', leafMat, { dark: 0.4 });
  // a tree just right of the frame whose limbs overhang the top-right corner
  addTree(liveOak(303, V3(18.0, G - 0.3, 21), {
    trunkH: 4.2, trunkR: 0.5,
    limbs: [
      // the thick limb rising from the right edge to the top centre
      { path: PX([[2000, 330, 20.5], [1789, 255, 20], [1640, 185, 19.5], [1480, 115, 19], [1330, 55, 18.5], [1180, -5, 18], [1040, -70, 17.5]]), r: 0.32 },
      { path: [[16, 6.5, 18], [14, 8.5, 15], [12.5, 9.8, 12]], r: 0.3 },
      { path: [[19, 6.5, 23], [20, 8, 26]], r: 0.3 },
    ], leafScale: 1.1, leafDensity: 0.35, moss: 0.22, bare: 0.2,
  }), 'oakTR', leafMat, { dark: 0.4 });

  // dense canopy fill where the photo has foliage across the top of the frame (traced coverage mask),
  // plus heavier Spanish moss hanging from the right-hand limbs
  {
    const denseMat = leafMaterial(oakDenseAtlas(), 'veg.canopy', 0xd8dca8, 1.0);
    const acc = canopyFill(77);
    shadeCanopy(acc, 4077, { dark: 0.62, glow: 0.35, warm: [1.0, 0.96, 0.78], cool: [0.70, 0.73, 0.74] });
    const l = new THREE.Mesh(acc.geometry(), denseMat); l.castShadow = true; l.receiveShadow = true; l.customDepthMaterial = denseMat.userData.depth;
    l.name = 'canopy:leaves'; group.add(l); skipInOverride(l);
    const MR = rng(919), mo = new Acc();
    const strand = (px, py, lpx, z) => mossStrand(mo, MR, px2w(px, py, z), lpx * wpx(z), (16 + MR() * 22) * wpx(z));
    for (let i = 0; i < 40; i++) strand(1360 + MR() * 440, MR() * 200, 120 + MR() * 220, 13 + MR() * 6);
    for (let i = 0; i < 2; i++) strand(1190 + MR() * 60, 215 + MR() * 50, 40 + MR() * 40, 14 + MR() * 2);
    for (let i = 0; i < 4; i++) strand(300 + MR() * 50, 30 + MR() * 40, 70 + MR() * 60, 16);
    const cm = mossMat.clone(); cm.color.set(0x8c8c76); cm.opacity = 0.7;
    const m = new THREE.Mesh(mo.geometry(), cm); m.name = 'canopy:moss'; m.renderOrder = 2; group.add(m); skipInOverride(m);
  }

  // background trees behind and beside the house (sunlit from behind: warmer leaves)
  const bgList = [
    [-22, -8, 12.5, 11], [-9, -16, 12.5, 12], [-2, -24, 12, 13], [-20, 0, 13, 10], [-19, 11, 12, 9], [-27, -12, 16, 12], [-15, -28, 14, 13],
    [-24, -8, 13, 10], [-30, -18, 14, 12], [-34, -30, 15, 13],
    [19.5, 3, 7, 6], [20.5, 7.5, 6.5, 6], [24, -1, 9, 7], [22, 2, 10, 8], [24, 8, 9, 8], [21, 11, 8, 7], [26, -4, 12, 9], [16, -6, 13, 9], [18, -14, 15, 11], [14, -18, 13, 10], [17, -10, 14, 11], [31, -16, 16, 12], [9, -24, 11, 12], [3, -20, 9, 10],
  [16.5, 0, 11, 8], [17, -4, 12, 8],
    // low, dense shrub masses filling the lawn gap right of the bedroom wing (dark round shrubs in the photo)
    [15.9, 6.5, 4.2, 4.6], [16.8, 2.5, 5.0, 5.0],
  ];
  bgList.forEach(([x, z, h, w], i) => addTree(bgTree(500 + i, V3(x, G, z), { h, w, cards: 520 }), 'bg' + i, bgLeafMat, { dark: 0.35, glow: 2.6, cool: [0.66, 0.70, 0.66] }));

  // ---------------- foundation planting: real Poly Haven plants (instanced), low and layered
  const sagos = [], flowers = [], blooms = [];
  const R = rng(4242);
  const front = (x) => (x < -8.1 ? 8.6 : x < -4.42 ? (x > -7.4 && x < -5.2 ? 9.7 : 9.2) : x < -1.14 ? 6.2 : x < 2.72 ? (x > -0.3 && x < 1.8 ? 8.3 : 7.8) : x < 6.44 ? 8.6 : x < 10.25 ? (x > 7.3 && x < 9.5 ? 8.3 : 7.8) : 6.2);
  const U = (a, b) => a + R() * (b - a);
  const P = {};   // plant kind -> placements
  // heights (m) each kind is normalised to; instances then vary 0.8-1.3x. Shrub1 (156k-tri wiry flowering stalks) is dropped.
  const KEEP = 0.9;
  const add = (k, x, z, s, o = {}) => {
    if (k === 'shrub1') k = 'shrub2';
    if (R() > KEEP || (k === 'calathea' && R() < 0.65)) return;
    if (k === 'periw' && R() < 0.6) return;
    const g = U(1.1, 1.8), h = g * U(0.85, 1.1);
    (P[k] ??= []).push({ p: [x, G, z], s: [g, h, g], rot: R() * 6.28, tint: o.tint ?? U(0.85, 1.1), hue: o.hue ?? 0 });
  };
  const onWalk = (x, pad = 0) => x > 2.7 - pad && x < 6.4 + pad;
  // against the facade: low, separated clumps with stone showing between
  const kinds = ['shrub2', 'calathea', 'fern', 'shrub4', 'periw', 'shrub2', 'calathea'];
  for (let x = -12.6, i = 0; x < 13; x += U(0.3, 0.55), i++) {
    if (onWalk(x, 0.2) || R() < 0.12) continue;
    const z = front(x) + U(0.55, 0.9);
    const k = kinds[(i * 3 + Math.floor(R() * 3)) % kinds.length];
    add(k, x, z, k === 'fern' ? U(1.0, 1.4) : k === 'shrub2' ? U(0.38, 0.55) : k === 'calathea' ? U(1.1, 1.5) : k === 'periw' ? U(2.2, 3) : U(1.6, 2.2));
  }
  // front edge of the bed: tiny flowering shrubs and periwinkle, tight to the mulch edge
  for (let x = -12.6; x < 13; x += U(0.5, 0.9)) {
    if (onWalk(x, 0.5)) continue;
    const z = Math.max(front(x) + 1.7, 10.2) + U(0, 0.5);
    if (R() < 0.3) add('shrub1', x, z, U(0.8, 1.1)); else add('periw', x, z, U(2.2, 3));
  }
  // palms by the steps and left of the dining bay, big fan palm
  sagos.push({ p: [2.3, G, 9.1], s: [0.9, 0.9, 0.9], rot: 0.3 }, { p: [6.9, G, 9.2], s: [0.9, 0.9, 0.9], rot: 1.2 });
  sagos.push({ p: [-2.1, G, 7.4], s: [1.6, 1.7, 1.6], rot: 0.7 }, { p: [1.0, G, 8.4], s: [1.9, 2.1, 1.9], rot: 2.0 });
  // flowers bordering the walk near the steps
  for (const sx of [-1, 1]) for (let i = 0; i < 8; i++) add(i % 2 ? 'shrub1' : 'periw', 4.58 + sx * (1.5 + R() * 2.4), 9.6 + R() * 2.0, i % 2 ? 1 : 2.4);
  // foreground beds
  const [bedF, bedL, bedR, bedE] = site.beds;
  scatter(bedL, 75, R, (x, z) => add('fern', x, z, U(1.8, 2.6)), (x) => x < -9 || x > -3);
  scatter(bedL, 80, R, (x, z) => add('calathea', x, z, U(1.0, 1.5)));
  scatter(bedL, 40, R, (x, z) => add('shrub2', x, z, U(0.5, 0.8)));
  scatter(bedL, 28, R, (x, z) => add('shrub4', x, z, U(1.0, 1.6)));
  scatter(bedL, 70, R, (x, z) => add('periw', x, z, U(2.2, 3.0)));
  scatter(bedL, 0, R, (x, z) => blooms.push({ p: [x, G + 0.1, z], s: [U(0.9, 1.4), U(0.7, 1.1), U(0.9, 1.4)], rot: R() * 6.28 }));
  scatter(bedR, 48, R, (x, z) => add('shrub1', x, z, U(0.6, 0.9)));
  scatter(bedR, 60, R, (x, z) => add('periw', x, z, U(2.2, 3.0)));
  scatter(bedR, 50, R, (x, z) => add('calathea', x, z, U(1.0, 1.5)));
  scatter(bedR, 30, R, (x, z) => add('fern', x, z, U(1.4, 2.0)));
  scatter(bedR, 45, R, (x, z) => add('shrub2', x, z, U(0.5, 0.8)));
  scatter(bedR, 0, R, (x, z) => blooms.push({ p: [x, G + 0.1, z], s: [U(0.9, 1.4), U(0.7, 1.1), U(0.9, 1.4)], rot: R() * 6.28 }));
  scatter(bedE, 20, R, (x, z) => add('shrub2', x, z, U(0.9, 1.5)));
  for (const [x, z, k] of [[13.4, 8.5, 1.5], [14.6, 6.5, 1.7], [12.8, 10.8, 1.2], [15.8, 9.5, 1.4], [16.6, 6, 1.6]]) add('shrub2', x, z, k);
  void bedF;
  // low stacked-stone wainscot along the base of the front walls
  {
    const segs = [[-12, -8.1, 8.6], [-8.1, -7.4, 9.2], [-5.2, -4.42, 9.2], [-4.42, -1.14, 6.2], [-1.14, -0.3, 7.8], [1.8, 2.72, 7.8], [6.44, 7.3, 8.6], [9.5, 10.25, 7.8], [10.25, 13, 6.2]];
    for (const [x0, x1, z] of segs) {
      const sm = M.stone.clone(); sm.map = M.stone.map.clone(); sm.map.needsUpdate = true;
      const b = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, 0.62, 0.1), sm);
      const uv = b.geometry.attributes.uv, ps = b.geometry.attributes.position;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, ps.getX(i) + x0, ps.getY(i));
      b.position.set((x0 + x1) / 2, G + 0.31, z + 0.04); b.castShadow = true; b.receiveShadow = true; b.name = 'wainscot'; group.add(b);
    }
  }

  // dense, low boxwood-like mounds hugging the stone band (below the sills), blooming mounds and strap clumps in the beds
  const boxes = [], straps = [];
  for (let x = -12.7; x < 13.2; x += U(0.45, 0.75)) {
    if (onWalk(x, 0.35) || R() < 0.1) continue;
    const h = U(0.75, 1.15);
    boxes.push({ p: [x, G - 0.02, front(x) + U(0.45, 0.8)], s: [U(0.9, 1.3), h, U(0.9, 1.3)], rot: R() * 6.28 });
    if (R() < 0.5) boxes.push({ p: [x + U(-0.3, 0.3), G - 0.02, front(x) + U(1.2, 1.7)], s: [U(0.7, 1), h * 0.7, U(0.7, 1)], rot: R() * 6.28 });
  }
  for (const sx of [-1, 1]) for (let i = 0; i < 9; i++) boxes.push({ p: [4.58 + sx * (1.0 + i * 0.28 + U(0, .15)), G - 0.02, 9.9 + U(0, 1)], s: [0.8, 0.7, 0.8], rot: R() * 6.28 });
  for (const bed of [bedE]) {
    scatter(bed, bed === bedE ? 10 : 90, R, (x, z) => blooms.push({ p: [x, G, z], s: [U(0.8, 1.3), U(0.7, 1.1), U(0.8, 1.3)], rot: R() * 6.28 }));
    scatter(bed, bed === bedE ? 10 : 70, R, (x, z) => straps.push({ p: [x, G, z], s: [U(0.9, 1.5), U(0.9, 1.6), U(0.9, 1.5)], rot: R() * 6.28 }));
  }
  scatter(site.beds[0], 0, R, (x, z) => blooms.push({ p: [x, G, z], s: [0.7, 0.6, 0.7], rot: R() * 6.28 }), (x, z) => z > front(x) + 1.3 && !onWalk(x, 0.6));
  for (const [geo, mat, list, nm] of [[shrubGeo(31, ATLAS.box, { cards: 100, rx: 0.4, ry: 0.4, size: 0.4 }), shrubMat, boxes, 'boxwood'],
    [shrubGeo(32, [...ATLAS.box, ...ATLAS.flower, ...ATLAS.flower], { cards: 110, rx: 0.35, ry: 0.3, size: 0.36 }), shrubMat, blooms, 'blooms'],
    [strapGeo(0.6, 0.85), strapMat, straps, 'hosta']]) { const im = instanced(geo, mat, list, nm); group.add(im); skipInOverride(im); }

  // flower clusters: hydrangea/impatiens-like heads of 5 cm blooms on stems, grouped 20-40 cm wide
  {
    const fr = rng(777), acc = []; const cols = [[1, .55, .7], [.95, .35, .55], [1, .92, .95], [1, .75, .82], [.55, .8, .45]];
    const pos = [], col = [], idx = []; let vn = 0;
    const o = new THREE.OctahedronGeometry(1, 0); const op = o.attributes.position;
    for (let h = 0; h < 3; h++) {
      const base = [[1, .55, .7], [1, .93, .96], [.95, .4, .6]][h];
      for (let b = 0; b < 26; b++) {
        const a = fr() * 6.28, rr = Math.sqrt(fr()) * 0.17, c = [Math.cos(a) * rr, 0.32 + (0.12 - rr * 0.4) + fr() * 0.07, Math.sin(a) * rr], sz = 0.028 + fr() * 0.015;
        const k = 0.85 + fr() * 0.25;
        for (let i = 0; i < op.count; i++) { pos.push(c[0] + op.getX(i) * sz, c[1] + op.getY(i) * sz * 0.8, c[2] + op.getZ(i) * sz); col.push(base[0] * k, base[1] * k, base[2] * k); }
      }
      for (let st = 0; st < 0; st++) { // leaves/stem fill: dark-green tufts under the head
        const a = fr() * 6.28, rr = fr() * 0.15; const c = [Math.cos(a) * rr, 0.14 + fr() * 0.12, Math.sin(a) * rr], sz = 0.07 + fr() * 0.04;
        for (let i = 0; i < op.count; i++) { pos.push(c[0] + op.getX(i) * sz, c[1] + op.getY(i) * sz, c[2] + op.getZ(i) * sz); col.push(.25, .5, .2); }
      }
      void vn; void idx; void acc;
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos.splice(0), 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col.splice(0), 3)); g.computeVertexNormals();
      const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, emissive: 0x401a20, emissiveIntensity: 0.25, flatShading: true, name: 'veg.flowerhead' });
      const list = [];
      const place = (x, z, sc) => list.push({ p: [x, G, z], s: [sc, sc * U(0.9, 1.3), sc], rot: R() * 6.28 });
      for (const bed of [bedL, bedR]) scatter(bed, 22, R, (x, z) => place(x, z, U(0.8, 1.3)), (x, z) => !onWalk(x, 0.5));
      if (h === 0) for (let x = -12.4; x < 13; x += U(1.2, 2.2)) if (!onWalk(x, 0.4)) place(x, front(x) + U(1.5, 2.2), U(1, 1.5));
      const im = instanced(g, m, list, 'flowerheads' + h); group.add(im);
    }
  }
  for (const im of [instanced(sagoGeo(21), frondMat, sagos, 'sagos')]) { group.add(im); skipInOverride(im); }

  // ---------------- load the glTF plant kinds and instance them (per-instance tint)
  const KINDS = { fern: 'fern_02', shrub1: 'shrub_01', shrub2: 'shrub_02', shrub4: 'shrub_04', calathea: 'calathea_orbifolia_01', periw: 'periwinkle_plant' };
  for (const [kind, list] of Object.entries(P)) {
    const id = KINDS[kind];
    try {
      const gltf = await ctx.loadGLTF(ASSET + `models_baked/${id}.glb`);   // pre-simplified, normalised, centred (tools/bake_plants.mjs)
      const parts = [];
      gltf.scene.traverse((o) => { if (o.isMesh) parts.push(o); });
      const geos = parts.map((m) => m.geometry);
      // variants are separate meshes (fern/shrub_02/calathea): split the list among them; single meshes get all
      const per = geos.map(() => []);
      list.forEach((it, i) => per[i % geos.length].push(it));
      geos.forEach((g, k) => {
        if (!per[k].length) return;
        const mat = parts[k].material.clone(); mat.side = THREE.DoubleSide;
        if (mat.transparent) { mat.transparent = false; mat.alphaTest = 0.5; }
        else mat.alphaTest = 0.5;
        mat.depthWrite = true; mat.name = 'veg.' + id;
        mat.color.setRGB(0.8, 0.85, 0.75);
        const im = instanced(g, mat, per[k], id);
        const c = new THREE.Color();
        per[k].forEach((it, i) => { c.setRGB(it.tint, it.tint * 1.02, it.tint * 0.95); im.setColorAt(i, c); });
        im.instanceColor.needsUpdate = true;
        group.add(im); skipInOverride(im);
      });
    } catch (e) { console.warn('plant load failed', id, e); }
  }

  return group;
}
