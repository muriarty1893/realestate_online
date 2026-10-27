// Vegetation: procedural live oaks (tube limbs + alpha leaf-cluster cards + Spanish moss),
// background tree masses, foundation shrubs, flowering mounds, sago palms, liriope, ferns (glTF).
import * as THREE from 'three';
import { rng, V3, ASSET } from './util.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { SimplifyModifier } from 'three/addons/modifiers/SimplifyModifier.js';
import { foliageAtlas, ATLAS, atlasUV, mossTexture, frondTexture, strapTexture } from './vegtex.js';

// ---------------------------------------------------------------- geometry accumulators
class Acc {
  constructor() { this.pos = []; this.nor = []; this.uv = []; this.idx = []; this.col = []; this.shade = 1; }
  get n() { return this.pos.length / 3; }
  vert(p, n, u, v) { this.pos.push(p.x, p.y, p.z); this.nor.push(n.x, n.y, n.z); this.uv.push(u, v); const k = this.shade; this.col.push(k, k, k); }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.setIndex(this.idx);
    g.computeBoundingSphere();
    return g;
  }
}

// tube along a polyline with per-point radius (parallel transport frames), bark UVs in metres
function tube(acc, pts, rad, sides) {
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
      acc.vert(pts[i].clone().addScaledVector(dir, rad[i]), dir, (k / sides) * Math.max(0.3, circ), vlen);
    }
  }
  for (let i = 0; i < N - 1; i++) for (let k = 0; k < sides; k++) {
    const a = base + i * (sides + 1) + k, b = a + sides + 1;
    acc.idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
}

// camera-independent leaf card: quad centred at c with axes u,v (half sizes), normal nrm, atlas cell
function card(acc, c, u, v, nrm, cell) {
  const { u0, u1, v0, v1 } = atlasUV(cell);
  const b = acc.n;
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

// ---------------------------------------------------------------- live oak
// limbs: [{az (deg, 0 = +x, 90 = +z), el0, el1 (deg), len, r}]
function liveOak(seed, base, { trunkH = 3.8, trunkR = 0.6, lean = [0, 0], limbs, leafScale = 1.25, leafDensity = 1, moss = 0, twigLen = 1, leafBand = [0.25, 1], bare = 0.3 }) {
  const R = rng(seed);
  const bark = new Acc(), leaves = new Acc(), mossA = new Acc();
  const center = base.clone().add(V3(0, trunkH + 3, 0));
  const leafCells = ATLAS.oak;
  const addLeaves = (p, size) => {
    const { u, v } = randomCardAxes(R, size * leafScale);
    const dc = p.clone().sub(center);
    leaves.shade = THREE.MathUtils.clamp(0.42 + 0.07 * dc.length() + 0.05 * dc.y + (R() - 0.5) * 0.2, 0.35, 1.05);
    const nrm = p.clone().sub(center).normalize().lerp(V3(0, 1, 0), 0.35).normalize();
    card(leaves, p, u, v, nrm, leafCells[Math.floor(R() * leafCells.length)]);
  };
  const addMoss = (p) => {
    const len = 0.5 + R() * 1.1, w = 0.14 + R() * 0.18;
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
      pts = curve.getSpacedPoints(n).map((q, i) => (i ? q.add(V3((R() - 0.5) * 0.12, (R() - 0.5) * 0.12, (R() - 0.5) * 0.12)) : q));
      rad = pts.map((q, i) => Math.max(0.03, r0 * (1 - 0.8 * (i / n))));
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
    tube(bark, pts, rad, depth === 0 ? 10 : depth === 1 ? 7 : 4);
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
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    const q = base.clone().lerp(top, t).add(V3((R() - 0.5) * 0.15 * t, 0, (R() - 0.5) * 0.15 * t));
    tp.push(q); tr.push(trunkR * (1.35 - 0.45 * t + (t < 0.12 ? 0.35 * (0.12 - t) / 0.12 : 0)));
  }
  tube(bark, tp, tr, 14);
  for (const L of limbs) {
    const start = top.clone().add(V3(0, -0.4 * R(), 0));
    branch(start, L.az ?? 0, L.el0 ?? 0, L.el1 ?? 0, L.len ?? 0, L.r ?? trunkR * 0.55, 0, L.path ?? null, L.leafy ?? 1);
  }
  return { bark, leaves, moss: mossA };
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
    const { u, v } = randomCardAxes(R, 1.6 + R() * 1.6, 0.8);
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

// ---------------------------------------------------------------- build
export async function buildVegetation(ctx, M, parent, site) {
  const G = -0.45;
  const atlas = foliageAtlas();
  const leafMat = new THREE.MeshStandardMaterial({ map: atlas, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.85, metalness: 0,
    emissive: 0x4a4a18, emissiveMap: atlas, emissiveIntensity: 0.35, vertexColors: true, name: 'veg.leaves' });
  const bgLeafMat = leafMat.clone(); bgLeafMat.emissive = new THREE.Color(0x6a6a22); bgLeafMat.emissiveIntensity = 0.5; bgLeafMat.name = 'veg.bgleaves';
  const shrubMat = new THREE.MeshStandardMaterial({ map: atlas, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.8, vertexColors: true, name: 'veg.shrub' });
  const mossMat = new THREE.MeshStandardMaterial({ map: mossTexture(), alphaTest: 0.35, side: THREE.DoubleSide, roughness: 0.95, color: 0xa9ae9e, name: 'veg.moss' });
  const frondMat = new THREE.MeshStandardMaterial({ map: frondTexture(), alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.75, name: 'veg.frond' });
  const strapMat = new THREE.MeshStandardMaterial({ map: strapTexture(), alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.8, name: 'veg.strap' });
  const group = new THREE.Group(); group.name = 'vegetation'; parent.add(group);

  const addTree = (t, name, lm) => {
    const b = new THREE.Mesh(t.bark.geometry(), M.bark); b.castShadow = true; b.receiveShadow = true; b.name = name + ':bark'; group.add(b);
    const l = new THREE.Mesh(t.leaves.geometry(), lm); l.castShadow = true; l.receiveShadow = true; l.name = name + ':leaves'; group.add(l); skipInOverride(l);
    if (t.moss && t.moss.idx.length) { const m = new THREE.Mesh(t.moss.geometry(), mossMat); m.name = name + ':moss'; m.castShadow = false; group.add(m); skipInOverride(m); }
  };

  // left foreground live oak: trunk at the left edge of the frame, main limb arching right over the top
  addTree(liveOak(101, V3(-6.9, G - 0.3, 17), {
    trunkH: 4.3, trunkR: 0.58, lean: [0.35, 0],
    limbs: [
      { path: [[-5.3, 6.0, 16.6], [-3.0, 7.6, 16.0], [0.5, 8.6, 15.5], [4.5, 9.1, 15.0], [7.5, 9.5, 14.6]], r: 0.4, leafy: 0.7 },
      { path: [[-7.6, 6.2, 17.4], [-8.6, 8.2, 18.0], [-9.6, 10.2, 18.6]], r: 0.4 },
      { path: [[-6.2, 6.4, 14.5], [-5.6, 7.9, 11.5], [-4.6, 8.8, 8.5], [-3.2, 9.3, 5.5]], r: 0.34, leafy: 0.6 },
      { path: [[-6.9, 5.6, 19.5], [-6.6, 6.8, 23], [-6.0, 7.4, 26]], r: 0.34 },
      { path: [[-8.5, 5.0, 15.0], [-10.5, 6.2, 12.5], [-12.5, 7.0, 10.5]], r: 0.3 },
    ], leafScale: 1.25, leafDensity: 0.35, moss: 0.04, bare: 0.2,
  }), 'oakL', leafMat);
  // right live oak with Spanish moss beside the bedroom wing, limbs high over the east roof
  addTree(liveOak(202, V3(18.0, G - 0.3, 5.5), {
    trunkH: 5.6, trunkR: 0.5, lean: [-0.3, 0],
    limbs: [
      { path: [[13.4, 8.0, 0.2], [11, 10, -0.5], [8.5, 11, -0.8]], r: 0.34, leafy: 0.8 },
      { path: [[13.6, 8.6, 4.5], [12, 10.2, 9], [10, 10.8, 13]], r: 0.32 },
      { path: [[16.5, 8, 2], [18.5, 10, 4], [20, 11, 7]], r: 0.32 },
      { path: [[16, 8, -2], [17.5, 10, -5], [18.5, 11, -8]], r: 0.3 },
      { path: [[14, 8.5, -2.5], [12.5, 10.5, -5], [11, 11.2, -7]], r: 0.3 },
    ], leafScale: 1.15, leafDensity: 0.4, moss: 0.35, bare: 0.3,
  }), 'oakR', leafMat);
  // a tree just right of the frame whose limbs overhang the top-right corner
  addTree(liveOak(303, V3(18.0, G - 0.3, 21), {
    trunkH: 4.2, trunkR: 0.5,
    limbs: [
      { path: [[15.5, 6.0, 20.5], [12, 7.2, 20], [9, 7.6, 19.5], [6.5, 7.9, 19.2]], r: 0.34 },
      { path: [[16, 6.5, 18], [14, 8.5, 15], [12.5, 9.8, 12]], r: 0.3 },
      { path: [[19, 6.5, 23], [20, 8, 26]], r: 0.3 },
    ], leafScale: 1.1, leafDensity: 0.6, moss: 0.35, bare: 0.2,
  }), 'oakTR', leafMat);

  // background trees behind and beside the house (sunlit from behind: warmer leaves)
  const bgList = [
    [-15, -8, 12.5, 11], [-9, -16, 12.5, 12], [-2, -24, 12, 13], [-20, 0, 13, 10], [-19, 11, 12, 9], [-27, -12, 16, 12], [-15, -28, 14, 13],
    [-24, -8, 13, 10], [-30, -18, 14, 12], [-34, -30, 15, 13],
    [19.5, 3, 7, 6], [20.5, 7.5, 6.5, 6], [24, -1, 9, 7], [22, 2, 10, 8], [24, 8, 9, 8], [21, 11, 8, 7], [26, -4, 12, 9], [16, -6, 13, 9], [18, -14, 15, 11], [14, -18, 13, 10], [17, -10, 14, 11], [31, -16, 16, 12], [9, -24, 11, 12], [3, -20, 9, 10],
  ];
  bgList.forEach(([x, z, h, w], i) => addTree(bgTree(500 + i, V3(x, G, z), { h, w, cards: 520 }), 'bg' + i, bgLeafMat));

  // ---------------- foundation planting: real Poly Haven plants (instanced), low and layered
  const sagos = [], flowers = [];
  const R = rng(4242);
  const front = (x) => (x < -8.1 ? 8.6 : x < -4.42 ? (x > -7.4 && x < -5.2 ? 9.7 : 9.2) : x < -1.14 ? 6.2 : x < 2.72 ? (x > -0.3 && x < 1.8 ? 8.3 : 7.8) : x < 6.44 ? 8.6 : x < 10.25 ? (x > 7.3 && x < 9.5 ? 8.3 : 7.8) : 6.2);
  const U = (a, b) => a + R() * (b - a);
  const P = {};   // plant kind -> placements
  // heights (m) each kind is normalised to; instances then vary 0.8-1.3x. Shrub1 (156k-tri wiry flowering stalks) is dropped.
  const KEEP = 0.9;
  const add = (k, x, z, s, o = {}) => {
    if (k === 'shrub1') k = 'shrub2';
    if (R() > KEEP || (k === 'calathea' && R() < 0.65)) return;
    if (k === 'fern') k = R() < 0.5 ? 'fern' : 'fern';
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
  sagos.push({ p: [-2.1, G, 7.4], s: [1.6, 1.7, 1.6], rot: 0.7 });
  // flowers bordering the walk near the steps
  for (const sx of [-1, 1]) for (let i = 0; i < 12; i++) add(i % 2 ? 'shrub1' : 'periw', 4.58 + sx * (1.5 + R() * 2.4), 9.6 + R() * 2.0, i % 2 ? 1 : 2.4);
  // foreground beds
  const [bedF, bedL, bedR, bedE] = site.beds;
  scatter(bedL, 230, R, (x, z) => add('fern', x, z, U(1.7, 2.6)), (x) => x < -0.5);
  scatter(bedL, 70, R, (x, z) => add('calathea', x, z, U(1.3, 1.9)), (x) => x < 1);
  scatter(bedL, 28, R, (x, z) => add('shrub2', x, z, U(0.6, 0.9)), (x) => x > -9);
  scatter(bedL, 40, R, (x, z) => add('shrub4', x, z, U(2, 3)));
  scatter(bedL, 36, R, (x, z) => add('periw', x, z, U(2.4, 3.4)));
  scatter(bedL, 40, R, (x, z) => add('periw', x, z, U(2.4, 3.4)), (x) => x > -4);
  scatter(bedL, 14, R, (x, z) => add('fern', x, z, U(1.2, 1.7)), (x) => x > -4);
  scatter(bedR, 36, R, (x, z) => add('shrub1', x, z, U(1, 1.5)));
  scatter(bedR, 60, R, (x, z) => add('periw', x, z, U(2.4, 3.2)));
  scatter(bedR, 28, R, (x, z) => add('calathea', x, z, U(1.3, 1.8)));
  scatter(bedR, 24, R, (x, z) => add('fern', x, z, U(1.4, 2)));
  scatter(bedR, 20, R, (x, z) => add('shrub2', x, z, U(0.5, 0.8)));
  scatter(bedE, 28, R, (x, z) => add('shrub2', x, z, U(0.9, 1.5)));
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

  for (const im of [instanced(sagoGeo(21), frondMat, sagos, 'sagos')]) { group.add(im); skipInOverride(im); }

  // ---------------- load the glTF plant kinds and instance them (per-instance tint)
  const KINDS = { fern: 'fern_02', shrub1: 'shrub_01', shrub2: 'shrub_02', shrub4: 'shrub_04', calathea: 'calathea_orbifolia_01', periw: 'periwinkle_plant' };
  const HEIGHT = { fern: 0.6, calathea: 0.5, shrub2: 0.75, shrub4: 0.8, periw: 0.4 };
  const TARGET = { fern: 450, calathea: 500, shrub2: 600, shrub4: 900, periw: 400 };
  for (const [kind, list] of Object.entries(P)) {
    const id = KINDS[kind];
    try {
      const gltf = await ctx.loadGLTF(ASSET + `models/${id}/${id}.gltf`);
      gltf.scene.updateMatrixWorld(true);
      const parts = [];
      gltf.scene.traverse((o) => { if (o.isMesh) parts.push(o); });
      const T0 = performance.now();
      const geos = parts.map((m) => {
        let g = m.geometry.clone(); g.applyMatrix4(m.matrixWorld);
        g.computeBoundingBox(); let bb = g.boundingBox;
        const sc = HEIGHT[kind] / Math.max(0.05, bb.max.y - bb.min.y);
        g.scale(sc, sc, sc);
        const tris = (g.index ? g.index.count : g.attributes.position.count) / 3;
        const want = Math.min(tris, TARGET[kind]);
        if (want < tris) {
          if (!g.index) g = mergeVertices(g);
          g = new SimplifyModifier().modify(g, Math.floor(g.attributes.position.count * (1 - want / tris)));
          g.computeVertexNormals();
        }
        g.computeBoundingBox(); bb = g.boundingBox;
        g.translate(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -(bb.min.z + bb.max.z) / 2);
        return g;
      });
      console.log('[veg] simplified', kind, geos.map((g) => (g.index.count / 3) | 0).join(','), (performance.now() - T0) | 0, 'ms');
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
