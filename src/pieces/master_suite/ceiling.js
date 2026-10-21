// Master bedroom tray ceiling (10 ft -> 11 ft) with a small crown at the tray edge, ceiling fan and can lights.
import * as THREE from 'three';
import { box, mesh, lathe } from './util.js';
import { R } from './bedroom.js';

export const TRAY = { x0: -8.62, x1: -4.98, z0: -8.72, z1: -5.0 };
export const Y10 = 3.048, Y11 = 3.353;

export function buildCeiling(ctx, M, group, P) {
  const g = new THREE.Group(); g.name = 'mstr:ceiling'; group.add(g);
  const T = P.tray || TRAY;
  const quad = (x0, z0, x1, z1, y) => {
    const m = mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), M.ceiling, { cast: true });
    m.rotation.x = Math.PI / 2; m.position.set((x0 + x1) / 2, y, (z0 + z1) / 2); g.add(m);
  };
  // lower 10' ring
  quad(R.x0, R.z0, R.x1, T.z0, Y10);
  quad(R.x0, T.z1, R.x1, R.z1, Y10);
  quad(R.x0, T.z0, T.x0, T.z1, Y10);
  quad(T.x1, T.z0, R.x1, T.z1, Y10);
  // tray field
  quad(T.x0, T.z0, T.x1, T.z1, Y11);
  // risers (thin boxes so they cast/receive light correctly)
  const h = Y11 - Y10, rt = 0.02;
  g.add(box(T.x1 - T.x0 + 2 * rt, h, rt, M.ceiling, (T.x0 + T.x1) / 2, Y10 + h / 2, T.z0 - rt / 2, { cast: true }));
  g.add(box(T.x1 - T.x0 + 2 * rt, h, rt, M.ceiling, (T.x0 + T.x1) / 2, Y10 + h / 2, T.z1 + rt / 2, { cast: true }));
  g.add(box(rt, h, T.z1 - T.z0, M.ceiling, T.x0 - rt / 2, Y10 + h / 2, (T.z0 + T.z1) / 2, { cast: true }));
  g.add(box(rt, h, T.z1 - T.z0, M.ceiling, T.x1 + rt / 2, Y10 + h / 2, (T.z0 + T.z1) / 2, { cast: true }));
  // crown at the top of the riser (inside the tray) + a flat band at the bottom edge
  const crown = (len, cx, cz, rotY) => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0); shape.lineTo(0, -0.075); shape.lineTo(0.012, -0.075); shape.quadraticCurveTo(0.03, -0.03, 0.075, -0.012); shape.lineTo(0.075, 0); shape.lineTo(0, 0);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: len, bevelEnabled: false, curveSegments: 6 });
    geo.translate(0, 0, -len / 2);
    const m = mesh(geo, M.trimWhite, { cast: false });
    m.rotation.y = rotY; m.position.set(cx, Y11, cz); g.add(m);
  };
  crown(T.x1 - T.x0, (T.x0 + T.x1) / 2, T.z0, -Math.PI / 2);
  crown(T.x1 - T.x0, (T.x0 + T.x1) / 2, T.z1, Math.PI / 2);
  crown(T.z1 - T.z0, T.x0, (T.z0 + T.z1) / 2, 0);
  crown(T.z1 - T.z0, T.x1, (T.z0 + T.z1) / 2, Math.PI);
  const band = 0.05;
  g.add(box(T.x1 - T.x0, band, 0.012, M.trimWhite, (T.x0 + T.x1) / 2, Y10 + band / 2 - 0.001, T.z0 + 0.006, { cast: false }));
  g.add(box(T.x1 - T.x0, band, 0.012, M.trimWhite, (T.x0 + T.x1) / 2, Y10 + band / 2 - 0.001, T.z1 - 0.006, { cast: false }));
  g.add(box(0.012, band, T.z1 - T.z0, M.trimWhite, T.x0 + 0.006, Y10 + band / 2 - 0.001, (T.z0 + T.z1) / 2, { cast: false }));
  g.add(box(0.012, band, T.z1 - T.z0, M.trimWhite, T.x1 - 0.006, Y10 + band / 2 - 0.001, (T.z0 + T.z1) / 2, { cast: false }));
  // light-tight cap over the whole room (casts the sun shadow the roof would)
  const cap = box(R.x1 - R.x0 + 0.2, 0.04, R.z1 - R.z0 + 0.2, ctx.getMat('exterior.top'), (R.x0 + R.x1) / 2, Y11 + 0.05, (R.z0 + R.z1) / 2, { receive: false });
  g.add(cap);

  fan(ctx, M, g, P, T);
  cans(ctx, M, g, P, T);
}

function fan(ctx, M, g, P, T) {
  const f = new THREE.Group(); f.name = 'ceilingFan';
  const fx = P.fanX ?? -6.84, fz = P.fanZ ?? -6.88;
  f.position.set(fx, Y11, fz); g.add(f);
  f.add(mesh(lathe([[0, 0], [0.075, 0], [0.075, -0.015], [0.05, -0.07], [0.012, -0.075], [0, -0.075]], 28), M.bronze)); // canopy
  const rodL = 0.24;
  const rodm = mesh(new THREE.CylinderGeometry(0.011, 0.011, rodL, 10), M.bronze); rodm.position.y = -0.07 - rodL / 2; f.add(rodm);
  const yM = -0.07 - rodL;
  // motor housing
  f.add(mesh(lathe([[0, 0], [0.05, 0], [0.11, -0.03], [0.125, -0.07], [0.125, -0.1], [0.11, -0.12], [0, -0.12]].map(([r, y]) => [r, y + yM]), 36), M.bronze));
  // blades + irons
  const blades = new THREE.Group(); blades.position.y = yM - 0.09; f.add(blades);
  const bladeGeo = new THREE.BoxGeometry(0.58, 0.01, 0.135);
  {
    const p = bladeGeo.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i); const t = (x + 0.29) / 0.58; p.setZ(i, p.getZ(i) * (0.9 + 0.2 * t)); }
    bladeGeo.translate(0.16 + 0.29, 0, 0);
    bladeGeo.computeVertexNormals();
  }
  const ironGeo = new THREE.BoxGeometry(0.2, 0.012, 0.045); ironGeo.translate(0.15, -0.004, 0);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + (P.fanPhase ?? 0.35);
    const arm = new THREE.Group(); arm.rotation.y = a; blades.add(arm);
    const bl = mesh(bladeGeo, M.fanBlade); bl.rotation.x = 0.16; bl.position.y = 0.004; arm.add(bl);
    arm.add(mesh(ironGeo, M.bronze));
  }
  // light kit: bronze ring + frosted glass bowl
  const yL = yM - 0.12;
  f.add(mesh(lathe([[0, 0], [0.105, 0], [0.105, -0.035], [0, -0.035]].map(([r, y]) => [r, y + yL]), 32), M.bronze));
  f.add(mesh(lathe([[0.095, 0], [0.09, -0.02], [0.07, -0.045], [0.0, -0.055]].map(([r, y]) => [r, y + yL - 0.035]), 32), M.fanGlass, { cast: false }));
  if (!ctx.shot) ctx.onUpdate((dt) => { blades.rotation.y += dt * 1.2; });
  P.fanGroup = f;
}

function cans(ctx, M, g, P, T) {
  // four cans in the tray (positions read off the photo) + two on the 10' ring by the door
  const spots = P.cans || [
    [-8.2, Y11, -8.0], [-5.45, Y11, -8.0], [-8.2, Y11, -5.75], [-5.45, Y11, -5.75],
    [-7.6, Y10, -4.45], [-5.85, Y10, -4.45],
  ];
  const trimGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.008, 24);
  const lensGeo = new THREE.CircleGeometry(0.056, 24);
  for (const [x, y, z] of spots) {
    const t = mesh(trimGeo, M.trimWhite, { cast: false }); t.position.set(x, y - 0.004, z); g.add(t);
    const l = mesh(lensGeo, M.recessed, { cast: false }); l.rotation.x = Math.PI / 2; l.position.set(x, y - 0.0085, z); g.add(l);
  }
}
