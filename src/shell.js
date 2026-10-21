// Builds the house shell from plan.js: walls (split at every room/opening boundary so each
// face gets its own room's material), headers & sills, floors, ceilings (flat / tray / vault),
// baseboards, thresholds and default door/window units.
// Pieces customise it through ctx (see main.js) BEFORE buildShell runs.
import * as THREE from 'three';
import * as P from './plan.js';
import { getMat } from './materials.js';

const EPS = 0.06; // metres: sample distance off a face when classifying what it faces
export const WALL_BOTTOM = P.GRADE_Y - 0.12;

// ---------- spatial lookup in px space
const inRect = (r, x, y) => x > r[0] && x < r[2] && y > r[1] && y < r[3];
const m2px = (x, z) => [x / P.M_PER_PX + P.ORIGIN_PX[0], z / P.M_PER_PX + P.ORIGIN_PX[1]];

export function classify(xm, zm, ctx) {
  const [x, y] = m2px(xm, zm);
  for (const o of ctx.openingsResolved) if (inRect(o.r, x, y)) return { kind: 'opening', opening: o };
  for (const w of ctx.wallsResolved) if (inRect(w.r, x, y)) return { kind: 'solid', wall: w };
  for (const rm of P.rooms) for (const r of rm.rects) if (inRect(r, x, y)) return { kind: rm.outdoor ? 'outdoor' : 'room', room: rm };
  return { kind: 'outside' };
}

// ---------- geometry buckets keyed by material
class Buckets {
  constructor() { this.map = new Map(); }
  get(mat) {
    let b = this.map.get(mat);
    if (!b) { b = { mat, pos: [], nor: [], uv: [], idx: [] }; this.map.set(mat, b); }
    return b;
  }
  // a,b,c,d CCW seen from the front; n = [nx,ny,nz]
  quad(mat, a, b, c, d, n) {
    const B = this.get(mat);
    const base = B.pos.length / 3;
    for (const p of [a, b, c, d]) {
      B.pos.push(p[0], p[1], p[2]);
      B.nor.push(n[0], n[1], n[2]);
      let u, v;
      if (n[0] > 0.5) { u = -p[2]; v = p[1]; } else if (n[0] < -0.5) { u = p[2]; v = p[1]; }
      else if (n[2] > 0.5) { u = p[0]; v = p[1]; } else if (n[2] < -0.5) { u = -p[0]; v = p[1]; }
      else if (n[1] > 0.5) { u = p[0]; v = -p[2]; } else { u = p[0]; v = p[2]; }
      B.uv.push(u, v);
    }
    B.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  // emit selected faces of an axis aligned box. mats: {px,nx,pz,nz,py,ny} -> material or null
  box(x0, y0, z0, x1, y1, z1, mats) {
    if (mats.pz) this.quad(mats.pz, [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1]);
    if (mats.nz) this.quad(mats.nz, [x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1]);
    if (mats.px) this.quad(mats.px, [x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0]);
    if (mats.nx) this.quad(mats.nx, [x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0]);
    if (mats.py) this.quad(mats.py, [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0]);
    if (mats.ny) this.quad(mats.ny, [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0]);
  }
  toMeshes(group, { cast = true, receive = true } = {}) {
    for (const B of this.map.values()) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(B.pos, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(B.nor, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(B.uv, 2));
      g.setAttribute('uv1', new THREE.Float32BufferAttribute(B.uv, 2));
      g.setIndex(B.idx);
      g.computeBoundingSphere();
      const m = new THREE.Mesh(g, B.mat);
      m.castShadow = cast; m.receiveShadow = receive;
      m.name = 'shell:' + (B.mat.name || 'mat');
      group.add(m);
    }
  }
}

const roomFloorY = (rm) => rm.floorY ?? 0;

export function buildShell(ctx) {
  const group = new THREE.Group();
  group.name = 'shell';
  const B = new Buckets();
  const trimB = new Buckets();
  const FB = new Buckets(); // floors + thresholds (walkable)
  const exteriorFaces = [];
  const colliders = [];
  const walkables = [];

  const extMat = getMat('exterior.wall');
  const topMat = getMat('exterior.top');
  const revealMat = getMat('reveal');
  const trimMat = getMat('trim');

  // what material a face gets, given what it looks at
  function faceMat(cls) {
    if (cls.kind === 'room') return ctx.roomMat(cls.room.id, 'wall');
    if (cls.kind === 'opening') return revealMat;
    if (cls.kind === 'solid') return null; // buried inside another wall
    return extMat; // outside or outdoor (porch)
  }

  // record exterior faces so the exterior piece can clad them
  function noteFace(cls, wallId, axis, sign, plane, a0, a1, y0, y1) {
    if (cls.kind === 'outside' || cls.kind === 'outdoor')
      exteriorFaces.push({ wallId, axis, normal: axis === 'z' ? [0, sign] : [sign, 0], plane, a0, a1, y0, y1, room: cls.room?.id ?? null });
  }

  function baseboard(cls, axis, sign, plane, a0, a1) {
    if (cls.kind !== 'room') return;
    const rm = cls.room;
    if (rm.floor === 'concrete' || ctx.noBaseboard.has(rm.id)) return;
    const y0 = roomFloorY(rm), h = rm.floor === 'tile' ? 0.1 : 0.135, t = 0.014;
    const y1 = y0 + h;
    const mats = { py: trimMat };
    if (axis === 'z') {
      const z0 = sign > 0 ? plane : plane - t, z1 = sign > 0 ? plane + t : plane;
      mats[sign > 0 ? 'pz' : 'nz'] = trimMat; mats.px = trimMat; mats.nx = trimMat;
      trimB.box(a0, y0, z0, a1, y1, z1, mats);
    } else {
      const x0 = sign > 0 ? plane : plane - t, x1 = sign > 0 ? plane + t : plane;
      mats[sign > 0 ? 'px' : 'nx'] = trimMat; mats.pz = trimMat; mats.nz = trimMat;
      trimB.box(x0, y0, a0, x1, y1, a1, mats);
    }
  }

  // split coordinates along an axis from every rect edge that falls inside (lo, hi)
  const allRects = () => [
    ...P.rooms.flatMap((r) => r.rects),
    ...ctx.openingsResolved.map((o) => o.r),
    ...ctx.wallsResolved.map((w) => w.r),
  ];
  function splits(lo, hi, axis) {
    const s = new Set([lo, hi]);
    for (const r of allRects()) {
      const c = axis === 'x' ? [r[0], r[2]] : [r[1], r[3]];
      for (const v of c) if (v > lo + 0.5 && v < hi - 0.5) s.add(v);
    }
    return [...s].sort((a, b) => a - b);
  }

  // one wall-like solid between y0 and y1 (metres), px rect r
  function solid(r, y0, y1, id, { ends = true, top = true, bottom = false, bottomMat = null, base = false } = {}) {
    const horiz = r[2] - r[0] >= r[3] - r[1];
    const M = P.rectM(r);
    if (horiz) {
      const cuts = splits(r[0], r[2], 'x');
      for (let i = 0; i < cuts.length - 1; i++) {
        const [xa] = P.px2m(cuts[i], 0), [xb] = P.px2m(cuts[i + 1], 0), xm = (xa + xb) / 2;
        const cN = classify(xm, M.z0 - EPS, ctx), cS = classify(xm, M.z1 + EPS, ctx);
        B.box(xa, y0, M.z0, xb, y1, M.z1, { nz: faceMat(cN), pz: faceMat(cS), py: top ? topMat : null, ny: bottom ? bottomMat : null });
        noteFace(cN, id, 'z', -1, M.z0, xa, xb, y0, y1); noteFace(cS, id, 'z', 1, M.z1, xa, xb, y0, y1);
        if (base) { baseboard(cN, 'z', -1, M.z0, xa, xb); baseboard(cS, 'z', 1, M.z1, xa, xb); }
      }
      if (ends) {
        const cW = classify(M.x0 - EPS, M.cz, ctx), cE = classify(M.x1 + EPS, M.cz, ctx);
        B.box(M.x0, y0, M.z0, M.x1, y1, M.z1, { nx: faceMat(cW), px: faceMat(cE) });
        noteFace(cW, id, 'x', -1, M.x0, M.z0, M.z1, y0, y1); noteFace(cE, id, 'x', 1, M.x1, M.z0, M.z1, y0, y1);
        if (base) { baseboard(cW, 'x', -1, M.x0, M.z0, M.z1); baseboard(cE, 'x', 1, M.x1, M.z0, M.z1); }
      }
    } else {
      const cuts = splits(r[1], r[3], 'z');
      for (let i = 0; i < cuts.length - 1; i++) {
        const [, za] = P.px2m(0, cuts[i]), [, zb] = P.px2m(0, cuts[i + 1]), zm = (za + zb) / 2;
        const cW = classify(M.x0 - EPS, zm, ctx), cE = classify(M.x1 + EPS, zm, ctx);
        B.box(M.x0, y0, za, M.x1, y1, zb, { nx: faceMat(cW), px: faceMat(cE), py: top ? topMat : null, ny: bottom ? bottomMat : null });
        noteFace(cW, id, 'x', -1, M.x0, za, zb, y0, y1); noteFace(cE, id, 'x', 1, M.x1, za, zb, y0, y1);
        if (base) { baseboard(cW, 'x', -1, M.x0, za, zb); baseboard(cE, 'x', 1, M.x1, za, zb); }
      }
      if (ends) {
        const cN = classify(M.cx, M.z0 - EPS, ctx), cS = classify(M.cx, M.z1 + EPS, ctx);
        B.box(M.x0, y0, M.z0, M.x1, y1, M.z1, { nz: faceMat(cN), pz: faceMat(cS) });
        noteFace(cN, id, 'z', -1, M.z0, M.x0, M.x1, y0, y1); noteFace(cS, id, 'z', 1, M.z1, M.x0, M.x1, y0, y1);
        if (base) { baseboard(cN, 'z', -1, M.z0, M.x0, M.x1); baseboard(cS, 'z', 1, M.z1, M.x0, M.x1); }
      }
    }
  }

  // ---------------- walls
  for (const w of ctx.wallsResolved) {
    if (ctx.hiddenWalls.has(w.id)) continue;
    const top = P.ft(w.h ?? P.DEFAULT_WALL_FT);
    solid(w.r, WALL_BOTTOM, top, w.id, { base: true });
    const M = P.rectM(w.r);
    colliders.push({ x0: M.x0, z0: M.z0, x1: M.x1, z1: M.z1, id: w.id });
  }

  // ---------------- openings: header, sill, threshold, unit
  const units = new THREE.Group(); units.name = 'openings';
  for (const o of ctx.openingsResolved) {
    const M = P.rectM(o.r);
    const horiz = o.r[2] - o.r[0] >= o.r[3] - o.r[1];
    // rooms on both sides
    const sideA = horiz ? classify(M.cx, M.z0 - EPS, ctx) : classify(M.x0 - EPS, M.cz, ctx);
    const sideB = horiz ? classify(M.cx, M.z1 + EPS, ctx) : classify(M.x1 + EPS, M.cz, ctx);
    const floors = [sideA, sideB].filter((c) => c.room).map((c) => roomFloorY(c.room));
    const base = floors.length ? Math.max(...floors) : 0;
    o.base = base; o.sideA = sideA; o.sideB = sideB; o.horiz = horiz; o.M = M;
    const head = base + P.ft(o.head ?? 8);
    const top = P.ft(o.top ?? P.DEFAULT_WALL_FT);
    if (top > head + 0.001) solid(o.r, head, top, o.id, { ends: false, bottom: true, bottomMat: revealMat });
    const sill = o.sill != null && o.sill > 0 ? base + P.ft(o.sill) : null;
    if (sill != null) {
      solid(o.r, WALL_BOTTOM, sill, o.id, { ends: false, top: false, base: true });
      // window stool / sill top
      B.box(M.x0, sill - 0.001, M.z0, M.x1, sill, M.z1, { py: ctx.openingSillMat(o) });
    }
    if (o.type === 'window' || o.type === 'sidelight' || o.type === 'garage') colliders.push({ x0: M.x0, z0: M.z0, x1: M.x1, z1: M.z1, id: o.id });
    if (sill == null) {
      // threshold strip so doorways have floor
      const rm = [sideB, sideA].find((c) => c.kind === 'room')?.room ?? [sideA, sideB].find((c) => c.room)?.room;
      const fm = rm ? ctx.roomMat(rm.id, 'floor') : getMat('floor.wood');
      FB.box(M.x0, WALL_BOTTOM, M.z0, M.x1, base, M.z1, { py: fm });
    }
    if (!o.skipUnit) buildUnit(o, units, ctx);
  }

  // ---------------- floors & ceilings
  for (const rm of P.rooms) {
    const fy = roomFloorY(rm);
    const fMat = ctx.roomMat(rm.id, 'floor');
    for (const r of rm.rects) {
      const M = P.rectM(r);
      const y0 = rm.outdoor || rm.floorY ? P.GRADE_Y - 0.05 : fy - 0.25;
      FB.box(M.x0, y0, M.z0, M.x1, fy, M.z1, { py: fMat, pz: rm.outdoor ? fMat : null, nz: rm.outdoor ? fMat : null, px: rm.outdoor ? fMat : null, nx: rm.outdoor ? fMat : null });
    }
    if (!ctx.customCeilings.has(rm.id)) ceiling(rm, fy);
  }

  function ceilingRect(mat, x0, z0, x1, z1, y) {
    B.quad(mat, [x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], [0, -1, 0]);
    // thin top so the sun cannot leak through gaps between quads and so it casts shadows from above
    B.quad(topMat, [x0, y + 0.02, z1], [x1, y + 0.02, z1], [x1, y + 0.02, z0], [x0, y + 0.02, z0], [0, 1, 0]);
  }
  function ceiling(rm, fy) {
    const mat = ctx.roomMat(rm.id, 'ceiling');
    const y = fy + P.ft(rm.clg);
    if (rm.vault) {
      // default gable vault, ridge running north-south down the middle, springing from 10 ft
      for (const r of rm.rects) {
        const M = P.rectM(r);
        const yl = fy + P.ft(10), yh = y, xc = M.cx;
        const nA = new THREE.Vector3(yh - yl, -(xc - M.x0), 0).normalize();
        B.quad(mat, [M.x0, yl, M.z0], [xc, yh, M.z0], [xc, yh, M.z1], [M.x0, yl, M.z1], [nA.x, nA.y, 0]);
        B.quad(mat, [xc, yh, M.z0], [M.x1, yl, M.z0], [M.x1, yl, M.z1], [xc, yh, M.z1], [-nA.x, nA.y, 0]);
        B.quad(topMat, [M.x0, yl + 0.02, M.z1], [xc, yh + 0.02, M.z1], [xc, yh + 0.02, M.z0], [M.x0, yl + 0.02, M.z0], [-nA.x, -nA.y, 0]);
        B.quad(topMat, [xc, yh + 0.02, M.z1], [M.x1, yl + 0.02, M.z1], [M.x1, yl + 0.02, M.z0], [xc, yh + 0.02, M.z0], [nA.x, -nA.y, 0]);
      }
      return;
    }
    for (const r of rm.rects) {
      const M = P.rectM(r);
      const tr = rm.trayRect && rm.tray && r[0] <= rm.trayRect[0] && r[2] >= rm.trayRect[2] && r[1] <= rm.trayRect[1] && r[3] >= rm.trayRect[3] ? P.rectM(rm.trayRect) : null;
      if (!tr) { ceilingRect(mat, M.x0, M.z0, M.x1, M.z1, y); continue; }
      const yt = fy + P.ft(rm.tray);
      ceilingRect(mat, M.x0, M.z0, M.x1, tr.z0, y);
      ceilingRect(mat, M.x0, tr.z1, M.x1, M.z1, y);
      ceilingRect(mat, M.x0, tr.z0, tr.x0, tr.z1, y);
      ceilingRect(mat, tr.x1, tr.z0, M.x1, tr.z1, y);
      ceilingRect(mat, tr.x0, tr.z0, tr.x1, tr.z1, yt);
      // tray risers (face inward toward the room centre below)
      B.quad(mat, [tr.x0, y, tr.z0], [tr.x1, y, tr.z0], [tr.x1, yt, tr.z0], [tr.x0, yt, tr.z0], [0, 0, 1]);
      B.quad(mat, [tr.x1, y, tr.z1], [tr.x0, y, tr.z1], [tr.x0, yt, tr.z1], [tr.x1, yt, tr.z1], [0, 0, -1]);
      B.quad(mat, [tr.x0, y, tr.z1], [tr.x0, y, tr.z0], [tr.x0, yt, tr.z0], [tr.x0, yt, tr.z1], [1, 0, 0]);
      B.quad(mat, [tr.x1, y, tr.z0], [tr.x1, y, tr.z1], [tr.x1, yt, tr.z1], [tr.x1, yt, tr.z0], [-1, 0, 0]);
    }
  }

  B.toMeshes(group);
  trimB.toMeshes(group, { cast: false });
  const floors = new THREE.Group(); floors.name = 'floors';
  FB.toMeshes(floors, { cast: false });
  floors.children.forEach((m) => walkables.push(m));
  group.add(floors);
  group.add(units);
  return { group, exteriorFaces, colliders, walkables };
}

// ---------------------------------------------------------------- door / window units
function unitFrame(o) {
  // local frame of an opening: origin at opening centre on the floor (base), +u along the wall,
  // +n toward sideB (the +z or +x side). width/depth in metres.
  const M = o.M;
  const horiz = o.horiz;
  const width = horiz ? M.w : M.d, depth = horiz ? M.d : M.w;
  const g = new THREE.Group();
  g.position.set(M.cx, o.base, M.cz);
  // local X = along wall, local Z = across wall toward sideB
  if (!horiz) g.rotation.y = Math.PI / 2; // local +X -> world -Z, local +Z -> world +X
  // with rotation PI/2: local x maps to world -z, local z maps to world +x. sideB (+x) = local +z OK
  return { g, width, depth };
}

function exteriorSign(o) {
  // which local z side faces outside (+1 = sideB, -1 = sideA, 0 = both interior)
  const out = (c) => c.kind === 'outside' || c.kind === 'outdoor';
  if (out(o.sideB) && !out(o.sideA)) return 1;
  if (out(o.sideA) && !out(o.sideB)) return -1;
  return 0;
}

const boxMesh = (w, h, d, mat, x, y, z) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m;
};

export function glazedPanel(width, height, grid, frameMat, glassMat, { frame = 0.055, bar = 0.022, depth = 0.07 } = {}) {
  const g = new THREE.Group();
  g.add(boxMesh(width, frame, depth, frameMat, 0, frame / 2, 0));
  g.add(boxMesh(width, frame, depth, frameMat, 0, height - frame / 2, 0));
  g.add(boxMesh(frame, height, depth, frameMat, -width / 2 + frame / 2, height / 2, 0));
  g.add(boxMesh(frame, height, depth, frameMat, width / 2 - frame / 2, height / 2, 0));
  const [cols, rows] = grid || [1, 1];
  const iw = width - 2 * frame, ih = height - 2 * frame;
  for (let i = 1; i < cols; i++) g.add(boxMesh(bar, ih, depth * 0.6, frameMat, -iw / 2 + (iw * i) / cols, height / 2, 0));
  for (let j = 1; j < rows; j++) g.add(boxMesh(iw, bar, depth * 0.6, frameMat, 0, frame + (ih * j) / rows, 0));
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(iw, ih), glassMat);
  glass.position.set(0, height / 2, 0); glass.castShadow = false; glass.receiveShadow = false;
  glass.userData.glass = true;
  g.add(glass);
  return g;
}

function casing(g, width, headH, depth, side, mat, { leg = 0.085, t = 0.018 } = {}) {
  // side: +1 / -1 face of the wall (local z)
  const z = side * (depth / 2 + t / 2);
  g.add(boxMesh(leg, headH + leg, t, mat, -width / 2 - leg / 2, (headH + leg) / 2, z));
  g.add(boxMesh(leg, headH + leg, t, mat, width / 2 + leg / 2, (headH + leg) / 2, z));
  g.add(boxMesh(width + 2 * leg, leg, t, mat, 0, headH + leg / 2, z));
}

function buildUnit(o, parent, ctx) {
  const { g, width, depth } = unitFrame(o);
  g.name = 'unit:' + o.id;
  const frameMat = ctx.openingMat(o, 'frame');
  const glassMat = ctx.openingMat(o, 'glass');
  const trim = getMat('trim');
  const headH = P.ft(o.head ?? 8);
  const ext = exteriorSign(o);
  // window plane sits toward the exterior face
  const zWin = ext === 0 ? 0 : ext * (depth / 2 - 0.06);

  if (o.type === 'window' || o.type === 'sidelight') {
    const sill = P.ft(o.sill ?? 0);
    const p = glazedPanel(width - 0.01, headH - sill - 0.005, o.grid, frameMat, glassMat);
    p.position.set(0, sill, zWin);
    g.add(p);
  } else if (o.type === 'door') {
    const leaf = new THREE.Group();
    const lw = width - 0.012, lh = headH - 0.012, lt = 0.035;
    const doorMat = ctx.openingMat(o, 'leaf');
    leaf.add(boxMesh(lw, lh, lt, doorMat, lw / 2, lh / 2, 0));
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.028, 12, 8), getMat('hardware.black'));
    knob.position.set(lw - 0.07, 0.92, lt / 2 + 0.03); leaf.add(knob);
    const k2 = knob.clone(); k2.position.z = -lt / 2 - 0.03; leaf.add(k2);
    // swing side: local +z if 'into' room is sideB
    const intoB = o.into ? o.sideB.room?.id === o.into : true;
    const s = intoB ? 1 : -1;
    // hinge 'a' = low world coordinate end; vertical walls run local +x toward world -z
    const hingeHigh = (o.hinge === 'b') === o.horiz;
    leaf.position.set(hingeHigh ? width / 2 - 0.02 : -width / 2 + 0.02, 0.006, s * (depth / 2));
    // open 90 degrees into the room: leaf extends from the hinge along local ±z
    leaf.rotation.y = -s * (Math.PI / 2);
    g.add(leaf);
    casing(g, width, headH, depth, 1, trim); casing(g, width, headH, depth, -1, trim);
  } else if (o.type === 'pocket' || o.type === 'barn') {
    casing(g, width, headH, depth, 1, trim); casing(g, width, headH, depth, -1, trim);
  } else if (o.type === 'slider' || o.type === 'french') {
    const n = 2;
    const pw = width / n;
    for (let i = 0; i < n; i++) {
      const p = glazedPanel(pw - 0.006, headH - 0.01, o.grid || [1, 1], frameMat, glassMat, { frame: 0.07 });
      p.position.set(-width / 2 + pw * (i + 0.5), 0.005, zWin + (o.type === 'slider' ? (i ? 0.035 : -0.035) : 0));
      g.add(p);
    }
    if (ext !== 0) casing(g, width, headH, depth, -ext, trim);
  } else if (o.type === 'entry') {
    const doorMat = ctx.openingMat(o, 'leaf');
    for (const sx of [-1, 1]) {
      const lw = width / 2 - 0.008;
      const leaf = boxMesh(lw, headH - 0.012, 0.045, doorMat, sx * (width / 4), (headH - 0.012) / 2, zWin);
      g.add(leaf);
    }
  } else if (o.type === 'garage') {
    const gm = ctx.openingMat(o, 'leaf');
    const sec = 4, h = headH / sec;
    for (let i = 0; i < sec; i++) g.add(boxMesh(width - 0.02, h - 0.01, 0.05, gm, 0, h * i + h / 2, zWin));
  }
  parent.add(g);
}
