// Offline bake: load each full-res Poly Haven plant, flatten + normalise + simplify (same as the old runtime path),
// write a small .glb per plant into assets/exterior/models_baked/. Run: node tools/bake_plants.mjs
globalThis.ProgressEvent ??= class ProgressEvent extends Event { constructor(t, i = {}) { super(t); Object.assign(this, i); } };
import fs from 'node:fs';
import path from 'node:path';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { SimplifyModifier } from 'three/addons/modifiers/SimplifyModifier.js';

const SRC = 'assets/exterior/models', OUT = 'assets/exterior/models_baked';
const HEIGHT = { fern_02: 0.6, calathea_orbifolia_01: 0.5, shrub_02: 0.75, shrub_04: 0.8, periwinkle_plant: 0.4 };
const TARGET = { fern_02: 450, calathea_orbifolia_01: 500, shrub_02: 600, shrub_04: 900, periwinkle_plant: 400 };
fs.mkdirSync(OUT, { recursive: true });

for (const id of Object.keys(HEIGHT)) {
  const dir = path.join(SRC, id);
  if (!fs.existsSync(dir)) { console.log('skip', id); continue; }
  const json = JSON.parse(fs.readFileSync(path.join(dir, id + '.gltf'), 'utf8'));
  const bin = fs.readFileSync(path.join(dir, json.buffers[0].uri));
  const orig = JSON.parse(JSON.stringify(json));
  // geometry-only parse (no images in node)
  json.buffers[0].uri = 'data:application/octet-stream;base64,' + bin.toString('base64');
  delete json.images; delete json.textures;
  for (const m of json.materials) { delete m.normalTexture; delete m.pbrMetallicRoughness.baseColorTexture; delete m.pbrMetallicRoughness.metallicRoughnessTexture; }
  const gltf = await new GLTFLoader().parseAsync(JSON.stringify(json), '');
  gltf.scene.updateMatrixWorld(true);
  const parts = []; gltf.scene.traverse((o) => { if (o.isMesh) parts.push(o); });
  const geos = parts.map((m) => {
    let g = m.geometry.clone(); for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    g.applyMatrix4(m.matrixWorld);
    g.computeBoundingBox(); let bb = g.boundingBox;
    const sc = HEIGHT[id] / Math.max(0.05, bb.max.y - bb.min.y);
    g.scale(sc, sc, sc);
    const tris = (g.index ? g.index.count : g.attributes.position.count) / 3;
    const want = Math.min(tris, TARGET[id]);
    if (want < tris) {
      if (!g.index) g = mergeVertices(g);
      const s2 = new SimplifyModifier().modify(g, Math.floor(g.attributes.position.count * (1 - want / tris)));
      if (s2.index && s2.index.count > 0) { g = s2; g.computeVertexNormals(); }
      else {   // simplifier cannot collapse disconnected leaf cards: keep 1 chunk of 6 triangles in every N instead
        const keepEvery = Math.ceil(tris / want), ix = g.index.array, out = [];
        for (let c = 0; c * 6 < tris; c++) if (c % keepEvery === (c * 7) % keepEvery) for (let t = c * 18; t < Math.min(ix.length, c * 18 + 18); t++) out.push(ix[t]);
        g.setIndex(out);
      }
    }
    g.computeBoundingBox(); bb = g.boundingBox;
    g.translate(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -(bb.min.z + bb.max.z) / 2);
    return g;
  });
  console.log(id, geos.map((g) => Object.keys(g.attributes).join('+') + ':' + (g.index.count / 3 | 0)).join(' | '));

  // ---- write GLB
  const chunks = []; let off = 0;
  const bufferViews = [], accessors = [];
  const push = (buf, target) => {
    const pad = (4 - (buf.byteLength % 4)) % 4;
    bufferViews.push({ buffer: 0, byteOffset: off, byteLength: buf.byteLength, ...(target ? { target } : {}) });
    chunks.push(Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength), Buffer.alloc(pad));
    off += buf.byteLength + pad; return bufferViews.length - 1;
  };
  const meshes = [];
  for (const g of geos) {
    const attrs = {};
    for (const [name, key, type] of [['POSITION', 'position', 'VEC3'], ['NORMAL', 'normal', 'VEC3'], ['TEXCOORD_0', 'uv', 'VEC2']]) {
      const a = g.attributes[key]; if (!a) continue;
      const arr = new Float32Array(a.array);
      const acc = { bufferView: push(arr, 34962), componentType: 5126, count: a.count, type };
      if (key === 'position') { g.computeBoundingBox(); acc.min = g.boundingBox.min.toArray(); acc.max = g.boundingBox.max.toArray(); }
      accessors.push(acc); attrs[name] = accessors.length - 1;
    }
    const idx = new Uint32Array(g.index.array);
    accessors.push({ bufferView: push(idx, 34963), componentType: 5125, count: idx.length, type: 'SCALAR' });
    meshes.push({ primitives: [{ attributes: attrs, indices: accessors.length - 1, material: 0 }] });
  }
  // images embedded as-is (all are 1k)
  const images = orig.images.map((im) => {
    const b = fs.readFileSync(path.join(dir, im.uri));
    return { bufferView: push(new Uint8Array(b), null), mimeType: im.uri.endsWith('.png') ? 'image/png' : 'image/jpeg' };
  });
  const out = {
    asset: { version: '2.0', generator: 'tools/bake_plants.mjs' }, scene: 0, scenes: [{ nodes: meshes.map((_, i) => i) }],
    nodes: meshes.map((_, i) => ({ mesh: i })), meshes, materials: orig.materials, textures: orig.textures, samplers: orig.samplers, images,
    accessors, bufferViews, buffers: [{ byteLength: off }],
  };
  if (!out.samplers) delete out.samplers;
  let j = Buffer.from(JSON.stringify(out)); j = Buffer.concat([j, Buffer.alloc((4 - (j.length % 4)) % 4, 0x20)]);
  const body = Buffer.concat(chunks);
  const head = Buffer.alloc(12); head.write('glTF', 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(12 + 8 + j.length + 8 + body.length, 8);
  const h1 = Buffer.alloc(8); h1.writeUInt32LE(j.length, 0); h1.write('JSON', 4);
  const h2 = Buffer.alloc(8); h2.writeUInt32LE(body.length, 0); h2.write('BIN\0', 4);
  fs.writeFileSync(path.join(OUT, id + '.glb'), Buffer.concat([head, h1, j, h2, body]));
}
