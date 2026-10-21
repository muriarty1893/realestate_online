// Master bath (tub under the window, two oak vanities with mirrors and brass sconces, glass shower) and WC.
import * as THREE from 'three';
import { box, rbox, mesh, lathe, metreUV, BASE } from './util.js';

const B = { x0: -11.98, x1: -9.036, z0: -7.74, z1: -5.03 }; // main bath rect (interior faces)
const SH = { x0: -10.11, x1: -9.036, z0: -7.74, z1: -6.27 }; // 42x56 shower (marks.shower)
const TUB = { x0: -11.89, x1: -11.13, z0: -6.39, z1: -4.86 }; // marks.tubMaster
const WEST = -11.98; // interior face of the exterior wall

export async function buildBath(ctx, M, group, P) {
  const g = new THREE.Group(); g.name = 'mbath'; group.add(g);
  tub(ctx, M, g);
  vanity(ctx, M, g, -7.73, -6.49, P, true);
  vanity(ctx, M, g, -4.81, -3.24, P, false);
  shower(ctx, M, g);
  romanShade(ctx, M, g);
  bathRug(ctx, M, g);
  wc(ctx, M, g);
  // skylight from the tub window (soft, cool) - no shadows, faces into the bath
  const rl = new THREE.RectAreaLight(0xf3f1ec, 2.2, 1.1, 1.6);
  rl.position.set(WEST + 0.05, 1.75, -5.585); rl.lookAt(WEST + 2, 1.5, -5.585);
  g.add(rl); ctx.addInteriorLight(rl);
  // plants / vase models
  await vases(ctx, M, g, P);
}

function tub(ctx, M, g) {
  // freestanding oval soaking tub: lathe profile scaled into an oval, outer shell + inner basin
  const H = 0.6, rx = (TUB.x1 - TUB.x0) / 2, rz = (TUB.z1 - TUB.z0) / 2;
  const prof = [[0.0, 0.0], [0.78, 0.0], [0.86, 0.03], [0.93, 0.25], [0.985, 0.6], [1.0, 0.93], [0.995, 0.985], [0.975, 1.0], [0.93, 0.995], [0.9, 0.96], [0.86, 0.55], [0.78, 0.22], [0.6, 0.15], [0.0, 0.15]];
  const geo = lathe(prof.map(([r, y]) => [r, y * H]), 64);
  const t = mesh(geo, M.porcelainWhite);
  t.scale.set(rx, 1, rz); t.position.set((TUB.x0 + TUB.x1) / 2, 0, (TUB.z0 + TUB.z1) / 2);
  g.add(t);
  // water-free basin bottom shading
  ctx.addCollider({ x0: TUB.x0, z0: TUB.z0, x1: TUB.x1, z1: TUB.z1 });
  // floor-mounted tub filler (matte black)
  const fx = TUB.x1 + 0.16, fz = (TUB.z0 + TUB.z1) / 2 + 0.25;
  const pipe = mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.95, 12), M.blackMatte); pipe.position.set(fx, 0.475, fz); g.add(pipe);
  const spout = mesh(new THREE.TorusGeometry(0.12, 0.016, 8, 20, Math.PI), M.blackMatte);
  spout.position.set(fx - 0.12, 0.95, fz); spout.rotation.y = 0; g.add(spout);
  const fb = mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.02, 20), M.blackMatte); fb.position.set(fx, 0.01, fz); g.add(fb);
}

function vanity(ctx, M, g, z0, z1, P, north) {
  const D = 0.56, H = 0.86, x0 = WEST, x1 = WEST + D, len = z1 - z0, zc = (z0 + z1) / 2;
  const v = new THREE.Group(); g.add(v);
  // carcass with toe kick
  v.add(box(D - 0.02, H - 0.1, len, M.oak, x0 + (D - 0.02) / 2, 0.1 + (H - 0.1) / 2, zc, { grain: 'y' }));
  v.add(box(D - 0.08, 0.1, len - 0.04, M.blackMatte, x0 + (D - 0.08) / 2, 0.05, zc, { cast: false }));
  // fronts: drawer stack on the south end, doors toward the north; slight reveals
  const fx = x1 - 0.005, ft = 0.02;
  const stackW = 0.42;
  const zStack0 = north ? z1 - stackW : z0, zStack1 = north ? z1 : z0 + stackW;
  const dh = (H - 0.12) / 3;
  for (let i = 0; i < 3; i++) {
    const y = 0.11 + dh * i + dh / 2;
    v.add(box(ft, dh - 0.008, stackW - 0.008, M.oakLight, fx, y, (zStack0 + zStack1) / 2, { grain: 'z' }));
    v.add(box(0.014, 0.012, 0.16, M.bronze, fx + 0.017, y + dh * 0.2, (zStack0 + zStack1) / 2));
  }
  const dz0 = north ? z0 : zStack1, dz1 = north ? zStack0 : z1, nd = 2;
  const dw = (dz1 - dz0) / nd;
  for (let i = 0; i < nd; i++) {
    const zz = dz0 + dw * (i + 0.5);
    v.add(box(ft, H - 0.12 - 0.008, dw - 0.008, M.oakLight, fx, 0.11 + (H - 0.12) / 2, zz, { grain: 'y' }));
    v.add(box(0.014, 0.16, 0.012, M.bronze, fx + 0.017, 0.62, zz + (i === 0 ? dw / 2 - 0.05 : -dw / 2 + 0.05)));
  }
  // quartz top + undermount sink + faucet
  v.add(box(D + 0.02, 0.03, len + 0.02, M.quartz, x0 + (D + 0.02) / 2, H + 0.015, zc));
  const sinkZ = north ? z0 + (zStack0 - z0) / 2 : zStack1 + (z1 - zStack1) / 2;
  const basin = mesh(new THREE.CylinderGeometry(0.2, 0.18, 0.012, 32), M.porcelainWhite, { cast: false });
  basin.scale.set(0.8, 1, 1.2); basin.position.set(x0 + 0.3, H + 0.026, sinkZ); v.add(basin);
  const fp = mesh(new THREE.CylinderGeometry(0.014, 0.016, 0.3, 12), M.bronze); fp.position.set(x0 + 0.08, H + 0.18, sinkZ); v.add(fp);
  const sp = mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.16, 10), M.bronze); sp.rotation.z = Math.PI / 2; sp.position.set(x0 + 0.15, H + 0.32, sinkZ); v.add(sp);
  for (const s of [-1, 1]) { const h = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.08, 8), M.bronze); h.position.set(x0 + 0.08, H + 0.07, sinkZ + s * 0.17); v.add(h); }
  // mirror (thin oak frame) + brass sconces each side
  const mw = 0.72, mh = 1.0, my = 1.62;
  v.add(box(0.025, mh + 0.06, mw + 0.06, M.oak, WEST + 0.0125, my, sinkZ, { grain: 'y' }));
  const mir = mesh(new THREE.PlaneGeometry(mw, mh), M.mirror, { cast: false });
  mir.rotation.y = Math.PI / 2; mir.position.set(WEST + 0.027, my, sinkZ); v.add(mir);
  for (const s of [-1, 1]) sconce(M, v, WEST, 1.72, sinkZ + s * (mw / 2 + 0.17));
  // a few things on the counter
  v.add(box(0.12, 0.02, 0.24, M.oakLight, x0 + 0.12, H + 0.04, sinkZ + (north ? 0.32 : -0.32)));
  const jar = mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.12, 16), M.ceramic); jar.position.set(x0 + 0.1, H + 0.11, sinkZ + (north ? 0.28 : -0.28)); v.add(jar);
  ctx.addCollider({ x0, z0, x1: x1 + 0.02, z1 });
  if (north) P.bathVase = { x: x0 + 0.2, y: H + 0.03, z: zStack0 + 0.14 };
}

function sconce(M, g, wallX, y, z) {
  const plate = mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.015, 16), M.brass);
  plate.position.set(wallX + 0.008, y, z); plate.rotation.z = Math.PI / 2; g.add(plate);
  const arm = box(0.11, 0.012, 0.012, M.brass, wallX + 0.06, y, z); g.add(arm);
  const shade = mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.16, 20, 1, true), M.shade, { cast: false });
  shade.position.set(wallX + 0.11, y + 0.02, z); g.add(shade);
  const cup = mesh(new THREE.CylinderGeometry(0.047, 0.04, 0.03, 20), M.brass); cup.position.set(wallX + 0.11, y - 0.07, z); g.add(cup);
}

function shower(ctx, M, g) {
  // tile on the two solid walls inside the shower, full height
  const tH = 2.4;
  g.add(box(0.012, tH, SH.z1 - SH.z0, M.subway, SH.x1 - 0.006, tH / 2, (SH.z0 + SH.z1) / 2, { grain: 'z' }));
  g.add(box(SH.x1 - SH.x0, tH, 0.012, M.subway, (SH.x0 + SH.x1) / 2, tH / 2, SH.z0 + 0.006, { grain: 'x' }));
  // pan + curb
  const pan = box(SH.x1 - SH.x0 - 0.012, 0.02, SH.z1 - SH.z0 - 0.08, M.porcelain, (SH.x0 + SH.x1) / 2 - 0.006, 0.01, (SH.z0 + SH.z1) / 2 - 0.04, { cast: false });
  g.add(pan);
  g.add(box(SH.x1 - SH.x0, 0.1, 0.1, M.quartz, (SH.x0 + SH.x1) / 2, 0.05, SH.z1 - 0.05));
  g.add(box(0.1, 0.1, SH.z1 - SH.z0, M.quartz, SH.x0 + 0.05, 0.05, (SH.z0 + SH.z1) / 2));
  // frameless glass: west panel full length, south fixed panel + door
  const gh = 2.0, gt = 0.01;
  const gw = mesh(new THREE.BoxGeometry(gt, gh, SH.z1 - SH.z0 - 0.02), M.showerGlass, { cast: false });
  gw.position.set(SH.x0 + 0.05, 0.1 + gh / 2, (SH.z0 + SH.z1) / 2); gw.userData.glass = true; g.add(gw);
  const sw = SH.x1 - SH.x0 - 0.1;
  const gs = mesh(new THREE.BoxGeometry(sw * 0.45, gh, gt), M.showerGlass, { cast: false });
  gs.position.set(SH.x1 - sw * 0.225, 0.1 + gh / 2, SH.z1 - 0.05); gs.userData.glass = true; g.add(gs);
  const gd = mesh(new THREE.BoxGeometry(sw * 0.55, gh, gt), M.showerGlass, { cast: false });
  gd.position.set(SH.x0 + 0.1 + sw * 0.275, 0.1 + gh / 2, SH.z1 - 0.05); gd.userData.glass = true; g.add(gd);
  g.add(box(0.015, 0.3, 0.025, M.bronze, SH.x0 + 0.13, 1.1, SH.z1 - 0.025));
  // brass rain head + valve
  const arm = box(0.3, 0.02, 0.02, M.brass, SH.x1 - 0.15, 2.1, (SH.z0 + SH.z1) / 2); g.add(arm);
  const head = mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.012, 24), M.brass); head.position.set(SH.x1 - 0.3, 2.08, (SH.z0 + SH.z1) / 2); g.add(head);
  const valve = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.012, 20), M.brass); valve.rotation.z = Math.PI / 2; valve.position.set(SH.x1 - 0.015, 1.1, (SH.z0 + SH.z1) / 2); g.add(valve);
  // niche
  g.add(box(0.008, 0.3, 0.5, M.porcelainWhite, SH.x1 - 0.013, 1.35, (SH.z0 + SH.z1) / 2 - 0.2));
  ctx.addCollider({ x0: SH.x0 + 0.04, z0: SH.z0, x1: SH.x0 + 0.06, z1: SH.z1 });
}

function romanShade(ctx, M, g) {
  // win_tub: z -6.17..-5.0, head 8 ft; shade lowered over the top quarter
  const z0 = -6.17, z1 = -5.0, head = ctx.ft(8), h = 0.42;
  const s = new THREE.Group(); g.add(s);
  const folds = 4;
  for (let i = 0; i < folds; i++) {
    const y = head - (i + 0.5) * (h / folds);
    const f = rbox(0.04, h / folds + 0.01, z1 - z0 + 0.04, 0.018, M.romanShade, WEST + 0.03, y, (z0 + z1) / 2, { segs: 2 });
    s.add(f);
  }
}

function bathRug(ctx, M, g) {
  const r = box(0.6, 0.012, 0.95, M.rug, WEST + 0.92, 0.007, -7.08, { cast: false });
  g.add(r);
}

function wc(ctx, M, g) {
  // WC room x -10.01..-9.036, z -4.91..-3.25: toilet on the east wall, linen cabinet at the south end
  const x = -9.036, z = -4.35;
  const t = new THREE.Group(); t.position.set(x, 0, z); g.add(t);
  t.add(rbox(0.19, 0.38, 0.5, 0.04, M.porcelainWhite, -0.1, 0.62, 0));            // tank
  const bowl = mesh(lathe([[0.0, 0], [0.12, 0], [0.16, 0.25], [0.19, 0.4], [0.0, 0.4]], 28), M.porcelainWhite);
  bowl.scale.set(1.3, 1, 1); bowl.position.set(-0.4, 0, 0); t.add(bowl);
  t.add(rbox(0.46, 0.025, 0.38, 0.012, M.porcelainWhite, -0.42, 0.41, 0));
  // linen cabinet
  g.add(box(0.95, 2.1, 0.4, M.trimWhite, -9.525, 1.05, -3.25 - 0.2));
  ctx.addCollider({ x0: -9.04 - 0.65, z0: z - 0.25, x1: -9.04, z1: z + 0.25 });
}

async function vases(ctx, M, g, P) {
  const load = async (name) => {
    try { return (await ctx.loadGLTF(BASE + `models/${name}/${name}.glb`)).scene; } catch (e) { console.warn('master_suite: model ' + name, e); return null; }
  };
  const fit = (obj, h) => {
    const bb = new THREE.Box3().setFromObject(obj); const s = h / (bb.max.y - bb.min.y);
    obj.scale.setScalar(s); obj.position.y -= bb.min.y * s;
    obj.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    const w = new THREE.Group(); w.add(obj); return w;
  };
  const [v1, v2, plate] = await Promise.all([load('ceramic_vase_01'), load('ceramic_vase_02'), load('carved_wooden_plate')]);
  if (v1 && P.bathVase) {
    const v = fit(v1, 0.26); v.position.set(P.bathVase.x, P.bathVase.y, P.bathVase.z); g.add(v);
    branches(M, g, P.bathVase.x, P.bathVase.y + 0.22, P.bathVase.z, M.leafOlive, 0.42, 7, 3, true);
  }
  if (v2 && P.vaseR) {
    const v = fit(v2, 0.19); v.position.set(P.vaseR.x, P.vaseR.y, P.vaseR.z); g.add(v);
    v.traverse((o) => { if (o.isMesh) o.material = M.ceramic; });
    branches(M, g, P.vaseR.x, P.vaseR.y + 0.16, P.vaseR.z, M.leaf, 0.3, 5, 9, false);
  }
  if (plate && P.bowlL) {
    const p = fit(plate, 0.035); p.scale.multiplyScalar(1); p.position.set(P.bowlL.x, P.bowlL.y, P.bowlL.z); g.add(p);
    const bb = new THREE.Box3().setFromObject(p); const sz = bb.getSize(new THREE.Vector3());
    const k = 0.2 / Math.max(sz.x, sz.z); p.scale.multiplyScalar(k); p.position.y = P.bowlL.y;
    if (P.bowlR) { const p2 = p.clone(); p2.scale.multiplyScalar(0.6); p2.position.set(P.bowlR.x, P.bowlR.y, P.bowlR.z); g.add(p2); }
  }
}

// stems with leaves (eucalyptus = round leaves, olive = narrow leaves)
function branches(M, g, x, y, z, leafMat, len, stems, seed, narrow) {
  let s = seed * 9301 + 49297;
  const R = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const leafGeo = narrow ? new THREE.PlaneGeometry(0.018, 0.06) : new THREE.CircleGeometry(0.022, 10);
  const leaves = [];
  const stemGeos = [];
  for (let i = 0; i < stems; i++) {
    const a = R() * Math.PI * 2, tilt = 0.25 + R() * 0.45, L = len * (0.7 + R() * 0.5);
    const dir = new THREE.Vector3(Math.sin(a) * Math.sin(tilt), Math.cos(tilt), Math.cos(a) * Math.sin(tilt));
    const end = new THREE.Vector3(x, y, z).addScaledVector(dir, L);
    const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(x, y, z), new THREE.Vector3(x, y, z).addScaledVector(dir, L * 0.5).add(new THREE.Vector3(0, 0.03, 0)), end.clone().add(new THREE.Vector3(dir.x * 0.08, -0.06, dir.z * 0.08)));
    stemGeos.push(new THREE.TubeGeometry(curve, 8, 0.0025, 4, false));
    const n = narrow ? 14 : 10;
    for (let k = 1; k <= n; k++) {
      const p = curve.getPoint(k / (n + 1));
      for (const side of [-1, 1]) {
        const m = new THREE.Object3D();
        m.position.copy(p).add(new THREE.Vector3(side * 0.012 * Math.cos(a), 0, -side * 0.012 * Math.sin(a)));
        m.rotation.set(R() * 1.2 - 0.6, a + side * 1.2 + R() * 0.5, R() * 1.0 - 0.5);
        const sc = narrow ? 0.8 + R() * 0.5 : 0.7 + R() * 0.6; m.scale.setScalar(sc);
        m.updateMatrix(); leaves.push(m.matrix.clone());
      }
    }
  }
  const im = new THREE.InstancedMesh(leafGeo, leafMat, leaves.length);
  leaves.forEach((mt, i) => im.setMatrixAt(i, mt));
  im.castShadow = false; im.receiveShadow = true; g.add(im);
  for (const sg of stemGeos) g.add(mesh(sg, M.stem, { cast: false }));
}
