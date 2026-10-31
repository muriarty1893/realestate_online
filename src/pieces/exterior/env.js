// Procedural "garden at golden hour" environment for the exterior view: blue sky, warm horizon,
// a band of dark tree silhouettes, green-brown ground and a low sun glow. PMREM-filtered.
// Swapped in only while an exterior view is active (the engine's RoomEnvironment otherwise).
import * as THREE from 'three';

export function makeGardenEnv(renderer, sunDir) {
  const scene = new THREE.Scene();
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { sun: { value: sunDir.clone().normalize() } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `
      uniform vec3 sun; varying vec3 vP;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
      float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
        return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
      void main(){
        vec3 d = normalize(vP);
        float h = d.y;
        vec3 zen = vec3(0.30, 0.52, 0.95), hor = vec3(1.25, 1.10, 0.90);
        vec3 c = mix(hor, zen, pow(clamp(h, 0.0, 1.0), 0.5));
        // tree line: irregular band of foliage up to ~18 degrees
        float az = atan(d.z, d.x);
        float top = 0.12 + 0.18 * noise(vec2(az * 3.0, 1.0)) + 0.08 * noise(vec2(az * 11.0, 5.0));
        float trees = smoothstep(top + 0.02, top - 0.02, h);
        vec3 leaf = vec3(0.07, 0.09, 0.035) * (0.7 + 0.6 * noise(vec2(az * 40.0, h * 40.0)));
        // sunlit leaf edges toward the sun
        float sd = max(dot(d, sun), 0.0);
        leaf += vec3(0.5, 0.42, 0.15) * pow(sd, 6.0) * 0.8;
        c = mix(c, leaf, trees * 0.92);
        // ground below the horizon
        if (h < 0.0) c = mix(vec3(0.12, 0.14, 0.06), vec3(0.06, 0.07, 0.035), clamp(-h * 3.0, 0.0, 1.0));
        // sun glow
        c += vec3(6.0, 4.6, 2.6) * pow(sd, 400.0) + vec3(0.9, 0.65, 0.35) * pow(sd, 12.0);
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(10, 64, 32), mat));
  const pmrem = new THREE.PMREMGenerator(renderer);
  const rt = pmrem.fromScene(scene, 0.02);
  pmrem.dispose();
  mat.dispose();
  return rt.texture;
}

// swap the environment in/out with the exterior views
export function installEnvSwap(ctx, envTex) {
  addEventListener('viewchange', (e) => {
    const v = e.detail;
    if (v && v.piece === 'exterior') ctx.scene.environment = envTex;
    else if (ctx.scene.environment === envTex) ctx.scene.environment = ctx.lighting.roomEnv;
  });
}

// Warm sunset glow low in the sky behind the trees (right of the house in the front photo), added on top
// of the engine's sky dome. Additive, behind everything, follows the camera; shown with the exterior
// views and in walk mode, hidden for the interior pieces' views.
export function addSkyGlow(ctx, dir = [0.62, 0.06, -0.78]) {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, transparent: true, blending: THREE.AdditiveBlending, fog: false,
    uniforms: { gdir: { value: new THREE.Vector3(...dir).normalize() } },
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `
      uniform vec3 gdir; varying vec3 vP;
      void main(){
        vec3 d = normalize(vP);
        float h = d.y;
        float ang = acos(clamp(dot(normalize(vec3(d.x, 0.0, d.z)), normalize(vec3(gdir.x, 0.0, gdir.z))), -1.0, 1.0));
        float band = smoothstep(0.38, 0.0, h) * smoothstep(-0.05, 0.02, h);
        vec3 c = vec3(1.0, 0.66, 0.3) * 1.3 * exp(-ang * ang / (2.0 * 0.3 * 0.3)) * band
               + vec3(1.0, 0.8, 0.5) * 0.1 * smoothstep(0.15, 0.0, h) * smoothstep(-0.05, 0.02, h);
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(380, 32, 16), mat);
  m.name = 'ext.skyglow'; m.renderOrder = -9; m.frustumCulled = false;
  ctx.scene.add(m);
  ctx.onUpdate(() => m.position.copy(ctx.camera.position));
  addEventListener('viewchange', (e) => { const v = e.detail; m.visible = !v || v.piece === 'exterior'; });
  return m;
}
