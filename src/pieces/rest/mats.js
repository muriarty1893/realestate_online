// Shared materials for the rest-of-house piece. One instance per finish, reused everywhere.
import * as THREE from 'three';
import { ASSET, subwayTile, juteWeave, knit, abstractArt, canvasTex, boardNormal } from './kit.js';

const std = (name, o) => { const m = new THREE.MeshStandardMaterial(o); m.name = 'rest.' + name; return m; };

// floor finishes are needed in configure() (before the shell is built)
export function floorMats(ctx) {
  const T = (f, o) => ctx.loadTex(ASSET + f, o);
  const F = {};
  // Reuse the great room's floor if its builder set a textured one, so the house reads as one floor.
  const gm = ctx.roomMat('great', 'floor');
  if (gm && gm.map) F.wood = gm;
  else {
    F.wood = std('floor.wood', {
      map: T('wood_floor_diff.jpg', { srgb: true, repeatM: 1.7 }),
      normalMap: T('wood_floor_nor.jpg', { repeatM: 1.7 }),
      roughnessMap: T('wood_floor_rough.jpg', { repeatM: 1.7 }),
      color: 0xe9dccd, roughness: 0.85, normalScale: new THREE.Vector2(0.6, 0.6),
    });
  }
  F.tile = std('floor.tile', {
    map: T('tile_diff.jpg', { srgb: true, repeatM: 1.5 }),
    normalMap: T('marble_01_nor.jpg', { repeatM: 1.5 }),
    roughnessMap: T('marble_01_rough.jpg', { repeatM: 1.5 }),
    color: 0xfbf5ec, roughness: 0.7, normalScale: new THREE.Vector2(0.8, 0.8),
  });
  F.concrete = std('floor.concrete', {
    map: T('concrete_diff.jpg', { srgb: true, repeatM: 1.9 }),
    normalMap: T('garage_floor_nor.jpg', { repeatM: 1.9 }),
    roughnessMap: T('garage_floor_rough.jpg', { repeatM: 1.9 }),
    color: 0xf2f0ec, roughness: 0.9, normalScale: new THREE.Vector2(0.5, 0.5),
  });
  F.garageWall = std('garage.wall', { color: 0xe7e4dd, roughness: 0.95 });
  // unique marker for the stair floor so the build step can remove it and lay its own treads
  F.stairMarker = std('stair.floor.marker', { color: 0x8a6446 });
  return F;
}

export function makeMats(ctx, F) {
  const T = (f, o) => ctx.loadTex(ASSET + f, o);
  const M = { ...F };
  const oakMaps = { map: T('white_oak_veneer_diff.jpg', { srgb: true, repeatM: 0.5 }), normalMap: T('white_oak_veneer_nor.jpg', { repeatM: 0.5 }), roughnessMap: T('white_oak_veneer_rough.jpg', { repeatM: 0.5 }) };
  M.oak = std('oak', { ...oakMaps, color: 0xf6e7d2, roughness: 0.75, normalScale: new THREE.Vector2(0.4, 0.4) });
  M.oakWarm = std('oakWarm', { ...oakMaps, color: 0xd9b48a, roughness: 0.7, normalScale: new THREE.Vector2(0.4, 0.4) });
  M.oakDark = std('oakDark', { ...oakMaps, color: 0x9c7552, roughness: 0.65, normalScale: new THREE.Vector2(0.4, 0.4) });
  M.paint = std('paint.cabinet', { color: 0xf1eee6, roughness: 0.42 });
  M.paintSage = std('paint.sage', { color: 0x8e9a8b, roughness: 0.45 });
  M.paintGreige = std('paint.greige', { color: 0xc9c0b2, roughness: 0.5 });
  M.black = std('black', { color: 0x1c1b1a, roughness: 0.42, metalness: 0.55 });
  M.bronze = std('bronze', { color: 0x4b3a2b, roughness: 0.38, metalness: 0.75 });
  M.brass = std('brass', { color: 0xb48c57, roughness: 0.3, metalness: 0.9 });
  M.chrome = std('chrome', { color: 0xdedede, roughness: 0.12, metalness: 1 });
  M.porcelain = std('porcelain', { color: 0xf8f7f3, roughness: 0.1, envMapIntensity: 1.1 });
  M.porcelainIn = std('porcelain.in', { color: 0xf3f2ee, roughness: 0.12, side: THREE.BackSide });
  M.quartz = std('quartz', { color: 0xf0eee8, roughness: 0.2 });
  M.butcher = M.oakWarm;
  M.mirror = std('mirror', { color: 0xd8dbdc, roughness: 0.02, metalness: 1, envMapIntensity: 1.0 });
  M.glass = new THREE.MeshPhysicalMaterial({ name: 'rest.glass', color: 0xffffff, roughness: 0.03, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide });
  M.darkGlass = std('darkGlass', { color: 0x1d2125, roughness: 0.05, metalness: 0.3 });

  // fabrics
  const lin = (repeatM) => ({ normalMap: T('rough_linen_nor.jpg', { repeatM }), roughnessMap: T('rough_linen_rough.jpg', { repeatM }) });
  const fab = (name, color, repeatM = 0.27, extra = {}) => std(name, { ...lin(repeatM), color, roughness: 1, normalScale: new THREE.Vector2(0.9, 0.9), ...extra });
  M.linenWhite = fab('linen.white', 0xf2efe8);
  M.linenCream = fab('linen.cream', 0xe9e1d2);
  M.linenOat = fab('linen.oat', 0xd5c8b2);
  M.linenTaupe = fab('linen.taupe', 0xab9a84);
  M.linenSage = fab('linen.sage', 0xa7ae9b);
  M.linenBlue = fab('linen.blue', 0x8d99a6);
  M.linenCharcoal = fab('linen.charcoal', 0x6a6762);
  M.upholstery = fab('upholstery', 0xc2b49f, 0.4);
  M.upholsteryLight = fab('upholstery.light', 0xddd3c3, 0.4);
  M.curtain = fab('curtain', 0xe6dccb, 0.27, { side: THREE.DoubleSide, roughness: 1 });
  const kn = knit({ color: [212, 198, 176] });
  M.knitOat = std('knit.oat', { map: canvasTex(kn.map, { repeatM: kn.size }), normalMap: canvasTex(kn.normal, { srgb: false, repeatM: kn.size }), roughness: 1, normalScale: new THREE.Vector2(1.2, 1.2) });
  const kn2 = knit({ color: [232, 229, 222], seed: 33, size: 0.05 });
  M.towel = std('towel', { map: canvasTex(kn2.map, { repeatM: 0.05 }), normalMap: canvasTex(kn2.normal, { srgb: false, repeatM: 0.05 }), roughness: 1 });
  const kn3 = knit({ color: [120, 126, 134], seed: 35 });
  M.knitBlue = std('knit.blue', { map: canvasTex(kn3.map, { repeatM: kn3.size }), normalMap: canvasTex(kn3.normal, { srgb: false, repeatM: kn3.size }), roughness: 1 });
  const ju = juteWeave({});
  M.jute = std('jute', { map: canvasTex(ju.map, { repeatM: ju.size }), normalMap: canvasTex(ju.normal, { srgb: false, repeatM: ju.size }), roughness: 1, normalScale: new THREE.Vector2(1.3, 1.3) });
  const ju2 = juteWeave({ base: [214, 202, 182], seed: 23, cell: 12 });
  M.juteLight = std('jute.light', { map: canvasTex(ju2.map, { repeatM: ju2.size }), normalMap: canvasTex(ju2.normal, { srgb: false, repeatM: ju2.size }), roughness: 1, normalScale: new THREE.Vector2(1.2, 1.2) });
  const ju3 = juteWeave({ base: [150, 120, 84], seed: 25, cell: 10, size: 0.12 });
  M.basket = std('basket', { map: canvasTex(ju3.map, { repeatM: 0.12 }), normalMap: canvasTex(ju3.normal, { srgb: false, repeatM: 0.12 }), roughness: 0.95 });

  // tile
  const sw = subwayTile({});
  M.subway = std('subway', { map: canvasTex(sw.map, { repeatM: sw.size }), normalMap: canvasTex(sw.normal, { srgb: false, repeatM: sw.size }), roughness: 0.18, normalScale: new THREE.Vector2(0.7, 0.7) });
  const bn = boardNormal({});
  M.shiplap = std('shiplap', { color: 0xf1eee6, roughness: 0.6, normalMap: canvasTex(bn.normal, { srgb: false, repeatM: bn.size }), normalScale: new THREE.Vector2(1, 1) });

  // lighting fixtures
  M.ceramic = std('ceramic', { color: 0xebe3d4, roughness: 0.35 });
  M.ceramicSage = std('ceramic.sage', { color: 0xb7bba9, roughness: 0.4 });
  M.ceramicCharcoal = std('ceramic.char', { color: 0x55524d, roughness: 0.5 });
  M.shade = std('shade', { ...lin(0.2), color: 0xf0e5d1, roughness: 1, emissive: 0xffcf96, emissiveIntensity: 0.5, side: THREE.DoubleSide });
  M.glow = std('glow', { color: 0xffffff, emissive: 0xfff0dc, emissiveIntensity: 2.2, roughness: 0.4 });
  M.glowSoft = std('glow.soft', { color: 0xf7f2ea, emissive: 0xffe6c4, emissiveIntensity: 1.1, roughness: 0.5 });
  M.ledStrip = std('led', { color: 0xffffff, emissive: 0xf4f6ff, emissiveIntensity: 2.4 });
  M.trimWhite = ctx.getMat('trim');
  M.wall = ctx.getMat('paint.wall');
  M.door = ctx.getMat('door.interior');

  // garage / misc
  M.steel = std('steel', { color: 0x2a2b2c, roughness: 0.5, metalness: 0.4 });
  M.galv = std('galv', { color: 0xa3a7aa, roughness: 0.4, metalness: 0.8 });
  M.cardboard = std('cardboard', { color: 0xb08a5e, roughness: 0.92 });
  M.binGrey = std('bin.grey', { color: 0x5d6268, roughness: 0.55 });
  M.binClear = std('bin.clear', { color: 0xd8dde0, roughness: 0.25, transparent: true, opacity: 0.75 });
  M.binLid = std('bin.lid', { color: 0x2f3134, roughness: 0.5 });
  M.rubber = std('rubber', { color: 0x1f1f1f, roughness: 0.85 });
  M.appliance = std('appliance', { color: 0xf3f3f1, roughness: 0.28, metalness: 0.05 });
  M.pegboard = std('pegboard', { color: 0x9b7b5a, roughness: 0.9 });
  M.plant = std('plant', { color: 0x6c7a59, roughness: 0.75, side: THREE.DoubleSide });
  M.plantDark = std('plant.dark', { color: 0x4f5c40, roughness: 0.75, side: THREE.DoubleSide });
  M.stem = std('stem', { color: 0x5a5140, roughness: 0.9 });
  M.joint = std('joint', { color: 0x6f6d69, roughness: 0.9 });
  M.paper = std('paper', { color: 0xf3f0e9, roughness: 0.9 });
  M.wicker = M.basket;

  // book / clothing palette
  const pal = [0x6f6a63, 0xb9ab95, 0x8a9488, 0xd9d0c1, 0x51575f, 0xa48a6c, 0xe8e2d6, 0x7d6a58, 0x9aa3ad, 0xc4b8a5];
  M.cloth = pal.map((c, i) => std('cloth' + i, { color: c, roughness: 1, ...lin(0.27), normalScale: new THREE.Vector2(0.6, 0.6) }));
  M.books = [0xe6dfd2, 0x9b8b76, 0x50565c, 0xc9b9a0, 0x7c8577, 0x2f2f30, 0xb8a588].map((c, i) => std('book' + i, { color: c, roughness: 0.8 }));

  // art
  const art = (seed, o, w = 600, h = 450) => std('art' + seed, { map: canvasTex(abstractArt({ seed, w, h, ...o }), { repeatM: 1 }), roughness: 0.85 });
  M.art = [
    art(41, { palette: ['#ece6da', '#cbbfa9', '#9c9488', '#5e6b79', '#b49c7d'] }),
    art(42, { style: 'landscape', palette: ['#eeeae2', '#d9d3c6', '#bdb5a5', '#8c9699', '#a59c89'] }),
    art(43, { style: 'line', palette: ['#efe9dd'] }, 450, 600),
    art(44, { palette: ['#e8e2d5', '#c6b49a', '#8d7c68', '#d9cbb5', '#6d6357'] }, 450, 600),
    art(45, { style: 'landscape', palette: ['#f0ece4', '#dfd8ca', '#c7bfae', '#9aa39b', '#b8ab92'] }),
    art(46, { palette: ['#ebe7df', '#a7b0b5', '#d8cfc0', '#67737f', '#c2ad8f'] }, 450, 600),
  ];
  // planar UVs are in metres, so art textures need per-piece UV fitting: done in furniture.art()
  return M;
}
