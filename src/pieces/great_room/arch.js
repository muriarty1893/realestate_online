// Architecture owned by the great room piece: E-W ridge vault, gable infill over the kitchen beam,
// rough-sawn beams (kitchen line + dining/foyer headers), fireplace, great-room niche shelving.
import * as THREE from 'three';
import { boxMM, mesh, metreUV } from './util.js';

export const GR = { x0: -0.357, x1: 6.561, z0: -2.627, z1: 3.578 };
export const SPRING = 3.048; // 10 ft
export const RIDGE = 4.4196; // 14.5 ft
export const ZR = (GR.z0 + GR.z1) / 2; // ridge line (runs east-west)
export const vaultY = (z) => SPRING + (RIDGE - SPRING) * (1 - Math.abs(z - ZR) / ((GR.z1 - GR.z0) / 2));

export function buildVault(ctx, M, group) {
  const { x0, x1, z0, z1 } = GR;
  const pos = [], nor = [], uv = [], idx = [];
  const quad = (a, b, c, d, n) => {
    const base = pos.length / 3;
    for (const p of [a, b, c, d]) { pos.push(...p); nor.push(...n); uv.push(p[0], p[2]); }
    idx.push(base, base + 2, base + 1, base, base + 3, base + 2);
  };
  const run = (z1 - z0) / 2, rise = RIDGE - SPRING;
  const nS = new THREE.Vector3(0, -run, -rise).normalize(); // south slope faces down & north
  const nN = new THREE.Vector3(0, -run, rise).normalize();
  // south slope: from the south wall (z1, spring) up to the ridge; seen from below
  quad([x0, SPRING, z1], [x1, SPRING, z1], [x1, RIDGE, ZR], [x0, RIDGE, ZR], nS.toArray());
  quad([x0, RIDGE, ZR], [x1, RIDGE, ZR], [x1, SPRING, z0], [x0, SPRING, z0], nN.toArray());
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  const ceil = mesh(g, M.ceiling, { cast: true, receive: true, name: 'gr:vault' });
  group.add(ceil);
  // a dark top skin so the sun does not leak through and the vault casts shadows from above
  const top = mesh(g.clone(), ctx.getMat('exterior.top'), { cast: true, receive: false });
  top.geometry.translate(0, 0.03, 0);
  const ti = top.geometry.index.array; for (let i = 0; i < ti.length; i += 3) { const t = ti[i]; ti[i] = ti[i + 2]; ti[i + 2] = t; }
  top.geometry.computeVertexNormals();
  group.add(top);

  // gable infill above the kitchen beam (x of the column stubs), beam top (9 ft) up to the rake
  const ix0 = -0.465, ix1 = -0.249;
  const sh = new THREE.Shape();
  // shape in (z, y): extrude along +x
  sh.moveTo(z0, 2.743); sh.lineTo(z1, 2.743); sh.lineTo(z1, SPRING); sh.lineTo(ZR, RIDGE + 0.02); sh.lineTo(z0, SPRING); sh.closePath();
  const eg = new THREE.ExtrudeGeometry(sh, { depth: ix1 - ix0, bevelEnabled: false });
  // map shape (x->z, y->y, extrude z->x)
  const p = eg.attributes.position;
  for (let i = 0; i < p.count; i++) { const sx = p.getX(i), sy = p.getY(i), sz = p.getZ(i); p.setXYZ(i, ix0 + sz, sy, sx); }
  // swapping axes mirrors the winding; flip it back
  const ei = eg.index ? eg.index.array : null;
  if (ei) { for (let i = 0; i < ei.length; i += 3) { const t = ei[i]; ei[i] = ei[i + 2]; ei[i + 2] = t; } }
  else { const a = p.array; for (let i = 0; i < p.count; i += 3) { for (let k = 0; k < 3; k++) { const t = a[i * 3 + k]; a[i * 3 + k] = a[(i + 2) * 3 + k]; a[(i + 2) * 3 + k] = t; } } }
  eg.computeVertexNormals();
  metreUV(eg, 'y');
  group.add(mesh(eg, M.wall, { name: 'gr:infill' }));
}

export function buildBeams(ctx, M, group) {
  // kitchen / great-room line beam, 8 ft to 9 ft, full length between the columns
  group.add(boxMM(-0.482, 2.438, GR.z0 + 0.002, -0.232, 2.743, GR.z1 - 0.002, M.beam, { grain: 'z', name: 'gr:beamK' }));
  // dining + foyer header beams, wrapping through the openings
  for (const id of ['open_dining', 'open_foyer']) {
    const o = ctx.opening(id); const r = ctx.rectM(o.r);
    group.add(boxMM(r.x0 + 0.002, 2.432, r.z0 - 0.03, r.x1 - 0.002, 2.745, r.z1 + 0.03, M.beam, { grain: 'x', name: 'gr:beam_' + id }));
  }
}

export function buildFireplace(ctx, M, group) {
  // marks.fireplace: firebox [2084,1010,2107,1100], hearth [2040,990,2107,1150]
  const fb = ctx.rectM(ctx.plan.marks.fireplace.firebox);
  const hz = ctx.rectM(ctx.plan.marks.fireplace.hearth);
  const xw = GR.x1; // east wall face
  const bx0 = fb.x0; // breast front face
  const zc = fb.cz, bw = 1.9; // breast width
  const za = zc - bw / 2, zb = zc + bw / 2;
  // chimney breast up to the vault (follows the slope at its top)
  const hTop = Math.min(vaultY(za), vaultY(zb)) - 0.01;
  const breast = boxMM(bx0, 0, za, xw, hTop, zb, M.plasterStone, { grain: 'y', name: 'gr:breast', worldUV: true });
  group.add(breast);
  // firebox opening (dark recess) and hearth
  const fw = 0.95, fh = 0.78, fy = 0.42;
  group.add(boxMM(bx0 - 0.003, fy, zc - fw / 2, bx0 + 0.18, fy + fh, zc + fw / 2, M.firebox, { name: 'gr:firebox' }));
  // firebox surround: thin steel frame
  group.add(boxMM(bx0 - 0.012, fy - 0.03, zc - fw / 2 - 0.03, bx0 - 0.002, fy, zc + fw / 2 + 0.03, M.iron));
  group.add(boxMM(bx0 - 0.012, fy + fh, zc - fw / 2 - 0.03, bx0 - 0.002, fy + fh + 0.03, zc + fw / 2 + 0.03, M.iron));
  group.add(boxMM(bx0 - 0.012, fy, zc - fw / 2 - 0.03, bx0 - 0.002, fy + fh, zc - fw / 2, M.iron));
  group.add(boxMM(bx0 - 0.012, fy, zc + fw / 2, bx0 - 0.002, fy + fh, zc + fw / 2 + 0.03, M.iron));
  // raised stone hearth bench
  group.add(boxMM(hz.x0 + 0.25, 0, zc - bw / 2 - 0.05, bx0, 0.42, zc + bw / 2 + 0.05, M.hearth, { name: 'gr:hearth' }));
  // rough-sawn mantel beam
  group.add(boxMM(bx0 - 0.2, 1.42, za - 0.08, bx0, 1.6, zb + 0.08, M.beam, { grain: 'z', name: 'gr:mantel' }));
  // logs + grate
  const logM = M.beam;
  for (let i = 0; i < 3; i++) {
    const l = mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.62, 10), logM);
    l.rotation.x = Math.PI / 2; l.rotation.y = (i - 1) * 0.25;
    l.position.set(bx0 + 0.1 + (i % 2) * 0.03, fy + 0.08 + (i === 1 ? 0.09 : 0), zc + (i - 1) * 0.05);
    group.add(l);
  }
  ctx.addCollider({ x0: hz.x0 + 0.25, z0: za, x1: xw, z1: zb });
}
