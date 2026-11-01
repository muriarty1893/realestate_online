// Master bedroom furnishings: bed, nightstands, lamps, bench, rug, art, curtains, barn door, fan, lights.
import * as THREE from 'three';
import { buildBedding, beddingMats, clothGeo } from './bedding.js';
import { box, rbox, mesh, metreUV, pillowGeo, drapeGeo, curtainGeo, lathe, merge, rng, canvasTex, softShadow } from './util.js';

export const R = { x0: -8.928, x1: -4.540, z0: -9.047, z1: -3.978 }; // mstr interior faces
export const BED = { x: -6.735, head: -8.937, W: 2.06, L: 2.3, hbW: 2.22, hbH: 1.12 };

export function buildBedroom(ctx, M, group, P) {
  const g = new THREE.Group(); g.name = 'mstr:furniture'; group.add(g);
  beddingMats(M);
  bed(ctx, M, g, P);
  nightstands(ctx, M, g, P);
  bench(ctx, M, g, P);
  rug(ctx, M, g, P);
  art(ctx, M, g, P);
  curtains(ctx, M, g, P);
  barnDoor(ctx, M, g, P);
  entryDoor(ctx, M, g, P);
  sunBeam(ctx, M, g, P);
  grounding(ctx, M, g, P);
  return g;
}

// ------------------------------------------------------------------ bed
function bed(ctx, M, g, P) {
  const b = new THREE.Group(); b.name = 'bed';
  b.position.set(BED.x, 0, BED.head);
  g.add(b);
  const { W, L, hbW, hbH } = BED;
  // headboard: tall plain upholstered panel standing on the floor
  b.add(rbox(hbW, hbH, 0.11, 0.035, M.upholstery, 0, hbH / 2 + 0.02, -0.055, { segs: 4 }));
  // platform base with recessed plinth
  const baseH = 0.34, baseW = W + 0.06, baseL = L + 0.12;
  b.add(rbox(baseW - 0.06, baseH - 0.02, baseL - 0.06, 0.035, M.upholstery, 0, 0.02 + (baseH - 0.02) / 2, baseL / 2 - 0.01, { segs: 3 }));
  // mattress
  const mT = 0.3, mTop = baseH + mT;
  b.add(rbox(W - 0.2, mT, L - 0.2, 0.06, M.sheet, 0, baseH + mT / 2, L / 2, { segs: 3 }));
  // layered bedding (duvet, turned-down band, throw, pillows): see bedding.js
  buildBedding(ctx, M, b, { W, L, mTop });
  ctx.addCollider({ x0: BED.x - hbW / 2, z0: BED.head - 0.11, x1: BED.x + hbW / 2, z1: BED.head + baseL });
}

// ------------------------------------------------------------------ nightstands + lamps + decor
function nightstands(ctx, M, g, P) {
  const w = 0.58, d = 0.42, h = 0.42, top = 0.64;
  const xs = [BED.x - BED.hbW / 2 - 0.07 - w / 2, BED.x + BED.hbW / 2 + 0.07 + w / 2];
  const zc = R.z0 + d / 2 + 0.005;
  xs.forEach((x, i) => {
    const n = new THREE.Group(); n.position.set(x, top - h, zc); g.add(n);
    const t = 0.022;
    n.add(box(w, t, d, M.oakSoft, 0, h - t / 2, 0, { grain: 'x' }));          // top
    n.add(box(w, t, d, M.oakSoft, 0, t / 2, 0, { grain: 'x' }));              // bottom
    n.add(box(t, h - 2 * t, d, M.oakSoft, -w / 2 + t / 2, h / 2, 0, { grain: 'z' }));
    n.add(box(t, h - 2 * t, d, M.oakSoft, w / 2 - t / 2, h / 2, 0, { grain: 'z' }));
    n.add(box(w - 2 * t, h - 2 * t, 0.012, M.oak, 0, h / 2, -d / 2 + 0.006, { grain: 'x' })); // back
    // drawer (top half) with slim reveal, open shelf below
    const dh = 0.16;
    n.add(box(w - 2 * t - 0.006, dh - 0.006, 0.02, M.oakSoft, 0, h - t - dh / 2, d / 2 - 0.012, { grain: 'x' }));
    n.add(box(w - 2 * t, 0.016, d - 0.02, M.oak, 0, h - t - dh - 0.008, 0, { grain: 'x' }));
    // books on the shelf
    const bk = (bw, bh, bd, mat, bx, by, bz, ry = 0) => { const m = box(bw, bh, bd, mat, bx, by, bz); m.rotation.y = ry; n.add(m); };
    if (i === 1) {
      bk(0.26, 0.03, 0.2, M.books[0], -0.02, t + 0.015, 0.02, 0.05);
      bk(0.24, 0.025, 0.18, M.books[3], -0.01, t + 0.043, 0.02, -0.04);
      bk(0.22, 0.022, 0.17, M.books[2], -0.02, t + 0.066, 0.02, 0.08);
    } else {
      bk(0.24, 0.03, 0.18, M.books[1], 0.03, t + 0.015, 0.03, -0.06);
      bk(0.22, 0.025, 0.16, M.books[2], 0.03, t + 0.043, 0.03, 0.03);
    }
    // lamp
    lamp(ctx, M, g, x + (i === 1 ? -0.07 : 0.02), top, zc - 0.02);
    ctx.addCollider({ x0: x - w / 2, z0: R.z0, x1: x + w / 2, z1: R.z0 + d });
  });
  // decor: book stack + small bowl on right, wood bowl on left, vase with eucalyptus on right
  const xr = xs[1], xl = xs[0];
  g.add(box(0.22, 0.025, 0.16, M.books[2], xr + 0.12, top + 0.0125, zc + 0.08));
  g.add(box(0.2, 0.02, 0.15, M.books[4], xr + 0.12, top + 0.035, zc + 0.08));
  P.vaseR = { x: xr + 0.17, y: top, z: zc - 0.07 };
  P.bowlL = { x: xl - 0.17, y: top, z: zc + 0.06 };
  P.bowlR = { x: xr + 0.12, y: top + 0.045, z: zc + 0.08 };
}

function lamp(ctx, M, g, x, y, z) {
  const l = new THREE.Group(); l.position.set(x, y, z); g.add(l);
  // gourd base (cream ceramic)
  const pts = [[0.0, 0], [0.07, 0.0], [0.09, 0.02], [0.115, 0.08], [0.125, 0.13], [0.115, 0.19], [0.085, 0.24], [0.045, 0.27], [0.03, 0.29], [0.03, 0.31], [0.0, 0.31]];
  l.add(mesh(lathe(pts, 40), M.ceramic, { cast: false }));
  const neck = mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.12, 8), M.brass); neck.position.y = 0.36; l.add(neck);
  // tapered linen shade
  const sh = mesh(new THREE.CylinderGeometry(0.115, 0.18, 0.23, 48, 1, true), M.shade, { cast: false });
  sh.position.y = 0.43; l.add(sh);
  const bulb = mesh(new THREE.SphereGeometry(0.03, 12, 8), M.bulbGlow, { cast: false }); bulb.position.y = 0.42; l.add(bulb);
  const pl = new THREE.PointLight(0xffd8a8, 0.6, 3.5, 2);
  pl.position.set(0, 0.42, 0); pl.castShadow = false;
  l.add(pl); ctx.addInteriorLight(pl);
}

// ------------------------------------------------------------------ bench at the foot
function bench(ctx, M, g, P) {
  const Lb = 1.62, D = 0.42, H = 0.47, legT = 0.075, cushT = 0.12;
  const zc = BED.head + BED.L + 0.12 + 0.13 + D / 2;
  const b = new THREE.Group(); b.position.set(BED.x, 0, zc); g.add(b);
  for (const s of [-1, 1]) b.add(rbox(legT, H - cushT + 0.01, D - 0.01, 0.006, M.oakSoft, s * (Lb / 2 - legT / 2), (H - cushT + 0.01) / 2, 0, { grain: 'y' }));
  b.add(box(Lb - 2 * legT, 0.025, D - 0.08, M.oakSoft, 0, H - cushT - 0.0125, 0, { grain: 'x' }));
  b.add(rbox(Lb, cushT, D, 0.03, M.benchFab, 0, H - cushT / 2, 0, { segs: 4 }));
  // chunky knit throw draped over the east half, hanging toward the floor in front
  const th = mesh(clothGeo({ x0: -0.16, x1: 0.42, z0: -D / 2 + 0.03, z1: D / 2 - 0.02, top: H + 0.03, r: 0.045,
    hang: { w: 0.05, e: 0.05, h: 0.05, f: 0.5 }, density: 90, flare: 0.22, maxDrop: H + 0.02, floorY: 0.015, hem: 0.03, hemIn: 0.02,
    field: (s, t, drop) => 0.02 * Math.sin(s * 8 + t * 4) * Math.sin(t * 6 - s * 3) + (drop > 0 ? 0.015 + 0.03 * Math.sin(drop * 9 + s * 5) * Math.min(1, drop * 4) : 0.012), foldAmp: 0.07, foldSeed: 13, foldScale: 10,
    shade: (s, t, drop, disp) => { const band = s > 0.1 && s < 0.3 ? 1.0 : 0.8; return band * (1 - 0.25 * Math.min(1, drop / 0.45)) * (1 + Math.max(-0.2, Math.min(0.1, disp * 6))); } }), M.knit);
  th.rotation.y = 0.1;
  b.add(th);
  P.bench = { z: zc, D };
  ctx.addCollider({ x0: BED.x - Lb / 2, z0: zc - D / 2, x1: BED.x + Lb / 2, z1: zc + D / 2 });
}

// ------------------------------------------------------------------ rug
function rug(ctx, M, g, P) {
  const w = 3.66, d = 2.74, t = 0.018;
  const x = BED.x + 0.03, z1 = -5.35, z0 = z1 - d;
  const geo = new THREE.BoxGeometry(w, t, d, 1, 1, 1);
  metreUV(geo, 'z');
  const m = mesh(geo, M.rug, { cast: false });
  m.position.set(x, t / 2 + 0.001, (z0 + z1) / 2);
  g.add(m);
}

// ------------------------------------------------------------------ art over the bed
function art(ctx, M, g, P) {
  const w = 1.32, h = 1.04, fd = 0.035, fw = 0.025;
  const a = new THREE.Group(); a.position.set(BED.x, 1.79, R.z0 + fd / 2 + 0.004); g.add(a);
  a.add(box(w, fw, fd, M.artFrame, 0, h / 2 - fw / 2, 0));
  a.add(box(w, fw, fd, M.artFrame, 0, -h / 2 + fw / 2, 0));
  a.add(box(fw, h - 2 * fw, fd, M.artFrame, -w / 2 + fw / 2, 0, 0));
  a.add(box(fw, h - 2 * fw, fd, M.artFrame, w / 2 - fw / 2, 0, 0));
  a.add(box(w - 2 * fw, h - 2 * fw, 0.01, M.artMat, 0, 0, -fd / 2 + 0.006));
  const pic = mesh(new THREE.PlaneGeometry(w - 0.2, h - 0.2), M.art, { cast: false });
  pic.position.z = -fd / 2 + 0.0125; a.add(pic);
}

// ------------------------------------------------------------------ curtains + rods
function rod(M, g, a, b, y, along, fixed, r = 0.013) {
  // along = 'x' (north wall) or 'z' (east wall); fixed = the other coordinate
  const len = Math.abs(b - a), mid = (a + b) / 2;
  const geo = new THREE.CylinderGeometry(r, r, len, 12);
  const m = mesh(geo, M.black, { cast: true });
  if (along === 'x') { m.rotation.z = Math.PI / 2; m.position.set(mid, y, fixed); }
  else { m.rotation.x = Math.PI / 2; m.position.set(fixed, y, mid); }
  g.add(m);
  for (const e of [a, b]) {
    const f = mesh(new THREE.SphereGeometry(r * 1.9, 12, 8), M.black);
    if (along === 'x') f.position.set(e + Math.sign(e - mid) * 0.015, y, fixed); else f.position.set(fixed, y, e + Math.sign(e - mid) * 0.015);
    g.add(f);
  }
  // wall brackets
  for (const e of [a + Math.sign(b - a) * 0.1, b - Math.sign(b - a) * 0.1]) {
    const br = along === 'x' ? box(0.012, 0.012, 0.09, M.black, e, y, fixed - 0.045) : box(0.09, 0.012, 0.012, M.black, fixed + 0.045, y, e);
    g.add(br);
  }
}

function panel(M, mat, g, { width, height, top, at, along, fixed, folds = 7, depth = 0.07, seed = 0, flip = 1, irr = 1 }) {
  const geo = curtainGeo(width, height, { folds, depth, seed, flare: 0.08, irr });
  const m = mesh(geo, mat, { cast: true });
  m.position.y = top;
  if (along === 'x') { m.position.x = at; m.position.z = fixed; m.rotation.y = flip > 0 ? 0 : Math.PI; }
  else { m.position.z = at; m.position.x = fixed; m.rotation.y = flip > 0 ? Math.PI / 2 : -Math.PI / 2; }
  if (mat === M.curtainNear || mat === M.curtainSlider) { m.castShadow = false; m.receiveShadow = false; }
  g.add(m);
  // header rings
  return m;
}

function curtains(ctx, M, g, P) {
  const rodY = 2.66, zN = R.z0 + 0.1;
  // west window (win_mstr_n1, x -8.604..-7.880): panel gathered on its west side
  rod(M, g, -8.87, -7.68, rodY, 'x', zN);
  panel(M, M.curtain, g, { width: 0.42, height: rodY - 0.02, top: rodY - 0.02, at: -8.66, along: 'x', fixed: zN + 0.01, folds: 6, seed: 1 });
  // east window (win_mstr_n2, x -5.567..-4.842): rod spans from left of the window to the corner
  rod(M, g, -5.86, -4.6, rodY, 'x', zN);
  panel(M, M.curtainLit, g, { width: 0.5, height: rodY - 0.02, top: rodY - 0.02, at: -4.8, along: 'x', fixed: zN + 0.01, folds: 7, depth: 0.09, seed: 2 });
  // slider on the east wall: sheer full-height panels on a rod just below the ceiling
  const xE = R.x1 - 0.07, sY = 2.95;
  rod(M, g, -3.99, -7.62, sY, 'z', xE, 0.014);
  panel(M, M.curtainNear, g, { width: 2.0, height: sY - 0.02, top: sY - 0.02, at: -6.55, along: 'z', fixed: xE - 0.02, folds: 10, depth: 0.022, seed: 3, irr: 1 });
  panel(M, M.curtainNear, g, { width: 0.8, height: sY - 0.02, top: sY - 0.02, at: -4.95, along: 'z', fixed: xE - 0.01, folds: 5, depth: 0.02, seed: 4, irr: 1 });
}

// ------------------------------------------------------------------ barn door + flat track
function barnDoor(ctx, M, g, P) {
  // opening door_barn: z -6.096..-5.199 on the wall x -9.036..-8.928; door slid open to the north
  const wallX = R.x0, doorW = 1.08, doorH = 2.42, t = 0.04;
  const zS = -6.096 - 0.012; // leading (south) edge overlaps the north casing like the photo
  const zc = zS - doorW / 2;
  const xb = wallX + 0.018 + 0.016; // back face clear of the casing
  const d = new THREE.Group(); d.name = 'barnDoor';
  d.position.set(xb + t / 2, 0.012, zc); g.add(d);
  // slab core
  d.add(box(t - 0.014, doorH, doorW, M.oakDoor, -0.007, doorH / 2, 0, { grain: 'y' }));
  // frame on the room face: stiles + 6 rails -> 5 horizontal recessed panels
  const st = 0.125, rail = 0.115, topR = 0.13, botR = 0.2, ft = 0.02, fx = t / 2 - ft / 2 + 0.006;
  for (const s of [-1, 1]) d.add(box(ft, doorH, st, M.oakDoor, fx, doorH / 2, s * (doorW / 2 - st / 2), { grain: 'y' }));
  const inner = doorH - topR - botR, pnl = (inner - 4 * rail) / 5;
  const rails = [[botR / 2, botR]];
  for (let k = 1; k <= 4; k++) rails.push([botR + k * pnl + (k - 0.5) * rail, rail]);
  rails.push([doorH - topR / 2, topR]);
  for (const [y, h] of rails) d.add(box(ft, h, doorW - 2 * st, M.oakDoor, fx, y, 0, { grain: 'z' }));
  // pull: black bar on the leading edge
  const pullZ = doorW / 2 - 0.07;
  d.add(box(0.014, 0.34, 0.016, M.black, t / 2 + 0.045, 1.08, pullZ));
  for (const y of [0.93, 1.23]) d.add(box(0.045, 0.016, 0.016, M.black, t / 2 + 0.022, y, pullZ));
  // flat track rail with stops, hangers with wheels
  const railY = doorH + 0.012 + 0.06, railX = xb + t / 2 + 0.005;
  const z0 = -5.05, z1 = zS - doorW - 0.07;
  g.add(box(0.008, 0.045, z0 - z1, M.black, railX, railY, (z0 + z1) / 2));
  for (const z of [z0 - 0.12, (z0 + z1) / 2, z1 + 0.12]) g.add(box(0.03, 0.02, 0.02, M.black, railX - 0.015, railY, z));
  for (const z of [z0 - 0.03, z1 + 0.03]) g.add(box(0.03, 0.05, 0.025, M.black, railX + 0.012, railY, z));
  for (const s of [-1, 1]) {
    const hz = zc + s * (doorW / 2 - 0.13);
    g.add(box(0.008, 0.2, 0.04, M.black, railX + 0.016, doorH + 0.012 - 0.04, hz));
    const wheel = mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.018, 20), M.black);
    wheel.rotation.z = Math.PI / 2; wheel.position.set(railX + 0.016, railY + 0.045, hz); g.add(wheel);
    for (const yy of [doorH - 0.09, doorH - 0.03]) g.add(box(0.012, 0.012, 0.012, M.black, railX + 0.024, yy, hz));
  }
}

// ------------------------------------------------------------------ hall door (custom so it parks against the corner)
function entryDoor(ctx, M, g, P) {
  // door_mstr: x -5.588..-4.756 in the south wall (z -3.978..-3.858). Hinge at the east jamb.
  const o = { x0: -5.588, x1: -4.756, z0: -3.978, z1: -3.858 };
  const headH = ctx.ft(8), leg = 0.085, ct = 0.018, wd = o.x1 - o.x0;
  const trim = ctx.getMat('trim');
  for (const z of [o.z0 - ct / 2, o.z1 + ct / 2]) {
    g.add(box(leg, headH + leg, ct, trim, o.x0 - leg / 2, (headH + leg) / 2, z));
    g.add(box(leg, headH + leg, ct, trim, o.x1 + leg / 2, (headH + leg) / 2, z));
    g.add(box(wd + 2 * leg, leg, ct, trim, (o.x0 + o.x1) / 2, headH + leg / 2, z));
  }
  const leaf = new THREE.Group();
  // swung out into the rear hall against its east side, so it never sits in the bedroom view
  leaf.position.set(o.x1 - 0.02, 0.006, o.z1);
  leaf.rotation.y = Math.PI / 2 + 0.05;
  const lw = wd - 0.02, lh = headH - 0.012, lt = 0.035;
  leaf.add(box(lw, lh, lt, ctx.getMat('door.interior'), -lw / 2, lh / 2, -lt / 2));
  const knob = mesh(new THREE.SphereGeometry(0.028, 12, 8), M.black);
  knob.position.set(-lw + 0.07, 0.92, 0.02); leaf.add(knob);
  const k2 = knob.clone(); k2.position.z = -lt - 0.02; leaf.add(k2);
  g.add(leaf);
}

// ------------------------------------------------------------------ low morning sun through the slider
// The photo's window-shaped sun patch on the west wall can't be reached by the real sun through this plan
// (the porch roof and both wings shade the slider), so a shadow-casting spot with a window gobo stands in
// for that beam. It is the piece's one shadow-casting light and is registered as an interior light.
function sunBeam(ctx, M, g, P) {
  const C = new THREE.Vector3(-8.928, 1.2, -7.82);           // patch centre on the west wall
  const az = THREE.MathUtils.degToRad(117), el = THREE.MathUtils.degToRad(8);
  const d = new THREE.Vector3(-Math.sin(az) * Math.cos(el), -Math.sin(el), Math.cos(az) * Math.cos(el)); // travel dir
  const pos = C.clone().addScaledVector(d, -4.4);
  const gobo = canvasTex(256, 256, (c, w, h) => {
    c.fillStyle = '#000'; c.fillRect(0, 0, w, h);
    c.save(); c.translate(w / 2, h / 2); c.transform(1, 0, -0.18, 1, 0, 0);
    c.filter = 'blur(7px)'; c.fillStyle = '#fff';
    const pw = 0.36 * w, ph = 0.62 * h, bar = 0.045 * w;
    c.fillRect(-pw / 2, -ph / 2, pw, ph);
    c.fillStyle = '#000';
    c.fillRect(-bar / 2, -ph / 2, bar, ph);                     // meeting stile
    c.fillRect(-pw / 2, -bar / 2 - ph * 0.08, pw, bar);        // check rail
    c.restore();
  }, { srgb: true });
  gobo.wrapS = gobo.wrapT = THREE.ClampToEdgeWrapping;
  const sp = new THREE.SpotLight(0xffe8c4, 270, 9, 0.24, 0.0, 1.2);
  sp.position.copy(pos); sp.target.position.copy(C);
  sp.map = gobo;
  sp.castShadow = true;
  sp.shadow.mapSize.set(1024, 1024); sp.shadow.bias = -0.0004; sp.shadow.normalBias = 0.02; sp.shadow.radius = 9;
  sp.shadow.camera.near = 0.2; sp.shadow.camera.far = 9;
  g.add(sp, sp.target);
  ctx.addInteriorLight(sp);
}

// ------------------------------------------------------------------ grounding: soft contact shadows + warm bounce
function floorSun(ctx, M, g) {
  const tx = canvasTex(256, 256, (c, w, h) => {
    c.fillStyle = '#000'; c.fillRect(0, 0, w, h);
    c.save(); c.translate(w / 2, h / 2); c.transform(1, 0, -0.5, 1, 0, 0); c.filter = 'blur(14px)'; c.fillStyle = '#fff';
    c.fillRect(-70, -80, 62, 160); c.fillRect(2, -80, 62, 160); c.restore();
  }, { srgb: true });
  tx.wrapS = tx.wrapT = THREE.ClampToEdgeWrapping;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), new THREE.MeshBasicMaterial({ map: tx, color: new THREE.Color(0xffc477).multiplyScalar(0.42), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, toneMapped: true }));
  m.rotation.x = -Math.PI / 2; m.position.set(-7.55, 0.022, -4.95); m.renderOrder = 3; m.receiveShadow = false;
  g.add(m);
}

function grounding(ctx, M, g, P) {
  floorSun(ctx, M, g);
  const f = 0.021;                                      // just above the rug
  const { W, L, hbW } = BED;
  const bz = BED.head + (L + 0.12) / 2;
  // bed: wide soft occlusion + tight dark core under the platform
  softShadow(g, { x: BED.x, y: f, z: bz + 0.02, w: W + 0.7, d: L + 0.75, blur: 0.3, r: 0.25, opacity: 0.62 });
  softShadow(g, { x: BED.x, y: f + 0.002, z: bz + 0.02, w: W + 0.2, d: L + 0.25, blur: 0.12, r: 0.08, opacity: 0.5 });
  // tight contact line where the upholstered base meets the rug
  softShadow(g, { x: BED.x, y: f + 0.003, z: bz + 0.02, w: W + 0.1, d: L + 0.2, blur: 0.045, r: 0.04, opacity: 0.6, order: 3 });
  // bench
  const bzc = P.bench.z, bD = P.bench.D;
  softShadow(g, { x: BED.x, y: f, z: bzc + 0.03, w: 1.62 + 0.4, d: bD + 0.4, blur: 0.18, r: 0.12, opacity: 0.64 });
  for (const s of [-1, 1]) softShadow(g, { x: BED.x + s * (0.81 - 0.04), y: f + 0.002, z: bzc, w: 0.2, d: bD + 0.08, blur: 0.05, r: 0.02, opacity: 0.78 });
  for (const s of [-1, 1]) softShadow(g, { x: BED.x + s * (0.81 - 0.0375), y: f + 0.004, z: bzc, w: 0.1, d: bD + 0.02, blur: 0.022, r: 0.01, opacity: 0.85, order: 3 });
  // where the knit throw reaches the rug in front of the bench
  softShadow(g, { x: BED.x + 0.15, y: f + 0.004, z: bzc + bD / 2 + 0.06, w: 0.75, d: 0.22, blur: 0.08, r: 0.08, opacity: 0.55, rotY: -0.1, order: 3 });
  // rug edge on the floor
  softShadow(g, { x: BED.x + 0.03, y: 0.004, z: -5.35 - 1.37, w: 3.66 + 0.1, d: 2.74 + 0.1, blur: 0.12, r: 0.04, opacity: 0.3 });
  // nightstands: floor + wall shadows below the floating cabinets, tops under lamps / decor
  const w = 0.58, d = 0.42, top = 0.64;
  const xs = [BED.x - hbW / 2 - 0.07 - w / 2, BED.x + hbW / 2 + 0.07 + w / 2];
  const zc = R.z0 + d / 2 + 0.005;
  xs.forEach((x, i) => {
    softShadow(g, { x, y: 0.12, z: R.z0 + 0.003, w: w + 0.2, d: 0.42, orient: 'wallN', blur: 0.11, r: 0.05, opacity: 0.65 });
    softShadow(g, { x, y: 0.004, z: zc + 0.05, w: w + 0.3, d: d + 0.3, blur: 0.14, r: 0.1, opacity: 0.55 });
    softShadow(g, { x, y: 0.246, z: zc, w: w - 0.08, d: d - 0.06, blur: 0.14, r: 0.03, opacity: 0.55 });   // open shelf sits under the top slab
    const lx = x + (i === 1 ? -0.07 : 0.02), lz = zc - 0.02;
    softShadow(g, { x: lx + 0.03, y: top + 0.002, z: lz + 0.04, w: 0.36, d: 0.36, blur: 0.09, r: 0.16, opacity: 0.55 });
  });
  softShadow(g, { x: xs[1] + 0.13, y: top + 0.002, z: zc + 0.1, w: 0.3, d: 0.24, blur: 0.04, r: 0.02, opacity: 0.5 });
  softShadow(g, { x: xs[1] + 0.2, y: top + 0.002, z: zc - 0.06, w: 0.2, d: 0.2, blur: 0.05, r: 0.08, opacity: 0.5 });
  softShadow(g, { x: xs[0] - 0.14, y: top + 0.002, z: zc + 0.07, w: 0.26, d: 0.26, blur: 0.05, r: 0.1, opacity: 0.45 });
  // barn door on the wall behind it
  softShadow(g, { x: R.x0 + 0.003, y: 1.2, z: -6.648 - 0.02, w: 1.3, d: 2.62, orient: 'wallW', blur: 0.09, r: 0.03, opacity: 0.4 });
  // headboard against the wall
  softShadow(g, { x: BED.x, y: 0.6, z: R.z0 + 0.003, w: hbW + 0.25, d: 1.35, orient: 'wallN', blur: 0.13, r: 0.05, opacity: 0.32 });

  // warm bounce light: no shadow, high in the room so walls and ceiling glow evenly like the photo
  const bounce = new THREE.HemisphereLight(0xfff6ea, 0xe6d6bf, 0.4);
  g.add(bounce); ctx.addInteriorLight(bounce);
  const glow = new THREE.PointLight(0xffeedc, 0.8, 9, 1.6);
  glow.position.set(BED.x + 0.2, 2.2, -6.3); glow.castShadow = false;
  g.add(glow); ctx.addInteriorLight(glow);
}
