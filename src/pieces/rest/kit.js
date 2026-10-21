// Shared toolkit for the "rest of house" piece: merged-geometry batching, procedural
// geometry (rounded/soft boxes, pillows, curtains, basins) and procedural canvas textures.
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

export const ASSET = 'assets/rest/';
const V3 = THREE.Vector3;

// ---------------------------------------------------------------- small utils
export function rng(seed = 1) {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// planar UVs in metres, chosen per vertex from the dominant normal axis
export function planarUV(g, s = 1, ox = 0, oy = 0) {
  const p = g.attributes.position, n = g.attributes.normal;
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) * s, y = p.getY(i) * s, z = p.getZ(i) * s;
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
    let u, v;
    if (ay >= ax && ay >= az) { u = x; v = z; } else if (ax >= az) { u = z; v = y; } else { u = x; v = y; }
    uv[2 * i] = u + ox; uv[2 * i + 1] = v + oy;
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return g;
}

function normalize(g) {
  for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'uv') g.deleteAttribute(k);
  if (!g.attributes.normal) g.computeVertexNormals();
  if (!g.attributes.uv) planarUV(g);
  if (!g.index) {
    const n = g.attributes.position.count;
    const idx = new (n > 65535 ? Uint32Array : Uint16Array)(n);
    for (let i = 0; i < n; i++) idx[i] = i;
    g.setIndex(new THREE.BufferAttribute(idx, 1));
  }
  g.morphAttributes = {};
  g.clearGroups();
  return g;
}

// ---------------------------------------------------------------- batching
// Collects geometry per material and merges it into one mesh per material on flush().
export class Batch {
  constructor() { this.map = new Map(); this.tris = 0; this.meshes = []; }
  add(geo, mat, m4, cast = true) {
    const g = normalize(geo.clone());
    g.applyMatrix4(m4);
    const key = mat.uuid + (cast ? ':c' : ':n');
    let e = this.map.get(key);
    if (!e) this.map.set(key, (e = { mat, cast, geos: [] }));
    e.geos.push(g);
  }
  flush(parent, name = 'rest') {
    for (const e of this.map.values()) {
      const g = mergeGeometries(e.geos, false);
      if (!g) continue;
      g.computeBoundingSphere();
      const mesh = new THREE.Mesh(g, e.mat);
      mesh.castShadow = e.cast; mesh.receiveShadow = true;
      mesh.name = name + ':' + (e.mat.name || 'mat');
      parent.add(mesh);
      this.meshes.push(mesh);
      this.tris += (g.index ? g.index.count : g.attributes.position.count) / 3;
    }
    this.map.clear();
  }
}

const _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new V3(1, 1, 1), _p = new V3();
function localM(x, y, z, ry = 0, rx = 0, rz = 0, s = 1) {
  _e.set(rx, ry, rz, 'YXZ');
  _q.setFromEuler(_e);
  _p.set(x, y, z);
  _s.set(s, s, s);
  return new THREE.Matrix4().compose(_p, _q, _s);
}

// A placement frame: local x along, y up, z forward. Everything added goes into the batch.
export class Frame {
  constructor(B, m) { this.B = B; this.m = m || new THREE.Matrix4(); }
  at(x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0) { return new Frame(this.B, this.m.clone().multiply(localM(x, y, z, ry, rx, rz))); }
  scaled(sx, sy, sz) { return new Frame(this.B, this.m.clone().multiply(new THREE.Matrix4().makeScale(sx, sy, sz))); }
  add(geo, mat, x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0, cast = true) {
    this.B.add(geo, mat, this.m.clone().multiply(localM(x, y, z, ry, rx, rz)), cast);
  }
  // axis-aligned (in local frame) box; (x, z) = centre, y = bottom
  box(mat, w, h, d, x = 0, y = 0, z = 0, o = {}) {
    this.add(boxGeo(w, h, d, o), mat, x, y + h / 2, z, o.ry || 0, o.rx || 0, o.rz || 0, o.cast ?? (w * h * d > 0.004));
  }
  // centred box
  boxC(mat, w, h, d, x = 0, y = 0, z = 0, o = {}) {
    this.add(boxGeo(w, h, d, o), mat, x, y, z, o.ry || 0, o.rx || 0, o.rz || 0, o.cast ?? (w * h * d > 0.004));
  }
  cyl(mat, r, h, x = 0, y = 0, z = 0, o = {}) {
    // vertical cylinder, y = bottom
    const g = new THREE.CylinderGeometry(o.r2 ?? r, r, h, o.seg ?? 16, 1, o.open ?? false);
    this.add(g, mat, x, y + h / 2, z, o.ry || 0, o.rx || 0, o.rz || 0, o.cast ?? false);
  }
  // horizontal rod along local x, centred at (x,y,z)
  rodX(mat, r, len, x = 0, y = 0, z = 0, o = {}) {
    const g = new THREE.CylinderGeometry(r, r, len, o.seg ?? 12);
    this.add(g, mat, x, y, z, 0, 0, Math.PI / 2, o.cast ?? false);
  }
  rodZ(mat, r, len, x = 0, y = 0, z = 0, o = {}) {
    const g = new THREE.CylinderGeometry(r, r, len, o.seg ?? 12);
    this.add(g, mat, x, y, z, 0, Math.PI / 2, 0, o.cast ?? false);
  }
}

// ---------------------------------------------------------------- geometry
// Box with metric UVs; the texture V axis follows the longest edge of each face (wood grain).
export function boxGeo(w, h, d, o = {}) {
  const g = new THREE.BoxGeometry(w, h, d);
  const p = g.attributes.position, n = g.attributes.normal;
  const uv = g.attributes.uv;
  const r = o.seed != null ? rng(o.seed) : Math.random;
  const ou = r() * 3, ov = r() * 3;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i));
    let a, b, sa, sb; // a,b in-plane coordinates with sizes
    if (ax > 0.5) { a = z; b = y; sa = d; sb = h; } else if (ay > 0.5) { a = x; b = z; sa = w; sb = d; } else { a = x; b = y; sa = w; sb = h; }
    const grain = o.grain ?? 'long';
    let u, v;
    if (grain === 'long' ? sa > sb : grain === 'a') { u = b; v = a; } else { u = a; v = b; }
    uv.setXY(i, u + ou, v + ov);
  }
  return g;
}

// grid-built box (with extra cuts near edges) used by softBox / pillow
function axisCuts(S, r, n) {
  const h = S / 2, a = h - r, out = [-h];
  if (r > 0) out.push(-a - r * 0.414, -a);
  for (let i = 1; i < n; i++) out.push(-a + (2 * a * i) / n);
  if (r > 0) out.push(a, a + r * 0.414);
  out.push(h);
  return out.filter((v, i, arr) => i === 0 || v > arr[i - 1] + 1e-6);
}
function gridBox(xs, ys, zs) {
  const pos = [], idx = [];
  const face = (A, B, f) => { // A,B coordinate lists; f(a,b) -> [x,y,z]
    const base = pos.length / 3;
    for (let j = 0; j < B.length; j++) for (let i = 0; i < A.length; i++) pos.push(...f(A[i], B[j]));
    const W = A.length;
    for (let j = 0; j < B.length - 1; j++) for (let i = 0; i < W - 1; i++) {
      const a = base + j * W + i, b = a + 1, c = a + W, d = c + 1;
      idx.push(a, b, d, a, d, c);
    }
  };
  const X0 = xs[0], X1 = xs.at(-1), Y0 = ys[0], Y1 = ys.at(-1), Z0 = zs[0], Z1 = zs.at(-1);
  face(zs, ys, (z, y) => [X1, y, -z]);     // +x  (a = -z so winding is outward)
  face(zs, ys, (z, y) => [X0, y, z]);      // -x
  face(xs, zs, (x, z) => [x, Y1, -z]);     // +y
  face(xs, zs, (x, z) => [x, Y0, z]);      // -y
  face(xs, ys, (x, y) => [x, y, Z1]);      // +z
  face(xs, ys, (x, y) => [-x, y, Z0]);     // -z
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  return mergeVertices(g, 1e-6);
}

// smooth noise for wrinkles
function wrinkle(seed) {
  const r = rng(seed);
  const waves = Array.from({ length: 5 }, () => ({ k: new V3(r() - 0.5, r() - 0.5, r() - 0.5).normalize().multiplyScalar(6 + r() * 16), ph: r() * 6.28, a: 0.4 + r() * 0.6 }));
  return (x, y, z) => { let s = 0; for (const w of waves) s += w.a * Math.sin(w.k.x * x + w.k.y * y + w.k.z * z + w.ph); return s / 2.5; };
}

// Rounded box with real rounded edges; optional wrinkle noise (metres) for soft goods.
export function softBox(w, h, d, r, o = {}) {
  r = Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4);
  const n = o.n ?? 4;
  const g = gridBox(axisCuts(w, r, Math.max(1, Math.round(n * w / Math.max(w, d)))), axisCuts(h, r, o.ny ?? 1), axisCuts(d, r, Math.max(1, Math.round(n * d / Math.max(w, d)))));
  const p = g.attributes.position;
  const a = w / 2 - r, b = h / 2 - r, c = d / 2 - r;
  const v = new V3(), q = new V3(), dir = new V3();
  const nz = o.noise ? wrinkle(o.seed ?? 7) : null;
  for (let i = 0; i < p.count; i++) {
    v.set(p.getX(i), p.getY(i), p.getZ(i));
    q.set(clamp(v.x, -a, a), clamp(v.y, -b, b), clamp(v.z, -c, c));
    dir.subVectors(v, q);
    if (dir.lengthSq() < 1e-14) continue;
    dir.normalize();
    v.copy(q).addScaledVector(dir, r);
    if (nz) {
      const k = o.noiseBottom === false && dir.y < -0.5 ? 0 : 1;
      v.addScaledVector(dir, nz(v.x, v.y, v.z) * o.noise * k);
    }
    if (o.sag) v.y -= o.sag * (1 - (v.x / (w / 2)) ** 2) * (1 - (v.z / (d / 2)) ** 2) * (v.y > 0 ? 1 : 0.3);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  planarUV(g);
  return g;
}

// Open-topped rounded basin (tub / sink interior). Render with a BackSide material.
// Opening at y = 0, bottom at y = -depth.
export function openBasin(w, depth, d, r) {
  r = Math.min(r, w / 2 - 1e-3, d / 2 - 1e-3, depth - 1e-3);
  const h = depth + r;
  const g = softBox(w, h, d, r, { n: 6, ny: 2 });
  const p = g.attributes.position, idx = g.index.array;
  const lim = h / 2 - r + 1e-5;
  const keep = [];
  for (let i = 0; i < idx.length; i += 3) {
    const a = idx[i], b = idx[i + 1], c = idx[i + 2];
    if (Math.max(p.getY(a), p.getY(b), p.getY(c)) <= lim) keep.push(a, b, c);
  }
  g.setIndex(keep);
  g.translate(0, -lim, 0);
  return g;
}

// Pillow: thick in the middle, thin seams, slightly pointed corners. w x h, thickness t (local z).
export function pillowGeo(w, h, t, seed = 3) {
  const xs = [], ys = [], N = 10, M = 8;
  for (let i = 0; i <= N; i++) xs.push(-w / 2 + (w * i) / N);
  for (let j = 0; j <= M; j++) ys.push(-h / 2 + (h * j) / M);
  const g = gridBox(xs, ys, [-t / 2, t / 2]);
  const p = g.attributes.position;
  const nz = wrinkle(seed);
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const fx = x / (w / 2), fy = y / (h / 2);
    const bulge = Math.pow(Math.max(0, (1 - fx * fx) * (1 - fy * fy)), 0.55);
    z = Math.sign(z || 1) * (t / 2) * (0.12 + 0.88 * bulge);
    x *= 1 - 0.07 * (1 - fy * fy);
    y *= 1 - 0.07 * (1 - fx * fx);
    z += nz(x, y, z) * 0.006 * bulge;
    p.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals();
  planarUV(g);
  return g;
}

// Pleated curtain panel hanging in the local xy plane, top at y = 0 going down to -h.
export function curtainGeo(w, h, folds, depth, seed = 5) {
  const g = new THREE.PlaneGeometry(w, h, folds * 6, 6);
  const p = g.attributes.position;
  const r = rng(seed);
  const ph = r() * 6;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i);
    const t = (x + w / 2) / w;
    const fy = (h / 2 - y) / h; // 0 top .. 1 bottom
    const z = depth * Math.sin(t * folds * Math.PI * 2 + ph) * (0.75 + 0.35 * fy) + depth * 0.25 * Math.sin(t * folds * 0.9 * Math.PI * 2 + ph * 2);
    p.setXYZ(i, x * (1 + 0.04 * fy), y - h / 2, z);
  }
  g.computeVertexNormals();
  // uv in metres (vertical grain)
  const uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i), p.getY(i));
  return g;
}

export function latheGeo(pts, seg = 24) {
  const g = new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg);
  planarUV(g);
  return g;
}

// ---------------------------------------------------------------- canvas textures
function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

export function canvasTex(c, { srgb = true, repeatM = 1, repeatMV, aniso = 8 } = {}) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1 / repeatM, 1 / (repeatMV ?? repeatM));
  t.anisotropy = aniso;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// normal map from a height canvas (sobel)
export function heightToNormal(hc, strength = 2) {
  const w = hc.width, h = hc.height;
  const src = hc.getContext('2d').getImageData(0, 0, w, h).data;
  const out = canvas(w, h);
  const ctx = out.getContext('2d');
  const img = ctx.createImageData(w, h);
  const H = (x, y) => src[(((y + h) % h) * w + ((x + w) % w)) * 4] / 255;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = (H(x + 1, y) - H(x - 1, y)) * strength;
    const dy = (H(x, y + 1) - H(x, y - 1)) * strength;
    const l = Math.hypot(dx, dy, 1);
    const i = (y * w + x) * 4;
    img.data[i] = (-dx / l * 0.5 + 0.5) * 255;
    img.data[i + 1] = (dy / l * 0.5 + 0.5) * 255;
    img.data[i + 2] = (1 / l * 0.5 + 0.5) * 255;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return out;
}

// white subway tile, running bond. Canvas covers 0.6 x 0.6 m (tile 0.15 x 0.075).
export function subwayTile({ color = '#f4f2ee', grout = '#cfcac0', tw = 0.15, th = 0.075, size = 0.6, px = 1024, seed = 11 } = {}) {
  const r = rng(seed);
  const c = canvas(px, px), hc = canvas(px, px);
  const g = c.getContext('2d'), hg = hc.getContext('2d');
  const s = px / size, gw = Math.max(2, 0.0025 * s);
  g.fillStyle = grout; g.fillRect(0, 0, px, px);
  hg.fillStyle = '#000'; hg.fillRect(0, 0, px, px);
  const rows = Math.round(size / th), cols = Math.round(size / tw);
  for (let j = 0; j < rows; j++) for (let i = -1; i < cols + 1; i++) {
    const x = (i * tw + (j % 2) * tw / 2) * s, y = j * th * s;
    const v = 0.96 + r() * 0.05;
    const col = new THREE.Color(color).multiplyScalar(v);
    g.fillStyle = '#' + col.getHexString();
    g.fillRect(x + gw / 2, y + gw / 2, tw * s - gw, th * s - gw);
    // bevelled height: bright face with soft edges
    const grd = hg.createLinearGradient(0, y, 0, y + th * s);
    grd.addColorStop(0, '#888'); grd.addColorStop(0.08, '#fff'); grd.addColorStop(0.92, '#fff'); grd.addColorStop(1, '#888');
    hg.fillStyle = grd;
    hg.fillRect(x + gw / 2, y + gw / 2, tw * s - gw, th * s - gw);
  }
  return { map: c, normal: heightToNormal(hc, 3), size };
}

// chunky jute / seagrass weave
export function juteWeave({ px = 512, size = 0.3, base = [176, 146, 104], seed = 21, cell = 16 } = {}) {
  const r = rng(seed);
  const c = canvas(px, px), hc = canvas(px, px);
  const g = c.getContext('2d'), hg = hc.getContext('2d');
  g.fillStyle = `rgb(${base.map((v) => v * 0.55).join(',')})`; g.fillRect(0, 0, px, px);
  hg.fillStyle = '#000'; hg.fillRect(0, 0, px, px);
  const n = px / cell;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const horiz = (i + j) % 2 === 0;
    const x = i * cell, y = j * cell;
    // a bundle of fibres
    for (let k = 0; k < 4; k++) {
      const v = 0.82 + r() * 0.3;
      g.fillStyle = `rgb(${base.map((b) => Math.min(255, b * v)).join(',')})`;
      const o = 1 + k * (cell - 2) / 4;
      if (horiz) g.fillRect(x + 1, y + o, cell - 2, (cell - 2) / 4 - 0.5); else g.fillRect(x + o, y + 1, (cell - 2) / 4 - 0.5, cell - 2);
    }
    const grd = horiz ? hg.createLinearGradient(x, 0, x + cell, 0) : hg.createLinearGradient(0, y, 0, y + cell);
    grd.addColorStop(0, '#222'); grd.addColorStop(0.5, '#fff'); grd.addColorStop(1, '#222');
    hg.fillStyle = grd; hg.fillRect(x + 1, y + 1, cell - 2, cell - 2);
  }
  // fibre speckle
  for (let k = 0; k < px * px / 30; k++) {
    const v = r() > 0.5 ? 1.2 : 0.7;
    g.fillStyle = `rgba(${base.map((b) => Math.min(255, b * v)).join(',')},0.35)`;
    g.fillRect(r() * px, r() * px, 1 + r() * 3, 1);
  }
  return { map: c, normal: heightToNormal(hc, 2.5), size };
}

// knit / waffle texture for throws and towels
export function knit({ px = 256, size = 0.08, color = [214, 200, 178], seed = 31 } = {}) {
  const r = rng(seed);
  const c = canvas(px, px), hc = canvas(px, px);
  const g = c.getContext('2d'), hg = hc.getContext('2d');
  g.fillStyle = `rgb(${color.join(',')})`; g.fillRect(0, 0, px, px);
  hg.fillStyle = '#000'; hg.fillRect(0, 0, px, px);
  const cw = px / 8, ch = px / 8;
  for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) {
    for (const side of [-1, 1]) {
      hg.save();
      hg.translate(i * cw + cw / 2 + side * cw * 0.22, j * ch + ch / 2);
      hg.rotate(side * 0.5);
      const grd = hg.createRadialGradient(0, 0, 1, 0, 0, cw * 0.32);
      grd.addColorStop(0, '#fff'); grd.addColorStop(1, '#000');
      hg.fillStyle = grd;
      hg.scale(0.55, 1);
      hg.beginPath(); hg.arc(0, 0, cw * 0.42, 0, Math.PI * 2); hg.fill();
      hg.restore();
    }
    const v = 0.93 + r() * 0.1;
    g.fillStyle = `rgba(${color.map((x) => Math.min(255, x * v)).join(',')},0.5)`;
    g.fillRect(i * cw, j * ch, cw, ch);
  }
  // darken grooves on colour map too
  g.globalCompositeOperation = 'multiply';
  g.globalAlpha = 0.35;
  g.drawImage(hc, 0, 0);
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  return { map: c, normal: heightToNormal(hc, 4), size };
}

// soft abstract painting in a muted palette (like the art in the reference photos)
export function abstractArt({ w = 600, h = 450, palette = ['#e9e3d7', '#c9bfae', '#8f8a80', '#5d6a78', '#b59a78'], seed = 41, style = 'wash' } = {}) {
  const r = rng(seed);
  const c = canvas(w, h);
  const g = c.getContext('2d');
  g.fillStyle = palette[0]; g.fillRect(0, 0, w, h);
  if (style === 'line') {
    // sparse charcoal line drawing on paper
    g.strokeStyle = 'rgba(70,64,58,0.55)'; g.lineCap = 'round';
    for (let k = 0; k < 7; k++) {
      g.lineWidth = 1 + r() * 3;
      g.beginPath();
      let x = w * (0.2 + r() * 0.6), y = h * (0.2 + r() * 0.6);
      g.moveTo(x, y);
      for (let s = 0; s < 4; s++) { const x2 = x + (r() - 0.5) * w * 0.5, y2 = y + (r() - 0.5) * h * 0.5; g.quadraticCurveTo(x + (r() - 0.5) * w * 0.4, y + (r() - 0.5) * h * 0.4, x2, y2); x = x2; y = y2; }
      g.stroke();
    }
    for (let k = 0; k < 3; k++) { g.fillStyle = `rgba(150,135,115,${0.08 + r() * 0.1})`; g.beginPath(); g.ellipse(w * r(), h * r(), w * (0.1 + r() * 0.2), h * (0.08 + r() * 0.2), r() * 3, 0, 7); g.fill(); }
    return c;
  }
  if (style === 'landscape') {
    // misty horizon landscape (like the dining wall art in the great room photo)
    const sky = g.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, palette[0]); sky.addColorStop(0.55, palette[1]); sky.addColorStop(1, palette[2]);
    g.fillStyle = sky; g.fillRect(0, 0, w, h);
    for (let k = 0; k < 3; k++) {
      g.fillStyle = [palette[3], palette[4], palette[2]][k] + (k === 0 ? '66' : 'aa');
      g.beginPath(); g.moveTo(0, h);
      const base = h * (0.55 + k * 0.12);
      for (let x = 0; x <= w; x += w / 20) g.lineTo(x, base - Math.sin(x / w * 5 + k * 2 + r()) * h * 0.04 - r() * h * 0.02);
      g.lineTo(w, h); g.fill();
    }
    return c;
  }
  // layered translucent washes + brush strokes
  for (let k = 0; k < 26; k++) {
    const col = palette[1 + Math.floor(r() * (palette.length - 1))];
    g.globalAlpha = 0.08 + r() * 0.22;
    g.fillStyle = col;
    g.beginPath();
    const cx = w * r(), cy = h * r(), rx = w * (0.08 + r() * 0.3), ry = h * (0.06 + r() * 0.25);
    g.ellipse(cx, cy, rx, ry, r() * 3.14, 0, Math.PI * 2);
    g.fill();
  }
  for (let k = 0; k < 40; k++) {
    g.globalAlpha = 0.1 + r() * 0.35;
    g.strokeStyle = palette[1 + Math.floor(r() * (palette.length - 1))];
    g.lineWidth = 4 + r() * 18;
    g.lineCap = 'round';
    g.beginPath();
    const x = w * r(), y = h * r();
    g.moveTo(x, y);
    g.bezierCurveTo(x + (r() - 0.5) * 200, y + (r() - 0.5) * 120, x + (r() - 0.5) * 200, y + (r() - 0.5) * 120, x + (r() - 0.5) * 260, y + (r() - 0.5) * 160);
    g.stroke();
  }
  g.globalAlpha = 1;
  return c;
}

// simple vertical-board texture (shiplap / board and batten) as height -> normal
export function boardNormal({ px = 512, size = 1.2, board = 0.15, seed = 51 } = {}) {
  const hc = canvas(px, px);
  const g = hc.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, px, px);
  const s = px / size, n = Math.round(size / board);
  for (let i = 0; i < n; i++) {
    const x = i * board * s;
    const grd = g.createLinearGradient(x - 3, 0, x + 3, 0);
    grd.addColorStop(0, '#fff'); grd.addColorStop(0.5, '#000'); grd.addColorStop(1, '#fff');
    g.fillStyle = grd; g.fillRect(x - 3, 0, 6, px);
  }
  return { normal: heightToNormal(hc, 4), size };
}

export { mergeGeometries };
