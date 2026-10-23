// A warm, neutral-bounce environment for this piece's materials. The shared RoomEnvironment has a cool cast that
// turns every shadowed fold, underside and curtain blue-grey; photographs of this room show warm, creamy shadows.
import * as THREE from 'three';

export function warmEnvironment(renderer) {
  const sc = new THREE.Scene();
  const face = (c) => new THREE.MeshBasicMaterial({ color: c, side: THREE.BackSide });
  // +x, -x, +y, -y, +z, -z : cream walls, bright ceiling, warm wood floor
  const room = new THREE.Mesh(new THREE.BoxGeometry(10, 5, 10), [face(0xd9c7ae), face(0xd9c7ae), face(0xeadccb), face(0xb9a68c), face(0xd9c7ae), face(0xdcc9b0)]);
  sc.add(room);
  const lite = (c, k, w, h, x, y, z, ry, rx = 0) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k), side: THREE.DoubleSide }));
    m.position.set(x, y, z); m.rotation.set(rx, ry, 0); sc.add(m);
  };
  lite(0xfff1de, 9, 3.2, 2.6, 0, 1.8, -4.95, 0);         // windows (north)
  lite(0xffeccf, 5, 2.4, 2.6, 4.95, 1.6, 1.0, -Math.PI / 2); // slider (east)
  lite(0xffe2bd, 2.2, 4, 4, 0, 2.48, 0, 0, Math.PI / 2);  // soft ceiling glow
  const pm = new THREE.PMREMGenerator(renderer);
  const t = pm.fromScene(sc, 0.04).texture;
  pm.dispose();
  return t;
}

export function applyWarmEnv(ctx, M, group, intensity = 0.5) {
  const env = warmEnvironment(ctx.renderer);
  const seen = new Set();
  const visit = (m) => {
    if (!m || seen.has(m) || !m.isMeshStandardMaterial) return;
    seen.add(m);
    m.envMap = env; m.envMapIntensity = m === M.glass || m === M.showerGlass ? 0.8 : m === M.mirror ? 0.9 : m === M.chrome || m === M.brass ? 1.0 : intensity;
    m.needsUpdate = true;
  };
  for (const v of Object.values(M)) (Array.isArray(v) ? v : [v]).forEach(visit);
  group.traverse((o) => { if (o.isMesh) (Array.isArray(o.material) ? o.material : [o.material]).forEach(visit); });
}
