// Exterior skins over the shell's exterior faces: board-and-batten, stucco, stone wainscot,
// plus gable walls from the roof blocks.
import * as THREE from 'three';
import { Geo, V3, wallUV, polyNormal } from './util.js';

export const STONE_TOP = 0.42;     // top of the stone wainscot (world y)
const STONE_T = 0.045;              // stone veneer thickness
const BB_OFF = 0.008;               // board plane offset off the shell face
const BATTEN = { w: 0.065, t: 0.022, pitch: 0.4064 };

// faces (by wall id) that get board-and-batten instead of stucco
const BB_WALLS = new Set(['w_bump1', 'w_bump2', 'w_bump7', 'w_dinS1', 'w_dinS2', 'w_bfS1', 'w_bfS2']);
const BAY_WALLS = new Set(['w_bump3', 'w_bump4', 'w_bump5', 'w_bump6', 'w_dinBay1', 'w_dinBay2', 'w_dinBay3', 'w_dinBay4',
  'w_bfBay1', 'w_bfBay2', 'w_bfBay3', 'w_bfBay4', 'win_garage_bay', 'win_dining_bay', 'win_bed_front_bay']);

export function faceStyle(f) {
  if (f.room === 'entry') return { skin: 'porch', stone: false };
  if (f.room === 'porch') return { skin: 'stucco', stone: false };
  if (BAY_WALLS.has(f.wallId)) return { skin: 'stucco', stone: false };
  if (BB_WALLS.has(f.wallId)) return { skin: 'bb', stone: true };
  if (f.wallId === 'w_x1080c' && f.axis === 'x' && f.normal[0] > 0 && f.a0 >= 6.1) return { skin: 'bb', stone: true };
  return { skin: 'stucco', stone: true };
}

// world point on a face at along-coordinate a and height y, offset d outward
function facePoint(f, a, y, d = 0) {
  if (f.axis === 'z') return V3(a, y, f.plane + f.normal[1] * d);
  return V3(f.plane + f.normal[0] * d, y, a);
}

export function buildCladding(ctx, M, parent, gables = []) {
  const geo = new Geo();
  const battens = [];
  const faces = ctx.shell.exteriorFaces;

  for (const f of faces) {
    const st = faceStyle(f);
    const len = f.a1 - f.a0;
    if (len < 0.005) continue;
    const nrm = f.axis === 'z' ? V3(0, 0, f.normal[1]) : V3(f.normal[0], 0, 0);
    // stone wainscot
    let yStart = f.y0;
    if (st.stone && f.y0 < STONE_TOP) {
      const top = Math.min(STONE_TOP, f.y1);
      const ext = 0.045; // wrap outside corners
      stoneBox(geo, M, f, f.a0 - ext, f.a1 + ext, f.y0 - 0.05, top, nrm);
      yStart = top;
    }
    if (st.skin === 'bb' && f.y1 > yStart) {
      quadOnFace(geo, M.board, f, f.a0, f.a1, yStart, f.y1, BB_OFF);
      addBattens(battens, f, f.a0, f.a1, () => [yStart, f.y1]);
    } else if (st.skin === 'porch' && f.y1 > yStart) {
      quadOnFace(geo, M.porchWall, f, f.a0, f.a1, Math.max(yStart, -0.05), f.y1, 0.004);
    }
  }

  // gable walls
  for (const g of gables) {
    const pts = g.pts.map((p) => p.clone());
    if (polyNormal(pts).dot(g.n) < 0) pts.reverse();
    if (g.style === 'bb') {
      const n = g.n;
      for (const p of pts) p.addScaledVector(n, BB_OFF);
      geo.poly(M.board, pts, wallUV(n), n);
      // battens: height of the polygon's top edge at each batten position
      const f = n.z !== 0 ? { axis: 'z', plane: pts[0].z, normal: [0, n.z] } : { axis: 'x', plane: pts[0].x, normal: [n.x, 0] };
      const aOf = (p) => (f.axis === 'z' ? p.x : p.z);
      const as = pts.map(aOf);
      const yb = Math.min(...pts.map((p) => p.y));
      addBattens(battens, { ...f, plane: f.axis === 'z' ? pts[0].z - n.z * BB_OFF : pts[0].x - n.x * BB_OFF }, Math.min(...as), Math.max(...as), (a) => [yb, topAt(pts, aOf, a) - 0.02]);
    } else {
      const mat = g.style === 'porch' ? M.porchWall : g.style === 'smooth' ? M.board : M.stucco;
      if (g.style === 'smooth') for (const p of pts) p.addScaledVector(g.n, BB_OFF);
      geo.poly(mat, pts, wallUV(g.n), g.n);
    }
  }

  const meshes = geo.toMeshes(parent, { name: 'clad' });
  if (battens.length) {
    const box = new THREE.BoxGeometry(1, 1, 1);
    const im = new THREE.InstancedMesh(box, M.batten, battens.length);
    battens.forEach((m, i) => im.setMatrixAt(i, m));
    im.castShadow = true; im.receiveShadow = true; im.name = 'clad:battens';
    im.instanceMatrix.needsUpdate = true;
    im.computeBoundingSphere();
    parent.add(im);
  }
  return meshes;
}

function topAt(pts, aOf, a) {
  let best = -Infinity;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[(i + 1) % pts.length];
    const pa = aOf(p), qa = aOf(q);
    if ((a - pa) * (a - qa) > 0 || Math.abs(pa - qa) < 1e-6) continue;
    const t = (a - pa) / (qa - pa);
    best = Math.max(best, p.y + (q.y - p.y) * t);
  }
  return best;
}

export function quadOnFace(geo, mat, f, a0, a1, y0, y1, off) {
  const n = f.axis === 'z' ? V3(0, 0, f.normal[1]) : V3(f.normal[0], 0, 0);
  const pts = [facePoint(f, a0, y0, off), facePoint(f, a1, y0, off), facePoint(f, a1, y1, off), facePoint(f, a0, y1, off)];
  if (polyNormal(pts).dot(n) < 0) pts.reverse();
  geo.poly(mat, pts, wallUV(n), n);
}

function stoneBox(geo, M, f, a0, a1, y0, y1, n) {
  const P0 = facePoint(f, a0, y0, 0), P1 = facePoint(f, a1, y1, STONE_T);
  const x0 = Math.min(P0.x, P1.x), x1 = Math.max(P0.x, P1.x), z0 = Math.min(P0.z, P1.z), z1 = Math.max(P0.z, P1.z);
  // skip the face pointing into the wall
  const skip = f.axis === 'z' ? (n.z > 0 ? 'nz' : 'pz') : (n.x > 0 ? 'nx' : 'px');
  geo.box(M.stone, x0, y0, z0, x1, y1, z1, { skip: skip + 'ny' });
  // cap / water table
  const C0 = facePoint(f, a0 - 0.02, y1, -0.002), C1 = facePoint(f, a1 + 0.02, y1 + 0.05, STONE_T + 0.025);
  geo.box(M.stoneCap, Math.min(C0.x, C1.x), y1, Math.min(C0.z, C1.z), Math.max(C0.x, C1.x), y1 + 0.05, Math.max(C0.z, C1.z), { skip: skip + 'ny' });
}

function addBattens(list, f, a0, a1, yRange) {
  const { w, t, pitch } = BATTEN;
  const first = Math.ceil((a0 + w) / pitch) * pitch;
  for (let a = first; a < a1 - w; a += pitch) {
    const [ya, yb] = yRange(a);
    if (yb - ya < 0.05) continue;
    const c = facePoint(f, a, (ya + yb) / 2, BB_OFF + t / 2);
    const m = new THREE.Matrix4();
    const sx = f.axis === 'z' ? w : t, sz = f.axis === 'z' ? t : w;
    m.compose(c, new THREE.Quaternion(), new THREE.Vector3(sx, yb - ya, sz));
    list.push(m);
  }
}
