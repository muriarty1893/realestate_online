// First-person walking: pointer-lock mouse look (drag-look fallback), WASD / arrows,
// wall collision against 2D boxes, floor following by raycasting walkable meshes.
import * as THREE from 'three';

export class Walker {
  constructor(camera, dom, { colliders, walkables }) {
    this.camera = camera; this.dom = dom;
    this.colliders = colliders; this.walkables = walkables;
    this.eye = 1.62; this.radius = 0.2; this.speed = 1.6;
    this.yaw = 0; this.pitch = 0;
    this.keys = new Set();
    this.ground = 0;
    this.enabled = true;
    this.ray = new THREE.Raycaster();
    this.ray.far = 4;
    this.locked = false;

    dom.addEventListener('click', () => { if (this.enabled && dom.requestPointerLock) dom.requestPointerLock(); });
    document.addEventListener('pointerlockchange', () => { this.locked = document.pointerLockElement === dom; });
    document.addEventListener('mousemove', (e) => {
      if (!this.enabled) return;
      if (this.locked) this.look(e.movementX, e.movementY);
    });
    // drag look when pointer lock is not available
    let drag = null;
    dom.addEventListener('pointerdown', (e) => { if (!this.locked) drag = [e.clientX, e.clientY]; });
    window.addEventListener('pointerup', () => { drag = null; });
    window.addEventListener('pointermove', (e) => {
      if (!drag || this.locked || !this.enabled) return;
      this.look(e.clientX - drag[0], e.clientY - drag[1]); drag = [e.clientX, e.clientY];
    });
    window.addEventListener('keydown', (e) => { this.keys.add(e.code); });
    window.addEventListener('keyup', (e) => { this.keys.delete(e.code); });
    window.addEventListener('blur', () => this.keys.clear());
  }

  look(dx, dy) {
    this.yaw -= dx * 0.0022;
    this.pitch = THREE.MathUtils.clamp(this.pitch - dy * 0.0022, -1.45, 1.45);
  }

  // place the camera at pos looking at target (also used by view presets)
  setPose(pos, target) {
    this.camera.position.set(...pos);
    const d = new THREE.Vector3(...target).sub(this.camera.position).normalize();
    this.yaw = Math.atan2(-d.x, -d.z);
    this.pitch = Math.asin(THREE.MathUtils.clamp(d.y, -1, 1));
    this.ground = this.sampleGround(pos[0], pos[2], pos[1]) ?? pos[1] - this.eye;
    this.eyeOffset = pos[1] - this.ground; // keep the view's exact height until the user moves
    this.apply();
  }

  apply() {
    const e = new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(e);
  }

  sampleGround(x, z, fromY) {
    this.ray.set(new THREE.Vector3(x, (fromY ?? this.camera.position.y) + 0.3, z), new THREE.Vector3(0, -1, 0));
    this.ray.far = 3.2;
    const hits = this.ray.intersectObjects(this.walkables, false);
    return hits.length ? hits[0].point.y : null;
  }

  blocked(x, z) {
    const r = this.radius;
    for (const c of this.colliders) if (x + r > c.x0 && x - r < c.x1 && z + r > c.z0 && z - r < c.z1) return true;
    return false;
  }

  update(dt) {
    if (!this.enabled) return;
    const k = this.keys;
    let f = 0, s = 0;
    if (k.has('KeyW') || k.has('ArrowUp')) f += 1;
    if (k.has('KeyS') || k.has('ArrowDown')) f -= 1;
    if (k.has('KeyD') || k.has('ArrowRight')) s += 1;
    if (k.has('KeyA') || k.has('ArrowLeft')) s -= 1;
    if (k.has('KeyQ')) this.yaw += dt * 1.6;
    if (k.has('KeyE')) this.yaw -= dt * 1.6;
    this.apply();
    if (!f && !s) return;
    const sp = this.speed * (k.has('ShiftLeft') || k.has('ShiftRight') ? 2.2 : 1) * dt;
    const fx = -Math.sin(this.yaw), fz = -Math.cos(this.yaw);
    const dx = (fx * f + -fz * s) * sp, dz = (fz * f + fx * s) * sp;
    const p = this.camera.position;
    if (!this.blocked(p.x + dx, p.z)) p.x += dx;
    if (!this.blocked(p.x, p.z + dz)) p.z += dz;
    const g = this.sampleGround(p.x, p.z, this.ground + 0.5);
    if (g !== null && g - this.ground < 0.45) this.ground = g;
    this.eyeOffset = this.eye;
    p.y = THREE.MathUtils.damp(p.y, this.ground + this.eyeOffset, 12, dt);
  }
}
