// Shared material registry. The shell asks for materials by key; piece modules may
// override keys for the rooms/openings they own (see ctx.setRoomMaterial in main.js).
import * as THREE from 'three';

const texLoader = new THREE.TextureLoader();
const texCache = new Map();

// Load a texture whose UVs are in metres: repeatM = size of one tile in metres.
export function loadTex(url, { srgb = false, repeatM = 1, anisotropy = 8, rotation = 0 } = {}) {
  const key = `${url}|${srgb}|${repeatM}|${rotation}`;
  if (texCache.has(key)) return texCache.get(key);
  const t = texLoader.load(url);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1 / repeatM, 1 / repeatM);
  t.rotation = rotation;
  t.anisotropy = anisotropy;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  texCache.set(key, t);
  return t;
}

// Same as loadTex but resolves once the image is decoded (use in async build()).
// Shot mode also waits for THREE.DefaultLoadingManager, so plain loadTex() is safe too.
export async function loadTexAsync(url, { srgb = false, repeatM = 1, anisotropy = 8, rotation = 0 } = {}) {
  const key = `${url}|${srgb}|${repeatM}|${rotation}`;
  if (texCache.has(key) && texCache.get(key).image) return texCache.get(key);
  const t = await texLoader.loadAsync(url);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1 / repeatM, 1 / repeatM);
  t.rotation = rotation;
  t.anisotropy = anisotropy;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  texCache.set(key, t);
  return t;
}

const std = (o) => new THREE.MeshStandardMaterial(o);

// Neutral defaults. Colours are linear-workflow sRGB hexes.
const defaults = {
  'paint.wall': () => std({ color: 0xece5d8, roughness: 0.92 }),        // warm white drywall
  'paint.ceiling': () => std({ color: 0xf1ece2, roughness: 0.95 }),
  'trim': () => std({ color: 0xf3f0e8, roughness: 0.55 }),              // satin white trim
  'reveal': () => std({ color: 0xece5d8, roughness: 0.92 }),
  'floor.wood': () => std({ color: 0x8a6446, roughness: 0.55 }),
  'floor.tile': () => std({ color: 0xcfc8bd, roughness: 0.35 }),
  'floor.concrete': () => std({ color: 0x9a978f, roughness: 0.85 }),
  'floor.pavers': () => std({ color: 0xa98e74, roughness: 0.85 }),
  'exterior.wall': () => std({ color: 0xd9d2c4, roughness: 0.95 }),     // stucco-ish
  'exterior.top': () => std({ color: 0x55504a, roughness: 0.9 }),
  'window.frame': () => std({ color: 0x2a2521, roughness: 0.45, metalness: 0.1 }),
  'window.glass': () => new THREE.MeshPhysicalMaterial({
    color: 0xffffff, roughness: 0.03, metalness: 0, transparent: true, opacity: 0.12,
    envMapIntensity: 1.2, depthWrite: false, side: THREE.DoubleSide,
  }),
  'door.interior': () => std({ color: 0xf3f0e8, roughness: 0.5 }),
  'door.entry': () => std({ color: 0x6b3a1e, roughness: 0.45 }),
  'door.garage': () => std({ color: 0xe8e4dc, roughness: 0.6, metalness: 0.2 }),
  'hardware.black': () => std({ color: 0x151515, roughness: 0.4, metalness: 0.6 }),
};

const registry = new Map();
export function getMat(key) {
  if (registry.has(key)) return registry.get(key);
  const f = defaults[key];
  const m = f ? f() : std({ color: 0xff00ff });
  m.name = key;
  registry.set(key, m);
  return m;
}
export function setMat(key, material) {
  material.name = material.name || key;
  registry.set(key, material);
}
export function hasMat(key) { return registry.has(key); }
