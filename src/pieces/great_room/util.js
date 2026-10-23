// Geometry helpers for the great room piece (metre UVs, boxes, rounded boxes, lathe, cushions).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const ASSET = new URL('../../../assets/great_room/', import.meta.url).href;
export { mergeGeometries };

export function mesh(geo, mat, { cast = true, receive = true, name } = {}) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = cast; m.receiveShadow = receive;
  if (name) m.name = name;
  return m;
}

// Box-projected UVs in metres (object space). grain = axis that texture V follows where possible.
export function metreUV(geo, grain = 'y', { scale = 1, off = [0, 0, 0] } = {}) {
  const p = geo.attributes.position, n = geo.attributes.normal;
  const uv = new Float32Array(p.count * 2);
  const ax = { x: 0, y: 1, z: 2 };
  const g = ax[grain];
  for (let i = 0; i < p.count; i++) {
    const P = [p.getX(i) + off[0], p.getY(i) + off[1], p.getZ(i) + off[2]];
    const N = [Math.abs(n.getX(i)), Math.abs(n.getY(i)), Math.abs(n.getZ(i))];
    const dom = N[0] >= N[1] && N[0] >= N[2] ? 0 : N[1] >= N[2] ? 1 : 2;
    const others = [0, 1, 2].filter((k) => k !== dom);
    const vAxis = others.includes(g) ? g : others[1];
    const uAxis = others.find((k) => k !== vAxis);
    uv[i * 2] = P[uAxis] * scale; uv[i * 2 + 1] = P[vAxis] * scale;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return geo;
}

// axis-aligned box from min/max corners (metres, world or parent space)
export function boxMM(x0, y0, z0, x1, y1, z1, mat, opt = {}) {
  const w = Math.abs(x1 - x0), h = Math.abs(y1 - y0), d = Math.abs(z1 - z0);
  const g = new THREE.BoxGeometry(w, h, d);
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, cz = (z0 + z1) / 2;
  metreUV(g, opt.grain || 'y', { off: opt.worldUV ? [cx, cy, cz] : [0, 0, 0] });
  const m = mesh(g, mat, opt);
  m.position.set(cx, cy, cz);
  return m;
}
export function box(w, h, d, mat, x = 0, y = 0, z = 0, opt = {}) {
  const g = metreUV(new THREE.BoxGeometry(w, h, d), opt.grain || 'y');
  const m = mesh(g, mat, opt);
  m.position.set(x, y, z);
  return m;
}
export function rbox(w, h, d, r, mat, x = 0, y = 0, z = 0, opt = {}) {
  const rr = Math.max(0.001, Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4));
  const g = metreUV(new RoundedBoxGeometry(w, h, d, opt.segs ?? 3, rr), opt.grain || 'y');
  const m = mesh(g, mat, opt);
  m.position.set(x, y, z);
  return m;
}
export function cyl(rt, rb, h, mat, x = 0, y = 0, z = 0, opt = {}) {
  const g = new THREE.CylinderGeometry(rt, rb, h, opt.seg ?? 20, 1, opt.open ?? false);
  const m = mesh(g, mat, opt);
  m.position.set(x, y, z);
  return m;
}

// Soft cushion: subdivided box whose faces bulge outward. Local origin at the centre.
export function cushionGeo(w, h, d, { segs = 10, bulge = 0.25, round = 0.35, seed = 0, wrinkle = 0.0 } = {}) {
  const g = new THREE.BoxGeometry(1, 1, 1, segs, Math.max(2, Math.round(segs * h / w)), segs);
  const p = g.attributes.position;
  const rnd = (a, b) => Math.sin(a * 12.9898 + b * 78.233 + seed * 3.1) * 43758.5453 % 1;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i) * 2, y = p.getY(i) * 2, z = p.getZ(i) * 2;
    // round the box toward a superellipsoid
    const ax = Math.abs(x), ay = Math.abs(y), az = Math.abs(z);
    const k = round;
    const sx = 1 - k * 0.25 * (ay * ay + az * az) * ax * ax;
    const sy = 1 - k * 0.25 * (ax * ax + az * az) * ay * ay;
    const sz = 1 - k * 0.25 * (ax * ax + ay * ay) * az * az;
    // bulge top/bottom and front/back faces
    const by = 1 + bulge * (1 - ax * ax) * (1 - az * az) * ay;
    const bz = 1 + bulge * 0.5 * (1 - ax * ax) * (1 - ay * ay) * az;
    let X = x * sx, Y = y * sy * by, Z = z * sz * bz;
    if (wrinkle) { const n = Math.sin(x * 7 + seed) * Math.sin(z * 6 + seed * 1.7) + 0.5 * Math.sin(x * 13 + z * 11 + seed); Y += wrinkle * n * (y > 0 ? 1 : 0); }
    p.setXYZ(i, (X * w) / 2, (Y * h) / 2, (Z * d) / 2);
  }
  g.computeVertexNormals();
  metreUV(g, 'x');
  return g;
}

// Throw pillow: thick in the middle, pinched at the edges. Faces +Z.
export function pillowGeo(w, h, d, { segs = 18, seed = 0, puff = 1 } = {}) {
  const g = new THREE.BoxGeometry(1, 1, 1, segs, segs, 3);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i) * 2, y = p.getY(i) * 2, z = p.getZ(i) * 2;
    const fx = 1 - Math.pow(Math.abs(x), 3), fy = 1 - Math.pow(Math.abs(y), 3);
    let t = Math.max(0.05, Math.pow(Math.max(0, fx * fy), 0.6)) * puff;
    // soft crease across the top ("karate chop") and a slumped, flatter lower edge
    const chop = Math.exp(-(x * x) / 0.05) * Math.max(0, y) * 0.32;
    t *= 1 - chop;
    t *= 1 - 0.18 * Math.max(0, -y);
    const nn = 0.06 * Math.sin(x * 4.3 + seed) * Math.sin(y * 3.7 + seed * 2.1) + 0.035 * Math.sin(x * 9.1 + y * 7.3 + seed * 1.3);
    // pinch the corners inward and let the sides sag
    const cr = Math.abs(x * y);
    x *= 1 - 0.07 * y * y - 0.06 * cr; y *= 1 - 0.07 * x * x - 0.06 * cr - 0.04 * Math.max(0, y);
    p.setXYZ(i, (x * w) / 2, (y * h) / 2, (z * d) / 2 * t + nn * d * 0.35 * Math.sign(z));
  }
  g.computeVertexNormals();
  const uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i), p.getY(i));
  return g;
}

// seeded random
export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

// canvas texture helper
export function canvasTex(w, h, draw, { srgb = true, repeat = [1, 1] } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.anisotropy = 8;
  return t;
}

// merge many meshes sharing one material into a single mesh (keeps draw calls low)
export function mergeByMaterial(group) {
  const buckets = new Map();
  group.updateMatrixWorld(true);
  const out = new THREE.Group();
  group.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh) return;
    const key = o.material.uuid + (o.castShadow ? 'c' : '');
    if (!buckets.has(key)) buckets.set(key, { mat: o.material, cast: o.castShadow, geos: [] });
    const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    g.applyMatrix4(o.matrixWorld);
    buckets.get(key).geos.push(g);
  });
  for (const b of buckets.values()) {
    const g = mergeGeometries(b.geos, false);
    const m = new THREE.Mesh(g, b.mat);
    m.castShadow = b.cast; m.receiveShadow = true;
    out.add(m);
  }
  return out;
}
