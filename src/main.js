// Entry point: renderer, piece loading, shell, views, walk mode and screenshot mode.
//   index.html                         walk mode
//   index.html?shot=1&view=great_room  screenshot mode (used by tools/shot.mjs)
//   extra params: w,h (shot size), pos=x,y,z target=x,y,z fov=deg, preset=day|golden|dusk,
//                 only=piece1,piece2 (load only these pieces), top=1 (plan view, roofless)
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
RectAreaLightUniformsLib.init();
import * as P from './plan.js';
import { getMat, setMat, loadTex, loadTexAsync } from './materials.js';
import { buildShell } from './shell.js';
import { Lighting, PRESETS, deepMerge } from './lighting.js';
import { Walker } from './walk.js';

const PIECES = ['exterior', 'great_room', 'master_suite', 'rest'];
const q = new URLSearchParams(location.search);
const SHOT = q.has('shot');
const TOP = q.has('top');
const errors = (window.__errors = []);
const logErr = (where, e) => { const msg = `[${where}] ${e?.stack || e}`; errors.push(msg); console.error(msg); };
window.addEventListener('error', (e) => logErr('window', e.error || e.message));
window.addEventListener('unhandledrejection', (e) => logErr('promise', e.reason));

// ---------------------------------------------------------------- renderer
const canvas = document.getElementById('c');
if (SHOT) document.body.classList.add('shot');
const W = SHOT ? +(q.get('w') || 1789) : innerWidth;
const H = SHOT ? +(q.get('h') || 1200) : innerHeight;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: SHOT, powerPreference: 'high-performance' });
renderer.setPixelRatio(SHOT ? 1 : Math.min(devicePixelRatio, q.has('hq') ? 1.5 : 1));
renderer.setSize(W, H, !SHOT);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.AgXToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;
if (TOP) renderer.clippingPlanes = [new THREE.Plane(new THREE.Vector3(0, -1, 0), 2.2)];

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, W / H, 0.05, 1200);
const lighting = new Lighting(renderer, scene);

// ---------------------------------------------------------------- post
const rt = new THREE.WebGLRenderTarget(W * renderer.getPixelRatio(), H * renderer.getPixelRatio(), { type: THREE.HalfFloatType, samples: 4 });
const composer = new EffectComposer(renderer, rt);
composer.setPixelRatio(renderer.getPixelRatio());
composer.setSize(W, H);
composer.addPass(new RenderPass(scene, camera));
const gtao = new GTAOPass(scene, camera, W, H);
gtao.output = GTAOPass.OUTPUT.Default;
gtao.blendIntensity = 1.0;
gtao.updateGtaoMaterial({ radius: 0.5, distanceExponent: 1.5, thickness: 1.0, scale: 1.0, samples: 16, distanceFallOff: 1.0 });
gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 16 });
// stock blend is mix(1, ao, intensity), which extrapolates past 1 (negative, tinted darks); darken with pow() instead
gtao.blendMaterial.fragmentShader = /* glsl */`
  uniform float intensity;
  uniform sampler2D tDiffuse;
  varying vec2 vUv;
  void main() {
    vec4 texel = texture2D(tDiffuse, vUv);
    float ao = clamp(texel.r, 0.0, 1.0);
    gl_FragColor = vec4(vec3(intensity <= 1.0 ? mix(1.0, ao, intensity) : pow(ao, intensity)), texel.a);
  }`;
gtao.blendMaterial.needsUpdate = true;
composer.addPass(gtao);
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.0, 0.4, 0.92);
bloom.enabled = false;
composer.addPass(bloom);
composer.addPass(new OutputPass());

// walk mode: the sun never moves, so render the shadow map only when lighting changes; AO is opt-in (O key)
let walkAO = q.has('hq');
if (!SHOT) renderer.shadowMap.autoUpdate = false;
function applyPost(post = {}) {
  gtao.enabled = SHOT ? (post.ao ?? true) : walkAO && (post.ao ?? true);
  gtao.blendIntensity = post.aoIntensity ?? 1.0;
  gtao.updateGtaoMaterial({ radius: post.aoRadius ?? 0.5, thickness: post.aoThickness ?? 1.0, distanceExponent: 1.5, scale: 1.0, samples: SHOT ? 24 : 12, distanceFallOff: 1.0 });
  bloom.enabled = (post.bloom ?? 0) > 0;
  bloom.strength = post.bloom ?? 0;
  bloom.radius = post.bloomRadius ?? 0.4;
  bloom.threshold = post.bloomThreshold ?? 0.92;
}

// ---------------------------------------------------------------- context handed to pieces
const gltfLoader = new GLTFLoader();
const rgbeLoader = new RGBELoader();
const roomMats = new Map();
const updaters = [];
const views = {
  start: { pos: [0.6, 1.2, 24], target: [0.6, 2.5, 4], fov: 55, preset: 'golden', label: 'Front walk' },
};
const ctx = {
  THREE, scene, renderer, camera, lighting, plan: P, px2m: P.px2m, rectM: P.rectM, ft: P.ft,
  params: q, shot: SHOT,
  wallsResolved: P.walls.map((w) => ({ ...w })),
  openingsResolved: P.openings.map((o) => ({ ...o })),
  hiddenWalls: new Set(), customCeilings: new Set(), noBaseboard: new Set(),
  colliders: [], walkables: [],
  getMat, setMat, loadTex, loadTexAsync,
  loadGLTF: (url) => gltfLoader.loadAsync(url),
  loadHDR: (url) => rgbeLoader.loadAsync(url),
  room(id) {
    const r = P.rooms.find((x) => x.id === id);
    if (!r) throw new Error('no room ' + id);
    return { ...r, rectsM: r.rects.map(P.rectM), floorY: r.floorY ?? 0, clgM: P.ft(r.clg), trayM: r.trayRect ? P.rectM(r.trayRect) : null };
  },
  opening(id) { return this.openingsResolved.find((o) => o.id === id); },
  setRoomMaterial(roomId, part, mat) { roomMats.set(roomId + ':' + part, mat); },
  roomMat(roomId, part) {
    const m = roomMats.get(roomId + ':' + part);
    if (m) return m;
    const rm = P.rooms.find((x) => x.id === roomId);
    if (part === 'floor') return getMat('floor.' + (rm?.floor || 'wood'));
    if (part === 'ceiling') return getMat(rm?.outdoor ? 'paint.ceiling' : 'paint.ceiling');
    return getMat(rm?.outdoor ? 'exterior.wall' : 'paint.wall');
  },
  overrideOpening(id, patch) { const o = this.opening(id); if (!o) throw new Error('no opening ' + id); Object.assign(o, patch); },
  openingMat(o, part) {
    if (o.mats?.[part]) return o.mats[part];
    if (part === 'frame') return getMat('window.frame');
    if (part === 'glass') return getMat('window.glass');
    if (part === 'leaf') return getMat(o.type === 'entry' ? 'door.entry' : o.type === 'garage' ? 'door.garage' : 'door.interior');
    return getMat('trim');
  },
  openingSillMat(o) { return o.mats?.sill ?? getMat('reveal'); },
  hideWall(id) { this.hiddenWalls.add(id); },
  customCeiling(roomId) { this.customCeilings.add(roomId); },
  addCollider(c) { this.colliders.push(c); },
  addWalkable(mesh) { this.walkables.push(mesh); },
  addInteriorLight(light) { lighting.addInteriorLight(light); },
  onUpdate(fn) { updaters.push(fn); },
  views,
};
window.__ctx = ctx;

// ---------------------------------------------------------------- loading
const pending = { n: 0 };
THREE.DefaultLoadingManager.onStart = () => { pending.n++; };
const mgrIdle = () => new Promise((res) => {
  const t0 = performance.now();
  const tick = () => {
    const m = THREE.DefaultLoadingManager;
    // itemsLoaded/itemsTotal are private; poll via a probe on the manager
    if (!m.__busy || performance.now() - t0 > 90000) res(); else setTimeout(tick, 100);
  };
  tick();
});
{
  const m = THREE.DefaultLoadingManager;
  let total = 0, done = 0;
  const origStart = m.itemStart.bind(m), origEnd = m.itemEnd.bind(m), origErr = m.itemError.bind(m);
  m.itemStart = (u) => { total++; m.__busy = total > done; origStart(u); };
  m.itemEnd = (u) => { done++; m.__busy = total > done; origEnd(u); };
  m.itemError = (u) => { logErr('loader', 'failed to load ' + u); origErr(u); };
}

const status = document.getElementById('status');
const say = (s) => { if (status) status.textContent = s; };

async function init() {
  const only = q.get('only') ? q.get('only').split(',') : null;
  const mods = {};
  for (const id of PIECES) {
    if (only && !only.includes(id)) continue;
    try { mods[id] = await import(`./pieces/${id}.js`); } catch (e) { logErr(id + ':import', e); }
  }
  say('configuring…');
  for (const [id, m] of Object.entries(mods)) {
    try { if (m.views) for (const [k, v] of Object.entries(m.views)) views[k] = { ...v, piece: id }; } catch (e) { logErr(id + ':views', e); }
    try { await m.configure?.(ctx); } catch (e) { logErr(id + ':configure', e); }
  }
  say('building shell…');
  const shell = buildShell(ctx);
  scene.add(shell.group);
  ctx.shell = shell;
  ctx.colliders.push(...shell.colliders);
  ctx.walkables.push(...shell.walkables);
  for (const [id, m] of Object.entries(mods)) {
    say('building ' + id + '…');
    try { await m.build?.(ctx); } catch (e) { logErr(id + ':build', e); }
  }
  scene.traverse((o) => { if (o.isMesh && o.userData.glass) { o.castShadow = false; } });
  return mods;
}

// ---------------------------------------------------------------- views
function viewFromParams() {
  const v = { ...(views[q.get('view') || 'start'] || views.start) };
  if (q.get('pos')) v.pos = q.get('pos').split(',').map(Number);
  if (q.get('target')) v.target = q.get('target').split(',').map(Number);
  if (q.get('fov')) v.fov = +q.get('fov');
  if (q.get('preset')) v.preset = q.get('preset');
  return v;
}
function presetFor(v) {
  const base = typeof v.preset === 'string' ? PRESETS[v.preset] : deepMerge(PRESETS[v.preset?.base || 'golden'], v.preset);
  return deepMerge(base || PRESETS.golden, v.lighting);
}

let walker;
const TONE = { agx: THREE.AgXToneMapping, aces: THREE.ACESFilmicToneMapping, neutral: THREE.NeutralToneMapping, linear: THREE.LinearToneMapping };
function setView(v) {
  renderer.toneMapping = TONE[v.toneMapping || 'agx'];
  camera.fov = v.fov ?? 55;
  camera.updateProjectionMatrix();
  lighting.apply(presetFor(v));
  renderer.shadowMap.needsUpdate = true;
  applyPost(v.post);
  if (walker) walker.setPose(v.pos, v.target);
  else { camera.position.set(...v.pos); camera.lookAt(...v.target); }
  window.dispatchEvent(new CustomEvent('viewchange', { detail: v }));
}

function topView() {
  const cam = new THREE.OrthographicCamera(-15, 15, 10, -10, 0.1, 200);
  cam.position.set(0, 60, 0.3); cam.up.set(0, 0, -1); cam.lookAt(0, 0, 0.3);
  return cam;
}

// ---------------------------------------------------------------- go
const mods = await init();
let activeCam = camera;
const v0 = viewFromParams();
if (!SHOT) {
  walker = new Walker(camera, canvas, { colliders: ctx.colliders, walkables: ctx.walkables });
  ctx.walker = walker;
}
setView(v0);
if (TOP) {
  activeCam = topView();
  composer.passes[0].camera = activeCam; gtao.camera = activeCam;
  lighting.sky.visible = false;
  lighting.sun.castShadow = false;
  lighting.hemi.intensity = 1.5;
}

const clock = new THREE.Clock();
function frame() {
  const dt = Math.min(clock.getDelta(), 0.1);
  walker?.update(dt);
  for (const f of updaters) { try { f(dt, ctx); } catch (e) { logErr('update', e); } }
  composer.render(dt);
}

if (SHOT) {
  await mgrIdle();
  try { await renderer.compileAsync(scene, activeCam); } catch (e) { logErr('compile', e); }
  for (let i = 0; i < 4; i++) frame();
  await new Promise((r) => setTimeout(r, 50));
  frame();
  window.__info = { triangles: renderer.info.render.triangles, calls: renderer.info.render.calls, programs: renderer.info.programs.length };
  window.__shotReady = true;
} else {
  say('');
  buildHud();
  renderer.setAnimationLoop(frame);
  // re-render shadows a few times while late assets (textures/models) finish loading
  let shadowTicks = 0;
  const shadowTimer = setInterval(() => { renderer.shadowMap.needsUpdate = true; if (++shadowTicks > 20) clearInterval(shadowTimer); }, 1000);
  addEventListener('resize', () => {
    renderer.setSize(innerWidth, innerHeight);
    composer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  });
}

// ---------------------------------------------------------------- HUD (walk mode)
function buildHud() {
  const hud = document.getElementById('hud');
  const list = document.getElementById('views');
  const names = Object.keys(views);
  names.forEach((k, i) => {
    const b = document.createElement('button');
    b.textContent = `${i + 1} · ${views[k].label || k}`;
    b.onclick = (e) => { e.stopPropagation(); setView(views[k]); };
    list.appendChild(b);
  });
  const presetNames = Object.keys(PRESETS);
  let pi = 0;
  const roomLabel = document.getElementById('room');
  addEventListener('keydown', (e) => {
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= names.length) setView(views[names[n - 1]]);
    if (e.code === 'KeyL') { pi = (pi + 1) % presetNames.length; lighting.apply(deepMerge(PRESETS[presetNames[pi]])); renderer.shadowMap.needsUpdate = true; document.getElementById('preset').textContent = presetNames[pi]; }
    if (e.code === 'KeyO') { walkAO = !walkAO; gtao.enabled = walkAO; }
    if (e.code === 'KeyH') hud.classList.toggle('hidden');
  });
  setInterval(() => {
    const p = camera.position;
    const px = p.x / P.M_PER_PX + P.ORIGIN_PX[0], py = p.z / P.M_PER_PX + P.ORIGIN_PX[1];
    const rm = P.rooms.find((r) => r.rects.some((rc) => px > rc[0] && px < rc[2] && py > rc[1] && py < rc[3]));
    roomLabel.textContent = rm ? rm.name : 'Outside';
  }, 250);
}
