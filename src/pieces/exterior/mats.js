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
    if (kind === 'room') { grd.addColorStop(0, '#8a5a14'); grd.addColorStop(0.12, '#e0a228'); grd.addColorStop(0.4, '#ffcc3c'); grd.addColorStop(0.8, '#fcc030'); grd.addColorStop(1, '#c88618'); }
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
    rg.addColorStop(0, 'rgba(255,215,110,0.5)'); rg.addColorStop(1, 'rgba(255,190,80,0)');
    g.fillStyle = rg; g.fillRect(0, 0, w, h);
    // ceiling light fixture glow + ceiling line, window-top gradient
    const cg = g.createRadialGradient(w * 0.5, h * 0.04, 1, w * 0.5, h * 0.04, w * 0.5);
    cg.addColorStop(0, 'rgba(255,245,200,0.75)'); cg.addColorStop(1, 'rgba(255,230,150,0)');
    g.fillStyle = cg; g.fillRect(0, 0, w, h * 0.3);
    g.fillStyle = 'rgba(90,50,10,0.22)'; g.fillRect(0, h * 0.2, w, 3);
    // faint sky reflection: diagonal pale blue streak on the upper glass
    g.save(); g.fillStyle = 'rgba(150,185,225,0.17)';
    g.beginPath(); g.moveTo(0, 0); g.lineTo(w * 0.75, 0); g.lineTo(0, h * 0.5); g.closePath(); g.fill(); g.restore();
    const vg = g.createLinearGradient(0, 0, 0, h); vg.addColorStop(0, 'rgba(120,160,210,0.18)'); vg.addColorStop(0.35, 'rgba(120,160,210,0)');
    g.fillStyle = vg; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(120,70,25,0.2)';
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
    g.fillStyle = '#6a6258'; g.fillRect(0, 0, S, S);
    hg.fillStyle = '#000'; hg.fillRect(0, 0, S, S);
    const rows = 20, rowH = S / rows;
    // muted tan, buff and grey concrete pavers (~10 x 15-30 cm)
    const cols = ['#c4ad8e', '#d0b998', '#b8a184', '#c9b08f', '#ad9c86', '#d6c1a2', '#bea284', '#b3a48e', '#c8b393', '#a89884'];
    for (let r = 0; r < rows; r++) {
      let x = -R() * 0.3 * px;
      while (x < S) {
        const L = (0.15 + R() * 0.15) * px;
        const c = cols[Math.floor(R() * cols.length)];
        g.fillStyle = c;
        const gap = 5;
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


// architectural asphalt shingles: staggered tabs in courses, per-tab tone, dark course-shadow lines
function shingleTextures() {
  const R = rng(5);
  const S = 1024, M = 2.0;
  const hc = document.createElement('canvas'); hc.width = hc.height = S;
  const hg = hc.getContext('2d');
  const rows = 20, rowH = S / rows, tabW = S / 14;
  const color = canvasTex(S, S, (g) => {
    g.fillStyle = '#6a6862'; g.fillRect(0, 0, S, S);
    hg.fillStyle = '#000'; hg.fillRect(0, 0, S, S);
    for (let r = 0; r < rows; r++) {
      const off = (r % 2 ? 0.5 : 0) * tabW;
      for (let i = -1; i < 15; i++) {
        const x = i * tabW + off, t = R();
        const v = 104 + t * 16 + 4 * Math.sin(r * 2.3 + i);
        g.fillStyle = `rgb(${v * 0.96 | 0},${v * 1.0 | 0},${v * 1.05 | 0})`;
        g.fillRect(x + 1.5, r * rowH, tabW - 3, rowH);
        for (let k = 0; k < 40; k++) { const b = R() > 0.5 ? 210 : 30; g.fillStyle = `rgba(${b},${b},${b + 8},${R() * 0.3})`; g.fillRect(x + R() * tabW, r * rowH + R() * rowH, 2, 2); }
        const sg = g.createLinearGradient(0, r * rowH, 0, (r + 1) * rowH);
        sg.addColorStop(0, 'rgba(0,0,0,0.0)'); sg.addColorStop(0.7, 'rgba(0,0,0,0.06)'); sg.addColorStop(1, "rgba(0,0,0,0.6)");
        g.fillStyle = sg; g.fillRect(x, r * rowH, tabW, rowH);
        const hh = 170 + R() * 60;
        hg.fillStyle = `rgb(${hh},${hh},${hh})`; hg.fillRect(x + 1, r * rowH + 1, tabW - 2, rowH - 3);
      }
    }
  }, { srgb: true });
  const normal = normalFromHeight(hc, 5);
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
  M.stucco = pbr(ctx, 'white_stucco', { repeat: 2.2, color: 0xe6ded0, roughness: 1, normalScale: 0.8, name: 'ext.stucco' });
  M.porchWall = pbr(ctx, 'white_stucco', { repeat: 2.2, color: 0xe0d9cc, roughness: 0.95, normalScale: 0.3, name: 'ext.porchwall' });
  const board = battenBoardTextures();
  M.board = new THREE.MeshStandardMaterial({ color: 0xe3dac3, map: board, roughness: 0.82, name: 'ext.board' });
  M.batten = new THREE.MeshStandardMaterial({ color: 0xe9e0ca, roughness: 0.8, name: 'ext.batten' });
  M.stone = pbr(ctx, 'castle_wall_slates', { repeat: 1.6, color: 0xd2cabe, roughness: 1, normalScale: 1.6, name: 'ext.stone' });
  M.stoneCap = new THREE.MeshStandardMaterial({ color: 0x9d9184, roughness: 0.9, name: 'ext.stonecap' });
  const shg = shingleTextures();
  M.shingle = new THREE.MeshStandardMaterial({ map: shg.color, normalMap: shg.normal, roughness: 0.92, name: 'ext.shingle' });
  M.shingle.color.setRGB(0.92, 1.0, 1.06);
  M.shingle.envMapIntensity = 0.35;
  M.ridgeCap = new THREE.MeshStandardMaterial({ map: shg.color, normalMap: shg.normal, roughness: 0.9, color: 0xb4b2ac, name: 'ext.ridgecap' });
  M.bronze = new THREE.MeshStandardMaterial({ color: 0x4a3b30, roughness: 0.55, metalness: 0.25, name: 'ext.bronze' });
  M.bronzeMatte = new THREE.MeshStandardMaterial({ color: 0x40362d, roughness: 0.75, metalness: 0.1, name: 'ext.bronze.matte' });
  M.soffit = new THREE.MeshStandardMaterial({ color: 0x5a4a3e, roughness: 0.8, name: 'ext.soffit' });
  const seam = seamTextures();
  M.metalRoof = new THREE.MeshStandardMaterial({ color: 0x4b4743, roughness: 0.38, metalness: 0.55, normalMap: seam.normal, name: 'ext.metalroof' });
  M.metalRoof.normalMap.repeat.set(1 / 0.45, 1);
  M.metalRoof.normalScale.set(1.2, 1.2);
  M.white = new THREE.MeshStandardMaterial({ color: 0xf0ece2, roughness: 0.6, name: 'ext.white' });
  M.porchCeiling = new THREE.MeshStandardMaterial({ color: 0xc9a974, roughness: 0.8, name: 'ext.porchceiling' });
  M.doorWood = pbr(ctx, 'rosewood_veneer1', { repeat: 1.2, color: 0xb06a3c, roughness: 0.5, nor: null, name: 'ext.doorwood' });
  M.doorWood.roughness = 0.45;
  const pav = paverTextures();
  M.pavers = new THREE.MeshStandardMaterial({ color: 0xffe6c8, map: pav.color, normalMap: pav.normal, roughness: 0.88, name: 'ext.pavers' });
  M.brickStep = new THREE.MeshStandardMaterial({ map: pav.color, normalMap: pav.normal, roughness: 0.85, color: 0xd8b8a0, name: 'ext.bricksteps' });
  M.grass = pbr(ctx, 'Grass005', { repeat: 1.6, color: 0xc8d070, roughness: 1, diff: 'Grass005_1K-JPG_Color.jpg', nor: 'Grass005_1K-JPG_NormalGL.jpg', rough: 'Grass005_1K-JPG_Roughness.jpg', name: 'ext.grass' });
  M.mulch = pbr(ctx, 'forest_leaves_02', { repeat: 1.5, color: 0x3c3228, roughness: 1, rough: null, name: 'ext.mulch' });
  // live-oak bark: grey-brown furrowed oak with moss and lichen (Poly Haven jolcham_oak_bark_01, 1k is 1:2)
  M.bark = pbr(ctx, 'jolcham_oak_bark', { repeat: 1, color: 0xa4a4a6, roughness: 1, normalScale: 1.6, name: 'ext.bark' });
  for (const t of [M.bark.map, M.bark.normalMap, M.bark.roughnessMap]) t.repeat.set(1 / 0.9, 1 / 1.8);
  // limbs are seen from below in shade: lift the bark by its own albedo so the grey-brown texture reads
  M.bark.emissive = new THREE.Color().setRGB(0.3, 0.31, 0.42); M.bark.emissiveMap = M.bark.map; M.bark.emissiveIntensity = 1.0;
  M.concrete = pbr(ctx, 'white_stucco', { repeat: 1.5, color: 0xb9b1a4, roughness: 0.95, normalScale: 0.5, name: 'ext.walk' });

  // glass: clear (global, seen from inside) and warm-lit (front windows, outside face only)
  M.glassClear = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.03, metalness: 0, transparent: true, opacity: 0.12, envMapIntensity: 1.2, depthWrite: false, side: THREE.DoubleSide, name: 'ext.glass' });
  M.glow = [];
  for (let i = 0; i < 6; i++) {
    const t = glowTexture(31 + i * 17, i === 5 ? 'foyer' : 'room');
    const m = new THREE.MeshStandardMaterial({ color: 0x3a5a86, roughness: 0.04, metalness: 0.0, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 1.3, envMapIntensity: 1.6, name: 'ext.glow' + i });
    m.userData.glowBase = 1.3;
    M.glow.push(m);
  }
  return M;
}
