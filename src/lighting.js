// Global lighting: sun, sky dome, hemisphere fill, environment map, exposure.
// A preset is plain data so each view can pick one and override any field.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export const PRESETS = {
  // soft daylight, sun high in the south-west
  day: {
    sun: { az: 215, el: 48, color: 0xfff4e6, intensity: 2.6 },
    hemi: { sky: 0xdfe8f5, ground: 0x8a7a66, intensity: 0.55 },
    env: { intensity: 0.45 },
    sky: { top: 0x6f9fd8, horizon: 0xdfe9f2, bottom: 0x8a8578 },
    exposure: 1.0, interior: 1.0,
  },
  // low warm sun from the east (morning), interior lamps on
  golden: {
    sun: { az: 100, el: 13, color: 0xffc58a, intensity: 4.2 },
    hemi: { sky: 0xe9e2d6, ground: 0x7d6a55, intensity: 0.38 },
    env: { intensity: 0.32 },
    sky: { top: 0x7ea6d6, horizon: 0xf6d6a8, bottom: 0x6f6a60 },
    exposure: 1.0, interior: 1.0,
  },
  // blue hour: dim sky, warm glow from every window
  dusk: {
    sun: { az: 250, el: 3, color: 0xffb070, intensity: 0.7 },
    hemi: { sky: 0x9fb4d0, ground: 0x4a4238, intensity: 0.35 },
    env: { intensity: 0.25 },
    sky: { top: 0x5f86c0, horizon: 0xf3d2a2, bottom: 0x3a3a34 },
    exposure: 1.1, interior: 1.8,
  },
};

export function deepMerge(a, b) {
  if (!b) return structuredClone(a);
  const out = structuredClone(a);
  for (const k of Object.keys(b)) {
    if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && out[k] && typeof out[k] === 'object') out[k] = deepMerge(out[k], b[k]);
    else out[k] = b[k];
  }
  return out;
}

export function sunVector(az, el) {
  const a = THREE.MathUtils.degToRad(az), e = THREE.MathUtils.degToRad(el);
  // az: compass bearing of the sun, 0 = north (-Z), 90 = east (+X), 180 = south (+Z)
  return new THREE.Vector3(Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e));
}

export class Lighting {
  constructor(renderer, scene) {
    this.renderer = renderer; this.scene = scene;
    this.center = new THREE.Vector3(0, 0, 0.3); // middle of the house footprint (x -12.1..12.2, z -9.2..9.7)

    this.sun = new THREE.DirectionalLight(0xffffff, 3);
    this.sun.name = 'sun';
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(4096, 4096);
    const sc = this.sun.shadow.camera;
    sc.left = -17; sc.right = 17; sc.top = 17; sc.bottom = -17; sc.near = 1; sc.far = 120;
    this.sun.shadow.bias = -0.0002;
    this.sun.shadow.normalBias = 0.02;
    this.sun.shadow.radius = 3;
    this.sun.target.position.copy(this.center);
    scene.add(this.sun, this.sun.target);

    this.hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.5);
    scene.add(this.hemi);

    // sky dome
    this.skyUniforms = { top: { value: new THREE.Color() }, horizon: { value: new THREE.Color() }, bottom: { value: new THREE.Color() } };
    const skyMat = new THREE.ShaderMaterial({
      uniforms: this.skyUniforms, side: THREE.BackSide, depthWrite: false, fog: false,
      vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `uniform vec3 top; uniform vec3 horizon; uniform vec3 bottom; varying vec3 vP;
        void main(){ float h = vP.y; vec3 c = h > 0.0 ? mix(horizon, top, pow(clamp(h,0.0,1.0), 0.55)) : mix(horizon, bottom, pow(clamp(-h,0.0,1.0), 0.4));
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        }`,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), skyMat);
    this.sky.name = 'skydome';
    this.sky.renderOrder = -10;
    this.sky.frustumCulled = false;
    scene.add(this.sky);

    const pmrem = new THREE.PMREMGenerator(renderer);
    this.roomEnv = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = this.roomEnv;
    this.interiorLights = [];
    this.current = null;
  }

  addInteriorLight(light) {
    light.userData.baseIntensity = light.intensity;
    this.interiorLights.push(light);
    if (this.current) light.intensity = light.userData.baseIntensity * (this.current.interior ?? 1);
  }

  apply(preset) {
    this.current = preset;
    const p = preset;
    const v = sunVector(p.sun.az, p.sun.el);
    this.sun.position.copy(this.center).addScaledVector(v, 60);
    this.sun.color.set(p.sun.color);
    this.sun.intensity = p.sun.intensity;
    this.hemi.color.set(p.hemi.sky); this.hemi.groundColor.set(p.hemi.ground); this.hemi.intensity = p.hemi.intensity;
    if (p.sky) {
      this.sky.visible = true;
      this.skyUniforms.top.value.set(p.sky.top); this.skyUniforms.horizon.value.set(p.sky.horizon); this.skyUniforms.bottom.value.set(p.sky.bottom);
    } else this.sky.visible = false;
    if (p.env?.texture !== undefined) this.scene.environment = p.env.texture;
    this.scene.environmentIntensity = p.env?.intensity ?? 0.4;
    this.renderer.toneMappingExposure = p.exposure ?? 1;
    for (const l of this.interiorLights) l.intensity = l.userData.baseIntensity * (p.interior ?? 1);
    if (p.shadowFocus) {
      // tighten the sun shadow frustum around a point for crisper shadows in a single view
      const f = p.shadowFocus; // {center:[x,y,z], radius}
      const c = new THREE.Vector3(...f.center);
      this.sun.target.position.copy(c);
      this.sun.position.copy(c).addScaledVector(v, 60);
      const sc = this.sun.shadow.camera; sc.left = -f.radius; sc.right = f.radius; sc.top = f.radius; sc.bottom = -f.radius; sc.updateProjectionMatrix();
    } else {
      this.sun.target.position.copy(this.center);
      const sc = this.sun.shadow.camera; sc.left = -17; sc.right = 17; sc.top = 17; sc.bottom = -17; sc.updateProjectionMatrix();
    }
    this.sun.target.updateMatrixWorld();
  }
}
