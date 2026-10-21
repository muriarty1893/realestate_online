// Shared helpers for the exterior piece: geometry buckets with world-space UVs,
// polygon clipping, beams between points, seeded random, canvas textures.
import * as THREE from 'three';

export const ASSET = 'assets/exterior/';

// ---------------------------------------------------------------- seeded random
export function rng(seed = 1) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}

// ---------------------------------------------------------------- UV projectors (metres)
// wall-like (vertical) face with outward normal n: u along the wall, v = y (same convention as shell.js)
export function wallUV(n) {
  if (n.z > 0.5) return (p) => [p.x, p.y];
  if (n.z < -0.5) return (p) => [-p.x, p.y];
  if (n.x > 0.5) return (p) => [-p.z, p.y];
  if (n.x < -0.5) return (p) => [p.z, p.y];
  return (p) => [p.x, p.z];
}
// sloped face: u horizontal along the eave, v up the slope (so shingle rows follow the eaves)
export function slopeUV(n) {
  const h = new THREE.Vector3(n.x, 0, n.z);
  if (h.lengthSq() < 1e-6) return (p) => [p.x, -p.z];
  h.normalize();
  const uA = new THREE.Vector3(-h.z, 0, h.x); // horizontal, along the eave
  const vA = new THREE.Vector3().crossVectors(n, uA).normalize();
  if (vA.y < 0) vA.negate();
  return (p) => [p.x * uA.x + p.z * uA.z, p.x * vA.x + p.y * vA.y + p.z * vA.z];
}

// ---------------------------------------------------------------- buckets
export class Geo {
  constructor() { this.map = new Map(); }
  get(mat) {
    let b = this.map.get(mat);
    if (!b) { b = { mat, pos: [], nor: [], uv: [], idx: [] }; this.map.set(mat, b); }
    return b;
  }
  // convex planar polygon, points CCW seen from the front (normal side)
  poly(mat, pts, uvf, nrm) {
    if (pts.length < 3) return;
    // UVs are computed in the caller's frame (local when this.xf is set, else world)
    const nl = nrm || polyNormal(pts);
    const f = uvf || wallUV(nl);
    const uvs = pts.map((p) => f(p));
    let n = nl;
    if (this.xf) { pts = pts.map((p) => p.clone().applyMatrix4(this.xf)); n = nl.clone().transformDirection(this.xf); }
    const B = this.get(mat);
    const base = B.pos.length / 3;
    pts.forEach((p, i) => { B.pos.push(p.x, p.y, p.z); B.nor.push(n.x, n.y, n.z); B.uv.push(uvs[i][0], uvs[i][1]); });
    for (let i = 1; i < pts.length - 1; i++) B.idx.push(base, base + i, base + i + 1);
  }
  quad(mat, a, b, c, d, uvf) { this.poly(mat, [a, b, c, d], uvf); }
  // axis-aligned box, all 6 faces, world UVs
  box(mat, x0, y0, z0, x1, y1, z1, { skip = '' } = {}) {
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    if (!skip.includes('pz')) this.poly(mat, [V(x0, y0, z1), V(x1, y0, z1), V(x1, y1, z1), V(x0, y1, z1)]);
    if (!skip.includes('nz')) this.poly(mat, [V(x1, y0, z0), V(x0, y0, z0), V(x0, y1, z0), V(x1, y1, z0)]);
    if (!skip.includes('px')) this.poly(mat, [V(x1, y0, z1), V(x1, y0, z0), V(x1, y1, z0), V(x1, y1, z1)]);
    if (!skip.includes('nx')) this.poly(mat, [V(x0, y0, z0), V(x0, y0, z1), V(x0, y1, z1), V(x0, y1, z0)]);
    if (!skip.includes('py')) this.poly(mat, [V(x0, y1, z1), V(x1, y1, z1), V(x1, y1, z0), V(x0, y1, z0)]);
    if (!skip.includes('ny')) this.poly(mat, [V(x0, y0, z0), V(x1, y0, z0), V(x1, y0, z1), V(x0, y0, z1)]);
  }
  // oriented box: centre c, axes (unit) ax, ay, az with half sizes hx, hy, hz
  obox(mat, c, ax, ay, az, hx, hy, hz) {
    const P = (sx, sy, sz) => c.clone().addScaledVector(ax, sx * hx).addScaledVector(ay, sy * hy).addScaledVector(az, sz * hz);
    const faces = [
      [[1, -1, -1], [1, 1, -1], [1, 1, 1], [1, -1, 1]],
      [[-1, -1, 1], [-1, 1, 1], [-1, 1, -1], [-1, -1, -1]],
      [[-1, 1, -1], [-1, 1, 1], [1, 1, 1], [1, 1, -1]],
      [[-1, -1, 1], [-1, -1, -1], [1, -1, -1], [1, -1, 1]],
      [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]],
      [[1, -1, -1], [-1, -1, -1], [-1, 1, -1], [1, 1, -1]],
    ];
    for (const f of faces) {
      const pts = f.map((s) => P(...s));
      const n = polyNormal(pts);
      // uv along the longest box axis
      const L = hx >= hy && hx >= hz ? ax : hy >= hz ? ay : az;
      const o = Math.abs(n.dot(L)) > 0.9 ? (hx >= hy ? ay : ax) : L;
      const w = new THREE.Vector3().crossVectors(n, o);
      this.poly(mat, pts, (p) => [p.dot(o), p.dot(w)], n);
    }
  }
  // box beam from a to b with cross section w (horizontal-ish side) x h, "up" hint
  beam(mat, a, b, w, h, up = new THREE.Vector3(0, 1, 0)) {
    const d = new THREE.Vector3().subVectors(b, a);
    const len = d.length(); if (len < 1e-5) return;
    const ax = d.clone().normalize();
    let az = new THREE.Vector3().crossVectors(ax, up);
    if (az.lengthSq() < 1e-6) az = new THREE.Vector3().crossVectors(ax, new THREE.Vector3(1, 0, 0));
    az.normalize();
    const ay = new THREE.Vector3().crossVectors(az, ax).normalize();
    const c = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
    this.obox(mat, c, ax, ay, az, len / 2, h / 2, w / 2);
  }
  toMeshes(parent, { cast = true, receive = true, name = 'ext' } = {}) {
    const out = [];
    for (const B of this.map.values()) {
      if (!B.idx.length) continue;
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(B.pos, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(B.nor, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(B.uv, 2));
      g.setIndex(B.idx);
      g.computeBoundingSphere();
      const m = new THREE.Mesh(g, B.mat);
      m.castShadow = cast; m.receiveShadow = receive;
      m.name = name + ':' + (B.mat.name || 'mat');
      parent.add(m); out.push(m);
    }
    this.map.clear();
    return out;
  }
}

export function polyNormal(pts) {
  const n = new THREE.Vector3();
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    n.x += (a.y - b.y) * (a.z + b.z); n.y += (a.z - b.z) * (a.x + b.x); n.z += (a.x - b.x) * (a.y + b.y);
  }
  return n.normalize();
}

// Sutherland-Hodgman: keep points where f(p) >= 0 (f linear in p)
export function clip(pts, f) {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const fa = f(a), fb = f(b);
    if (fa >= 0) out.push(a);
    if ((fa >= 0) !== (fb >= 0)) out.push(a.clone().lerp(b, fa / (fa - fb)));
  }
  return out;
}

export const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------------------------------------------------------------- canvas textures
export function canvasTex(w, h, draw, { srgb = true, repeat = null, mipmaps = true } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (repeat) t.repeat.set(repeat[0], repeat[1]);
  t.anisotropy = 8;
  t.generateMipmaps = mipmaps;
  return t;
}

// height canvas -> normal map canvas texture
export function normalFromHeight(srcCanvas, strength = 2) {
  const w = srcCanvas.width, h = srcCanvas.height;
  const sg = srcCanvas.getContext('2d').getImageData(0, 0, w, h).data;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  const out = g.createImageData(w, h);
  const H = (x, y) => sg[(((y + h) % h) * w + ((x + w) % w)) * 4] / 255;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = (H(x + 1, y) - H(x - 1, y)) * strength, dy = (H(x, y + 1) - H(x, y - 1)) * strength;
    const n = new THREE.Vector3(-dx, dy, 1).normalize();
    const i = (y * w + x) * 4;
    out.data[i] = (n.x * 0.5 + 0.5) * 255; out.data[i + 1] = (n.y * 0.5 + 0.5) * 255; out.data[i + 2] = (n.z * 0.5 + 0.5) * 255; out.data[i + 3] = 255;
  }
  g.putImageData(out, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
  return t;
}
