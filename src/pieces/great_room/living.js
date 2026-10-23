// Living area: cognac leather L-sectional, two leather club chairs, reclaimed-wood coffee table with
// decor, large distressed rug, throws, pillows, knit ball, side table, framed abstract art.
import * as THREE from 'three';
import { boxMM, box, rbox, cyl, mesh, cushionGeo, pillowGeo, rng, canvasTex, ASSET } from './util.js';

// --------------------------------------------------------------- contact shadows
// soft dark footprint under furniture (blurred rounded rect, multiplies the floor/rug)
let _shadowMat = null;
function shadowMat() {
  if (_shadowMat) return _shadowMat;
  const t = canvasTex(128, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.filter = 'blur(9px)'; g.fillStyle = '#000'; g.fillRect(26, 26, w - 52, h - 52);
  }, { srgb: false });
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  _shadowMat = new THREE.MeshBasicMaterial({ map: t, color: 0x120c08, transparent: true, opacity: 0.7, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  return _shadowMat;
}
export function contactShadow(w, d, x = 0, z = 0, { y = 0.0135, opacity = 1 } = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), opacity === 1 ? shadowMat() : Object.assign(shadowMat().clone(), { opacity: 0.7 * opacity }));
  m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.renderOrder = 2; m.receiveShadow = false; m.castShadow = false;
  return m;
}

// --------------------------------------------------------------- sectional
// Built in a local frame: seat runs along +x from 0..L, back at z=0, front at z=D. y up.
function sofaSection(M, L, { D = 1.0, armL = false, armR = false, seats = 2, backH = 0.8, seatH = 0.46, baseH = 0.29, armW = 0.24, armH = 0.62, seed = 1, roundEnd = false } = {}) {
  const g = new THREE.Group();
  const backT = 0.22;
  g.add(contactShadow(L + 0.3, D + 0.34, L / 2, D / 2 + 0.02));
  const x0 = armL ? armW : 0, x1 = L - (armR ? armW : 0);
  // base / plinth (leather wrapped) on short dark feet
  g.add(rbox(L, baseH - 0.05, D, 0.03, M.leather, L / 2, 0.05 + (baseH - 0.05) / 2, D / 2));
  for (const [x, z] of [[0.05, 0.05], [L - 0.05, 0.05], [0.05, D - 0.05], [L - 0.05, D - 0.05]]) g.add(box(0.05, 0.05, 0.05, M.black, x, 0.025, z));
  // outer back
  if (roundEnd) {
    g.add(rbox(L - 0.12, backH - 0.05, backT, 0.05, M.leather, (L - 0.12) / 2, 0.05 + (backH - 0.05) / 2, backT / 2, { segs: 4 }));
    g.add(rbox(0.3, backH - 0.05, backT, 0.11, M.leather, L - 0.15, 0.05 + (backH - 0.05) / 2, backT / 2, { segs: 5 }));
  } else g.add(rbox(L, backH - 0.05, backT, 0.05, M.leather, L / 2, 0.05 + (backH - 0.05) / 2, backT / 2, { segs: 4 }));
  // arms
  if (armL) g.add(rbox(armW, armH - 0.05, D, 0.07, M.leather, armW / 2, 0.05 + (armH - 0.05) / 2, D / 2, { segs: 4 }));
  if (armR) g.add(rbox(armW, armH - 0.05, D, 0.07, M.leather, L - armW / 2, 0.05 + (armH - 0.05) / 2, D / 2, { segs: 4 }));
  // seat cushions
  const sw = (x1 - x0) / seats;
  const sd = D - backT - 0.02;
  for (let i = 0; i < seats; i++) {
    const c = mesh(cushionGeo(sw - 0.01, seatH - baseH + 0.02, sd, { segs: 10, bulge: 0.11, round: 0.6, seed: seed + i, wrinkle: 0.003 }), M.leather);
    c.position.set(x0 + sw * (i + 0.5), (baseH + seatH) / 2 - 0.005, backT + sd / 2 + 0.01);
    g.add(c);
    // back cushions leaning on the back
    const bc = mesh(cushionGeo(sw - 0.02, 0.38, 0.17, { segs: 8, bulge: 0.11, round: 0.55, seed: seed + 7 + i, wrinkle: 0.004 }), M.leather);
    bc.rotation.x = -0.18;
    bc.position.set(x0 + sw * (i + 0.5), seatH + 0.16, backT + 0.075);
    g.add(bc);
  }
  return g;
}

function bumper(M, L, D, { seatH = 0.46, baseH = 0.29 } = {}) {
  // backless, armless end piece: leather base + one seat cushion, rounded outer end
  const g = new THREE.Group();
  g.add(contactShadow(L + 0.3, D + 0.34, L / 2, D / 2 + 0.02));
  g.add(rbox(L, baseH - 0.05, D, 0.06, M.leather, L / 2, 0.05 + (baseH - 0.05) / 2, D / 2, { segs: 4 }));
  for (const [x, z] of [[0.05, 0.05], [L - 0.05, 0.05], [0.05, D - 0.05], [L - 0.05, D - 0.05]]) g.add(box(0.05, 0.05, 0.05, M.black, x, 0.025, z));
  const c = mesh(cushionGeo(L - 0.01, seatH - baseH + 0.02, D - 0.02, { segs: 10, bulge: 0.12, round: 0.7, seed: 31 }), M.leather);
  c.position.set(L / 2, (baseH + seatH) / 2 - 0.005, D / 2); g.add(c);
  return g;
}

function cornerBlock(M, D = 1.0, { backH = 0.8, seatH = 0.46, baseH = 0.29, seed = 3 } = {}) {
  // square corner: backs on z=0 and x=0
  const g = new THREE.Group();
  const backT = 0.22;
  g.add(contactShadow(D + 0.3, D + 0.3, D / 2, D / 2));
  g.add(rbox(D, baseH - 0.05, D, 0.03, M.leather, D / 2, 0.05 + (baseH - 0.05) / 2, D / 2));
  g.add(rbox(D, backH - 0.05, backT, 0.05, M.leather, D / 2, 0.05 + (backH - 0.05) / 2, backT / 2, { segs: 4 }));
  g.add(rbox(backT, backH - 0.05, D, 0.05, M.leather, backT / 2, 0.05 + (backH - 0.05) / 2, D / 2, { segs: 4 }));
  const s = D - backT - 0.02;
  const c = mesh(cushionGeo(s, seatH - baseH + 0.02, s, { segs: 10, bulge: 0.11, round: 0.6, seed }), M.leather);
  c.position.set(backT + s / 2 + 0.01, (baseH + seatH) / 2 - 0.005, backT + s / 2 + 0.01); g.add(c);
  for (const r of [0, 1]) {
    const bc = mesh(cushionGeo(s - 0.05, 0.38, 0.17, { segs: 8, bulge: 0.11, round: 0.55, seed: seed + 5 + r }), M.leather);
    if (r === 0) { bc.rotation.x = -0.18; bc.position.set(backT + s / 2, seatH + 0.16, backT + 0.075); }
    else { bc.rotation.order = 'YXZ'; bc.rotation.y = Math.PI / 2; bc.rotation.x = -0.18; bc.position.set(backT + 0.075, seatH + 0.16, backT + s / 2 + 0.05); }
    g.add(bc);
  }
  return g;
}

// --------------------------------------------------------------- club chair (faces +z)
function clubChair(M, { W = 0.84, D = 0.9, H = 0.82, seatH = 0.47, armH = 0.63, armW = 0.15, legH = 0.14 } = {}) {
  const g = new THREE.Group();
  // tapered dark legs
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const l = mesh(new THREE.CylinderGeometry(0.018, 0.012, legH, 10), M.legWood);
    l.position.set(x * (W / 2 - 0.05), legH / 2, z * (D / 2 - 0.06)); l.rotation.z = -x * 0.08; l.rotation.x = z * 0.08; g.add(l);
  }
  g.add(contactShadow(W + 0.28, D + 0.28, 0, 0, { opacity: 0.8 }));
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(contactShadow(0.16, 0.16, x * (W / 2 - 0.05), z * (D / 2 - 0.06), { y: 0.0145 }));
  const y0 = legH;
  // seat deck
  g.add(rbox(W, 0.16, D, 0.04, M.leather, 0, y0 + 0.08, 0));
  // back
  g.add(rbox(W, H - y0, 0.2, 0.06, M.leather, 0, y0 + (H - y0) / 2, -D / 2 + 0.1, { segs: 4 }));
  // arms (track)
  for (const s of [-1, 1]) g.add(rbox(armW, armH - y0, D, 0.05, M.leather, s * (W / 2 - armW / 2), y0 + (armH - y0) / 2, 0, { segs: 4 }));
  // seat cushion
  const sw = W - 2 * armW, sd = D - 0.2;
  const sc = mesh(cushionGeo(sw, seatH - y0 - 0.14, sd, { segs: 9, bulge: 0.16, round: 0.7, seed: 4 }), M.leather);
  sc.position.set(0, y0 + 0.16 + (seatH - y0 - 0.16) / 2 + 0.01, 0.1); g.add(sc);
  const bc = mesh(cushionGeo(sw, 0.34, 0.14, { segs: 8, bulge: 0.16, round: 0.75, seed: 9 }), M.leather);
  bc.rotation.x = -0.15; bc.position.set(0, seatH + 0.18, -D / 2 + 0.26); g.add(bc);
  return g;
}

// --------------------------------------------------------------- coffee table (reclaimed, trestle legs)
function coffeeTable(M, L = 1.27, W = 0.9, H = 0.46) {
  // local: long axis x, centred at origin
  const g = new THREE.Group();
  const t = 0.075;
  g.add(contactShadow(L + 0.3, W + 0.3, 0, 0, { opacity: 0.9 }));
  // plank top: 5 planks with small gaps
  const n = 5, pw = W / n;
  for (let i = 0; i < n; i++) {
    const p = boxMM(-L / 2, H - t, -W / 2 + i * pw + 0.003, L / 2, H - 0.002 * (i % 2), -W / 2 + (i + 1) * pw - 0.003, M.reclaimed, { grain: 'x' });
    g.add(p);
  }
  // apron
  g.add(boxMM(-L / 2 + 0.08, H - t - 0.08, -W / 2 + 0.07, L / 2 - 0.08, H - t, -W / 2 + 0.11, M.reclaimed, { grain: 'x' }));
  g.add(boxMM(-L / 2 + 0.08, H - t - 0.08, W / 2 - 0.11, L / 2 - 0.08, H - t, W / 2 - 0.07, M.reclaimed, { grain: 'x' }));
  // chunky legs at each end, joined by a foot runner and a long stretcher
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) g.add(boxMM(sx * (L / 2 - 0.2) - 0.06, 0.06, sz * (W / 2 - 0.12) - 0.06, sx * (L / 2 - 0.2) + 0.06, H - t, sz * (W / 2 - 0.12) + 0.06, M.reclaimed, { grain: 'y' }));
    g.add(boxMM(sx * (L / 2 - 0.2) - 0.07, 0, -W / 2 + 0.03, sx * (L / 2 - 0.2) + 0.07, 0.08, W / 2 - 0.03, M.reclaimed, { grain: 'z' }));
  }
  g.add(boxMM(-L / 2 + 0.2, 0.12, -0.05, L / 2 - 0.2, 0.22, 0.05, M.reclaimed, { grain: 'x' }));
  return g;
}

// --------------------------------------------------------------- branches (olive / eucalyptus)
function branches(M, { n = 7, h = 0.45, spread = 0.22, leaf = [0.05, 0.012], leafMat, seed = 3, perStem = 14 } = {}) {
  const g = new THREE.Group();
  const R = rng(seed);
  const stemMat = M.stem;
  const leafGeo = new THREE.PlaneGeometry(leaf[1] * 2, leaf[0]);
  leafGeo.translate(0, leaf[0] / 2, 0);
  const total = n * perStem;
  const inst = new THREE.InstancedMesh(leafGeo, leafMat, total);
  inst.castShadow = true;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(1, 1, 1);
  let k = 0;
  for (let i = 0; i < n; i++) {
    const a = R() * Math.PI * 2, tilt = 0.25 + R() * 0.45;
    const len = h * (0.75 + R() * 0.4);
    const dir = new THREE.Vector3(Math.sin(a) * Math.sin(tilt), Math.cos(tilt), Math.cos(a) * Math.sin(tilt));
    const stem = mesh(new THREE.CylinderGeometry(0.0025, 0.0035, len, 5), stemMat);
    stem.position.copy(dir.clone().multiplyScalar(len / 2));
    stem.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    g.add(stem);
    for (let j = 0; j < perStem; j++) {
      const t = 0.3 + 0.7 * (j / perStem);
      const p = dir.clone().multiplyScalar(len * t);
      e.set((R() - 0.5) * 1.6, R() * Math.PI * 2, (R() - 0.5) * 1.6 + (j % 2 ? 0.9 : -0.9));
      q.setFromEuler(e);
      const sc = 0.7 + R() * 0.5; s.set(sc, sc, sc);
      m4.compose(p, q, s);
      inst.setMatrixAt(k++, m4);
    }
  }
  inst.count = k;
  g.add(inst);
  return g;
}

// --------------------------------------------------------------- art
function abstractTex(kind) {
  return canvasTex(512, 640, (g, w, h) => {
    const R = rng(kind === 'blue' ? 11 : 23);
    if (kind === 'blue') {
      g.fillStyle = '#d9d6cf'; g.fillRect(0, 0, w, h);
      const pal = ['#2f3d55', '#4f6079', '#8f9bab', '#c9a45c', '#e8e3d9', '#6d7a8c', '#1f2a3d', '#b7b3aa'];
      for (let i = 0; i < 70; i++) {
        g.globalAlpha = 0.25 + R() * 0.5; g.fillStyle = pal[(R() * pal.length) | 0];
        g.beginPath(); const x = R() * w, y = R() * h; g.ellipse(x, y, 20 + R() * 90, 10 + R() * 60, R() * 3, 0, 7); g.fill();
      }
      g.globalAlpha = 1;
    } else {
      // soft landscape: pale sky, green-gray hills, water
      const gr = g.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, '#e9ebe6'); gr.addColorStop(0.45, '#dfe2db'); gr.addColorStop(0.55, '#b9c2b3'); gr.addColorStop(1, '#d5d8cf');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 40; i++) {
        g.globalAlpha = 0.15 + R() * 0.3; g.fillStyle = ['#7f8f78', '#9aa696', '#5f6e5c', '#c5cbbf'][(R() * 4) | 0];
        g.beginPath(); g.ellipse(R() * w, h * (0.45 + R() * 0.2), 30 + R() * 120, 6 + R() * 20, 0, 0, 7); g.fill();
      }
      g.globalAlpha = 1;
    }
  });
}
export function framedArt(M, w, h, kind, { depth = 0.035, frame = 0.025, frameMat } = {}) {
  const g = new THREE.Group();
  const fm = frameMat || M.frameWood;
  g.add(boxMM(-w / 2, -h / 2, 0, -w / 2 + frame, h / 2, depth, fm));
  g.add(boxMM(w / 2 - frame, -h / 2, 0, w / 2, h / 2, depth, fm));
  g.add(boxMM(-w / 2 + frame, -h / 2, 0, w / 2 - frame, -h / 2 + frame, depth, fm));
  g.add(boxMM(-w / 2 + frame, h / 2 - frame, 0, w / 2 - frame, h / 2, depth, fm));
  const canvas = new THREE.MeshStandardMaterial({ map: abstractTex(kind), roughness: 0.85 });
  const c = mesh(new THREE.PlaneGeometry(w - 2 * frame - 0.02, h - 2 * frame - 0.02), canvas, { cast: false });
  c.position.z = depth - 0.012; g.add(c);
  g.add(boxMM(-w / 2 + frame, -h / 2 + frame, 0, w / 2 - frame, h / 2 - frame, depth - 0.016, M.paper));
  return g;
}

// --------------------------------------------------------------- throws
// a blanket draped over a horizontal bar: params in local frame (x along the bar)
function drapeThrow(M, mat, { W = 0.5, front = 0.5, back = 0.3, top = 0.2, r = 0.06, seg = 30, seed = 1, fringe = false, fold = 0.012 } = {}) {
  // cross-section path: from front bottom up to the top, across, down the back
  const R = rng(seed);
  const pts = [];
  const N = seg;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const total = front + top + back;
    const s = t * total;
    let y, z;
    if (s < front) { y = -front + s; z = top / 2 + r * 0.5; }
    else if (s < front + top) { y = 0; z = top / 2 - (s - front); }
    else { y = -(s - front - top); z = -top / 2 - r * 0.5; }
    pts.push([y, z]);
  }
  const geo = new THREE.PlaneGeometry(W, 1, 12, N);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const ix = i % 13, iy = Math.floor(i / 13);
    const x = (ix / 12 - 0.5) * W;
    const [y, z] = pts[N - iy];
    const hang = Math.min(1, Math.abs(y) * 4);
    const wav = fold * (Math.sin(x * 23 + seed) + 0.6 * Math.sin(x * 41 + seed * 2.3 + y * 5)) * (0.25 + hang) + 0.006 * (R() - 0.5);
    const lift = fold * 0.5 * Math.sin(x * 9 + seed * 1.7 + y * 7) * (1 - hang * 0.7);
    const vlift = fold * 0.45 * (1.5 + Math.sin(x * 12 + z * 9 + seed) + 0.5 * Math.sin(x * 26 - z * 15 + seed * 2)) * (1 - hang);
    p.setXYZ(i, x + wav * 0.5, y + vlift + (hang < 1 ? lift * 0.4 : 0), z + wav + lift);
  }
  geo.computeVertexNormals();
  const uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i), p.getY(i) + p.getZ(i));
  return mesh(geo, mat);
}

// --------------------------------------------------------------- rug
function rug(M, w, d) {
  const g = new THREE.Group();
  const r = boxMM(-w / 2, 0.0, -d / 2, w / 2, 0.012, d / 2, M.rug, { cast: false });
  // remap uv to 0..1 over the top so the canvas pattern spans the rug
  const uv = r.geometry.attributes.uv, pos = r.geometry.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / w + 0.5, pos.getZ(i) / d + 0.5);
  g.add(r);
  return g;
}

// --------------------------------------------------------------- build
export async function buildLiving(ctx, M, group) {
  const L = new THREE.Group(); L.name = 'living';
  // rug (9x12)
  const rg = rug(M, 2.74, 3.66); rg.position.set(1.57, 0, 0.77); L.add(rg);

  // sectional: corner at the north-west, section A runs south along x≈-0.3..0.7, section B east along z≈-1.65..-0.65
  const D = 1.0, cx = -0.30, cz = -1.55;
  const corner = cornerBlock(M, D); corner.position.set(cx, 0, cz); L.add(corner);
  // section A (west, faces east): local x -> world -z, local z (out of the back) -> world +x
  const LA = 1.64 - (cz + D), xB1 = 1.75, xB2 = 2.32;
  const A = sofaSection(M, LA, { D, armL: true, seats: 2, seed: 11 });
  A.rotation.y = Math.PI / 2; A.position.set(cx, 0, cz + D + LA); L.add(A);
  // section B (north, faces south) with a rounded back end, then a backless leather bumper end
  const B = sofaSection(M, xB1 - (cx + D), { D, seats: 1, seed: 21, roundEnd: true });
  B.position.set(cx + D, 0, cz); L.add(B);
  const bump = bumper(M, xB2 - xB1, D); bump.position.set(xB1, 0, cz); L.add(bump);
  ctx.addCollider({ x0: cx, z0: cz, x1: cx + D, z1: cz + D + LA });
  ctx.addCollider({ x0: cx, z0: cz, x1: xB2, z1: cz + D });

  // pillows on the sectional
  const pill = (mat, w, h, x, y, z, ry, rx = -0.25, rz = 0) => {
    const p = mesh(pillowGeo(w * 0.92, h * 0.92, 0.22, { seed: x * 10 + z, puff: 1.15 }), mat);
    p.position.set(x, y - 0.035, z); p.rotation.set(rx, ry, rz, 'YXZ'); L.add(p); return p;
  };
  // west section A: south end (by the arm) leather pillow + knit ball; corner group
  pill(M.leather, 0.5, 0.5, -0.02, 0.72, 1.4, Math.PI / 2 - 0.25, -0.3, 0.04);
  const ball = mesh(new THREE.SphereGeometry(0.13, 24, 18), M.knitBall); ball.position.set(0.22, 0.6, 1.08); L.add(ball);
  pill(M.pillowStripe, 0.5, 0.5, 0.0, 0.71, -0.38, Math.PI / 2 + 0.3, -0.3, -0.06);
  pill(M.pillowGray, 0.42, 0.42, 0.17, 0.63, -0.56, Math.PI / 2 + 0.5, -0.4);
  pill(M.leather, 0.5, 0.5, -0.03, 0.74, -0.8, Math.PI / 2 + 0.75, -0.28, 0.05);
  pill(M.leather, 0.44, 0.44, -0.08, 0.74, -1.0, Math.PI / 2 + 0.85, -0.3, 0.1);
  // throws
  const t1 = drapeThrow(M, M.throwStripe, { W: 0.5, front: 0.42, back: 0.35, top: 0.24, seed: 2, fold: 0.02 });
  t1.position.set(cx + 0.55, 0.62, 1.64 - 0.12); t1.rotation.y = 0; L.add(t1);
  // cream knit throw over the bumper, hanging down its north side
  const t2 = drapeThrow(M, M.knit, { W: 0.55, front: 0.3, back: 0.1, top: 0.98, r: 0.03, seed: 5, fold: 0.05 });
  t2.position.set((xB1 + xB2) / 2 - 0.02, 0.5, cz + D / 2); t2.rotation.y = Math.PI + 0.14; L.add(t2);

  // club chairs (face north, toward the sectional)
  const ch = clubChair(M);
  const c1 = ch; c1.position.set(2.33, 0, 2.3); c1.rotation.y = Math.PI + 0.2; L.add(c1);
  const c2 = ch.clone(); c2.position.set(0.95, 0, 2.95); c2.rotation.y = Math.PI - 0.38; L.add(c2);
  ctx.addCollider({ x0: 1.88, z0: 1.85, x1: 2.78, z1: 2.75 });
  ctx.addCollider({ x0: 0.5, z0: 2.5, x1: 1.4, z1: 3.4 });

  // coffee table + decor
  const ct = coffeeTable(M); ct.position.set(1.91, 0, 0.33); ct.rotation.y = Math.PI / 2; L.add(ct);
  ctx.addCollider({ x0: 1.46, z0: -0.31, x1: 2.36, z1: 0.96 });
  const topY = 0.46;
  // books
  const books = new THREE.Group();
  books.add(boxMM(-0.17, 0, -0.12, 0.17, 0.035, 0.12, M.bookA));
  books.add(boxMM(-0.15, 0.035, -0.11, 0.15, 0.062, 0.1, M.bookB));
  books.add(boxMM(-0.13, 0.062, -0.1, 0.13, 0.084, 0.09, M.bookC));
  books.position.set(1.85, topY, -0.08); books.rotation.y = 0.35; L.add(books);
  const mags = boxMM(-0.15, 0, -0.11, 0.15, 0.012, 0.11, M.paper); mags.position.set(2.05, topY, 0.62); mags.rotation.y = 0.5; L.add(mags);
  // small white bowl
  const bowlPts = []; for (let i = 0; i <= 10; i++) { const t = i / 10; bowlPts.push(new THREE.Vector2(0.03 + 0.07 * Math.sin(t * Math.PI / 2), 0.055 * (1 - Math.cos(t * Math.PI / 2)))); }
  const bowl = mesh(new THREE.LatheGeometry(bowlPts, 24), M.ceramicSide); bowl.position.set(1.76, topY, 0.25); L.add(bowl);
  // vase with olive branches (Poly Haven ceramic_vase_02)
  const vaseSpot = new THREE.Vector3(2.12, topY, 0.42);
  try {
    const gl = await ctx.loadGLTF(ASSET + 'models/ceramic_vase_02/ceramic_vase_02.gltf');
    const v = gl.scene; v.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    const bb = new THREE.Box3().setFromObject(v); const sz = bb.getSize(new THREE.Vector3());
    const sc = 0.25 / sz.y; v.scale.setScalar(sc); v.position.copy(vaseSpot).add(new THREE.Vector3(0, -bb.min.y * sc, 0));
    L.add(v);
  } catch (e) {
    L.add(cyl(0.07, 0.09, 0.25, M.ceramic, vaseSpot.x, topY + 0.125, vaseSpot.z));
  }
  const ol = branches(M, { n: 8, h: 0.42, leafMat: M.olive, seed: 5, perStem: 16 }); ol.position.copy(vaseSpot).add(new THREE.Vector3(0, 0.2, 0)); L.add(ol);

  // round side table at the south end of section A
  const st = new THREE.Group();
  st.add(contactShadow(0.5, 0.5, 0, 0));
  st.add(cyl(0.24, 0.24, 0.03, M.tableWood, 0, 0.54, 0, { seg: 32 }));
  st.add(cyl(0.035, 0.05, 0.52, M.legWood, 0, 0.27, 0));
  st.add(cyl(0.16, 0.18, 0.03, M.legWood, 0, 0.015, 0, { seg: 24 }));
  st.position.set(cx + 0.35, 0, 1.64 + 0.32); L.add(st);

  // art: abstract on the pier between the dining and foyer openings (north face of the south wall)
  const a1 = framedArt(M, 0.5, 0.6, 'blue', { frameMat: M.frameWood });
  a1.position.set(2.62, 1.56, 3.578 - 0.035); a1.rotation.y = Math.PI; L.add(a1);
  // light switch plate under it (as in the photo)
  L.add(boxMM(2.86, 1.12, 3.578 - 0.008, 2.93, 1.24, 3.578, M.trim));

  group.add(L);
}
