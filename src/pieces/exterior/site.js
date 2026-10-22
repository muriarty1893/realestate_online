// Site: lawn (with large-scale colour variation), paver walk with soldier border, side path,
// mulch beds, low-voltage path lights with warm light pools.
import * as THREE from 'three';
import { rng, canvasTex, V3 } from './util.js';

const G = -0.45;

function shapeMesh(pts, mat, y, name) {
  const s = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)));
  const g = new THREE.ShapeGeometry(s, 24);
  g.rotateX(-Math.PI / 2);
  const uv = g.attributes.uv, pos = g.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i), -pos.getZ(i));
  const m = new THREE.Mesh(g, mat);
  m.position.y = y; m.receiveShadow = true; m.name = name;
  return m;
}

// smooth closed blob outline through control points (Catmull-Rom)
function blob(ctrl, n = 120) {
  const c = new THREE.CatmullRomCurve3(ctrl.map(([x, z]) => V3(x, 0, z)), true, 'centripetal');
  return c.getPoints(n).map((p) => [p.x, p.z]);
}

export async function buildSite(ctx, M, parent) {
  const group = new THREE.Group(); group.name = 'site'; parent.add(group);
  const R = rng(99);

  // ---------------- lawn: subdivided plane with vertex-colour variation (mowing / patchiness)
  const N = 140, SZ = 320;
  const g = new THREE.PlaneGeometry(SZ, SZ, N, N);
  g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position, uv = g.attributes.uv;
  const col = new Float32Array(pos.count * 3);
  const noise = (x, z) => Math.sin(x * 0.21 + Math.sin(z * 0.13) * 2) * 0.5 + Math.sin(z * 0.17 + x * 0.05) * 0.35 + Math.sin((x + z) * 0.53) * 0.15;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    uv.setXY(i, x, -z);
    const k = 0.9 + 0.1 * noise(x, z);
    col[i * 3] = k * (0.95 + 0.05 * noise(z, x)); col[i * 3 + 1] = k; col[i * 3 + 2] = k * 0.92;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const lawnMat = M.grass.clone(); lawnMat.vertexColors = true; lawnMat.name = 'ext.lawn';
  const lawn = new THREE.Mesh(g, lawnMat);
  lawn.position.y = G; lawn.receiveShadow = true; lawn.name = 'lawn';
  group.add(lawn);
  ctx.addWalkable(lawn);

  // ---------------- mulch beds
  const beds = [
    // along the facade (lawn edge ~z 11.4 left of the walk, ~z 12.6 right of it)
    blob([[-13.6, 7.2], [-13.4, 10.8], [-9, 11.6], [-5, 11.3], [-1, 11.4], [2.6, 11.6], [3.3, 9.0], [5.9, 9.0], [6.8, 12.4], [10, 12.8], [13.5, 12.4], [15, 9], [13.5, 3], [11, 4.5], [0, 5], [-12, 5]]),
    // left foreground fern bed (edge from the walk at z 21.5 toward x -3.6, z 15)
    blob([[-18, 14.0], [-9, 14.4], [-3.8, 15.0], [0.2, 17.0], [3.2, 21.2], [3.2, 26], [-4, 28], [-14, 27], [-19, 21]]),
    // right foreground flower bed (edge from x 5.8, z 21.5 to x 10.7, z 18.4)
    blob([[5.9, 21.6], [8.2, 19.6], [10.8, 18.4], [15, 17.8], [22, 18.5], [22, 27], [12, 27.5], [6.2, 26]]),
    // right side under the oak
    blob([[12.8, 3.5], [16.5, 1.5], [20, 4], [21, 11], [18, 14.5], [14.5, 13], [13, 9]]),
  ];
  beds.forEach((b, i) => group.add(shapeMesh(b, M.mulch, G + 0.004 + i * 0.0005, 'bed' + i)));

  // ---------------- walk (pavers with darker soldier border) and the side path
  const wx0 = 3.45, wx1 = 5.71, wz0 = 8.52, wz1 = 44;
  const walk = new THREE.Mesh(new THREE.BoxGeometry(wx1 - wx0, 0.06, wz1 - wz0), M.pavers);
  const wuv = walk.geometry.attributes.uv, wpos = walk.geometry.attributes.position;
  for (let i = 0; i < wuv.count; i++) wuv.setXY(i, wpos.getX(i) + (wx0 + wx1) / 2, -(wpos.getZ(i) + (wz0 + wz1) / 2));
  walk.position.set((wx0 + wx1) / 2, G - 0.02, (wz0 + wz1) / 2);
  walk.receiveShadow = true; walk.name = 'walk';
  group.add(walk); ctx.addWalkable(walk);
  const border = new THREE.MeshStandardMaterial({ color: 0x9c7c66, roughness: 0.9, name: 'ext.walkborder' });
  for (const x of [wx0, wx1]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.065, wz1 - wz0), border);
    b.position.set(x + (x === wx0 ? 0.065 : -0.065), G - 0.018, (wz0 + wz1) / 2); b.receiveShadow = true; group.add(b);
  }
  const path = new THREE.Mesh(new THREE.BoxGeometry(16, 0.05, 1.05), M.concrete);
  const puv = path.geometry.attributes.uv, ppos = path.geometry.attributes.position;
  for (let i = 0; i < puv.count; i++) puv.setXY(i, ppos.getX(i), ppos.getZ(i) + ppos.getY(i));
  path.position.set(wx0 - 8, G - 0.02, 13.0); path.receiveShadow = true; path.name = 'sidepath';
  group.add(path); ctx.addWalkable(path);

  // ---------------- path lights
  const poolTex = canvasTex(128, 128, (c, w, h) => {
    const rg = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    rg.addColorStop(0, 'rgba(255,214,120,0.95)'); rg.addColorStop(0.35, 'rgba(255,200,100,0.45)'); rg.addColorStop(1, 'rgba(255,190,90,0)');
    c.fillStyle = rg; c.fillRect(0, 0, w, h);
  });
  const poolMat = new THREE.MeshBasicMaterial({ map: poolTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0x8a6a35, name: 'ext.lightpool', polygonOffset: true, polygonOffsetFactor: -2 });
  const lensMat = new THREE.MeshStandardMaterial({ color: 0x221a10, emissive: 0xffc070, emissiveIntensity: 3.0, name: 'ext.pathlens' });
  const lights = [[3.0, 12.0], [6.2, 11.6], [-5.6, 11.6], [7.4, 20.2], [2.9, 17.5], [6.3, 16.0]];
  for (const [x, z] of lights) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.5, 8), M.bronze);
    post.position.set(x, G + 0.25, z); group.add(post);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.09, 16), M.bronze);
    cap.position.set(x, G + 0.56, z); cap.castShadow = true; group.add(cap);
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.05, 12), lensMat);
    lens.position.set(x, G + 0.495, z); group.add(lens);
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.8), poolMat);
    pool.rotation.x = -Math.PI / 2; pool.position.set(x, G + 0.03, z); pool.renderOrder = 2; group.add(pool);
  }
  void R;
  return { group, beds };
}
