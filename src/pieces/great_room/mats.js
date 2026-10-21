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
  M.wall = std({ color: 0xeae1d0, roughness: 0.93 });
  M.ceiling = std({ color: 0xede6d8, roughness: 0.95 });
  M.trim = std({ color: 0xf2efe7, roughness: 0.5 });
  M.reveal = M.wall;
  M.doorInt = std({ color: 0xf0ede5, roughness: 0.45 });

  // ---------------- floor: medium-brown wood plank
  M.floor = std({
    map: tex('wood_floor_diff_2k.jpg', { srgb: true, tile: 2.0 }),
    normalMap: tex('wood_floor_nor_gl_1k.jpg', { tile: 2.0 }),
    roughnessMap: tex('wood_floor_rough_1k.jpg', { tile: 2.0 }),
    color: col(0.78, 0.68, 0.6), roughness: 0.75, normalScale: new THREE.Vector2(0.6, 0.6),
  });

  // ---------------- rough-sawn beam wood
  M.beam = std({
    map: tex('rough_wood_diff_1k.jpg', { srgb: true, tile: 1.2 }),
    normalMap: tex('rough_wood_nor_gl_1k.jpg', { tile: 1.2 }),
    roughnessMap: tex('rough_wood_rough_1k.jpg', { tile: 1.2 }),
    color: col(0.78, 0.55, 0.40), roughness: 0.9, normalScale: new THREE.Vector2(1.2, 1.2),
  });

  // ---------------- cabinet wood (warm medium-brown shaker, cherry/hickory look)
  M.cab = std({
    map: tex('wood_table_worn_diff_1k.jpg', { srgb: true, tile: 1.0 }),
    color: col(1.55, 1.12, 0.82), roughness: 0.5,
  });
  M.cabDark = std({ map: M.cab.map, color: col(1.1, 0.8, 0.6), roughness: 0.55 });

  // ---------------- dark leathered granite
  M.granite = std({
    map: tex('Marble017_Color.jpg', { srgb: true, tile: 1.4 }),
    normalMap: tex('Marble017_NormalGL.jpg', { tile: 0.5 }),
    color: col(0.55, 0.55, 0.55), roughness: 0.42, metalness: 0.0, normalScale: new THREE.Vector2(0.5, 0.5),
  });

  // ---------------- white subway tile (3x12 in running bond): Tiles009 is 2 tiles x 4 rows per texture
  M.subway = std({
    map: tex('Tiles009_Color.jpg', { srgb: true, tile: 0.61, tileV: 0.305 }),
    normalMap: tex('Tiles009_NormalGL.jpg', { tile: 0.61, tileV: 0.305 }),
    roughnessMap: tex('Tiles009_Roughness.jpg', { tile: 0.61, tileV: 0.305 }),
    color: col(1.0, 0.98, 0.95), roughness: 0.25, normalScale: new THREE.Vector2(0.8, 0.8),
  });

  // ---------------- cognac leather
  M.leather = std({
    map: tex('fabric_leather_02_diff_1k.jpg', { srgb: true, tile: 0.9 }),
    normalMap: tex('fabric_leather_02_nor_gl_1k.jpg', { tile: 0.9 }),
    roughnessMap: tex('fabric_leather_02_rough_1k.jpg', { tile: 0.9 }),
    color: col(0.92, 0.72, 0.6), roughness: 0.6, normalScale: new THREE.Vector2(0.7, 0.7),
  });
  M.leatherSide = std({ map: M.leather.map, normalMap: M.leather.normalMap, roughnessMap: M.leather.roughnessMap, color: col(0.92, 0.72, 0.6), roughness: 0.6, side: THREE.DoubleSide });
  M.leatherDark = std({ map: M.leather.map, normalMap: M.leather.normalMap, roughnessMap: M.leather.roughnessMap, color: col(0.6, 0.44, 0.34), roughness: 0.62 });

  // ---------------- reclaimed wood (coffee table)
  M.reclaimed = std({
    map: tex('wood_planks_dirt_diff_1k.jpg', { srgb: true, tile: 1.3 }),
    normalMap: tex('wood_planks_dirt_nor_gl_1k.jpg', { tile: 1.3 }),
    roughnessMap: tex('wood_planks_dirt_rough_1k.jpg', { tile: 1.3 }),
    color: col(1.05, 0.95, 0.85), roughness: 0.85,
  });
  M.tableWood = std({ map: tex('wood_table_worn_diff_1k.jpg', { srgb: true, tile: 1.2 }), color: col(1.2, 0.95, 0.78), roughness: 0.55 });

  // ---------------- metals
  M.steel = std({ color: 0xc9c9c7, metalness: 1.0, roughness: 0.28 });
  M.steelBrushed = std({ color: 0xbdbdbb, metalness: 1.0, roughness: 0.38 });
  M.brass = std({ color: 0xc09a5b, metalness: 1.0, roughness: 0.32 });
  M.iron = std({ color: 0x1c1b1a, metalness: 0.6, roughness: 0.5 });
  M.black = std({ color: 0x121212, roughness: 0.45 });
  M.ovenGlass = std({ color: 0x0b0b0c, metalness: 0.2, roughness: 0.08 });
  M.redKnob = std({ color: 0xb01a14, roughness: 0.35 });
  M.glass = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.02, metalness: 0, transparent: true, opacity: 0.18, envMapIntensity: 1.6, depthWrite: false, side: THREE.DoubleSide, clearcoat: 1 });
  M.bulb = std({ color: 0xfff1d6, emissive: 0xffc77a, emissiveIntensity: 6, roughness: 0.3 });
  M.canLens = std({ color: 0xfff6e8, emissive: 0xfff0dc, emissiveIntensity: 3.0, roughness: 0.5 });
  M.canTrim = std({ color: 0xf2f0ea, roughness: 0.4 });
  M.ledStrip = std({ color: 0xfff3dd, emissive: 0xffd9a0, emissiveIntensity: 4, roughness: 0.5 });
  M.sinkDark = std({ color: 0x2a2a2a, metalness: 0.6, roughness: 0.35 });

  // ---------------- fabrics
  const linenN = tex('rough_linen_nor_gl_1k.jpg', { tile: 0.25 });
  M.linen = std({ color: 0xd8ccb6, roughness: 0.95, normalMap: linenN, normalScale: new THREE.Vector2(0.6, 0.6), side: THREE.DoubleSide });
  M.curtain = std({ color: 0xd6c7ad, roughness: 0.95, normalMap: linenN, normalScale: new THREE.Vector2(0.5, 0.5), side: THREE.DoubleSide, emissive: 0x5a4a35, emissiveIntensity: 0.25 });
  M.cream = std({ color: 0xdcd3c3, roughness: 0.95, normalMap: linenN, normalScale: new THREE.Vector2(0.5, 0.5) });
  const knitN = tex('knitted_fleece_nor_gl_1k.jpg', { tile: 0.35 });
  M.knit = std({ color: 0xe6e0d3, roughness: 0.98, normalMap: knitN, normalScale: new THREE.Vector2(1.2, 1.2), side: THREE.DoubleSide });
  M.knitBall = std({ color: 0xefebe3, roughness: 0.98, normalMap: tex('knitted_fleece_nor_gl_1k.jpg', { tile: 0.12 }), normalScale: new THREE.Vector2(1.6, 1.6) });
  M.pillowWhite = std({ color: 0xe9e4d9, roughness: 0.95, normalMap: linenN });
  M.pillowGray = std({ color: 0x55565a, roughness: 0.95, normalMap: linenN });
  M.pillowLeather = M.leather;
  M.pillowStripe = std({ map: stripeTex(), roughness: 0.95, normalMap: linenN });
  M.throwStripe = std({ map: throwTex(), roughness: 0.95, normalMap: knitN, side: THREE.DoubleSide });

  // ---------------- rug: large distressed gray/beige vintage rug
  M.rug = std({ map: rugTex(), roughness: 1.0, normalMap: tex('poly_wool_herringbone_nor_gl_1k.jpg', { tile: 0.3 }), normalScale: new THREE.Vector2(0.6, 0.6) });

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
  return M;
}

// --------------------------------------------------------------- canvas textures
function rugTex() {
  return canvasTex(1024, 1024, (g, w, h) => {
    const R = rng(7);
    g.fillStyle = '#a79c90'; g.fillRect(0, 0, w, h);
    // mottled vintage wash: many soft blobs of grey, beige and blue-grey
    const pal = ['#b9b0a6', '#8f877e', '#c6bdb1', '#9a948f', '#7f7b78', '#b3a594', '#a2a5a6', '#cfc6b9'];
    for (let i = 0; i < 1600; i++) {
      const x = R() * w, y = R() * h, r = 6 + R() * 60;
      const c = pal[(R() * pal.length) | 0];
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, c + 'aa'); gr.addColorStop(1, c + '00');
      g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, r * (1 + R() * 2), r, R() * 3, 0, 7); g.fill();
    }
    // faint worn medallion border lines
    g.strokeStyle = 'rgba(110,104,98,0.35)'; g.lineWidth = 6;
    g.strokeRect(40, 40, w - 80, h - 80);
    g.strokeStyle = 'rgba(200,192,180,0.35)'; g.lineWidth = 3;
    g.strokeRect(62, 62, w - 124, h - 124);
    // distressing: pale abrasion streaks
    for (let i = 0; i < 900; i++) {
      const x = R() * w, y = R() * h;
      g.strokeStyle = `rgba(${210 + R() * 30},${205 + R() * 30},${195 + R() * 30},${0.08 + R() * 0.15})`;
      g.lineWidth = 1 + R() * 2.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (R() - 0.5) * 40, y + (R() - 0.5) * 8); g.stroke();
    }
    // fine fibre noise
    const id = g.getImageData(0, 0, w, h), d = id.data;
    for (let i = 0; i < d.length; i += 4) { const n = (R() - 0.5) * 26; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
    g.putImageData(id, 0, 0);
  });
}
function stripeTex() {
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#e8e2d6'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9; i++) {
      g.fillStyle = i % 3 === 1 ? '#4c4b4a' : '#8b8580';
      g.fillRect(i * 28 + 10, 0, i % 3 === 1 ? 7 : 3, h);
    }
  });
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
