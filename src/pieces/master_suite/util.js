// Geometry helpers for the master suite piece.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const BASE = new URL('../../../assets/master_suite/', import.meta.url).href;

export function mesh(geo, mat, { cast = true, receive = true, name } = {}) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = cast; m.receiveShadow = receive;
  if (name) m.name = name;
  return m;
}

// Box-projected UVs in metres. grain = 'x'|'y'|'z': texture V follows that axis where possible.
export function metreUV(geo, grain = 'y') {
  const p = geo.attributes.position, n = geo.attributes.normal;
  const uv = new Float32Array(p.count * 2);
  const ax = { x: 0, y: 1, z: 2 };
  for (let i = 0; i < p.count; i++) {
    const P = [p.getX(i), p.getY(i), p.getZ(i)];
    const N = [Math.abs(n.getX(i)), Math.abs(n.getY(i)), Math.abs(n.getZ(i))];
    const dom = N[0] > N[1] && N[0] > N[2] ? 0 : N[1] > N[2] ? 1 : 2;
    const others = [0, 1, 2].filter((k) => k !== dom);
    const g = ax[grain];
    let vAxis = others.includes(g) ? g : others[1];
    let uAxis = others.find((k) => k !== vAxis);
    uv[i * 2] = P[uAxis]; uv[i * 2 + 1] = P[vAxis];
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return geo;
}

// translate a geometry so its local origin is where we want, then place the mesh
export function box(w, h, d, mat, x = 0, y = 0, z = 0, { grain = 'y', cast = true, receive = true } = {}) {
  const g = metreUV(new THREE.BoxGeometry(w, h, d), grain);
  const m = mesh(g, mat, { cast, receive });
  m.position.set(x, y, z);
  return m;
}
export function rbox(w, h, d, r, mat, x = 0, y = 0, z = 0, { grain = 'y', segs = 3, cast = true, receive = true } = {}) {
  const g = metreUV(new RoundedBoxGeometry(w, h, d, segs, Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4)), grain);
  const m = mesh(g, mat, { cast, receive });
  m.position.set(x, y, z);
  return m;
}

// Pillow: two domed faces meeting at a seam; pointy corners, edges pulled in, soft creases.
export function pillowGeo(w, h, d, { segs = 24, puff = 1, seed = 0, pinch = 0.07, sag = 0.0 } = {}) {
  const geos = [];
  for (const side of [1, -1]) {
    const g = new THREE.PlaneGeometry(2, 2, segs, segs);
    const p = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i);
      const t = Math.pow(Math.max(0, 1 - x * x), 0.42) * Math.pow(Math.max(0, 1 - y * y), 0.42) * puff;
      const crease = 0.06 * Math.sin(x * 3.1 + seed) * Math.sin(y * 2.3 + seed * 1.7) + 0.04 * Math.sin((x + y) * 5 + seed * 3);
      const X = x * (1 - pinch * (1 - y * y)), Y = y * (1 - pinch * (1 - x * x));
      p.setXYZ(i, (X * w) / 2, (Y * h) / 2 - sag * (1 - x * x) * h * 0.5, side * (d / 2) * t * (1 + crease));
      uv.setXY(i, (X * w) / 2 + side * 0.37, (Y * h) / 2);
    }
    if (side < 0) g.scale(-1, 1, 1); // flip winding so the back faces outward
    geos.push(g);
  }
  const m = mergeGeometries(geos, false);
  m.computeVertexNormals();
  return m;
}

// Draped cloth over a rectangular top (local: x across, z along from head (0) to foot (L)).
// top: y of the top surface. hang: side overhang drop length, footHang: foot drop length.
export function drapeGeo({ W, L, z0 = 0, top, side = 0.3, foot = 0.3, r = 0.06, segX = 60, segZ = 60, wrinkle = 0.012, seed = 1, sideMask = [1, 1], floorY = 0.02, footLift = 0, fold = 0.012, foldFreq = 9, skew = 0 }) {
  const sx0 = -W / 2 - side * sideMask[0], sx1 = W / 2 + side * sideMask[1];
  const tz1 = L + foot;
  const g = new THREE.PlaneGeometry(1, 1, segX, segZ);
  const p = g.attributes.position, uv = g.attributes.uv;
  const foldAt = (e) => {
    // distance past the edge -> [outward, down]
    if (e <= 0) return [0, 0];
    const arc = (Math.PI / 2) * r;
    if (e < arc) { const th = e / r; return [r * Math.sin(th), r * (1 - Math.cos(th))]; }
    return [r, r + (e - arc)];
  };
  for (let i = 0; i < p.count; i++) {
    const u = uv.getX(i), v = 1 - uv.getY(i);
    const sl = sx0 + skew * (v - 0.5);
    const s = sl + (sx1 - sl) * u;
    const t = z0 + (tz1 - z0) * v;
    let x = s, z = t, y = top;
    const es = Math.abs(s) - W / 2;
    const [os, ds] = foldAt(es);
    if (es > 0) x = Math.sign(s) * (W / 2 + os);
    const et = t - L;
    const [ot, dt] = foldAt(et);
    if (et > 0) z = L + ot;
    y = top - ds - dt + (et > 0 ? footLift * Math.min(1, et / 0.1) : 0);
    // wrinkles: stronger on hanging parts
    const hang = Math.min(1, (ds + dt) / 0.15);
    const wv = wrinkle * (Math.sin(s * 9 + seed) * Math.sin(t * 5.7 + seed * 1.7) + 0.6 * Math.sin(s * 23 + t * 11 + seed * 3.1));
    const folds = hang * fold * (Math.sin((es > 0 ? t : s) * foldFreq + seed) + 0.4 * Math.sin((es > 0 ? t : s) * foldFreq * 2.3 + seed * 1.3));
    if (es > 0) x += Math.sign(s) * (folds + wv * 0.5);
    if (et > 0) z += folds + wv * 0.5;
    y += (1 - hang) * wv;
    y = Math.max(y, floorY);
    p.setXYZ(i, x, y, z);
    uv.setXY(i, s, t);
  }
  g.computeVertexNormals();
  return g;
}

// Pleated curtain panel hanging in local XY plane (width along X, from y=0 at top downward to -h),
// folds bulge along +Z.
export function curtainGeo(width, height, { folds = 6, depth = 0.05, segX = 64, segY = 24, hem = 0.0, flare = 0.0, seed = 0 } = {}) {
  const g = new THREE.PlaneGeometry(1, 1, segX, segY);
  const p = g.attributes.position, uv = g.attributes.uv;
  const col = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const u = uv.getX(i), v = 1 - uv.getY(i); // v: 0 top, 1 bottom
    const w = width * (1 + flare * v);
    const x = (u - 0.5) * w;
    const ph = u * folds * Math.PI * 2 + seed;
    const f = Math.sin(ph) + 0.25 * Math.sin(ph * 2.3 + v * 3);
    const z = depth * 0.5 * f * (1 + 0.3 * v);
    const y = -v * height;
    p.setXYZ(i, x, y, z);
    uv.setXY(i, u * width * 1.6, -y);
    // translucency proxy: thin crests glow more than the doubled-up valleys
    const c = 0.55 + 0.45 * (0.5 + 0.5 * Math.cos(ph)) * (0.85 + 0.15 * Math.sin(v * 7 + seed));
    col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = c;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}

export function lathe(points, segs = 32) {
  return new THREE.LatheGeometry(points.map(([r, y]) => new THREE.Vector2(r, y)), segs);
}

export function merge(geos) { return mergeGeometries(geos, false); }

// simple seeded rng
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
  t.repeat.set(...repeat);
  t.anisotropy = 8;
  return t;
}
