// Site: lawn, walkway, beds, path lights.
import * as THREE from 'three';

export async function buildSite(ctx, M, parent) {
  const g = new THREE.PlaneGeometry(400, 400);
  g.rotateX(-Math.PI / 2);
  // world-metre UVs
  const uv = g.attributes.uv, pos = g.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i), -pos.getZ(i));
  const lawn = new THREE.Mesh(g, M.grass);
  lawn.position.y = -0.45;
  lawn.receiveShadow = true;
  lawn.name = 'lawn';
  parent.add(lawn);
  ctx.addWalkable(lawn);
}
