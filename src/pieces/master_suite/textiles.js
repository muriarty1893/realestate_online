// Procedural textile maps (height field -> normal map + albedo) for the chunky jute rug and the knit throw.
import * as THREE from 'three';
import { rng } from './util.js';

function heightToNormal(h, W, H, strength) {
  const out = new Uint8ClampedArray(W * H * 4);
  const at = (x, y) => h[((y + H) % H) * W + ((x + W) % W)];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const dx = (at(x + 1, y) - at(x - 1, y)) * strength, dy = (at(x, y + 1) - at(x, y - 1)) * strength;
    const l = Math.hypot(dx, dy, 1), i = (y * W + x) * 4;
    out[i] = (-dx / l * 0.5 + 0.5) * 255; out[i + 1] = (-dy / l * 0.5 + 0.5) * 255; out[i + 2] = (1 / l) * 255; out[i + 3] = 255;
  }
  return out;
}
function tex(data, W, H, srgb, repeatM) {
  const t = new THREE.DataTexture(data, W, H, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1 / repeatM, 1 / repeatM);
  t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true;
  t.anisotropy = 8; t.flipY = false;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  return t;
}
// stamp a soft ellipse into a height field (wrapping)
function stamp(h, W, H, cx, cy, rx, ry, rot, amp) {
  const c = Math.cos(rot), s = Math.sin(rot), R = Math.ceil(Math.max(rx, ry)) + 1;
  for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) {
    const u = (x * c + y * s) / rx, v = (-x * s + y * c) / ry, d = u * u + v * v;
    if (d >= 1) continue;
    const px = ((Math.round(cx) + x) % W + W) % W, py = ((Math.round(cy) + y) % H + H) % H;
    const val = amp * Math.sqrt(1 - d);
    const k = py * W + px; if (val > h[k]) h[k] = val;
  }
}

// Chunky braided jute/wool: rows of fat loops along X with dark fibre flecks. Tile = repeatM metres.
export function rugMaps({ size = 512, repeatM = 0.42, rows = 19, loops = 15, seed = 3 } = {}) {
  const W = size, H = size, R = rng(seed);
  const h = new Float32Array(W * H), tone = new Float32Array(W * H).fill(0);
  const rh = H / rows, lw = W / loops;
  for (let r = 0; r < rows; r++) {
    const off = (r % 2) * lw * 0.5;
    for (let k = 0; k < loops; k++) {
      const cx = k * lw + off + (R() - 0.5) * lw * 0.15, cy = r * rh + rh / 2 + (R() - 0.5) * rh * 0.12;
      const amp = 0.75 + R() * 0.25;
      stamp(h, W, H, cx, cy, lw * (0.62 + R() * 0.15), rh * (0.48 + R() * 0.1), (R() - 0.5) * 0.25 + (r % 2 ? 0.12 : -0.12), amp);
      // per-loop tone
      const tv = (R() - 0.5) * 0.12;
      for (let y = -Math.floor(rh / 2); y < rh / 2; y++) for (let x = -Math.floor(lw / 2); x < lw / 2; x++) {
        const px = ((Math.round(cx) + x) % W + W) % W, py = ((Math.round(cy) + y) % H + H) % H; tone[py * W + px] = tv;
      }
    }
  }
  const nrm = heightToNormal(h, W, H, 2.2);
  const col = new Uint8ClampedArray(W * H * 4);
  const base = [240, 231, 214];
  for (let i = 0; i < W * H; i++) {
    const sh = 0.6 + 0.4 * h[i] + tone[i];
    col[i * 4] = base[0] * sh; col[i * 4 + 1] = base[1] * sh; col[i * 4 + 2] = base[2] * sh; col[i * 4 + 3] = 255;
  }
  // dark and light fibre flecks (short strokes along the rows)
  for (let n = 0; n < W * H * 0.006; n++) {
    const x = Math.floor(R() * W), y = Math.floor(R() * H), len = 3 + Math.floor(R() * 7), dark = R() < 0.75;
    const c = dark ? [110 + R() * 30, 92 + R() * 25, 72 + R() * 20] : [240, 232, 216];
    for (let k = 0; k < len; k++) { const px = (x + k) % W, py = (y + Math.round(k * (R() - 0.5) * 0.4) + H) % H, i = (py * W + px) * 4; col[i] = c[0]; col[i + 1] = c[1]; col[i + 2] = c[2]; }
  }
  return { map: tex(col, W, H, true, repeatM), normalMap: tex(nrm, W, H, false, repeatM) };
}

// Chunky hand knit: columns of V stitches. Tile = repeatM metres (4 x 5 stitches per tile).
export function knitMaps({ size = 256, repeatM = 0.22, cols = 4, rows = 5, seed = 5 } = {}) {
  const W = size, H = size, R = rng(seed);
  const h = new Float32Array(W * H);
  const cw = W / cols, rh = H / rows;
  const tone = new Float32Array(W * H);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) for (const side of [-1, 1]) {
    const jx = (R() - 0.5) * cw * 0.12, jy = (R() - 0.5) * rh * 0.14;
    stamp(h, W, H, c * cw + cw / 2 + side * cw * 0.21 + jx, r * rh + rh / 2 + jy, cw * (0.27 + R() * 0.04), rh * (0.6 + R() * 0.08), side * (0.45 + R() * 0.15), 0.8 + R() * 0.2);
  }
  const nrm = heightToNormal(h, W, H, 3.4);
  const col = new Uint8ClampedArray(W * H * 4);
  for (let i = 0; i < W * H; i++) { const sh = 0.58 + 0.42 * Math.pow(h[i], 0.7); col[i * 4] = 236 * sh; col[i * 4 + 1] = 224 * sh; col[i * 4 + 2] = 206 * sh; col[i * 4 + 3] = 255; }
  return { map: tex(col, W, H, true, repeatM), normalMap: tex(nrm, W, H, false, repeatM) };
}

// Linen creases: many long soft ridges/valleys mostly along `dir` (radians), baked to a normal map.
export function wrinkleMaps({ size = 512, repeatM = 1.0, n = 260, dir = Math.PI / 2, spread = 0.9, seed = 9, strength = 6 } = {}) {
  const W = size, H = size, R = rng(seed);
  const h = new Float32Array(W * H);
  const pxPerM = W / repeatM;
  for (let k = 0; k < n; k++) {
    const cx = R() * W, cy = R() * H, a = dir + (R() - 0.5) * spread * 2;
    const len = (0.08 + R() * 0.3) * pxPerM, wid = (0.006 + R() * 0.018) * pxPerM, amp = (R() < 0.5 ? -1 : 1) * (0.3 + R() * 0.7);
    const ca = Math.cos(a), sa = Math.sin(a), ext = Math.ceil(len / 2 + 3 * wid);
    for (let y = -ext; y <= ext; y++) for (let x = -ext; x <= ext; x++) {
      const u = x * ca + y * sa, v = -x * sa + y * ca;
      if (Math.abs(u) > len / 2) continue;
      const fall = Math.cos((u / (len / 2)) * Math.PI / 2);
      const val = amp * fall * fall * Math.exp(-(v * v) / (wid * wid));
      if (Math.abs(val) < 0.002) continue;
      const px = ((Math.round(cx) + x) % W + W) % W, py = ((Math.round(cy) + y) % H + H) % H;
      h[py * W + px] += val;
    }
  }
  const nrm = heightToNormal(h, W, H, strength / pxPerM * 60);
  return { normalMap: tex(nrm, W, H, false, repeatM) };
}
