// Shift-lens framing for the front view: architectural photos keep verticals vertical by shifting
// the lens instead of tilting the camera. The view declares `shift: [sx, sy]` (principal point offset
// as a fraction of the frame, +x right, +y down). Applied only while that view is active; walking or
// switching views restores the normal projection.
import * as THREE from 'three';

export function installLensShift(ctx) {
  const cam = ctx.camera, renderer = ctx.renderer;
  let active = null;
  const size = new THREE.Vector2();

  function apply(v) {
    renderer.getSize(size);
    const W = size.x, H = size.y;
    const [sx, sy] = v.shift;
    const f = H / 2 / Math.tan(THREE.MathUtils.degToRad(v.fov) / 2);
    const dx = sx * W, dy = sy * H;
    const fullW = W + 2 * Math.abs(dx), fullH = H + 2 * Math.abs(dy);
    const offX = fullW / 2 - (W / 2 + dx), offY = fullH / 2 - (H / 2 + dy);
    cam.fov = THREE.MathUtils.radToDeg(2 * Math.atan(fullH / 2 / f));
    cam.setViewOffset(fullW, fullH, offX, offY, W, H);
  }
  function clear() {
    if (!active) return;
    const fov = active.view.fov;
    active = null;
    cam.clearViewOffset();
    renderer.getSize(size);
    cam.aspect = size.x / size.y;
    cam.fov = fov;
    cam.updateProjectionMatrix();
  }
  addEventListener('viewchange', (e) => {
    const v = e.detail;
    if (v && v.piece === 'exterior' && v.shift) {
      active = { view: v, pos: cam.position.clone(), quat: cam.quaternion.clone() };
      apply(v);
    } else clear();
  });
  addEventListener('resize', () => requestAnimationFrame(() => { if (active) apply(active.view); }));
  ctx.onUpdate(() => {
    if (!active) return;
    if (cam.position.distanceTo(active.pos) > 1e-3 || cam.quaternion.angleTo(active.quat) > 1e-4) clear();
  });
}
