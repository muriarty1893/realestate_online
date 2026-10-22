// Exterior materials: CC0 PBR textures (Poly Haven / ambientCG) + a few procedural canvas maps.
import * as THREE from 'three';
import { ASSET, canvasTex, normalFromHeight, rng } from './util.js';

const TEX = ASSET + 'tex/';

function pbr(ctx, dir, { repeat = 1, color = 0xffffff, roughness = 1, normalScale = 1, diff = 'diffuse.jpg', nor = 'nor_gl.jpg', rough = 'rough.jpg', metalness = 0, name } = {}) {
  const m = new THREE.MeshStandardMaterial({ color, roughness, metalness });
  m.map = ctx.loadTex(TEX + dir + '/' + diff, { srgb: true, repeatM: repeat });
  if (nor) { m.normalMap = ctx.loadTex(TEX + dir + '/' + nor, { repeatM: repeat }); m.normalScale.set(normalScale, normalScale); }
  if (rough) m.roughnessMap = ctx.loadTex(TEX + dir + '/' + rough, { repeatM: repeat });
  m.name = name || dir;
  return m;
}

// warm interior glow seen through glass: gradient + soft curtain/lamp shapes
function glowTexture(seed, kind = 'room') {
  const R = rng(seed);
  return canvasTex(128, 256, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, 0, h);
    if (kind === 'room') { grd.addColorStop(0, '#d8780a'); grd.addColorStop(0.35, '#ffb020'); grd.addColorStop(0.75, '#f9a518'); grd.addColorStop(1, '#c86a08'); }
    else { grd.addColorStop(0, '#e8961e'); grd.addColorStop(0.5, '#ffc84a'); grd.addColorStop(1, '#d9862a'); }
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    // curtain folds at both sides
    for (const side of [0, 1]) {
      const cw = w * (0.12 + R() * 0.12);
      for (let i = 0; i < 6; i++) {
        const x = side ? w - cw + (i / 6) * cw : (i / 6) * cw;
        g.fillStyle = `rgba(${160 + R() * 40},${80 + R() * 30},${10 + R() * 20},${0.12 + R() * 0.14})`;
        g.fillRect(x, 0, cw / 9, h);
      }
    }
    // a bright lamp blob and a darker piece of furniture
    const lx = w * (0.3 + R() * 0.4), ly = h * (0.3 + R() * 0.25);
    const rg = g.createRadialGradient(lx, ly, 2, lx, ly, w * 0.55);
    rg.addColorStop(0, 'rgba(255,200,90,0.55)'); rg.addColorStop(1, 'rgba(255,190,80,0)');
    g.fillStyle = rg; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(120,70,25,0.16)';
    g.fillRect(w * R() * 0.5, h * (0.72 + R() * 0.1), w * (0.3 + R() * 0.4), h * 0.3);
  });
}

function battenBoardTextures() {
  // subtle painted-wood board texture (vertical grain) for board-and-batten
  const R = rng(7);
  const col = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(0,0,0,${R() * 0.025})`; g.fillRect(R() * w, 0, 1 + R() * 2, h); }
  }, { srgb: true });
  return col;
}

// running-bond clay pavers (tan / peach / grey), 2 m tile, with a soldier-course free field
function paverTextures() {
  const R = rng(11);
  const S = 1024, M = 2.0; // canvas px, metres per tile
  const px = S / M;
  const hc = document.createElement('canvas'); hc.width = hc.height = S;
  const hg = hc.getContext('2d');
  const color = canvasTex(S, S, (g) => {
    g.fillStyle = '#7d6a5a'; g.fillRect(0, 0, S, S);
    hg.fillStyle = '#000'; hg.fillRect(0, 0, S, S);
    const rows = 13, rowH = S / rows;
    const cols = ['#c9a487', '#d4b294', '#bf957a', '#c7a58f', '#b8a08c', '#d8b99c', '#c49577', '#ad8f7c', '#cfae96', '#b99a86'];
    for (let r = 0; r < rows; r++) {
      let x = -R() * 0.3 * px;
      while (x < S) {
        const L = (0.22 + R() * 0.25) * px;
        const c = cols[Math.floor(R() * cols.length)];
        g.fillStyle = c;
        const gap = 3;
        g.fillRect(x + gap / 2, r * rowH + gap / 2, L - gap, rowH - gap);
        // mottling
        for (let k = 0; k < 6; k++) { g.fillStyle = `rgba(${R() > 0.5 ? 255 : 60},${R() > 0.5 ? 220 : 50},${R() > 0.5 ? 190 : 40},${R() * 0.08})`; g.fillRect(x + R() * L, r * rowH + R() * rowH, 6 + R() * 18, 3 + R() * 8); }
        hg.fillStyle = `rgb(${200 + R() * 55},0,0)`; hg.fillRect(x + gap, r * rowH + gap, L - 2 * gap, rowH - 2 * gap);
        x += L;
        // wrap pavers that cross the right edge
        if (x > S) { g.fillStyle = c; g.fillRect(x - L - S + gap / 2, r * rowH + gap / 2, L - gap, rowH - gap); }
      }
    }
  });
  hg.filter = 'blur(1.5px)'; hg.drawImage(hc, 0, 0);
  const normal = normalFromHeight(hc, 3);
  color.repeat.set(1 / M, 1 / M); normal.repeat.set(1 / M, 1 / M);
  return { color, normal };
}

// standing-seam metal: vertical seam lines baked into a normal map (seams 0.45 m apart)
function seamTextures() {
  const S = 256;
  const hc = document.createElement('canvas'); hc.width = S; hc.height = 16;
  const g = hc.getContext('2d');
  const grd = g.createLinearGradient(0, 0, S, 0);
  grd.addColorStop(0, '#000'); grd.addColorStop(0.02, '#fff'); grd.addColorStop(0.04, '#000'); grd.addColorStop(1, '#000');
  g.fillStyle = grd; g.fillRect(0, 0, S, 16);
  const normal = normalFromHeight(hc, 6);
  return { normal };
}

export function makeMaterials(ctx) {
  const M = {};
  M.stucco = pbr(ctx, 'white_stucco', { repeat: 2.2, color: 0xf2dfd2, roughness: 1, normalScale: 0.8, name: 'ext.stucco' });
  M.porchWall = pbr(ctx, 'white_stucco', { repeat: 2.2, color: 0xeee4d2, roughness: 0.95, normalScale: 0.3, name: 'ext.porchwall' });
  const board = battenBoardTextures();
  M.board = new THREE.MeshStandardMaterial({ color: 0xe9e3d3, map: board, roughness: 0.82, name: 'ext.board' });
  M.batten = new THREE.MeshStandardMaterial({ color: 0xeae4d5, roughness: 0.8, name: 'ext.batten' });
  M.stone = pbr(ctx, 'castle_wall_slates', { repeat: 1.6, color: 0xc9bfb2, roughness: 1, normalScale: 1.2, name: 'ext.stone' });
  M.stoneCap = new THREE.MeshStandardMaterial({ color: 0x9d9184, roughness: 0.9, name: 'ext.stonecap' });
  M.shingle = pbr(ctx, 'roof_slates_02', { repeat: 3.0, color: 0xc4c6ca, roughness: 0.95, normalScale: 1.0, name: 'ext.shingle' });
  M.shingle.envMapIntensity = 0.35;
  M.ridgeCap = pbr(ctx, 'roof_slates_02', { repeat: 3.0, color: 0x6f7886, roughness: 0.95, name: 'ext.ridgecap' });
  M.bronze = new THREE.MeshStandardMaterial({ color: 0x3b3128, roughness: 0.55, metalness: 0.25, name: 'ext.bronze' });
  M.bronzeMatte = new THREE.MeshStandardMaterial({ color: 0x40362d, roughness: 0.75, metalness: 0.1, name: 'ext.bronze.matte' });
  M.soffit = new THREE.MeshStandardMaterial({ color: 0x4a4038, roughness: 0.8, name: 'ext.soffit' });
  const seam = seamTextures();
  M.metalRoof = new THREE.MeshStandardMaterial({ color: 0x4b4743, roughness: 0.38, metalness: 0.55, normalMap: seam.normal, name: 'ext.metalroof' });
  M.metalRoof.normalMap.repeat.set(1 / 0.45, 1);
  M.metalRoof.normalScale.set(1.2, 1.2);
  M.white = new THREE.MeshStandardMaterial({ color: 0xf0ece2, roughness: 0.6, name: 'ext.white' });
  M.porchCeiling = new THREE.MeshStandardMaterial({ color: 0xe9dcc4, roughness: 0.7, name: 'ext.porchceiling' });
  M.doorWood = pbr(ctx, 'rosewood_veneer1', { repeat: 1.2, color: 0xb06a3c, roughness: 0.5, nor: null, name: 'ext.doorwood' });
  M.doorWood.roughness = 0.45;
  const pav = paverTextures();
  M.pavers = new THREE.MeshStandardMaterial({ map: pav.color, normalMap: pav.normal, roughness: 0.88, name: 'ext.pavers' });
  M.brickStep = new THREE.MeshStandardMaterial({ map: pav.color, normalMap: pav.normal, roughness: 0.85, color: 0xd8b8a0, name: 'ext.bricksteps' });
  M.grass = pbr(ctx, 'Grass005', { repeat: 1.6, color: 0xf4f070, roughness: 1, diff: 'Grass005_1K-JPG_Color.jpg', nor: 'Grass005_1K-JPG_NormalGL.jpg', rough: 'Grass005_1K-JPG_Roughness.jpg', name: 'ext.grass' });
  M.mulch = pbr(ctx, 'forest_leaves_02', { repeat: 1.5, color: 0x4a382c, roughness: 1, rough: null, name: 'ext.mulch' });
  M.bark = pbr(ctx, 'bark_brown_02', { repeat: 1.2, color: 0xf0e6dc, roughness: 1, normalScale: 1.5, name: 'ext.bark' });
  M.concrete = pbr(ctx, 'white_stucco', { repeat: 1.5, color: 0xb9b1a4, roughness: 0.95, normalScale: 0.5, name: 'ext.walk' });

  // glass: clear (global, seen from inside) and warm-lit (front windows, outside face only)
  M.glassClear = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.03, metalness: 0, transparent: true, opacity: 0.12, envMapIntensity: 1.2, depthWrite: false, side: THREE.DoubleSide, name: 'ext.glass' });
  M.glow = [];
  for (let i = 0; i < 6; i++) {
    const t = glowTexture(31 + i * 17, i === 5 ? 'foyer' : 'room');
    const m = new THREE.MeshStandardMaterial({ color: 0x1a120a, roughness: 0.08, metalness: 0.0, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 1.3, envMapIntensity: 0.6, name: 'ext.glow' + i });
    m.userData.glowBase = 1.3;
    M.glow.push(m);
  }
  return M;
}
