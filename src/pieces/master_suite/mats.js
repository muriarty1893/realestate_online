// Materials for the master suite. All textures are CC0 (Poly Haven / ambientCG) under assets/master_suite/tex.
import * as THREE from 'three';
import { BASE, canvasTex, rng } from './util.js';
import { rugMaps, knitMaps, linenMaps, plankFloorMaps, oakGrainMaps } from './textiles.js';

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
  const pf = plankFloorMaps();
  M.oakFloor = new THREE.MeshPhysicalMaterial({
    map: pf.map, normalMap: pf.normalMap, color: 0xffffff, roughness: 0.5, clearcoat: 0.18, clearcoatRoughness: 0.42,
    normalScale: new THREE.Vector2(0.55, 0.55), name: 'ms.oakFloor',
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
  M.wallMstr = std({ color: 0xe9dfd0, roughness: 0.93, name: 'ms.wallMstr' });
  M.wallBath = std({ color: 0xebe6dc, roughness: 0.9, name: 'ms.wallBath' });
  M.ceiling = std({ color: 0xe8dfd0, roughness: 0.96, name: 'ms.ceiling' });
  M.trimWhite = std({ color: 0xf4f1ea, roughness: 0.5, name: 'ms.trim' });

  // ---- wood
  const oakTex = (size = 1.83) => ({
    map: T('oak_veneer_01_diff_1k.jpg', { srgb: true, repeatM: size }),
    normalMap: T('oak_veneer_01_nor_gl_1k.jpg', { repeatM: size }),
    roughnessMap: T('oak_veneer_01_rough_1k.jpg', { repeatM: size }),
  });
  M.oak = std({ ...oakTex(1.2), color: 0xeadbc6, roughness: 0.62, normalScale: new THREE.Vector2(0.4, 0.4), name: 'ms.oak' });
  const dg = oakGrainMaps();
  M.oakDoor = std({ map: dg.map, normalMap: dg.normalMap, color: 0xffffff, roughness: 0.62, normalScale: new THREE.Vector2(0.45, 0.45), name: 'ms.oakDoor' });
  M.oakSoft = std({ map: T('oak_soft_diff_1k.jpg', { srgb: true, repeatM: 1.2 }), normalMap: T('oak_veneer_01_nor_gl_1k.jpg', { repeatM: 1.2 }), roughnessMap: T('oak_veneer_01_rough_1k.jpg', { repeatM: 1.2 }), color: 0xf0dcc2, roughness: 0.6, normalScale: new THREE.Vector2(0.4, 0.4), name: 'ms.oakSoft' });
  M.oakLight = std({ ...oakTex(1.0), color: 0xf0e2cc, roughness: 0.6, normalScale: new THREE.Vector2(0.3, 0.3), name: 'ms.oakLight' });
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
  M.showerGlass = new THREE.MeshPhysicalMaterial({ color: 0xe8f0ee, roughness: 0.04, metalness: 0, transparent: true, opacity: 0.07, envMapIntensity: 0.35, depthWrite: false, side: THREE.DoubleSide, name: 'ms.showerGlass' });
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
  // bedding: slubby linen weave + baked soft creases, with fabric sheen (physical material)
  const bedLinen = (color, { tile = 1.1, crease, seed, ns = 1, rough = 0.94, sheen = 0.5 }) => {
    const lm = linenMaps({ size: 1024, repeatM: tile, seed, crease });
    const c = new THREE.Color(color);
    return new THREE.MeshPhysicalMaterial({
      map: lm.map, normalMap: lm.normalMap, color: c, roughness: rough, normalScale: new THREE.Vector2(ns, ns),
      sheen, sheenRoughness: 0.8, sheenColor: c.clone().lerp(new THREE.Color(0xffffff), 0.45), side: THREE.DoubleSide,
    });
  };
  M.duvet = Object.assign(bedLinen(0xb9a58d, { tile: 1.1, seed: 21, crease: { n: 90, dir: 0.5, spread: 1.1, seed: 4, amount: 0.7 }, ns: 0.55, sheen: 0.7 }), { name: 'ms.duvet' });
  M.throwCream = Object.assign(bedLinen(0xf0e6d4, { tile: 0.9, seed: 22, crease: { n: 80, dir: 0.3, spread: 1.3, seed: 8, amount: 0.7 }, ns: 0.55 }), { name: 'ms.throwCream' });
  M.sheet = Object.assign(bedLinen(0xece6dc, { tile: 0.9, seed: 23, crease: { n: 120, dir: 1.2, spread: 1.0, seed: 3, amount: 0.8 }, ns: 0.6 }), { name: 'ms.sheet' });
  const pillowMat = (color, seed, name) => Object.assign(bedLinen(color, { tile: 0.8, seed, crease: { n: 130, dir: 0.0, spread: 1.6, seed: 12 + seed, amount: 1.2 }, ns: 1.0, rough: 0.95 }), { name, side: THREE.FrontSide });
  M.pillowA = pillowMat(0xb6a089, 24, 'ms.pillowA');
  M.pillowB = pillowMat(0x9b8369, 25, 'ms.pillowB');
  M.pillowC = pillowMat(0xcdbba3, 26, 'ms.pillowC');
  M.pillowW = pillowMat(0xede7dc, 27, 'ms.pillowW');
  M.sheer = glowFab(fab(0xf4e8d2, 0.35, 0.95, 0.4, { side: THREE.DoubleSide, transparent: true, opacity: 0.9, depthWrite: false, emissive: new THREE.Color(0xffe6c4), emissiveIntensity: 3.2, name: 'ms.sheer' }), 0.8);
  M.curtainLit = glowFab(fab(0xd9c8af, 0.35, 0.95, 0.5, { side: THREE.DoubleSide, transparent: true, opacity: 1, emissive: new THREE.Color(0xffe0b8), emissiveIntensity: 0.3, name: 'ms.curtainLit' }));
  M.curtain = glowFab(fab(0xdccfba, 0.35, 0.95, 0.5, { side: THREE.DoubleSide, opacity: 1, emissive: new THREE.Color(0xffe0b8), emissiveIntensity: 0.2, name: 'ms.curtain' }));
  M.curtainSlider = glowFab(fab(0xe0cfb2, 0.35, 0.95, 0.5, { side: THREE.DoubleSide, emissive: new THREE.Color(0xffdfb0), emissiveIntensity: 0.85, name: 'ms.curtainSlider' }), 1.0);
  M.shade = std({ ...linenDetail(0.2), color: 0xf3e6cf, roughness: 0.95, emissive: new THREE.Color(0xffc777), emissiveIntensity: 0.55, side: THREE.DoubleSide, name: 'ms.shade' });
  M.romanShade = fab(0xe3dccf, 0.3, 0.95, 0.5, { name: 'ms.romanShade' });
  M.towel = fab(0xf0ece4, 0.15, 1.0, 1.0, { name: 'ms.towel' });

  // rug: chunky braided jute/wool (procedural loops + fibre flecks)
  const rm = rugMaps();
  M.rug = std({ map: rm.map, normalMap: rm.normalMap, color: 0xf2eadc, roughness: 1.0, normalScale: new THREE.Vector2(1.5, 1.5), name: 'ms.rug' });

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
  M.pillowKnit = std({ map: km.map, normalMap: km.normalMap, color: 0xcbbca6, roughness: 1, normalScale: new THREE.Vector2(0.8, 0.8), name: 'ms.pillowKnit' });
  M.pillowKnit.map = km.map.clone(); M.pillowKnit.map.repeat.set(1 / 0.12, 1 / 0.12); M.pillowKnit.normalMap = km.normalMap.clone(); M.pillowKnit.normalMap.repeat.set(1 / 0.12, 1 / 0.12);
  M.pillowKnit.map.needsUpdate = true; M.pillowKnit.normalMap.needsUpdate = true;
  return M;
}

// curtain fabric whose emissive (fake back-light) is modulated by the vertex colour of the fold crests
function glowFab(m, floorK = 0.15) {
  m.vertexColors = true;
  m.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n\ttotalEmissiveRadiance *= ' + floorK.toFixed(2) + ' + ' + (1 - floorK).toFixed(2) + ' * vColor.rgb * vColor.rgb;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <color_fragment>', 'vec3 keepCol = diffuseColor.rgb;\n#include <color_fragment>\ndiffuseColor.rgb = keepCol * (0.5 + 0.5 * vColor.rgb);');
  };
  m.customProgramCacheKey = () => 'ms-glowfab' + floorK;
  return m;
}

function artTexture() {
  return canvasTex(1024, 800, (g, w, h) => {
    const R = rng(7);
    g.fillStyle = '#d9cfbf'; g.fillRect(0, 0, w, h);
    // layered soft washes in sand / stone / ash
    const wash = (c, a, n, rmin, rmax) => {
      for (let i = 0; i < n; i++) {
        const x = R() * w, y = R() * h, r = rmin + R() * (rmax - rmin);
        const grd = g.createRadialGradient(x, y, 0, x, y, r);
        grd.addColorStop(0, `rgba(${c},${a})`); grd.addColorStop(1, `rgba(${c},0)`);
        g.fillStyle = grd; g.fillRect(0, 0, w, h);
      }
    };
    wash('232,224,210', 0.6, 14, 150, 380);
    wash('190,176,156', 0.35, 10, 120, 300);
    wash('150,138,124', 0.22, 6, 80, 220);
    // dry-brush charcoal sweeps, very soft
    g.lineCap = 'round';
    for (let i = 0; i < 14; i++) {
      g.strokeStyle = `rgba(${70 + R() * 30},${64 + R() * 25},${58 + R() * 20},${0.05 + R() * 0.12})`;
      g.lineWidth = 6 + R() * 26;
      g.beginPath(); let x = w * (0.1 + R() * 0.8), y = h * (0.15 + R() * 0.7); g.moveTo(x, y);
      for (let k = 0; k < 3; k++) { x += (R() - 0.5) * 420; y += (R() - 0.5) * 160; g.quadraticCurveTo(x + (R() - 0.5) * 200, y + (R() - 0.5) * 120, x, y); }
      g.stroke();
    }
    // paper grain
    const id = g.getImageData(0, 0, w, h);
    for (let i = 0; i < id.data.length; i += 4) { const n = (R() - 0.5) * 10; id.data[i] += n; id.data[i + 1] += n; id.data[i + 2] += n; }
    g.putImageData(id, 0, 0);
  });
}
