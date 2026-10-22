// Procedural foliage textures (canvas, alpha): live-oak leaf clusters, shrub clusters,
// flowering mounds, Spanish moss, palm/sago fronds, strap-leaf (liriope) clumps.
import * as THREE from 'three';
import { rng } from './util.js';

function tex(c, srgb = true) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  return t;
}
const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const hsl = (h, s, l, a = 1) => `hsla(${h},${s}%,${l}%,${a})`;

// live-oak spray: a few forked twigs with small elliptic leaves along them, lots of open space
function oakSpray(g, ox, oy, S, R, dense) {
  g.lineCap = 'round';
  const leaf = (x, y, rot, l) => {
    const h = 58 + R() * 20, sat = 30 + R() * 25;
    let li = 20 + R() * 16;
    if (R() < 0.3) li += 14; // backlit, translucent leaves
    g.fillStyle = hsl(h, sat, li);
    g.beginPath(); g.ellipse(x, y, l / 2, l * 0.21, rot, 0, Math.PI * 2); g.fill();
  };
  const twig = (x, y, a, len, w, depth) => {
    const steps = 6;
    let px = x, py = y;
    g.strokeStyle = hsl(28, 14, 30 + R() * 12); g.lineWidth = w;
    const pts = [];
    for (let i = 1; i <= steps; i++) {
      a += (R() - 0.5) * 0.5;
      const nx = px + Math.cos(a) * len / steps, ny = py + Math.sin(a) * len / steps;
      g.beginPath(); g.moveTo(px, py); g.lineTo(nx, ny); g.stroke();
      px = nx; py = ny; pts.push([px, py, a]);
    }
    for (const [lx, ly, la] of pts) {
      const n = dense ? 7 : 4;
      for (let k = 0; k < n; k++) {
        const side = R() < 0.5 ? -1 : 1, ang = la + side * (0.6 + R() * 0.8);
        const l = 18 + R() * 12;
        leaf(lx + Math.cos(ang) * l * 0.55, ly + Math.sin(ang) * l * 0.55, ang, l);
      }
    }
    if (depth < 2) for (let k = 0; k < 2; k++) { const [bx, by, ba] = pts[2 + Math.floor(R() * 3)]; twig(bx, by, ba + (R() < 0.5 ? -1 : 1) * (0.5 + R() * 0.5), len * 0.55, w * 0.65, depth + 1); }
  };
  const cx = ox + S / 2, cy = oy + S * 0.62;
  const nT = dense ? 5 : 3;
  for (let i = 0; i < nT; i++) twig(cx + (R() - 0.5) * S * 0.2, cy + (R() - 0.5) * S * 0.1, -Math.PI / 2 + (R() - 0.5) * 2.4, S * (0.32 + R() * 0.12), 3, 0);
}

// leaf cluster in a cell. kind: 'oak' | 'box' | 'dark' | 'flower' | 'bg'
function cluster(g, ox, oy, S, R, kind) {
  if (kind === 'oak' || kind === 'bg') {
    g.save(); g.beginPath(); g.rect(ox + 2, oy + 2, S - 4, S - 4); g.clip();
    oakSpray(g, ox, oy, S, R, kind === 'bg');
    g.restore();
    return;
  }
  const cx = ox + S / 2, cy = oy + S / 2;
  // twigs
  if (kind === 'oak' || kind === 'bg') {
    g.lineCap = 'round';
    for (let i = 0; i < 7; i++) {
      const a = R() * Math.PI * 2;
      g.strokeStyle = hsl(30, 20, 18 + R() * 10); g.lineWidth = 1.5 + R() * 2.5;
      g.beginPath(); g.moveTo(cx, cy + S * 0.2);
      g.quadraticCurveTo(cx + Math.cos(a) * S * 0.2, cy + Math.sin(a) * S * 0.15, cx + Math.cos(a) * S * 0.4, cy + Math.sin(a) * S * 0.36);
      g.stroke();
    }
  }
  const n = { oak: 300, bg: 520, box: 900, dark: 520, flower: 520 }[kind];
  const L = { oak: 26, bg: 30, box: 13, dark: 22, flower: 18 }[kind];
  for (let i = 0; i < n; i++) {
    // clumpy distribution: several sub-blobs
    const blob = Math.floor(R() * 6);
    const ba = blob * 1.047 + 0.5, br = blob === 0 ? 0 : S * 0.2;
    const bx = cx + Math.cos(ba) * br, by = cy + Math.sin(ba) * br * 0.8;
    const a = R() * Math.PI * 2, d = Math.pow(R(), 0.65) * S * (kind === 'box' || kind === 'flower' ? 0.42 : 0.24);
    const x = bx + Math.cos(a) * d, y = by + Math.sin(a) * d;
    if (Math.hypot(x - cx, y - cy) > S * 0.48) continue;
    const rot = R() * Math.PI;
    const l = L * (0.7 + R() * 0.6), w = l * (kind === 'box' ? 0.6 : 0.42);
    // light from the top-right: leaves higher in the cell are lighter
    const lift = (cy - y) / S;
    let h, s, li;
    if (kind === 'oak') { h = 62 + R() * 18; s = 25 + R() * 22; li = 15 + R() * 12 + lift * 12; if (R() < 0.14) { h = 55 + R() * 10; li += 16; s += 15; } }
    else if (kind === 'bg') { h = 75 + R() * 25; s = 25 + R() * 25; li = 16 + R() * 12 + lift * 12; }
    else if (kind === 'box') { h = 75 + R() * 22; s = 45 + R() * 25; li = 28 + R() * 18 + lift * 16; }
    else if (kind === 'dark') { h = 90 + R() * 30; s = 30 + R() * 20; li = 20 + R() * 14 + lift * 12; }
    else { h = 90 + R() * 25; s = 40 + R() * 20; li = 26 + R() * 14 + lift * 10; }
    g.fillStyle = hsl(h, s, li);
    g.beginPath(); g.ellipse(x, y, l / 2, w / 2, rot, 0, Math.PI * 2); g.fill();
    if (kind !== 'box') {
      g.strokeStyle = hsl(h, s, li + 8, 0.6); g.lineWidth = 1;
      g.beginPath(); g.moveTo(x - Math.cos(rot) * l * 0.4, y - Math.sin(rot) * l * 0.4); g.lineTo(x + Math.cos(rot) * l * 0.4, y + Math.sin(rot) * l * 0.4); g.stroke();
    }
  }
  if (kind === 'flower') {
    for (let i = 0; i < 70; i++) {
      const a = R() * Math.PI * 2, d = Math.pow(R(), 0.5) * S * 0.4;
      const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * 0.9 - S * 0.03;
      const pick = R();
      const col = pick < 0.5 ? hsl(335 + R() * 15, 75, 58 + R() * 15) : pick < 0.72 ? hsl(40, 30, 92) : hsl(352, 80, 46);
      const r = 5 + R() * 4;
      for (let k = 0; k < 5; k++) { const pa = (k / 5) * Math.PI * 2 + R(); g.fillStyle = col; g.beginPath(); g.ellipse(x + Math.cos(pa) * r * 0.55, y + Math.sin(pa) * r * 0.55, r * 0.55, r * 0.38, pa, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = hsl(50, 80, 60); g.beginPath(); g.arc(x, y, 1.4, 0, Math.PI * 2); g.fill();
    }
  }
}

// atlas 2x4 cells: row0 oak a/b, row1 oak c / bg, row2 box / dark, row3 flower / flower2
export function foliageAtlas() {
  const S = 512, c = canvas(S * 2, S * 4), g = c.getContext('2d');
  const R = rng(1234);
  const kinds = [['oak', 'oak'], ['oak', 'bg'], ['box', 'dark'], ['flower', 'flower']];
  kinds.forEach((row, j) => row.forEach((k, i) => cluster(g, i * S, j * S, S, R, k)));
  return tex(c);
}
export const ATLAS = { oak: [[0, 0], [1, 0], [0, 1]], bg: [[1, 1]], box: [[0, 2]], dark: [[1, 2]], flower: [[0, 3], [1, 3]] };
export const atlasUV = (cell) => ({ u0: cell[0] / 2, u1: (cell[0] + 1) / 2, v0: 1 - (cell[1] + 1) / 4, v1: 1 - cell[1] / 4 });

export function mossTexture() {
  const W = 256, H = 1024, c = canvas(W, H), g = c.getContext('2d');
  const R = rng(77);
  g.lineCap = 'round';
  for (let i = 0; i < 260; i++) {
    let x = W * (0.15 + R() * 0.7), y = R() * H * 0.08;
    const len = H * (0.35 + R() * 0.6) * (1 - Math.abs(x / W - 0.5));
    g.strokeStyle = hsl(75 + R() * 25, 5 + R() * 8, 48 + R() * 18, 0.5 + R() * 0.4);
    g.lineWidth = 1 + R() * 2.2;
    g.beginPath(); g.moveTo(x, y);
    const steps = 18;
    for (let k = 0; k < steps; k++) { x += (R() - 0.5) * 9; y += len / steps; g.lineTo(x, y); }
    g.stroke();
  }
  return tex(c);
}

// pinnate frond (sago / palm): rib along the texture height, leaflets either side
export function frondTexture() {
  const W = 256, H = 1024, c = canvas(W, H), g = c.getContext('2d');
  const R = rng(5);
  g.lineCap = 'round';
  for (let y = 40; y < H - 20; y += 7) {
    const t = y / H, span = W * 0.46 * Math.sin(Math.PI * Math.min(1, t * 1.1));
    for (const s of [-1, 1]) {
      g.strokeStyle = hsl(85 + R() * 15, 40 + R() * 15, 20 + R() * 12 + (1 - t) * 6);
      g.lineWidth = 3 + R() * 1.5;
      g.beginPath(); g.moveTo(W / 2, y); g.quadraticCurveTo(W / 2 + s * span * 0.5, y - 10, W / 2 + s * span, y - 30 - R() * 10); g.stroke();
    }
  }
  g.strokeStyle = hsl(60, 25, 25); g.lineWidth = 4; g.beginPath(); g.moveTo(W / 2, 0); g.lineTo(W / 2, H); g.stroke();
  return tex(c);
}

// strap-leaf clump (variegated liriope / spider plant) and fern-ish grass blades
export function strapTexture() {
  const W = 512, H = 512, c = canvas(W, H), g = c.getContext('2d');
  const R = rng(9);
  g.lineCap = 'round';
  for (let i = 0; i < 70; i++) {
    const a = (R() - 0.5) * 2.4, len = H * (0.5 + R() * 0.45);
    const x0 = W / 2 + (R() - 0.5) * 30, y0 = H - 4;
    const x1 = x0 + Math.sin(a) * len, y1 = y0 - Math.cos(a) * len * 0.8;
    const cx = x0 + Math.sin(a) * len * 0.4, cy = y0 - len * 0.9;
    g.strokeStyle = hsl(85 + R() * 20, 40, 26 + R() * 14); g.lineWidth = 7 + R() * 4;
    g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(cx, cy, x1, y1 + len * 0.25); g.stroke();
    if (R() < 0.7) { g.strokeStyle = hsl(60, 30, 82, 0.9); g.lineWidth = 2; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(cx, cy, x1, y1 + len * 0.25); g.stroke(); }
  }
  return tex(c);
}
