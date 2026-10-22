// Dining room (table, cream upholstered chairs, linear iron candle chandelier, window seat in the bay,
// linen curtains, art), butler pantry (cabinets + lit shelving), foyer (console, mirror, lantern, rug)
// and the great-room niche (built-in shelves).
import * as THREE from 'three';
import { boxMM, box, rbox, cyl, mesh, cushionGeo, pillowGeo, rng, ASSET, mergeByMaterial } from './util.js';
import { framedArt } from './living.js';

// --------------------------------------------------------------- dining chair (faces +z)
function diningChair(M) {
  const g = new THREE.Group();
  const W = 0.5, D = 0.58, seatH = 0.48, H = 0.98;
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const l = mesh(new THREE.CylinderGeometry(0.016, 0.012, seatH - 0.08, 8), M.legWood);
    l.position.set(x * (W / 2 - 0.04), (seatH - 0.08) / 2, z * (D / 2 - 0.05)); l.rotation.x = z < 0 ? -0.1 : 0; g.add(l);
  }
  const seat = mesh(cushionGeo(W, 0.1, D - 0.04, { segs: 8, bulge: 0.15, round: 0.4 }), M.cream);
  seat.position.set(0, seatH - 0.05, 0.02); g.add(seat);
  // curved upholstered back (slight wing), tapers toward the top
  const back = mesh(new THREE.CylinderGeometry(0.42, 0.42, H - seatH + 0.04, 18, 1, false, -0.6, 1.2), M.cream);
  back.scale.set(1, 1, 0.55);
  back.position.set(0, seatH + (H - seatH) / 2 - 0.02, -D / 2 + 0.2); back.rotation.y = Math.PI; g.add(back);
  // back thickness fill
  g.add(rbox(W - 0.02, H - seatH, 0.07, 0.03, M.cream, 0, seatH + (H - seatH) / 2 - 0.02, -D / 2 + 0.03));
  return g;
}

function linearChandelier(M, L = 1.05) {
  // iron rectangular frame with candle sleeves, along local x
  const g = new THREE.Group();
  const w = 0.2;
  const rail = (x0, z0, x1, z1, y) => { const a = new THREE.Vector3(x0, y, z0), b = new THREE.Vector3(x1, y, z1); const L2 = a.distanceTo(b); const m = mesh(new THREE.CylinderGeometry(0.008, 0.008, L2, 6), M.iron); m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); g.add(m); return m; };
  for (const s of [-1, 1]) rail(-L / 2, s * w / 2, L / 2, s * w / 2, 0);
  for (const x of [-L / 2, L / 2]) rail(x, -w / 2, x, w / 2, 0);
  // suspension: two rods up to a top bar, single rod to the ceiling canopy
  rail(-L / 2, 0, -0.04, 0, 0.28); rail(L / 2, 0, 0.04, 0, 0.28);
  // candles: 4 per side
  const n = 4;
  for (const s of [-1, 1]) for (let i = 0; i < n; i++) {
    const x = -L / 2 + 0.12 + (i * (L - 0.24)) / (n - 1);
    g.add(cyl(0.012, 0.012, 0.09, M.candle, x, 0.045, s * w / 2, { cast: false }));
    const b = mesh(new THREE.SphereGeometry(0.014, 10, 8), M.bulb, { cast: false }); b.scale.y = 1.6; b.position.set(x, 0.11, s * w / 2); g.add(b);
    g.add(cyl(0.02, 0.016, 0.012, M.iron, x, 0.0, s * w / 2));
  }
  return g;
}

// --------------------------------------------------------------- curtains
function curtainPanel(M, w, h, { folds = 7, depth = 0.06, seed = 1 } = {}) {
  const geo = new THREE.PlaneGeometry(w, h, folds * 6, 8);
  const p = geo.attributes.position;
  const R = rng(seed);
  const ph = R() * 6;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i);
    const t = (x / w + 0.5) * folds * Math.PI * 2;
    const flare = 1 + 0.25 * (0.5 - y / h); // folds open toward the floor
    p.setZ(i, Math.sin(t + ph) * depth * 0.5 * flare);
  }
  geo.computeVertexNormals();
  geo.translate(0, -h / 2, 0);
  return mesh(geo, M.curtain);
}

// --------------------------------------------------------------- build
export async function buildDining(ctx, M, group) {
  const D = new THREE.Group(); D.name = 'dining';
  // rug under the table
  const rugD = boxMM(-0.25, 0, 4.25, 1.85, 0.01, 7.25, M.rugDining, { cast: false });
  { const uv = rugD.geometry.attributes.uv, pos = rugD.geometry.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / 2.1 + 0.5, pos.getZ(i) / 3.0 + 0.5); }
  D.add(rugD);
  // table (long axis N-S), centred in the room
  const tc = new THREE.Vector3(0.79, 0, 5.75), TL = 1.95, TW = 0.98, TH = 0.76;
  const T = new THREE.Group();
  T.add(boxMM(-TW / 2, TH - 0.045, -TL / 2, TW / 2, TH, TL / 2, M.tableWood, { grain: 'z' }));
  T.add(boxMM(-TW / 2 + 0.06, TH - 0.13, -TL / 2 + 0.08, TW / 2 - 0.06, TH - 0.045, TL / 2 - 0.08, M.tableWood, { grain: 'z' }));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) T.add(boxMM(sx * (TW / 2 - 0.06) - 0.04, 0, sz * (TL / 2 - 0.08) - 0.04, sx * (TW / 2 - 0.06) + 0.04, TH - 0.045, sz * (TL / 2 - 0.08) + 0.04, M.tableWood));
  T.position.copy(tc); D.add(T);
  ctx.addCollider({ x0: tc.x - TW / 2 - 0.3, z0: tc.z - TL / 2 - 0.3, x1: tc.x + TW / 2 + 0.3, z1: tc.z + TL / 2 + 0.3 });
  // chairs
  const ch = mergeByMaterial(diningChair(M));
  const put = (x, z, ry) => { const c = ch.clone(); c.position.set(x, 0, z); c.rotation.y = ry; D.add(c); };
  put(tc.x, tc.z - TL / 2 - 0.22, 0);              // head (north), faces south
  put(tc.x, tc.z + TL / 2 + 0.22, Math.PI);        // foot (south)
  for (const dz of [-0.48, 0.48]) {
    put(tc.x + TW / 2 + 0.2, tc.z + dz, -Math.PI / 2 + 0.04); // east side, faces west
    put(tc.x - TW / 2 - 0.2, tc.z + dz, Math.PI / 2 - 0.04);  // west side, faces east
  }
  // centrepiece: white vase with eucalyptus
  D.add(cyl(0.06, 0.08, 0.22, M.ceramic, tc.x, TH + 0.11, tc.z, { seg: 24 }));
  const eu = branchesSimple(M, M.eucalyptus, 6); eu.position.set(tc.x, TH + 0.2, tc.z); D.add(eu);
  // chandelier (N-S along the table), hanging from the 11 ft tray
  const lc = linearChandelier(M, 1.05); lc.rotation.y = Math.PI / 2; lc.position.set(tc.x, 1.88, tc.z); D.add(lc);
  D.add(cyl(0.006, 0.006, 3.353 - 2.16, M.iron, tc.x, (3.353 + 2.16) / 2, tc.z, { cast: false }));
  D.add(cyl(0.07, 0.07, 0.03, M.iron, tc.x, 3.338, tc.z));

  // window seat in the bay: x -0.098..1.729, z 7.65..8.17 (window sill at 1.5 ft)
  const bx0 = -0.098, bx1 = 1.729, bz0 = 7.6, bz1 = 8.17;
  D.add(boxMM(bx0, 0, bz0 + 0.03, bx1, 0.42, bz1, M.trim));
  for (let i = 0; i < 3; i++) { const a = bx0 + 0.04 + i * ((bx1 - bx0 - 0.08) / 3); D.add(boxMM(a + 0.02, 0.08, bz0 + 0.01, a + (bx1 - bx0 - 0.08) / 3 - 0.02, 0.36, bz0 + 0.03, M.trim)); }
  const cush = mesh(cushionGeo(bx1 - bx0 - 0.02, 0.09, bz1 - bz0 - 0.04, { segs: 12, bulge: 0.12, round: 0.3 }), M.cream);
  cush.position.set((bx0 + bx1) / 2, 0.465, (bz0 + bz1) / 2 + 0.01); D.add(cush);
  const pp = (mat, w, x, ry) => { const p = mesh(pillowGeo(w, w, 0.12, { seed: x * 7 }), mat); p.position.set(x, 0.72, bz1 - 0.12); p.rotation.set(-0.25, Math.PI + ry, 0, 'YXZ'); D.add(p); };
  pp(M.pillowWhite, 0.45, bx0 + 0.3, 0.3); pp(M.pillowPattern, 0.42, bx0 + 0.62, 0.1); pp(M.pillowWhite, 0.42, bx1 - 0.35, -0.25);
  // bench along the west wall by the south-west corner (as staged in the photo)
  const bnx0 = -0.97, bnz0 = 6.55, bnz1 = 7.6;
  D.add(boxMM(bnx0, 0, bnz0, bnx0 + 0.45, 0.42, bnz1, M.trim));
  const bc = mesh(cushionGeo(0.43, 0.08, bnz1 - bnz0 - 0.02, { segs: 10, bulge: 0.12, round: 0.3 }), M.cream);
  bc.position.set(bnx0 + 0.225, 0.46, (bnz0 + bnz1) / 2); D.add(bc);
  const bp = (mat, w, z, ry) => { const p = mesh(pillowGeo(w, w, 0.12, { seed: z * 5 }), mat); p.position.set(bnx0 + 0.1, 0.7, z); p.rotation.set(-0.25, Math.PI / 2 + ry, 0, 'YXZ'); D.add(p); };
  bp(M.pillowPattern, 0.42, 7.3, -0.2); bp(M.pillowWhite, 0.45, 6.88, 0.1);
  ctx.addCollider({ x0: bnx0, z0: bnz0, x1: bnx0 + 0.45, z1: bnz1 });
  // curtains at the bay mouth on an iron rod
  D.add(cyl(0.012, 0.012, 2.6, M.iron, 0.8, 2.86, 7.56).rotateZ(Math.PI / 2));
  for (const x of [-0.5, 2.1]) D.add(cyl(0.025, 0.025, 0.05, M.iron, x, 2.86, 7.56).rotateZ(Math.PI / 2));
  const c1 = curtainPanel(M, 0.55, 2.82, { seed: 1 }); c1.position.set(1.62, 2.84, 7.58); D.add(c1);
  const c2 = curtainPanel(M, 0.62, 2.82, { seed: 2 }); c2.position.set(-0.08, 2.84, 7.58); D.add(c2);
  // art on the south wall west of the bay
  const a2 = framedArt(M, 0.46, 0.66, 'land', { frameMat: M.frameWood }); a2.position.set(-0.6, 1.5, 7.65 - 0.035 - 0.0); D.add(a2);
  group.add(D);

  buildButler(ctx, M, group);
  buildFoyer(ctx, M, group);
  buildNiche(ctx, M, group);
}

function branchesSimple(M, leafMat, n = 6) {
  const g = new THREE.Group();
  const R = rng(9);
  const leafGeo = new THREE.CircleGeometry(0.018, 8);
  const inst = new THREE.InstancedMesh(leafGeo, leafMat, n * 12);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  let k = 0;
  for (let i = 0; i < n; i++) {
    const a = R() * 6.28, tilt = 0.2 + R() * 0.5, len = 0.32 + R() * 0.15;
    const dir = new THREE.Vector3(Math.sin(a) * Math.sin(tilt), Math.cos(tilt), Math.cos(a) * Math.sin(tilt));
    const s = mesh(new THREE.CylinderGeometry(0.002, 0.003, len, 5), M.stem); s.position.copy(dir.clone().multiplyScalar(len / 2)); s.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir); g.add(s);
    for (let j = 0; j < 12; j++) { const p = dir.clone().multiplyScalar(len * (0.25 + 0.75 * j / 12)); e.set(R() * 3, R() * 6, R() * 3); q.setFromEuler(e); m4.compose(p, q, new THREE.Vector3(1, 1, 1)); inst.setMatrixAt(k++, m4); }
  }
  inst.count = k; g.add(inst);
  return g;
}

// --------------------------------------------------------------- butler pantry
function buildButler(ctx, M, group) {
  const g = new THREE.Group(); g.name = 'butler';
  const wx = -4.421, zN = 3.697, zS = 6.098, xE = -1.135;
  const CTR = 0.914;
  // west wall run (prep counter): base, counter, uppers with LED, tile
  g.add(boxMM(wx, 0.1, zN + 0.02, wx + 0.6, CTR - 0.03, zS - 0.6, M.cabDark));
  g.add(boxMM(wx, 0, zN + 0.05, wx + 0.53, 0.1, zS - 0.6, M.black));
  const fronts = (z0, z1, y0, y1, xf) => {
    const n = Math.max(1, Math.round((z1 - z0) / 0.5)), w = (z1 - z0) / n;
    for (let i = 0; i < n; i++) {
      const a = z0 + i * w + 0.003, b = a + w - 0.006;
      g.add(boxMM(xf, y0 + 0.003, a, xf + 0.02, y1 - 0.003, b, M.cab));
      g.add(boxMM(xf + 0.02, y0 + 0.06, a + 0.06, xf + 0.024, y1 - 0.06, b - 0.06, M.cabDark));
      g.add(cyl(0.0065, 0.0065, Math.min(0.18, (y1 - y0) * 0.4), M.brass, xf + 0.05, y1 - 0.15, i % 2 ? a + 0.05 : b - 0.05));
    }
  };
  fronts(zN + 0.02, zS - 0.6, 0.1, CTR - 0.03, wx + 0.6);
  g.add(boxMM(wx, CTR - 0.03, zN + 0.02, wx + 0.635, CTR, zS, M.granite));
  // south run under the windows
  g.add(boxMM(wx + 0.6, 0.1, zS - 0.6, xE - 0.02, CTR - 0.03, zS, M.cabDark));
  g.add(boxMM(wx, CTR - 0.03, zS - 0.635, xE - 0.02, CTR, zS, M.granite));
  // uppers on the west wall + open shelves
  g.add(boxMM(wx, 1.42, zN + 0.02, wx + 0.33, 2.38, 4.9, M.cabDark));
  fronts(zN + 0.02, 4.9, 1.42, 2.38, wx + 0.33);
  g.add(boxMM(wx + 0.03, 1.415, zN + 0.1, wx + 0.1, 1.42, 4.85, M.ledStrip, { cast: false }));
  g.add(boxMM(wx, CTR, zN + 0.02, wx + 0.008, 1.42, zS - 0.6, M.subway));
  const R = rng(4);
  for (const y of [1.45, 1.8, 2.15]) {
    g.add(boxMM(wx, y - 0.035, 4.95, wx + 0.3, y, zS - 0.62, M.tableWood, { grain: 'z' }));
    // jars / dishes / books
    for (let z = 5.0; z < zS - 0.7; z += 0.13 + R() * 0.08) {
      const k = R();
      if (k < 0.4) g.add(cyl(0.045, 0.045, 0.14 + R() * 0.08, M.jarGlass, wx + 0.15, y + 0.09, z, { cast: false }));
      else if (k < 0.7) g.add(boxMM(wx + 0.03, y, z - 0.02, wx + 0.24, y + 0.22 + R() * 0.05, z + 0.02, [M.bookA, M.bookB, M.bookC][(R() * 3) | 0]));
      else g.add(cyl(0.11, 0.1, 0.06, M.ceramic, wx + 0.15, y + 0.03, z));
    }
  }
  // counter props: jars, cutting board
  for (let i = 0; i < 3; i++) g.add(cyl(0.05, 0.05, 0.18 + i * 0.04, M.jarGlass, wx + 0.2, CTR + 0.1 + i * 0.02, 4.2 + i * 0.14, { cast: false }));
  g.add(boxMM(wx + 0.02, CTR, 4.75, wx + 0.05, CTR + 0.42, 5.05, M.tableWood));
  // wine fridge under the south counter
  g.add(boxMM(-2.4, 0.1, zS - 0.62, -1.8, CTR - 0.04, zS - 0.6, M.ovenGlass));
  group.add(g);
  ctx.addCollider({ x0: wx, z0: zN, x1: wx + 0.65, z1: zS });
  ctx.addCollider({ x0: wx, z0: zS - 0.65, x1: xE, z1: zS });
}

// --------------------------------------------------------------- foyer
function buildFoyer(ctx, M, group) {
  const g = new THREE.Group(); g.name = 'foyer';
  const ex = 6.443; // east wall face
  // console table on the east wall
  const cz = 5.3, cl = 1.4, cd = 0.4;
  g.add(boxMM(ex - cd, 0.78, cz - cl / 2, ex - 0.01, 0.82, cz + cl / 2, M.tableWood, { grain: 'z' }));
  for (const sz of [-1, 1]) for (const sx of [0, 1]) g.add(boxMM(ex - cd + 0.03 + sx * (cd - 0.1), 0, cz + sz * (cl / 2 - 0.04) - 0.025, ex - cd + 0.08 + sx * (cd - 0.1), 0.78, cz + sz * (cl / 2 - 0.04) + 0.025, M.tableWood));
  g.add(boxMM(ex - cd + 0.04, 0.12, cz - cl / 2 + 0.04, ex - 0.03, 0.15, cz + cl / 2 - 0.04, M.tableWood, { grain: 'z' }));
  // baskets on the lower shelf
  for (const dz of [-0.3, 0.3]) g.add(boxMM(ex - cd + 0.06, 0.15, cz + dz - 0.18, ex - 0.06, 0.4, cz + dz + 0.18, M.wicker));
  // round mirror
  const mir = new THREE.Group();
  mir.add(mesh(new THREE.TorusGeometry(0.42, 0.03, 10, 48), M.iron));
  const glass = mesh(new THREE.CircleGeometry(0.41, 48), M.mirror); glass.position.z = -0.005; mir.add(glass);
  mir.position.set(ex - 0.035, 1.65, cz); mir.rotation.y = -Math.PI / 2; g.add(mir);
  // lamp + decor on the console
  g.add(cyl(0.08, 0.1, 0.36, M.ceramic, ex - 0.2, 1.0, cz - 0.45, { seg: 20 }));
  g.add(cyl(0.13, 0.19, 0.28, M.shade, ex - 0.2, 1.33, cz - 0.45, { seg: 24, cast: false }));
  g.add(boxMM(ex - 0.32, 0.82, cz + 0.25, ex - 0.08, 0.86, cz + 0.55, M.bookA));
  // runner rug from the entry door
  const rr = boxMM(3.55, 0, 4.0, 5.65, 0.01, 6.6, M.rugFoyer, { cast: false });
  { const uv = rr.geometry.attributes.uv, pos = rr.geometry.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / 2.1 + 0.5, pos.getZ(i) / 2.6 + 0.5); }
  g.add(rr);
  // lantern pendant in the tray
  const lan = new THREE.Group();
  const fr = (x0, y0, z0, x1, y1, z1) => lan.add(boxMM(x0, y0, z0, x1, y1, z1, M.iron));
  const s = 0.18, h = 0.5;
  for (const x of [-s, s]) for (const z of [-s, s]) fr(x - 0.01, 0, z - 0.01, x + 0.01, h, z + 0.01);
  fr(-s - 0.02, h, -s - 0.02, s + 0.02, h + 0.03, s + 0.02); fr(-s - 0.02, -0.03, -s - 0.02, s + 0.02, 0, s + 0.02);
  const lg = mesh(new THREE.BoxGeometry(2 * s, h, 2 * s), M.glass, { cast: false, receive: false }); lg.position.y = h / 2; lan.add(lg);
  const lb = mesh(new THREE.SphereGeometry(0.03, 10, 8), M.bulb, { cast: false }); lb.position.y = h / 2; lan.add(lb);
  lan.position.set(4.58, 2.35, 5.27); g.add(lan);
  g.add(cyl(0.005, 0.005, 3.353 - 2.88, M.iron, 4.58, (3.353 + 2.88) / 2, 5.27, { cast: false }));
  group.add(g);
  ctx.addCollider({ x0: ex - cd, z0: cz - cl / 2, x1: ex, z1: cz + cl / 2 });
}

// --------------------------------------------------------------- niche beside the fireplace
function buildNiche(ctx, M, group) {
  const g = new THREE.Group(); g.name = 'niche';
  const x0 = 6.68, x1 = 7.26, z0 = -1.30, z1 = -0.584;
  g.add(boxMM(x0 + 0.02, 0, z0 + 0.01, x1, 0.75, z1 - 0.01, M.cab));
  g.add(boxMM(x0 - 0.01, 0.75, z0 + 0.01, x1, 0.79, z1 - 0.01, M.tableWood));
  for (const y of [1.25, 1.7, 2.1]) {
    g.add(boxMM(x0 + 0.15, y - 0.04, z0 + 0.01, x1, y, z1 - 0.01, M.beam, { grain: 'z' }));
  }
  g.add(cyl(0.07, 0.09, 0.3, M.ceramic, x0 + 0.35, 0.94, -0.95));
  g.add(boxMM(x0 + 0.25, 1.25, -1.2, x0 + 0.5, 1.5, -1.12, M.bookA));
  g.add(boxMM(x0 + 0.25, 1.25, -1.12, x0 + 0.5, 1.48, -1.04, M.bookC));
  g.add(cyl(0.1, 0.06, 0.12, M.ceramicBeige, x0 + 0.4, 1.76, -0.85));
  g.add(cyl(0.05, 0.05, 0.25, M.ceramic, x0 + 0.4, 2.225, -1.0));
  group.add(g);
}
