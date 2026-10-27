// Interior lights for the great room piece (6 lights max, registered with ctx.addInteriorLight):
// daylight spill from the north french doors, warm ceiling fill over the living area, under-cabinet
// strip, island pendants, dining chandelier, butler pantry. Can lights are emissive trims only.
import * as THREE from 'three';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { mesh, cyl } from './util.js';
import { vaultY } from './arch.js';

export function buildLights(ctx, M, group, { pendants = [], chandelier = [0.79, 1.9, 5.75] } = {}) {
  RectAreaLightUniformsLib.init();
  const L = new THREE.Group(); L.name = 'gr:lights';
  const add = (l) => { L.add(l); ctx.addInteriorLight(l); return l; };

  // 1. daylight through the north french doors (soft, slightly cool), facing south into the room
  const day = new THREE.RectAreaLight(0xf3f1ec, 2.2, 6.2, 2.3);
  day.position.set(3.1, 1.2, -2.55); day.lookAt(3.1, 1.0, 3.0);
  add(day);
  // 2. warm ceiling fill over the living area (stands in for the can lights + warm bounce)
  const fill = new THREE.RectAreaLight(0xffe2bf, 1.6, 4.5, 4.5);
  fill.position.set(2.2, 3.3, 0.6); fill.lookAt(2.2, 0, 0.6);
  add(fill);
  // 3. under-cabinet strip on the west wall
  const uc = new THREE.RectAreaLight(0xffcf96, 14.0, 3.2, 0.12);
  uc.position.set(-4.2, 1.37, 0.75); uc.lookAt(-4.6, 0, 0.75);
  add(uc);
  // 4. island pendants (one warm point light at their centre)
  const pc = pendants.length ? pendants.reduce((a, p) => a.add(new THREE.Vector3(...p)), new THREE.Vector3()).multiplyScalar(1 / pendants.length) : new THREE.Vector3(-1.68, 1.95, 1.1);
  const pl = new THREE.PointLight(0xffc88e, 3.5, 0, 2);
  pl.position.copy(pc).setY(1.7);
  add(pl);
  // 5. dining chandelier
  const dl = new THREE.PointLight(0xffc88e, 3.0, 0, 2);
  dl.position.set(chandelier[0], chandelier[1] + 0.05, chandelier[2]);
  add(dl);
  // 6. butler pantry (lit shelving)
  const bl = new THREE.PointLight(0xffd2a0, 2.2, 0, 2);
  bl.position.set(-3.6, 2.1, 5.0);
  add(bl);

  // ---------- emissive recessed cans
  const can = (x, y, z, n = new THREE.Vector3(0, -1, 0)) => {
    const g = new THREE.Group();
    g.add(cyl(0.075, 0.075, 0.012, M.canTrim, 0, 0, 0, { seg: 24, cast: false }));
    g.add(cyl(0.055, 0.055, 0.004, M.canLens, 0, -0.007, 0, { seg: 24, cast: false }));
    g.position.set(x, y - 0.006, z);
    g.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), n.normalize());
    L.add(g);
  };
  // kitchen: row over the west counters, row over the north counters, over the island
  for (const z of [2.99, 1.84, 0.71, -0.38, -1.5]) can(-3.14, 3.048, z);
  for (const x of [-2.6, -1.4]) can(x, 3.048, -1.8);
  can(-1.9, 3.048, 3.0);
  // great room vault: two rows on each slope
  const slopeN = (z) => { const s = z > (-2.627 + 3.578) / 2 ? -1 : 1; return new THREE.Vector3(0, -3.1025, s * 1.372); };
  for (const x of [0.8, 3.1, 5.4]) for (const z of [-1.4, 2.35]) can(x, vaultY(z), z, slopeN(z));
  // dining / foyer trays
  for (const [x, z] of [[-0.75, 5.0], [-0.75, 6.5], [2.3, 5.0], [2.3, 6.5]]) can(x, 3.048, z);
  for (const [x, z] of [[3.4, 4.0], [5.8, 4.0], [3.4, 6.62], [5.8, 6.62]]) can(x, 3.048, z);
  // ---------- baked glow decals (additive): under-cabinet wash on the range wall, warm pools on the floor
  const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const glow = (w, h, pos, rot, color, op) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: glowTex, color, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: true }));
    m.position.set(...pos); m.rotation.set(...rot); m.renderOrder = 3; m.castShadow = m.receiveShadow = false; m.userData.noProbe = true; L.add(m);
  };
  glow(3.6, 0.9, [-4.395, 1.12, 0.75], [0, Math.PI / 2, 0], 0xffb766, 0.55);   // range wall backsplash wash
  glow(4.0, 3.2, [1.4, 0.016, 0.8], [-Math.PI / 2, 0, 0], 0xffc27a, 0.1);     // living pool
  glow(2.6, 2.6, [-1.68, 0.02, 1.0], [-Math.PI / 2, 0, 0], 0xffbb70, 0.1);     // island pool
  glow(2.2, 2.2, [0.79, 0.016, 5.75], [-Math.PI / 2, 0, 0], 0xffc27a, 0.07);   // dining pool
  group.add(L);
  return L;
}

// Local reflection probe: render the kitchen once into a cube map and use it as the environment of
// the reflective materials (stainless, glass, granite, oven glass), so they mirror the warm room
// instead of the neutral studio environment.
export function reflectionProbe(ctx, mats, pos = [-1.4, 1.5, 1.3]) {
  const rt = new THREE.WebGLCubeRenderTarget(256, { type: THREE.HalfFloatType, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter });
  const cam = new THREE.CubeCamera(0.05, 60, rt);
  cam.position.set(...pos);
  ctx.scene.add(cam);
  let n = 0;
  ctx.onUpdate(() => {
    n++;
    if (n !== 2 && n !== 40) return;
    const r = ctx.renderer;
    const tm = r.toneMapping; r.toneMapping = THREE.NoToneMapping;
    const hidden = [];
    ctx.scene.traverse((o) => { if (o.userData.noProbe && o.visible) { o.visible = false; hidden.push(o); } });
    cam.update(r, ctx.scene);
    hidden.forEach((o) => (o.visible = true));
    r.toneMapping = tm;
    rt.texture.needsPMREMUpdate = true;
    for (const m of mats) { m.envMap = rt.texture; m.needsUpdate = true; }
  });
  return rt;
}
