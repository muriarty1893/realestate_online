// Materials for the master suite. All textures are CC0 (Poly Haven / ambientCG) under assets/master_suite/tex.
import * as THREE from 'three';
import { BASE, canvasTex, rng } from './util.js';
import { rugMaps, knitMaps, wrinkleMaps } from './textiles.js';

const std = (o) => new THREE.MeshStandardMaterial(o);

export function makeMats(ctx) {
  const T = (f, o = {}) => ctx.loadTex(BASE + 'tex/' + f, o);
  const set = (f, size, { rot = 0, srgbDiff = true, rough = true, nor = true, diff = true } = {}) => ({
    map: diff ? T(f + '_diff' + '.jpg', { srgb: srgbDiff, repeatM: size, rotation: rot }) : null,
    normalMap: nor ? T(f + '_nor_gl.jpg', { repeatM: size, rotation: rot }) : null,
    roughnessMap: rough ? T(f + '_rough.jpg', { repeatM: size, rotation: rot }) : null,
  });
  const PI2 = Math.PI / 2;
  const M = {};

  // ---- floors
  M.oakFloor = std({
    map: T('laminate_floor_02_diff_2k.jpg', { srgb: true, repeatM: 1.55, rotation: PI2 }),
    normalMap: T('laminate_floor_02_nor_gl_2k.jpg', { repeatM: 1.55, rotation: PI2 }),
    roughnessMap: T('laminate_floor_02_rough_2k.jpg', { repeatM: 1.55, rotation: PI2 }),
    color: 0xc4b3a3, roughness: 0.6, normalScale: new THREE.Vector2(0.5, 0.5), name: 'ms.oakFloor',
  });
  M.porcelain = std({
    map: T('porcelain_diff_1k.jpg', { srgb: true, repeatM: 1.5 }),
    normalMap: T('marble_01_nor_gl_1k.jpg', { repeatM: 1.5 }),
    color: 0xf1ede6, roughness: 0.32, normalScale: new THREE.Vector2(0.4, 0.4), name: 'ms.porcelain',
  });
  M.subway = std({
    map: T('long_white_tiles_diff_1k.jpg', { srgb: true, repeatM: 1.27 }),
    normalMap: T('long_white_tiles_nor_gl_1k.jpg', { repeatM: 1.27 }),
    roughnessMap: T('long_white_tiles_rough_1k.jpg', { repeatM: 1.27 }),
    color: 0xffffff, roughness: 0.25, name: 'ms.subway',
  });

  // ---- paint
  M.wallMstr = std({ color: 0xefe2d0, roughness: 0.93, name: 'ms.wallMstr' });
  M.wallBath = std({ color: 0xebe6dc, roughness: 0.9, name: 'ms.wallBath' });
  M.ceiling = std({ color: 0xf3eadc, roughness: 0.96, name: 'ms.ceiling' });
  M.trimWhite = std({ color: 0xf4f1ea, roughness: 0.5, name: 'ms.trim' });

  // ---- wood
  const oakTex = (size = 1.83) => ({
    map: T('oak_veneer_01_diff_1k.jpg', { srgb: true, repeatM: size }),
    normalMap: T('oak_veneer_01_nor_gl_1k.jpg', { repeatM: size }),
    roughnessMap: T('oak_veneer_01_rough_1k.jpg', { repeatM: size }),
  });
  M.oak = std({ ...oakTex(1.2), color: 0xd9b48e, roughness: 0.62, normalScale: new THREE.Vector2(0.4, 0.4), name: 'ms.oak' });
  M.oakDoor = std({ map: T('oak_soft_diff_1k.jpg', { srgb: true, repeatM: 1.6 }), normalMap: T('oak_veneer_01_nor_gl_1k.jpg', { repeatM: 1.6 }), roughnessMap: T('oak_veneer_01_rough_1k.jpg', { repeatM: 1.6 }), color: 0xf6e9d8, roughness: 0.6, normalScale: new THREE.Vector2(0.5, 0.5), name: 'ms.oakDoor' });
  M.oakSoft = std({ map: T('oak_soft_diff_1k.jpg', { srgb: true, repeatM: 1.2 }), normalMap: T('oak_veneer_01_nor_gl_1k.jpg', { repeatM: 1.2 }), roughnessMap: T('oak_veneer_01_rough_1k.jpg', { repeatM: 1.2 }), color: 0xf0dcc2, roughness: 0.6, normalScale: new THREE.Vector2(0.4, 0.4), name: 'ms.oakSoft' });
  M.oakLight = std({ ...oakTex(1.0), color: 0xe2c4a0, roughness: 0.6, normalScale: new THREE.Vector2(0.3, 0.3), name: 'ms.oakLight' });
  M.fanBlade = std({ ...oakTex(0.9), color: 0x8a6a50, roughness: 0.55, name: 'ms.fanBlade' });

  // ---- metals
  M.black = std({ color: 0x141312, roughness: 0.42, metalness: 0.55, name: 'ms.black' });
  M.blackMatte = std({ color: 0x161514, roughness: 0.6, metalness: 0.2, name: 'ms.blackMatte' });
  M.bronze = std({ color: 0x2b211b, roughness: 0.38, metalness: 0.75, name: 'ms.bronze' });
  M.brass = std({ color: 0xc89b5a, roughness: 0.28, metalness: 1.0, name: 'ms.brass' });
  M.chrome = std({ color: 0xdddddd, roughness: 0.12, metalness: 1.0, name: 'ms.chrome' });

  // ---- glass / windows
  M.winFrame = std({ color: 0x1b1a19, roughness: 0.45, metalness: 0.15, name: 'ms.winFrame' });
  M.glass = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.03, metalness: 0, transparent: true, opacity: 0.1, envMapIntensity: 1.0, depthWrite: false, side: THREE.DoubleSide, name: 'ms.glass' });
  M.showerGlass = new THREE.MeshPhysicalMaterial({ color: 0xe8f0ee, roughness: 0.04, metalness: 0, transparent: true, opacity: 0.16, envMapIntensity: 1.2, depthWrite: false, side: THREE.DoubleSide, name: 'ms.showerGlass' });
  M.mirror = std({ color: 0xc9ccca, roughness: 0.02, metalness: 1.0, envMapIntensity: 1.0, name: 'ms.mirror' });

  // ---- fabrics (neutral detail maps tinted by colour)
  const linenDetail = (size) => ({
    map: T('linen_detail_1k.jpg', { srgb: true, repeatM: size }),
    normalMap: T('rough_linen_nor_gl_1k.jpg', { repeatM: size }),
    roughnessMap: T('rough_linen_rough_1k.jpg', { repeatM: size }),
  });
  const fab = (color, size = 0.27, rough = 0.95, ns = 0.6, extra = {}) =>
    std({ ...linenDetail(size), color, roughness: rough, normalScale: new THREE.Vector2(ns, ns), ...extra });
  M.upholstery = fab(0x9a8068, 0.22, 0.95, 0.7, { name: 'ms.upholstery' });     // bed frame / headboard (taupe)
  M.benchFab = fab(0xcbb498, 0.2, 0.95, 0.6, { name: 'ms.benchFab' });
  const wrA = wrinkleMaps({ repeatM: 1.1, n: 300, dir: Math.PI / 2, spread: 0.7, seed: 4 }).normalMap;
  const wrB = wrinkleMaps({ repeatM: 0.9, n: 280, dir: 0.3, spread: 1.2, seed: 8 }).normalMap;
  const wrP = wrinkleMaps({ size: 256, repeatM: 0.5, n: 90, dir: 0, spread: 1.5, seed: 12 }).normalMap;
  M.duvet = fab(0xa08a74, 0.3, 0.95, 1.0, { side: THREE.DoubleSide, normalMap: wrA, name: 'ms.duvet' });
  M.throwCream = fab(0xcdbfa9, 0.25, 0.95, 1.0, { side: THREE.DoubleSide, normalMap: wrB, name: 'ms.throwCream' });
  M.sheet = fab(0xece6dc, 0.25, 0.9, 0.5, { side: THREE.DoubleSide, name: 'ms.sheet' });
  M.pillowA = fab(0xb09a82, 0.25, 0.95, 0.8, { normalMap: wrP, name: 'ms.pillowA' });
  M.pillowB = fab(0x957d66, 0.25, 0.95, 0.8, { normalMap: wrP, name: 'ms.pillowB' });
  M.pillowC = fab(0xc6b49c, 0.25, 0.95, 0.8, { normalMap: wrP, name: 'ms.pillowC' });
  M.pillowW = fab(0xebe5da, 0.25, 0.95, 0.6, { normalMap: wrP, name: 'ms.pillowW' });
  M.curtain = fab(0xdccfba, 0.35, 0.95, 0.5, { side: THREE.DoubleSide, name: 'ms.curtain' });
  M.sheer = glowFab(fab(0xe9dcc6, 0.35, 0.95, 0.4, { side: THREE.DoubleSide, emissive: new THREE.Color(0xffd6a6), emissiveIntensity: 0.75, name: 'ms.sheer' }));
  M.curtainLit = glowFab(fab(0xe6d6bd, 0.35, 0.95, 0.5, { side: THREE.DoubleSide, emissive: new THREE.Color(0xffd7a0), emissiveIntensity: 0.45, name: 'ms.curtainLit' }));
  M.curtain = glowFab(fab(0xdccfba, 0.35, 0.95, 0.5, { side: THREE.DoubleSide, emissive: new THREE.Color(0xffd7a0), emissiveIntensity: 0.12, name: 'ms.curtain' }));
  M.shade = std({ ...linenDetail(0.2), color: 0xf3e6cf, roughness: 0.95, emissive: new THREE.Color(0xffc777), emissiveIntensity: 0.55, side: THREE.DoubleSide, name: 'ms.shade' });
  M.romanShade = fab(0xe3dccf, 0.3, 0.95, 0.5, { name: 'ms.romanShade' });
  M.towel = fab(0xf0ece4, 0.15, 1.0, 1.0, { name: 'ms.towel' });

  // rug: chunky braided jute/wool (procedural loops + fibre flecks)
  const rm = rugMaps();
  M.rug = std({ map: rm.map, normalMap: rm.normalMap, color: 0xf2e9dc, roughness: 1.0, normalScale: new THREE.Vector2(1.3, 1.3), name: 'ms.rug' });

  // ceramics
  M.ceramic = std({ color: 0xead9bd, roughness: 0.55, name: 'ms.ceramic' });
  M.porcelainWhite = std({ color: 0xf6f5f2, roughness: 0.18, name: 'ms.porcelainWhite' });
  M.quartz = std({ color: 0xf2efea, roughness: 0.22, name: 'ms.quartz' });
  M.leaf = std({ color: 0x7d8c6c, roughness: 0.7, side: THREE.DoubleSide, name: 'ms.leaf' });
  M.leafOlive = std({ color: 0x6f7a55, roughness: 0.7, side: THREE.DoubleSide, name: 'ms.leafOlive' });
  M.stem = std({ color: 0x5b5240, roughness: 0.8, name: 'ms.stem' });

  // emissive light bits
  M.recessed = std({ color: 0xffffff, emissive: new THREE.Color(0xfff1d8), emissiveIntensity: 2.2, roughness: 0.4, name: 'ms.recessed' });
  M.fanGlass = std({ color: 0xf4efe6, emissive: new THREE.Color(0xfff0dc), emissiveIntensity: 0.55, roughness: 0.5, name: 'ms.fanGlass' });
  M.bulbGlow = std({ color: 0xffffff, emissive: new THREE.Color(0xffd29a), emissiveIntensity: 3, name: 'ms.bulbGlow' });

  // books
  M.books = [0xcfc4b2, 0x8f7f6d, 0xe6dfd2, 0x6f665c, 0xb9a88f].map((c, i) => std({ color: c, roughness: 0.8, name: 'ms.book' + i }));
  M.pages = std({ color: 0xf0e9dc, roughness: 0.9, name: 'ms.pages' });

  // abstract artwork (beige / charcoal), drawn on a canvas
  M.art = std({ map: artTexture(), roughness: 0.9, name: 'ms.art' });
  M.artMat = std({ color: 0xf1ebe0, roughness: 0.9, name: 'ms.artMat' });
  M.artFrame = std({ color: 0x5b4a3a, roughness: 0.6, name: 'ms.artFrame' });

  // chunky knit throw
  const km = knitMaps();
  M.knit = std({ map: km.map, normalMap: km.normalMap, color: 0xf3ebdf, roughness: 1.0, normalScale: new THREE.Vector2(1.2, 1.2), side: THREE.DoubleSide, name: 'ms.knit' });
  return M;
}

// curtain fabric whose emissive (fake back-light) is modulated by the vertex colour of the fold crests
function glowFab(m) {
  m.vertexColors = true;
  m.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n\ttotalEmissiveRadiance *= vColor.rgb * vColor.rgb;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <color_fragment>', 'vec3 keepCol = diffuseColor.rgb;\n#include <color_fragment>\ndiffuseColor.rgb = keepCol * (0.75 + 0.25 * vColor.rgb);');
  };
  m.customProgramCacheKey = () => 'ms-glowfab';
  return m;
}

function artTexture() {
  return canvasTex(1024, 820, (g, w, h) => {
    const R = rng(7);
    g.fillStyle = '#ddd2c1'; g.fillRect(0, 0, w, h);
    // soft washes
    for (let i = 0; i < 26; i++) {
      const x = R() * w, y = R() * h, r = 80 + R() * 260;
      const grd = g.createRadialGradient(x, y, 0, x, y, r);
      const c = R() < 0.5 ? '200,186,166' : '226,216,200';
      grd.addColorStop(0, `rgba(${c},0.55)`); grd.addColorStop(1, `rgba(${c},0)`);
      g.fillStyle = grd; g.fillRect(0, 0, w, h);
    }
    // charcoal gestures
    g.lineCap = 'round';
    for (let i = 0; i < 38; i++) {
      g.strokeStyle = `rgba(${60 + R() * 40},${55 + R() * 35},${50 + R() * 30},${0.08 + R() * 0.3})`;
      g.lineWidth = 1 + R() * 9;
      g.beginPath();
      let x = w * (0.15 + R() * 0.7), y = h * (0.15 + R() * 0.7);
      g.moveTo(x, y);
      for (let k = 0; k < 4; k++) { x += (R() - 0.5) * 380; y += (R() - 0.5) * 240; g.quadraticCurveTo(x + (R() - 0.5) * 200, y + (R() - 0.5) * 200, x, y); }
      g.stroke();
    }
    // a few larger muted shapes
    for (let i = 0; i < 6; i++) {
      g.fillStyle = `rgba(${150 + R() * 40},${132 + R() * 30},${112 + R() * 30},0.22)`;
      g.beginPath(); g.ellipse(w * (0.2 + R() * 0.6), h * (0.2 + R() * 0.6), 60 + R() * 200, 30 + R() * 120, R() * 3, 0, Math.PI * 2); g.fill();
    }
  });
}
