// Living area: cognac leather L-sectional, two leather club chairs, reclaimed-wood coffee table with
// decor, large distressed rug, throws, pillows, knit ball, side table, framed abstract art.
import * as THREE from 'three';
import { boxMM, cyl, mesh as mesh0, pillowGeo, rng, canvasTex, ASSET, leafGeo as leafGeo0 } from './util.js';
import { buildSectional, clubChair } from './sofa.js';

const mesh = mesh0;

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
  _shadowMat = new THREE.MeshBasicMaterial({ map: t, color: 0x0c0705, transparent: true, opacity: 0.85, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  return _shadowMat;
}
export function contactShadow(w, d, x = 0, z = 0, { y = 0.0135, opacity = 1 } = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), opacity === 1 ? shadowMat() : Object.assign(shadowMat().clone(), { opacity: 0.85 * opacity }));
  m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.renderOrder = 2; m.receiveShadow = false; m.castShadow = false;
  return m;
}


// --------------------------------------------------------------- coffee table (reclaimed, trestle legs)
function coffeeTable(M, L = 1.27, W = 0.9, H = 0.46) {
  // local: long axis x, centred at origin
  const g = new THREE.Group();
  // round 9: a thinner reclaimed top (5 cm) with a slight overhang on a slim apron, on trestle ends
  // (two square legs joined by a foot runner) and a low centre stretcher
  const t = 0.05, lw = 0.075, lx = L / 2 - 0.13, lz = W / 2 - 0.1;
  g.add(contactShadow(L + 0.3, W + 0.3, 0, 0, { opacity: 0.9 }));
  // plank top: 5 planks, hairline gaps, slightly uneven
  const n = 5, pw = W / n;
  for (let i = 0; i < n; i++) {
    const p = boxMM(-L / 2 + 0.004 * (i % 3), H - t, -W / 2 + i * pw + 0.0015, L / 2 - 0.003 * ((i + 1) % 2), H - 0.0025 * (i % 2), -W / 2 + (i + 1) * pw - 0.0015, M.reclaimed, { grain: 'x' });
    g.add(p);
  }
  // breadboard ends under the plank ends
  for (const sx of [-1, 1]) g.add(boxMM(sx * (L / 2 - 0.005) - 0.035, H - t - 0.012, -W / 2 + 0.01, sx * (L / 2 - 0.005) + 0.035, H - t, W / 2 - 0.01, M.reclaimed, { grain: 'z' }));
  // apron
  const ah = 0.075;
  g.add(boxMM(-lx, H - t - ah, -lz - 0.01, lx, H - t, -lz + 0.015, M.reclaimed, { grain: 'x' }));
  g.add(boxMM(-lx, H - t - ah, lz - 0.015, lx, H - t, lz + 0.01, M.reclaimed, { grain: 'x' }));
  for (const sx of [-1, 1]) {
    g.add(boxMM(sx * lx - 0.012, H - t - ah, -lz, sx * lx + 0.012, H - t, lz, M.reclaimed, { grain: 'z' }));
    // trestle end: two legs on a foot runner, with a cross rail just above it
    for (const sz of [-1, 1]) g.add(boxMM(sx * lx - lw / 2, 0.055, sz * lz - lw / 2, sx * lx + lw / 2, H - t, sz * lz + lw / 2, M.reclaimed, { grain: 'y' }));
    g.add(boxMM(sx * lx - 0.045, 0, -W / 2 + 0.04, sx * lx + 0.045, 0.06, W / 2 - 0.04, M.reclaimed, { grain: 'z' }));
    g.add(boxMM(sx * lx - 0.025, 0.1, -lz, sx * lx + 0.025, 0.16, lz, M.reclaimed, { grain: 'z' }));
  }
  // low centre stretcher between the trestles
  g.add(boxMM(-lx, 0.11, -0.03, lx, 0.17, 0.03, M.reclaimed, { grain: 'x' }));
  return g;
}

// --------------------------------------------------------------- branches (olive / eucalyptus)
function branches(M, { n = 7, h = 0.45, spread = 0.22, leaf = [0.05, 0.012], leafMat, seed = 3, perStem = 14 } = {}) {
  const g = new THREE.Group();
  const R = rng(seed);
  const stemMat = M.stem;
  const leafGeo = leafGeo0(leaf[0], leaf[1]);
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
      gr.addColorStop(0, '#d8dcd2'); gr.addColorStop(0.45, '#c9cfc0'); gr.addColorStop(0.55, '#8f9d88'); gr.addColorStop(1, '#b9bfa9');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 40; i++) {
        g.globalAlpha = 0.25 + R() * 0.4; g.fillStyle = ['#6f8068', '#8a9a84', '#4d5e4a', '#d9c9a0'][(R() * 4) | 0];
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
function drapeThrow(M, mat, { W = 0.5, front = 0.5, back = 0.3, top = 0.2, r = 0.06, seg = 30, seed = 1, fringe = null, fold = 0.012, soft0 = 0 } = {}) {
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
    // soft cloth: broad low-frequency folds on the hangs, the free corners droop and swing in
    const ex = Math.pow(Math.abs(x) / (W / 2), 3);
    const soft = soft0 * hang * (Math.sin(x * 7.5 + seed * 0.7) + 0.5 * Math.sin(x * 13 - seed));
    const droop = soft0 * 1.6 * ex * hang;
    p.setXYZ(i, x + wav * 0.5 - Math.sign(x) * droop * 0.5, y + vlift + (hang < 1 ? lift * 0.4 : 0) - droop * 0.6, z + wav + lift + Math.sign(z) * soft);
  }
  geo.computeVertexNormals();
  const uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i), p.getY(i) + p.getZ(i));
  const m = mesh(geo, mat);
  if (fringe) {
    // twisted-yarn fringe off the bottom edge of the back hang (row 0): pairs of crossed thin quads per tassel
    const fp = [], idx = [], n = Math.round(W / 0.016), fl = 0.065;
    for (let j = 0; j < n; j++) {
      const f = (j + 0.5) / n * 12, i0 = Math.floor(f), t = f - i0;
      const a = new THREE.Vector3().fromBufferAttribute(p, i0), b = new THREE.Vector3().fromBufferAttribute(p, Math.min(12, i0 + 1));
      const q = a.lerp(b, t), len = fl * (0.85 + 0.3 * R()), sw = (R() - 0.5) * 0.012, hw = 0.0022;
      for (const [dx, dz] of [[hw, 0], [0, hw]]) {
        const k = fp.length / 3;
        fp.push(q.x - dx, q.y + 0.004, q.z - dz, q.x + dx, q.y + 0.004, q.z + dz, q.x + dx + sw, q.y - len, q.z + dz + sw * 0.5, q.x - dx + sw, q.y - len, q.z - dz + sw * 0.5);
        idx.push(k, k + 1, k + 2, k, k + 2, k + 3);
      }
    }
    const fg = new THREE.BufferGeometry();
    fg.setAttribute('position', new THREE.Float32BufferAttribute(fp, 3)); fg.setIndex(idx); fg.computeVertexNormals();
    m.add(mesh(fg, fringe, { cast: false }));
  }
  return m;
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
  const LA = 1.64 - (cz + D), xB1 = 1.78, xB2 = 2.32;   // round 9: the backed return runs on to 1.78 (overlay)
  L.add(buildSectional(M, { D, cx, cz, zA1: 1.64, xB1, xB2 }));
  ctx.addCollider({ x0: cx, z0: cz, x1: cx + D, z1: cz + D + LA });
  ctx.addCollider({ x0: cx, z0: cz, x1: xB2, z1: cz + D });

  // pillows on the sectional
  const pill = (mat, w, h, x, y, z, ry, rx = -0.25, rz = 0) => {
    const p = mesh(pillowGeo(w * 0.92, h * 0.92, 0.22, { seed: x * 10 + z, puff: 1.15 }), mat);
    p.position.set(x, y - 0.06, z); p.rotation.set(rx, ry, rz, 'YXZ'); L.add(p); return p;
  };
  // west section A: south end (by the arm) leather pillow + knit ball; corner group
  pill(M.leather, 0.5, 0.5, 0.27, 0.8, 1.2, Math.PI / 2 - 0.25, -0.3, 0.04);
  const ball = mesh(new THREE.SphereGeometry(0.13, 24, 18), M.knitBall); ball.position.set(0.47, 0.63, 0.98); ball.scale.set(1, 0.92, 1); L.add(ball);
  pill(M.pillowStripe, 0.5, 0.5, 0.29, 0.79, -0.36, Math.PI / 2 + 0.3, -0.3, -0.06);
  pill(M.pillowGray, 0.42, 0.42, 0.45, 0.71, -0.52, Math.PI / 2 + 0.5, -0.4);
  pill(M.leather, 0.5, 0.5, 0.3, 0.81, -0.78, Math.PI / 2 + 0.75, -0.28, 0.05);
  pill(M.leather, 0.44, 0.44, 0.33, 0.8, -1.0, Math.PI / 2 + 0.85, -0.3, 0.1);
  // throws
  // striped throw over the back cushion by the arm, hanging onto the seat
  const t1 = drapeThrow(M, M.throwStripe, { W: 0.46, front: 0.4, back: 0.16, top: 0.3, seed: 2, fold: 0.03 });
  t1.position.set(0.0, 0.875, 1.1); t1.rotation.y = Math.PI / 2; L.add(t1);
  // cream knit throw lying along the return's near arm, hanging off its front
  // draped across the arm's width: bar along the arm (z), hanging into the seat and down the outside
  // the round-7 chaise end is a 0.4 m padded arm, top 0.58 m: the knit rolls over its crown into the seat and down the outside
  const t2 = drapeThrow(M, M.knit, { W: 0.74, front: 0.08, back: 0.34, top: 0.3, r: 0.1, seed: 5, fold: 0.03, soft0: 0.035, seg: 48, fringe: M.knitFringe });
  // round 9: the end roll is 0.2 m wide, top 0.53
  t2.position.set(xB2 - 0.15, 0.57, cz + D / 2 - 0.17); t2.rotation.y = -Math.PI / 2 + 0.06; t2.rotation.z = 0.03; L.add(t2);
  // the throw's folded-over edge on the seat side: a soft knit roll
  const roll = mesh(new THREE.CapsuleGeometry(0.03, 0.64, 6, 14), M.knit);
  roll.rotation.z = Math.PI / 2; roll.scale.set(1, 1, 0.8); roll.position.set(0, -0.02, 0.15 + 0.05 + 0.02); t2.add(roll);

  // club chairs (face north, toward the sectional)
  const ch = clubChair(M);
  const c1 = ch; c1.position.set(2.33, 0, 2.3); c1.rotation.y = Math.PI + 0.2; L.add(c1);
  const c2 = ch.clone(); c2.position.set(0.95, 0, 2.95); c2.rotation.y = Math.PI - 0.38; L.add(c2);
  ctx.addCollider({ x0: 1.88, z0: 1.85, x1: 2.78, z1: 2.75 });
  ctx.addCollider({ x0: 0.5, z0: 2.5, x1: 1.4, z1: 3.4 });

  // coffee table + decor
  const ct = coffeeTable(M); ct.position.set(1.91, 0, 0.33); ct.rotation.y = Math.PI / 2; L.add(ct);
  ctx.addCollider({ x0: 1.45, z0: -0.35, x1: 2.4, z1: 1.0 });
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
  const ol = branches(M, { n: 9, h: 0.42, leafMat: M.olive, seed: 5, perStem: 34, leaf: [0.062, 0.011] }); ol.position.copy(vaseSpot).add(new THREE.Vector3(0, 0.2, 0)); L.add(ol);

  // round side table at the south end of section A
  const st = new THREE.Group();
  st.add(contactShadow(0.5, 0.5, 0, 0));
  st.add(cyl(0.24, 0.24, 0.03, M.tableWood, 0, 0.54, 0, { seg: 32 }));
  st.add(cyl(0.035, 0.05, 0.52, M.legWood, 0, 0.27, 0));
  st.add(cyl(0.16, 0.18, 0.03, M.legWood, 0, 0.015, 0, { seg: 24 }));
  st.position.set(cx + 0.35, 0, 1.5 + 0.32); L.add(st);

  // art: abstract on the pier between the dining and foyer openings (north face of the south wall)
  const a1 = framedArt(M, 0.5, 0.6, 'blue', { frameMat: M.frameWood });
  a1.position.set(2.62, 1.56, 3.578 - 0.035); a1.rotation.y = Math.PI; L.add(a1);
  // light switch plate under it (as in the photo)
  L.add(boxMM(2.86, 1.12, 3.578 - 0.008, 2.93, 1.24, 3.578, M.trim));

  group.add(L);
}
