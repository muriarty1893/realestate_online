// Materials for the great room / kitchen / dining piece. CC0 textures from Poly Haven and ambientCG
// live in assets/great_room/tex. UVs on our own geometry are in metres, so repeat = 1 / tile size.
import * as THREE from 'three';
import { ASSET, canvasTex, rng } from './util.js';

const loader = new THREE.TextureLoader();
const cache = new Map();
export function tex(file, { srgb = false, tile = 1, tileV, rot = 0, aniso = 8 } = {}) {
  const key = `${file}|${srgb}|${tile}|${tileV}|${rot}`;
  if (cache.has(key)) return cache.get(key);
  const t = loader.load(ASSET + 'tex/' + file);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1 / tile, 1 / (tileV ?? tile));
  t.rotation = rot;
  t.anisotropy = aniso;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, t);
  return t;
}

const std = (o) => new THREE.MeshStandardMaterial(o);
const col = (r, g, b) => new THREE.Color(r, g, b);

export function makeMats() {
  const M = {};
  // ---------------- paint & trim (house-wide interior look)
  M.wall = std({ color: 0xf0e3cc, roughness: 0.93 });
  M.ceiling = std({ color: 0xf0e5d1, roughness: 0.95 });
  M.trim = std({ color: 0xf2efe7, roughness: 0.5 });
  M.reveal = M.wall;
  M.doorInt = std({ color: 0xf0ede5, roughness: 0.45 });

  // ---------------- floor: medium-brown wood plank
  M.floor = new THREE.MeshPhysicalMaterial({ specularIntensity: 0.5,
    map: tex('wood_floor_diff_2k.jpg', { srgb: true, tile: 2.0 }),
    normalMap: tex('wood_floor_nor_gl_1k.jpg', { tile: 2.0 }),
    color: col(0.29, 0.335, 0.47), roughness: 0.6, envMapIntensity: 0.7, clearcoat: 0.16, clearcoatRoughness: 0.5, normalScale: new THREE.Vector2(0.9, 0.9),
  });

  // ---------------- rough-sawn beam wood
  M.beam = std({
    map: tex('rough_wood_diff_1k.jpg', { srgb: true, tile: 1.2 }),
    normalMap: tex('rough_wood_nor_gl_1k.jpg', { tile: 1.2 }),
    roughnessMap: tex('rough_wood_rough_1k.jpg', { tile: 1.2 }),
    color: col(0.64, 0.4, 0.26), roughness: 0.9, normalScale: new THREE.Vector2(1.2, 1.2),
  });

  // ---------------- cabinet wood (warm medium-brown shaker, cherry/hickory look)
  M.cab = std({
    map: tex('oak_veneer_01_diff_1k.jpg', { srgb: true, tile: 0.55 }),
    color: col(0.68, 0.42, 0.23), roughness: 0.48,
  });
  M.cabDark = std({ map: M.cab.map, color: col(0.52, 0.32, 0.19), roughness: 0.55 });

  // ---------------- dark leathered granite
  M.granite = std({
    map: tex('Marble017_Color.jpg', { srgb: true, tile: 1.4 }),
    normalMap: tex('Marble017_NormalGL.jpg', { tile: 0.5 }),
    color: col(0.28, 0.27, 0.26), roughness: 0.38, metalness: 0.0, normalScale: new THREE.Vector2(0.5, 0.5),
  });

  // ---------------- white subway tile (3x12 in running bond): Tiles009 is 2 tiles x 4 rows per texture
  M.subway = std({
    map: tex('Tiles009_Color.jpg', { srgb: true, tile: 0.61, tileV: 0.305 }),
    normalMap: tex('Tiles009_NormalGL.jpg', { tile: 0.61, tileV: 0.305 }),
    roughnessMap: tex('Tiles009_Roughness.jpg', { tile: 0.61, tileV: 0.305 }),
    color: col(0.74, 0.72, 0.68), roughness: 0.25, normalScale: new THREE.Vector2(2.2, 2.2),
    emissive: 0xffa94d, emissiveMap: glowTex(), emissiveIntensity: 0.3,
  });

  // ---------------- cognac leather: Poly Haven brown_leather (CC0) PBR set, albedo tinted to the photo's cognac.
  // Grain ~4 mm at a 0.32 m tile. Clearcoat gives the soft satin highlights along cushion and arm tops.
  const LT = 0.26;
  const leatherMat = (o = {}) => new THREE.MeshPhysicalMaterial({
    map: tex('brown_leather_albedo_1k.jpg', { srgb: true, tile: LT }),
    normalMap: tex('brown_leather_nor_gl_1k.jpg', { tile: LT }), normalScale: new THREE.Vector2(0.28, 0.28),
    roughnessMap: tex('brown_leather_rough_1k.jpg', { tile: LT }), roughness: 0.82,
    color: new THREE.Color(1.86, 1.48, 0.8), metalness: 0, specularIntensity: 0.6, specularColor: new THREE.Color(1.0, 0.78, 0.55), envMapIntensity: 0.45,
    clearcoat: 0.14, clearcoatRoughness: 0.3, ...o,
  });
  // hide variation (round 7): large worn/lighter patches and darker mottling from world-space 3D noise, lighter
  // patches slightly desaturated toward tan; gloss varies in soft bands (lower roughness, more clearcoat on tops).
  const hide = (m) => {
    m.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vHideP; varying vec3 vHideN;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvHideP = (modelMatrix * vec4(transformed, 1.0)).xyz; vHideN = normalize(mat3(modelMatrix) * objectNormal);');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
varying vec3 vHideP; varying vec3 vHideN;
float hh3(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float hn3(vec3 x) { vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hh3(i), hh3(i + vec3(1, 0, 0)), f.x), mix(hh3(i + vec3(0, 1, 0)), hh3(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(hh3(i + vec3(0, 0, 1)), hh3(i + vec3(1, 0, 1)), f.x), mix(hh3(i + vec3(0, 1, 1)), hh3(i + vec3(1, 1, 1)), f.x), f.y), f.z); }`)
        .replace('#include <map_fragment>', `#include <map_fragment>
  float hm = 0.5 * hn3(vHideP * 3.1 + 7.0) + 0.32 * hn3(vHideP * 8.3) + 0.18 * hn3(vHideP * 23.0 + 3.0);
  float hup = smoothstep(0.35, 0.95, vHideN.y);
  float hk = mix(0.64, 1.3, smoothstep(0.15, 0.85, hm)) * (1.0 + 0.08 * hup);
  vec3 hc = diffuseColor.rgb * hk;
  diffuseColor.rgb = mix(hc, vec3(dot(hc, vec3(0.2126, 0.7152, 0.0722))), 0.22 * smoothstep(0.45, 0.85, hm));`)
        .replace('#include <opaque_fragment>', `
  { // shadows and mid-tones drift to a greyer brown, lit tones stay warm; soft sheen on upward / grazing faces
    float ol = dot(outgoingLight, vec3(0.2126, 0.7152, 0.0722));
    float sh = 1.0 - smoothstep(0.008, 0.06, ol);
    outgoingLight = mix(outgoingLight, vec3(ol) * vec3(1.06, 0.97, 0.88), 0.35 * sh);
    vec3 hv = normalize(vViewPosition);
    float gz = pow(1.0 - clamp(abs(dot(normalize(normal), hv)), 0.0, 1.0), 3.0);
    float sheen = gz * (0.35 + 0.65 * hup) * (0.5 + 0.8 * hn3(vHideP * 6.0 + 2.0)) * smoothstep(0.1, 0.4, ol);
    outgoingLight += vec3(0.20, 0.13, 0.07) * sheen * 2.2;
  }
#include <opaque_fragment>`)
        .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
  float hb = hn3(vHideP * vec3(2.2, 9.0, 2.2) + 11.0);
  roughnessFactor *= mix(1.08, 0.72, hup * smoothstep(0.3, 0.75, hb)) * (0.92 + 0.16 * hn3(vHideP * 14.0));`);
    };
    m.customProgramCacheKey = () => 'hide2';
    return m;
  };
  M.leather = leatherMat();
  M.leatherSide = leatherMat({ side: THREE.DoubleSide });
  M.leatherDark = leatherMat({ color: new THREE.Color(1.5, 1.18, 0.64) });
  M.sofaLeather = hide(leatherMat({ vertexColors: true, color: new THREE.Color(1.74, 1.35, 0.62), specularColor: new THREE.Color(1.0, 0.88, 0.72), normalScale: new THREE.Vector2(0.48, 0.48) }));           // upholstery blocks carry baked under-cushion shade
  M.leatherPipe = leatherMat({ color: new THREE.Color(1.1, 0.86, 0.5), clearcoat: 0.25 });
  hide(M.leather); hide(M.leatherDark);

  // ---------------- reclaimed wood (coffee table)
  M.reclaimed = std({
    map: tex('wood_planks_dirt_diff_1k.jpg', { srgb: true, tile: 1.3 }),
    normalMap: tex('wood_planks_dirt_nor_gl_1k.jpg', { tile: 1.3 }),
    roughnessMap: tex('wood_planks_dirt_rough_1k.jpg', { tile: 1.3 }),
    color: col(0.92, 0.86, 0.8), roughness: 0.88,
  });
  M.tableWood = std({ map: tex('wood_table_worn_diff_1k.jpg', { srgb: true, tile: 1.2 }), color: col(0.9, 0.76, 0.62), roughness: 0.55 });

  // ---------------- metals
  const brushed = brushedTex();
  M.steel = std({ color: 0xcfd1d2, metalness: 1.0, roughness: 0.34, roughnessMap: brushed, envMapIntensity: 1.1 });
  M.steelBrushed = std({ color: 0xc4c6c7, metalness: 1.0, roughness: 0.4, roughnessMap: brushed, envMapIntensity: 1.05 });
  M.brass = std({ color: 0xc09a5b, metalness: 1.0, roughness: 0.32 });
  M.iron = std({ color: 0x1c1b1a, metalness: 0.6, roughness: 0.5 });
  M.black = std({ color: 0x121212, roughness: 0.45 });
  M.ovenGlass = std({ color: 0x0b0b0c, metalness: 0.2, roughness: 0.08 });
  M.redKnob = std({ color: 0xb01a14, roughness: 0.35 });
  // clear glass without a transmission pass: additive specular-only layer (reflections add light, nothing darkens)
  M.glass = std({ color: 0x000000, roughness: 0.04, metalness: 0, transparent: true, blending: THREE.AdditiveBlending, envMapIntensity: 2.2, depthWrite: false, side: THREE.DoubleSide });
  M.bulb = std({ color: 0xfff1d6, emissive: 0xffc77a, emissiveIntensity: 16, roughness: 0.3 });
  M.canLens = std({ color: 0xfff6e8, emissive: 0xfff0dc, emissiveIntensity: 3.0, roughness: 0.5 });
  M.canTrim = std({ color: 0xf2f0ea, roughness: 0.4 });
  M.ledStrip = std({ color: 0xfff3dd, emissive: 0xffd9a0, emissiveIntensity: 4, roughness: 0.5 });
  M.sinkDark = std({ color: 0x2a2a2a, metalness: 0.6, roughness: 0.35 });

  // ---------------- fabrics
  const linenN = tex('rough_linen_nor_gl_1k.jpg', { tile: 0.25 });
  M.linen = std({ color: 0xd8ccb6, roughness: 0.95, normalMap: linenN, normalScale: new THREE.Vector2(0.6, 0.6), side: THREE.DoubleSide });
  M.curtain = std({ color: 0xd6c7ad, roughness: 0.95, normalMap: linenN, normalScale: new THREE.Vector2(0.5, 0.5), side: THREE.DoubleSide, emissive: 0x5a4a35, emissiveIntensity: 0.25 });
  M.chairFabric = std({ color: 0xbfb199, roughness: 0.92, normalMap: linenN, normalScale: new THREE.Vector2(0.9, 0.9) });
  M.cream = std({ color: 0xc4b498, roughness: 0.95, normalMap: linenN, normalScale: new THREE.Vector2(0.5, 0.5) });
  const knitN = tex('knitted_fleece_nor_gl_1k.jpg', { tile: 0.22 });
  const knitMap = knitTex(); knitMap.repeat.set(1 / 0.34, 1 / 0.34);
  // the throw: chunkier stitches (~1.3 cm) with a deeper bump so the knit reads at the camera's distance
  const knitBig = ribKnitTex(); knitBig.repeat.set(1 / 0.3, 1 / 0.3);
  M.knit = std({ map: knitBig, bumpMap: knitBig, bumpScale: 3.0, color: 0xc0b8a7, roughness: 1.0, side: THREE.DoubleSide });
  M.knitFringe = std({ color: 0xc9c1b0, roughness: 1.0, side: THREE.DoubleSide });
  const kb = knitMap.clone(); kb.repeat.set(2.4, 1.2); kb.needsUpdate = true;   // chunky stitches around the ball
  M.knitBall = std({ map: kb, bumpMap: kb, bumpScale: 4.0, color: 0xddd6c9, roughness: 1.0 });
  M.pillowWhite = std({ color: 0xcdc4b3, roughness: 0.97, normalMap: linenN, normalScale: new THREE.Vector2(1.2, 1.2) });
  M.pillowGray = std({ color: 0x55565a, roughness: 0.97, normalMap: linenN, normalScale: new THREE.Vector2(1.2, 1.2) });
  M.pillowLeather = M.leather;
  M.pillowStripe = std({ map: stripeTex(), roughness: 0.97, normalMap: linenN, normalScale: new THREE.Vector2(1.2, 1.2) });
  M.throwStripe = std({ map: throwTex(), roughness: 0.98, bumpMap: knitMap, bumpScale: 1.5, side: THREE.DoubleSide });

  // ---------------- rug: large distressed gray/beige vintage rug
  M.rug = std({ map: rugTex(7), color: col(0.32, 0.32, 0.34), roughness: 1.0, normalMap: tex('poly_wool_herringbone_nor_gl_1k.jpg', { tile: 0.3 }), normalScale: new THREE.Vector2(0.4, 0.4) });

  // ---------------- fireplace plaster / stone
  M.plasterStone = std({
    map: tex('plaster_stone_wall_01_diff_1k.jpg', { srgb: true, tile: 1.6 }),
    normalMap: tex('plaster_stone_wall_01_nor_gl_1k.jpg', { tile: 1.6 }),
    roughnessMap: tex('plaster_stone_wall_01_rough_1k.jpg', { tile: 1.6 }),
    color: col(1.05, 1.02, 0.97), roughness: 0.95,
  });
  M.firebox = std({ color: 0x1a1816, roughness: 0.9 });
  M.hearth = std({ map: M.granite.map, color: col(0.45, 0.45, 0.45), roughness: 0.6 });

  // ---------------- art
  M.frameWood = std({ color: 0x8a6a48, roughness: 0.6 });
  M.frameDark = std({ color: 0x3a3029, roughness: 0.5 });
  M.ceramic = std({ color: 0xeee9df, roughness: 0.35 });
  M.ceramicBeige = std({ color: 0xc9b9a0, roughness: 0.8 });
  M.olive = std({ color: 0x6d7a52, roughness: 0.8, side: THREE.DoubleSide });
  M.herb = std({ color: 0x4f7a3a, roughness: 0.8, side: THREE.DoubleSide });
  M.paper = std({ color: 0xece7dc, roughness: 0.9 });
  M.pumpkin = std({ color: 0xe0a440, roughness: 0.55 });
  M.candle = std({ color: 0xf4efe4, roughness: 0.6 });
  M.eucalyptus = std({ color: 0x7d917f, roughness: 0.75, side: THREE.DoubleSide });
  M.pillowPattern = std({ map: patternTex(), roughness: 0.95, normalMap: linenN });
  M.rugDining = std({ map: rugTex(31, ['#9a958e', '#b7b0a6', '#7f7b77', '#c9c1b5', '#8c8f93']), roughness: 1.0 });
  M.rugFoyer = std({ map: rugTex(41, ['#8e8378', '#b19f8a', '#6f665e', '#c4b6a3', '#7c6c5e']), roughness: 1.0 });
  M.jarGlass = new THREE.MeshPhysicalMaterial({ color: 0xf2efe6, roughness: 0.15, transparent: true, opacity: 0.55, envMapIntensity: 1.2 });
  M.wicker = std({ color: 0x9a7a52, roughness: 0.95, normalMap: tex('poly_wool_herringbone_nor_gl_1k.jpg', { tile: 0.12 }), normalScale: new THREE.Vector2(2, 2) });
  M.mirror = std({ color: 0xd9dde0, metalness: 1.0, roughness: 0.04 });
  M.shade = std({ color: 0xf1ebdf, roughness: 0.9, emissive: 0xffd9a8, emissiveIntensity: 0.25, side: THREE.DoubleSide });
  M.legWood = std({ color: 0x2e1f16, roughness: 0.5 });
  M.stem = std({ color: 0x5d5a40, roughness: 0.8 });
  M.bookA = std({ color: 0x2f3438, roughness: 0.7 });
  M.bookB = std({ color: 0xe6e1d6, roughness: 0.8 });
  M.bookC = std({ color: 0x8a8174, roughness: 0.8 });
  M.ceramicSide = std({ color: 0xeee9df, roughness: 0.35, side: THREE.DoubleSide });
  return M;
}

// --------------------------------------------------------------- canvas textures
// vertical warm glow for the backsplash (V in metres / 2: peak just under the uppers at y=1.39, fading down)
function glowTex() {
  const t = canvasTex(4, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); // canvas top = v 1 (y = 2 m), bottom = v 0
    const vy = (y) => 1 - y / 2;
    gr.addColorStop(vy(1.52), '#000'); gr.addColorStop(vy(1.40), '#fff'); gr.addColorStop(vy(1.30), '#8a8a8a');
    gr.addColorStop(vy(1.15), '#2a2a2a'); gr.addColorStop(vy(0.96), '#000');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  t.repeat.set(1, 0.5); t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
function rugTex(seed = 7, palette) {
  return canvasTex(1024, 1024, (g, w, h) => {
    const R = rng(seed);
    g.fillStyle = palette ? palette[0] : '#9b9892'; g.fillRect(0, 0, w, h);
    // cloudy vintage wash: large soft blobs (blue-grey, cream, brown-grey), then smaller ones
    const pal = palette || ['#c4c2bc', '#6f7d8c', '#d8d3c8', '#5f6064', '#a39f98', '#8a9aab', '#dcd8cc', '#4a4c50', '#8e8c88', '#b3aa9c'];
    for (const [n, r0, r1, a] of [[260, 70, 190, 'aa'], [900, 20, 90, 'aa'], [900, 6, 28, '88']]) {
      for (let i = 0; i < n; i++) {
        const x = R() * w, y = R() * h, r = r0 + R() * (r1 - r0);
        const c = pal[(R() * pal.length) | 0];
        const gr = g.createRadialGradient(x, y, 0, x, y, r);
        gr.addColorStop(0, c + a); gr.addColorStop(1, c + '00');
        g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, r * (1 + R() * 1.6), r, R() * 3, 0, 7); g.fill();
      }
    }
    if (!palette) { // faded grey-blue lattice medallions (Oushak-style), then a worn border
      g.filter = 'blur(3px)'; g.strokeStyle = 'rgba(70,84,100,0.16)'; g.lineWidth = 8;
      for (let cy = 0; cy < 4; cy++) for (let cx = 0; cx < 4; cx++) {
        const x = 128 + cx * 256, y = 128 + cy * 256 + (cx % 2) * 0;
        for (const k of [118, 86, 54]) { g.beginPath(); g.moveTo(x, y - k); g.lineTo(x + k, y); g.lineTo(x, y + k); g.lineTo(x - k, y); g.closePath(); g.stroke(); }
        g.fillStyle = 'rgba(60,72,88,0.14)'; g.beginPath(); g.arc(x, y, 18, 0, 7); g.fill();
      }
      g.strokeStyle = 'rgba(60,66,76,0.22)'; g.lineWidth = 22; g.strokeRect(20, 20, w - 40, h - 40);
      g.lineWidth = 6; g.strokeRect(62, 62, w - 124, h - 124); g.filter = 'none';
    }
    // faint worn border bands
    g.strokeStyle = 'rgba(95,92,90,0.12)'; g.lineWidth = 8; g.strokeRect(40, 40, w - 80, h - 80);
    // distressing: pale abrasion streaks along the pile
    for (let i = 0; i < 1100; i++) {
      const x = R() * w, y = R() * h;
      g.strokeStyle = `rgba(${215 + R() * 30},${210 + R() * 30},${200 + R() * 30},${0.06 + R() * 0.14})`;
      g.lineWidth = 1 + R() * 2.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (R() - 0.5) * 60, y + (R() - 0.5) * 10); g.stroke();
    }
    // fine fibre noise
    const id = g.getImageData(0, 0, w, h), d = id.data;
    for (let i = 0; i < d.length; i += 4) { const n = (R() - 0.5) * 22; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
    g.putImageData(id, 0, 0);
  });
}
// smooth cognac hide: gentle mottling + faint fine grain, no crackle
function leatherTex() {
  return canvasTex(512, 512, (g, w, h) => {
    const R = rng(77);
    g.fillStyle = '#683d1f'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 700; i++) {
      const x = R() * w, y = R() * h, r = 4 + R() * 14;
      const c = R() < 0.5 ? '#a9693a' : '#5f3820';
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, c + '1c'); gr.addColorStop(1, c + '00');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    }
    // a few soft, short hide creases
    g.lineCap = 'round';
    for (let i = 0; i < 110; i++) {
      const x = R() * w, y = R() * h, a = R() * 6.28, l = 20 + R() * 60;
      g.strokeStyle = `rgba(60,34,18,${0.05 + R() * 0.07})`; g.lineWidth = 1 + R() * 1.6;
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + (R() - 0.5) * 14, y + Math.sin(a) * l * 0.5 + (R() - 0.5) * 14, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
    }
    const id = g.getImageData(0, 0, w, h), d = id.data;
    for (let i = 0; i < d.length; i += 4) { const n = (R() - 0.5) * 9; d[i] += n; d[i + 1] += n * 0.8; d[i + 2] += n * 0.6; }
    g.putImageData(id, 0, 0);
  });
}
// throw knit (round 7): ribs of chevron stitches running along u with dark grooves between the ribs, slight
// per-stitch tone jitter; ~1.7 cm ribs at a 0.42 m tile
function ribKnitTex() {
  return canvasTex(512, 512, (g, w, h) => {
    const R = rng(17);
    g.fillStyle = '#a49b8a'; g.fillRect(0, 0, w, h);
    const rh = 512 / 24, sw = 512 / 32;
    for (let r = 0; r < 24; r++) {
      const y = r * rh;
      for (let c = 0; c < 33; c++) {
        const x = c * sw + (r % 2 ? sw / 2 : 0), j = Math.round((R() - 0.5) * 18);
        for (const s of [-1, 1]) {
          const cx = x, cy = y + rh / 2 + s * rh * 0.22;
          const gr = g.createRadialGradient(cx, cy - 1, 0.5, cx, cy, sw * 0.62);
          gr.addColorStop(0, `rgb(${246 + j},${240 + j},${226 + j})`); gr.addColorStop(0.55, `rgb(${222 + j},${214 + j},${198 + j})`); gr.addColorStop(1, 'rgba(150,141,124,0.0)');
          g.fillStyle = gr; g.beginPath(); g.ellipse(cx, cy, sw * 0.62, rh * 0.26, s * 0.55, 0, 7); g.fill();
        }
      }
    }
  });
}
// chunky knit: rows of rounded stitches (albedo + bump)
function knitTex() {
  return canvasTex(512, 512, (g, w, h) => {
    const R = rng(5);
    g.fillStyle = '#b3a892'; g.fillRect(0, 0, w, h);
    const sw = 12, sh = 10;
    for (let r = 0; r * sh < h + sh; r++) {
      for (let c = -1; c * sw < w + sw; c++) {
        const x = c * sw + (r % 2 ? sw / 2 : 0), y = r * sh;
        const j = (R() - 0.5) * 0.12;
        const gr = g.createRadialGradient(x + sw / 2, y + sh * 0.45, 1, x + sw / 2, y + sh / 2, sw * 0.62);
        gr.addColorStop(0, `rgba(255,250,238,${0.95 + j})`); gr.addColorStop(0.6, 'rgba(228,220,203,0.95)'); gr.addColorStop(1, 'rgba(176,166,148,0.9)');
        g.fillStyle = gr; g.beginPath(); g.ellipse(x + sw / 2, y + sh / 2, sw * 0.5, sh * 0.62, 0, 0, 7); g.fill();
      }
    }
  });
}
// vertical brushing streaks for stainless (roughness map: green channel)
function brushedTex() {
  const t = canvasTex(256, 256, (g, w, h) => {
    const R = rng(13);
    g.fillStyle = '#b4b4b4'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) {
      const x = R() * w, v = 130 + R() * 125, l = 40 + R() * 200, y = R() * h;
      g.strokeStyle = `rgba(${v},${v},${v},${0.25 + R() * 0.4})`; g.lineWidth = 0.6 + R() * 1.4;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + (R() - 0.5) * 2, y + l); g.stroke();
    }
  }, { srgb: false });
  t.repeat.set(1 / 0.5, 1 / 0.5);
  return t;
}
// equirect "stainless studio": streaky bright/dark vertical panels (bright ceiling, dark cabinet bands, warm floor)
export function steelEnvTex() {
  const t = canvasTex(1024, 512, (g, w, h) => {
    const R = rng(3);
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#e4e0d8'); gr.addColorStop(0.28, '#bdb6aa'); gr.addColorStop(0.45, '#8a7b68');
    gr.addColorStop(0.55, '#3d2c1f'); gr.addColorStop(0.7, '#6a5240'); gr.addColorStop(1, '#8c7258');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    // vertical bright windows / dark cabinets around the horizon
    for (let i = 0; i < 26; i++) {
      const x = R() * w, bw = 14 + R() * 70, bright = R() < 0.5;
      g.fillStyle = bright ? `rgba(255,252,244,${0.5 + R() * 0.4})` : `rgba(30,18,10,${0.35 + R() * 0.4})`;
      g.fillRect(x, h * (0.18 + R() * 0.1), bw, h * (0.3 + R() * 0.25));
    }
    // a couple of hot lamp glows
    for (let i = 0; i < 5; i++) {
      const x = R() * w, y = h * (0.3 + R() * 0.15), r = 30 + R() * 40;
      const rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, 'rgba(255,236,200,1)'); rg.addColorStop(1, 'rgba(255,236,200,0)');
      g.fillStyle = rg; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
  });
  t.mapping = THREE.EquirectangularReflectionMapping;
  return t;
}
function patternTex() {
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#e4ddd0'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#7d8a8f'; g.lineWidth = 5;
    for (let y = 16; y < h; y += 42) for (let x = 16; x < w; x += 42) { g.beginPath(); g.arc(x, y, 12, 0, 6.3); g.stroke(); }
  });
}
function stripeTex() {
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#e6dfd2'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9; i++) {
      g.fillStyle = i % 3 === 1 ? '#5a5048' : '#8c8178';
      g.fillRect(i * 28 + 10, 0, i % 3 === 1 ? 6 : 3, h);
    }
  }, { repeat: [2.4, 2.4] });
}
function throwTex() {
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#e3ddd1'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 64) {
      g.fillStyle = '#6f6c69'; g.fillRect(0, y + 20, w, 10);
      g.fillStyle = '#9d9892'; g.fillRect(0, y + 36, w, 4);
    }
  });
}

// faded vintage Oushak-style rug: worn field, lattice medallions, banded border, abrasion
function vintageRugTex() {
  return canvasTex(1024, 1400, (g, w, h) => {
    const R = rng(77);
    g.fillStyle = '#a9a8a2'; g.fillRect(0, 0, w, h);
    // washed field
    for (let i = 0; i < 500; i++) { const x = R() * w, y = R() * h, r = 40 + R() * 160; const c = ['#b9b7b0', '#8e98a2', '#c9c2b3', '#9a948a', '#7e8892'][(R() * 5) | 0];
      const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, c + '88'); gr.addColorStop(1, c + '00'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
    // lattice of diamonds
    const B = 130; g.strokeStyle = 'rgba(70,82,98,0.45)'; g.lineWidth = 5;
    const cxm = w / 2, cym = h / 2;
    for (let j = -4; j <= 4; j++) for (let i = -3; i <= 3; i++) {
      const x = cxm + i * 190 + (j % 2 ? 95 : 0), y = cym + j * 190; if (x < B + 40 || x > w - B - 40 || y < B + 40 || y > h - B - 40) continue;
      g.beginPath(); g.moveTo(x, y - 80); g.lineTo(x + 60, y); g.lineTo(x, y + 80); g.lineTo(x - 60, y); g.closePath(); g.stroke();
      g.fillStyle = 'rgba(150,100,80,0.35)'; g.beginPath(); g.arc(x, y, 14, 0, 7); g.fill();
      g.fillStyle = 'rgba(60,78,100,0.28)'; g.beginPath(); g.moveTo(x, y - 34); g.lineTo(x + 24, y); g.lineTo(x, y + 34); g.lineTo(x - 24, y); g.fill();
    }
    // border bands
    g.fillStyle = 'rgba(78,92,110,0.55)'; g.fillRect(40, 40, w - 80, 22); g.fillRect(40, h - 62, w - 80, 22); g.fillRect(40, 40, 22, h - 80); g.fillRect(w - 62, 40, 22, h - 80);
    g.fillStyle = 'rgba(205,198,182,0.7)'; g.fillRect(70, 70, w - 140, 70); g.fillRect(70, h - 140, w - 140, 70); g.fillRect(70, 70, 70, h - 140); g.fillRect(w - 140, 70, 70, h - 140);
    g.strokeStyle = 'rgba(70,82,98,0.5)'; g.lineWidth = 4;
    for (let t = 90; t < w - 100; t += 46) { g.beginPath(); g.moveTo(t, 80); g.lineTo(t + 23, 130); g.lineTo(t + 46, 80); g.stroke(); g.beginPath(); g.moveTo(t, h - 80); g.lineTo(t + 23, h - 130); g.lineTo(t + 46, h - 80); g.stroke(); }
    for (let t = 90; t < h - 100; t += 46) { g.beginPath(); g.moveTo(80, t); g.lineTo(130, t + 23); g.lineTo(80, t + 46); g.stroke(); g.beginPath(); g.moveTo(w - 80, t); g.lineTo(w - 130, t + 23); g.lineTo(w - 80, t + 46); g.stroke(); }
    g.strokeStyle = 'rgba(60,70,84,0.7)'; g.lineWidth = 10; g.strokeRect(8, 8, w - 16, h - 16);
    // abrasion + fibre
    for (let i = 0; i < 1400; i++) { const x = R() * w, y = R() * h; g.strokeStyle = `rgba(225,220,210,${0.05 + R() * 0.12})`; g.lineWidth = 1 + R() * 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (R() - 0.5) * 50, y + (R() - 0.5) * 12); g.stroke(); }
    const id = g.getImageData(0, 0, w, h), d = id.data;
    for (let i = 0; i < d.length; i += 4) { const n = (R() - 0.5) * 20; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
    g.putImageData(id, 0, 0);
  });
}
