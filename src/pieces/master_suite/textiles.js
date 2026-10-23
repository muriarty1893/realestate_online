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

// add long soft creases (ridges/valleys mostly along `dir`) into a height field
function addCreases(h, W, H, repeatM, { n = 260, dir = Math.PI / 2, spread = 0.9, seed = 9, amount = 1 } = {}) {
  const R = rng(seed), pxPerM = W / repeatM;
  for (let k = 0; k < n; k++) {
    const cx = R() * W, cy = R() * H, a = dir + (R() - 0.5) * spread * 2;
    const len = (0.08 + R() * 0.3) * pxPerM, wid = (0.006 + R() * 0.018) * pxPerM, amp = amount * (R() < 0.5 ? -1 : 1) * (0.3 + R() * 0.7);
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
}

// Linen creases: many long soft ridges/valleys mostly along `dir` (radians), baked to a normal map.
export function wrinkleMaps({ size = 512, repeatM = 1.0, n = 260, dir = Math.PI / 2, spread = 0.9, seed = 9, strength = 6 } = {}) {
  const W = size, H = size, h = new Float32Array(W * H), pxPerM = W / repeatM;
  addCreases(h, W, H, repeatM, { n, dir, spread, seed });
  return { normalMap: tex(heightToNormal(h, W, H, strength / pxPerM * 60), W, H, false, repeatM) };
}

// Slubby linen: plain weave + irregular slub streaks in both thread directions (albedo + normal), with soft creases
// baked into the normal map. Albedo is a near-white luminance variation to be tinted by the material colour.
export function linenMaps({ size = 1024, repeatM = 1.1, pitch = 4, seed = 21, crease = { n: 260, dir: Math.PI / 2, spread: 0.9, seed: 4, amount: 1 }, creaseStrength = 6, slub = 1 } = {}) {
  const W = size, H = size, R = rng(seed), pxPerM = W / repeatM;
  const h = new Float32Array(W * H), tone = new Float32Array(W * H);
  // weave height + per-thread random thickness
  const warp = new Float32Array(Math.ceil(W / pitch) + 1).map(() => (R() - 0.5)), weft = new Float32Array(Math.ceil(H / pitch) + 1).map(() => (R() - 0.5));
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const a = Math.sin((x / pitch) * Math.PI), b = Math.sin((y / pitch) * Math.PI);
    const over = ((Math.floor(x / pitch) + Math.floor(y / pitch)) & 1) ? 1 : -1;
    h[y * W + x] = 0.12 * (a * b * over) + 0.05 * (warp[Math.floor(x / pitch)] + weft[Math.floor(y / pitch)]);
    tone[y * W + x] = 0.04 * warp[Math.floor(x / pitch)] + 0.04 * weft[Math.floor(y / pitch)];
  }
  // slubs: long thick thread streaks (horizontal and vertical), lighter or darker
  for (let k = 0; k < 700 * slub; k++) {
    const horiz = R() < 0.5, len = (0.015 + R() * 0.07) * pxPerM, th = 1 + Math.floor(R() * 2), amp = (R() < 0.5 ? -1 : 1) * (0.02 + R() * 0.045);
    const x0 = Math.floor(R() * W), y0 = Math.floor(R() * H);
    for (let i = 0; i < len; i++) {
      const f = Math.sin((i / len) * Math.PI);
      for (let t = 0; t < th; t++) {
        const px = ((horiz ? x0 + i : x0 + t) % W + W) % W, py = ((horiz ? y0 + t : y0 + i) % H + H) % H;
        tone[py * W + px] += amp * f; h[py * W + px] += 0.25 * amp * f;
      }
    }
  }
  if (crease) addCreases(h, W, H, repeatM, { ...crease });
  const nrm = heightToNormal(h, W, H, 1.0 + creaseStrength * 0.25);
  const col = new Uint8ClampedArray(W * H * 4);
  for (let i = 0; i < W * H; i++) { const v = Math.max(0, Math.min(1, 0.9 + tone[i])) * 255; col[i * 4] = v; col[i * 4 + 1] = v * 0.985; col[i * 4 + 2] = v * 0.96; col[i * 4 + 3] = 255; }
  return { map: tex(col, W, H, true, repeatM), normalMap: tex(nrm, W, H, false, repeatM) };
}

// ---- oak ---------------------------------------------------------------------------------------------------
// paint wood grain (running down the canvas, +y) into rect x0,y0,w,h of a 2D context
function paintGrain(g, x0, y0, w, h, R, { base = [200, 160, 115], tint = 1, streaks = 70, contrast = 1 } = {}) {
  g.fillStyle = `rgb(${base.map((c) => Math.round(c * tint)).join(',')})`;
  g.fillRect(x0, y0, w, h);
  // broad soft tonal bands along the board
  for (let i = 0; i < 6; i++) {
    const bx = x0 + R() * w, bw = w * (0.15 + R() * 0.4), dark = R() < 0.5;
    const gr = g.createLinearGradient(bx - bw, 0, bx + bw, 0);
    const c = dark ? '90,58,30' : '236,206,160', a = (0.05 + R() * 0.09) * contrast;
    gr.addColorStop(0, `rgba(${c},0)`); gr.addColorStop(0.5, `rgba(${c},${a})`); gr.addColorStop(1, `rgba(${c},0)`);
    g.save(); g.beginPath(); g.rect(x0, y0, w, h); g.clip(); g.fillStyle = gr; g.fillRect(bx - bw, y0, bw * 2, h); g.restore();
  }
  g.save(); g.beginPath(); g.rect(x0, y0, w, h); g.clip();
  g.lineCap = 'round';
  for (let i = 0; i < streaks; i++) {
    const dark = R() < 0.7, x = x0 + R() * w, lw = 0.5 + R() * 1.6, yy = y0 + (R() - 0.3) * h * 0.5, len = h * (0.3 + R() * 0.9);
    g.strokeStyle = dark ? `rgba(${105 + R() * 25},${68 + R() * 20},${38 + R() * 12},${(0.05 + R() * 0.14) * contrast})` : `rgba(236,208,166,${(0.05 + R() * 0.1) * contrast})`;
    g.lineWidth = lw; g.beginPath(); g.moveTo(x, yy);
    const wob = 0.6 + R() * 1.6, ph = R() * 6;
    for (let t = 0; t <= len; t += 14) g.lineTo(x + Math.sin(t * 0.011 + ph) * wob + Math.sin(t * 0.037 + ph * 2) * wob * 0.4, yy + t);
    g.stroke();
  }
  // occasional faint cathedral arcs
  for (let i = 0; i < 2; i++) {
    if (R() < 0.45) continue;
    const cx = x0 + w * (0.25 + R() * 0.5), cy = y0 + R() * h, ry = 40 + R() * 90;
    for (let k = 1; k <= 4; k++) {
      g.strokeStyle = `rgba(110,72,40,${0.05 * contrast})`; g.lineWidth = 1;
      g.beginPath(); g.ellipse(cx, cy, k * (w * 0.06), ry * k * 0.5, 0, 0, Math.PI * 2); g.stroke();
    }
  }
  g.restore();
}
function canvasPix(draw, W, H) {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'); draw(g, W, H);
  return g.getImageData(0, 0, W, H).data;
}

// Light natural oak boards with varied tone, butt joints and fine grain. Planks run along V (canvas +y). Tile = tileM metres.
export function plankFloorMaps({ size = 2048, tileM = 3.8, cols = 20, seed = 31, base = [160, 130, 102] } = {}) {
  const W = size, H = size, R = rng(seed), pw = W / cols, pxPerM = W / tileM;
  const boards = [];
  for (let c = 0; c < cols; c++) {
    let y = -R() * 1.4 * pxPerM;
    while (y < H) {
      const len = (0.9 + R() * 1.7) * pxPerM;
      boards.push({ c, y0: y, y1: Math.min(y + len, H + 4), tint: 0.87 + R() * 0.26, warm: (R() - 0.5) * 0.1, seed: Math.floor(R() * 1e6) });
      y += len;
    }
  }
  const alb = canvasPix((g) => {
    g.fillStyle = 'rgb(150,105,70)'; g.fillRect(0, 0, W, H);
    for (const b of boards) {
      const y0 = Math.max(0, b.y0), r = rng(b.seed);
      const bs = [base[0] * (1 + b.warm), base[1], base[2] * (1 - b.warm)];
      paintGrain(g, b.c * pw + 1, y0, pw - 2, b.y1 - y0, r, { base: bs, tint: b.tint, streaks: 55, contrast: 1.1 });
    }
    // joints and gaps
    g.fillStyle = 'rgba(70,44,24,0.62)';
    for (let c = 0; c < cols; c++) g.fillRect(c * pw - 1, 0, 2, H);
    for (const b of boards) if (b.y0 > 0) g.fillRect(b.c * pw, b.y0 - 1, pw, 2);
  }, W, H);
  const hgt = canvasPix((g) => {
    g.fillStyle = '#c8c8c8'; g.fillRect(0, 0, W, H);
    for (const b of boards) { const v = 190 + Math.floor((rng(b.seed)() - 0.5) * 22); g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(b.c * pw + 1, Math.max(0, b.y0), pw - 2, b.y1 - Math.max(0, b.y0)); }
    g.fillStyle = '#2a2a2a';
    for (let c = 0; c < cols; c++) g.fillRect(c * pw - 1.5, 0, 3, H);
    for (const b of boards) if (b.y0 > 0) g.fillRect(b.c * pw, b.y0 - 1.5, pw, 3);
  }, W, H);
  const hf = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) hf[i] = hgt[i * 4] / 255;
  return { map: tex(alb, W, H, true, tileM), normalMap: tex(heightToNormal(hf, W, H, 3.0), W, H, false, tileM) };
}

// Subtle vertical oak grain for the barn door (one tile = repeatM metres, grain along V).
export function oakGrainMaps({ size = 1024, repeatM = 1.3, seed = 41, base = [186, 152, 120], streaks = 170, contrast = 1.05 } = {}) {
  const W = size, H = size, R = rng(seed);
  const alb = canvasPix((g) => paintGrain(g, 0, 0, W, H, R, { base, streaks, contrast }), W, H);
  const hf = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) hf[i] = (alb[i * 4] + alb[i * 4 + 1]) / 510;
  return { map: tex(alb, W, H, true, repeatM), normalMap: tex(heightToNormal(hf, W, H, 0.8), W, H, false, repeatM) };
}
