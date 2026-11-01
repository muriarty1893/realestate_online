// Tailored leather upholstery: the L-sectional and the club chairs.
// Every cushion and frame part is its own rounded box (small edge radius, gentle crown) with real gaps between
// parts, so seams read as dark lines from AO and shadow instead of being painted on. Piping tubes are built in
// the cushion's local space and parented to it.
import * as THREE from 'three';
import { mesh, box } from './util.js';
import { contactShadow } from './living.js';


// Rounded box w x h x d centred at the origin. Edge radius r. Faces bow outward: +y by `crown`, -y by `crownB`,
// the four sides by `bulge`, plus faint wrinkles on the +y face. UVs in metres per face (grain continuous over
// the rounded edges), normals welded across face boundaries. Vertex colour darkens toward the bottom.
export function upholsteryGeo(w, h, d, { r = 0.025, crown = 0, crownB = 0, bulge = 0, wrinkle = 0, seed = 1, k = 3, m = [8, 2, 6], shade = 0.3, p = 2.5, up = [0, 1, 0], sag = 0, crease = 0, wear = 0.1, side = 0.42 } = {}) {
  // `up` = world up in the block's local frame (back cushions are rotated), for the top-lit tone below
  const ext = Math.abs(up[0]) * w / 2 + Math.abs(up[1]) * h / 2 + Math.abs(up[2]) * d / 2;
  const H = [w / 2, h / 2, d / 2];
  const rr = Math.min(r, H[0] - 1e-3, H[1] - 1e-3, H[2] - 1e-3);
  const N = [2 * k + m[0], 2 * k + m[1], 2 * k + m[2]];
  const g = new THREE.BoxGeometry(1, 1, 1, N[0], N[1], N[2]);
  const pos = g.attributes.position, nor = g.attributes.normal, uv = g.attributes.uv;
  const col = new Float32Array(pos.count * 3);
  // tick coordinate: k ticks in each radius band (uniform in angle once projected), m ticks across the middle
  const tick = (u, a) => {
    const i = Math.round((u + 0.5) * N[a]), inner = H[a] - rr;
    if (i <= k) return -inner - rr * Math.tan((Math.PI / 4) * (1 - i / k));
    if (i >= N[a] - k) return inner + rr * Math.tan((Math.PI / 4) * (1 - (N[a] - i) / k));
    return -inner + ((i - k) / m[a]) * 2 * inner;
  };
  const P = [0, 0, 0], I = [0, 0, 0], n = [0, 0, 0];
  const F = (a) => { let f = 1; for (let b = 0; b < 3; b++) if (b !== a) f *= 1 - Math.pow(Math.min(1, Math.abs(P[b]) / H[b]), p); return f; };
  for (let v = 0; v < pos.count; v++) {
    P[0] = tick(pos.getX(v), 0); P[1] = tick(pos.getY(v), 1); P[2] = tick(pos.getZ(v), 2);
    let L = 0;
    for (let a = 0; a < 3; a++) { I[a] = Math.max(-(H[a] - rr), Math.min(H[a] - rr, P[a])); n[a] = P[a] - I[a]; L += n[a] * n[a]; }
    L = Math.sqrt(L) || 1;
    for (let a = 0; a < 3; a++) { n[a] /= L; P[a] = I[a] + n[a] * rr; }
    // uv from the (rounded, undisplaced) position in the face plane, metres
    const fn = [nor.getX(v), nor.getY(v), nor.getZ(v)];
    if (Math.abs(fn[0]) > 0.5) uv.setXY(v, P[2] * Math.sign(fn[0]), P[1]);
    else if (Math.abs(fn[1]) > 0.5) uv.setXY(v, P[0], P[2]);
    else uv.setXY(v, P[0], P[1]);
    // displacement: crown / bulge, scaled by the normal so the rims blend smoothly
    const fx = F(0), fy = F(1), fz = F(2);
    const dy = n[1] > 0 ? crown * fy * n[1] : crownB * fy * n[1];
    let wr = 0;
    if (wrinkle && n[1] > 0) wr = wrinkle * n[1] * fy * (Math.sin(P[0] * 31 + seed) * Math.sin(P[2] * 23 + seed * 1.9) + 0.6 * Math.sin(P[0] * 57 - P[2] * 41 + seed * 3.1));
    // sitting wear: a soft dip in the middle of the seat (slightly toward the front) and creases fanning out
    // toward the front edge (local +z), strongest where the seat rolls over the front
    if ((sag || crease) && n[1] > 0) {
      const u = P[0] / H[0], v = P[2] / H[2];
      wr -= sag * n[1] * fy * Math.exp(-(u * u) / 0.35 - ((v - 0.25) * (v - 0.25)) / 0.3);
      const fr = Math.max(0, v - 0.1) / 0.9, ang = P[0] * 26 + v * 2.2 * Math.sin(P[0] * 7 + seed) + seed;
      wr -= crease * n[1] * fy * fr * fr * Math.pow(0.5 + 0.5 * Math.sin(ang), 6) * (0.6 + 0.4 * Math.sin(P[0] * 11 + seed * 2.7));
    }
    const X = P[0] + bulge * fx * n[0], Y = P[1] + dy + wr, Z = P[2] + bulge * fz * n[2];
    // under-cushion shade: darker low on the sides and on the bottom
    const ndu = n[0] * up[0] + n[1] * up[1] + n[2] * up[2];
    const t = (P[0] * up[0] + P[1] * up[1] + P[2] * up[2] + ext) / (2 * ext);
    let c = 1 - shade * Math.pow(1 - t, 2);
    if (ndu < -0.5) c *= 0.55;
    c *= side + (1 - side) * Math.max(0, ndu);
    // worn, lighter top edges (rounded band between the top and a side face)
    const edge = Math.max(0, ndu) * (1 - Math.abs(ndu)) * 4;
    c *= 1 + wear * Math.min(1, edge);
    // shade desaturates (bluer multiplier in the dark) so creases and undersides go brown, not rust
    col[v * 3] = c; col[v * 3 + 1] = Math.pow(c, 0.92) * 0.98; col[v * 3 + 2] = Math.pow(c, 0.8) * 0.95;
    pos.setXYZ(v, X, Y, Z);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  // weld normals across face boundaries (duplicate positions) so the rounded edges shade smoothly
  const key = (v) => `${Math.round(pos.getX(v) * 1e5)},${Math.round(pos.getY(v) * 1e5)},${Math.round(pos.getZ(v) * 1e5)}`;
  const acc = new Map(), nn = g.attributes.normal;
  for (let v = 0; v < pos.count; v++) {
    const kk = key(v), a = acc.get(kk);
    if (a) { a[0] += nn.getX(v); a[1] += nn.getY(v); a[2] += nn.getZ(v); a[3]++; } else acc.set(kk, [nn.getX(v), nn.getY(v), nn.getZ(v), 1]);
  }
  for (let v = 0; v < pos.count; v++) {
    const a = acc.get(key(v));
    if (a[3] > 1) { const l = Math.hypot(a[0], a[1], a[2]) || 1; nn.setXYZ(v, a[0] / l, a[1] / l, a[2] / l); }
  }
  return g;
}

// Welt (piping) loop around the +y face (sy=1) or -y face (sy=-1) of an upholsteryGeo block, at the 45° point of
// its rounded edge. Local to the block.
function pipingGeo(w, h, d, r, sy = 1, rad = 0.0045) {
  const rr = Math.min(r, w / 2 - 1e-3, h / 2 - 1e-3, d / 2 - 1e-3);
  const c = rr * Math.SQRT1_2, hx = w / 2 - rr + c, hz = d / 2 - rr + c, y = sy * (h / 2 - rr + c);
  const cr = Math.min(c + 0.004, hx, hz), pts = [];
  const corners = [[hx - cr, hz - cr, 0], [-(hx - cr), hz - cr, Math.PI / 2], [-(hx - cr), -(hz - cr), Math.PI], [hx - cr, -(hz - cr), 1.5 * Math.PI]];
  for (const [cx, cz, a0] of corners) for (let i = 0; i <= 4; i++) { const a = a0 + (i / 4) * (Math.PI / 2); pts.push(new THREE.Vector3(cx + cr * Math.cos(a), y, cz + cr * Math.sin(a))); }
  const curve = new THREE.CatmullRomCurve3(pts, true, 'centripetal');
  return new THREE.TubeGeometry(curve, 140, rad, 6, true);
}

// A cushion / frame block: mesh with sofaLeather, optional piping loops parented to it.
function block(M, w, h, d, opt = {}, pipe = []) {
  const m = mesh(upholsteryGeo(w, h, d, opt), M.sofaLeather);
  for (const sy of pipe) m.add(mesh(pipingGeo(w, h, d, opt.r ?? 0.025, sy), M.leatherPipe, { cast: false }));
  return m;
}
const at = (o, x, y, z) => { o.position.set(x, y, z); return o; };

// --------------------------------------------------------------- sectional (round 9: one continuous shell)
// The frame is one upholstered shell: a back rail that runs unbroken round the L, a deck (base) under every seat, a
// slim rounded arm at the far end, and a low rolled end on the chaise. Each part is a rounded block, and the blocks
// overlap with matching profiles, so their unions read as one volume: the rails share the outer corner exactly, and
// coplanar faces are offset by a few mm (the hidden one sits inside) so nothing z-fights. Seat and back cushions are
// all one height and press into each other (slight overlap), so their seams are soft creases, not gaps.
const S = { foot: 0.06, baseTop: 0.24, seatTop: 0.45, railTop: 0.72, backT: 0.115, armW: 0.17, armTop: 0.62, gap: 0.008, lean: 0.2, press: 0.012, backH: 0.38, backTk: 0.165 };

const SIDE = 0.58;   // sofa sides stay closer to their tops in tone (photo); the chairs keep 0.42
const frame = (M, w, h, d, opt = {}) => block(M, w, h, d, { r: 0.032, bulge: 0.006, m: [6, 6, 4], shade: 0.42, ...opt });
// rounded block spanning world box [x0,x1]x[y0,y1]x[z0,z1]
const blockAt = (M, x0, y0, z0, x1, y1, z1, opt, pipe) => at(block(M, x1 - x0, y1 - y0, z1 - z0, opt, pipe), (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);

function seatCushion(M, w, d, seed) {
  const h = S.seatTop - S.baseTop;
  return block(M, w, h, d, { r: 0.07, crown: 0.03, bulge: 0.022, wrinkle: 0.003, sag: 0.034, crease: 0.016, seed, m: [24, 3, 18], shade: 0.5, k: 5, wear: 0.18, side: SIDE }, [1]);
}
// back cushion in a local frame where the rail's front face is at z=zBack and the seat runs toward +z.
// thickness along its local y (front face +y), height along z; leans back against the rail's top front edge.
function backCushion(M, w, seed, { H = S.backH, T = S.backTk, lean = S.lean, zBack = S.backT } = {}) {
  const c = block(M, w, T, H, { r: 0.056, crown: 0.028, crownB: 0.018, bulge: 0.016, wrinkle: 0.0035, seed, m: [14, 2, 10], shade: 0.32, k: 4, side: SIDE, up: [0, Math.sin(lean), -Math.cos(lean)], wear: 0.14 }, [1, -1]);
  c.rotation.x = Math.PI / 2 - lean;
  const zb = zBack + (S.railTop - S.seatTop) * Math.tan(lean) + 0.004;
  const sl = Math.sin(lean), cl = Math.cos(lean);
  c.position.set(0, S.seatTop + 0.004 + (T / 2) * sl + (H / 2) * cl, zb + (T / 2) * cl - (H / 2) * sl);
  return c;
}
// back cushion of width w centred at `along` on the north rail (runs along x) or the west rail (runs along z)
function backOn(M, wall, origin, along, w, seed) {
  const q = new THREE.Group(), b = backCushion(M, w, seed);
  q.add(b);
  if (wall === 'N') q.position.set(along, 0, origin);
  else { q.rotation.y = Math.PI / 2; q.position.set(origin, 0, along); }   // local +z (front) -> +x, local x -> -z
  return q;
}

// L-sectional. Corner (outer NW) at (cx,cz); the west run goes south to zA1 and ends in a slim arm; the north
// run (the return) goes east, backed to xB1, then a backless chaise to xB2 with a low rolled end.
export function buildSectional(M, { D = 1.0, cx = -0.3, cz = -1.55, zA1 = 1.64, xB1 = 1.5, xB2 = 2.32 } = {}) {
  const g = new THREE.Group(); g.name = 'sectional';
  const { foot, baseTop, seatTop, railTop, backT: bt, armW, armTop, press } = S;
  const xF = cx + D, zF = cz + D;               // seat fronts: west run's front x, return's front z
  const endW = 0.2, endTop = 0.53;              // chaise end roll
  // contact shadows (no overlap)
  g.add(contactShadow(xB2 - cx + 0.3, D + 0.34, (cx + xB2) / 2, cz + D / 2 + 0.02));
  g.add(contactShadow(D + 0.34, zA1 - zF + 0.15, cx + D / 2 + 0.02, (zF + zA1) / 2 + 0.07));
  // feet at the outer corners
  for (const [x, z] of [[cx + 0.06, cz + 0.06], [xB2 - 0.06, cz + 0.06], [xB2 - 0.06, zF - 0.06], [xF - 0.06, zF + 0.06], [cx + 0.06, zA1 - 0.06], [xF - 0.06, zA1 - 0.06]])
    g.add(box(0.05, foot, 0.05, M.legWood, x, foot / 2, z));
  const baseO = { r: 0.022, m: [20, 4, 6], side: SIDE };
  // deck: west run (ends inside the arm), return (starts inside the west deck, ends inside the chaise roll);
  // outer faces 1 cm inside the rail so the rail's face is the only one there
  g.add(blockAt(M, cx + 0.01, foot, cz + 0.01, xF - 0.004, baseTop, zA1 - armW + 0.04, baseO));
  g.add(blockAt(M, xF - 0.06, foot, cz + 0.01, xB2 - endW + 0.04, baseTop, zF - 0.002, baseO));
  // back rail, unbroken round the corner: the north rail owns the outer corner; the west rail starts inside it,
  // 3 mm lower, and ends inside the arm. Soft rounded top with a welt along it.
  const railO = { r: 0.038, crown: 0.004, bulge: 0.004, m: [40, 8, 4], shade: 0.34, k: 4, wear: 0.2, side: SIDE };
  g.add(blockAt(M, cx, foot, cz, xB1, railTop, cz + bt, railO, [1]));
  g.add(blockAt(M, cx, foot, cz + 0.02, cx + bt, railTop - 0.003, zA1 - armW * 0.45, { ...railO, m: [4, 8, 40] }, [1]));
  // slim track arm with a rounded top, full depth, flowing into the rail
  g.add(blockAt(M, cx + 0.002, foot, zA1 - armW, xF + 0.003, armTop, zA1, { r: 0.07, crown: 0.01, bulge: 0.006, m: [12, 6, 4], k: 5, shade: 0.36, wear: 0.2, side: SIDE }, [1]));
  // chaise end: a low rolled end, a little proud of the deck
  g.add(blockAt(M, xB2 - endW, foot, cz + 0.004, xB2, endTop, zF + 0.003, { r: 0.085, crown: 0.012, bulge: 0.008, m: [6, 6, 14], k: 5, shade: 0.36, wear: 0.2, side: SIDE }, [1]));

  // seat cushions: one height, pressed together (overlap `press`) so seams are creases
  const sy = (baseTop + seatTop) / 2 + 0.002, sd = D - bt - 0.003, P = press / 2;
  const seat = (x0, z0, x1, z1, seed) => g.add(at(seatCushion(M, x1 - x0, z1 - z0, seed), (x0 + x1) / 2, sy, (z0 + z1) / 2));
  // west run: corner seat + two seats to the arm (cushion depth runs along x)
  const zA0 = zF, zArm = zA1 - armW;
  const q = (zArm - zA0) / 2;
  seat(cx + bt, cz + bt, xF - 0.003, zF + P, 3);
  for (let i = 0; i < 2; i++) {
    const c = at(seatCushion(M, q + press, sd, 11 + i), cx + bt + sd / 2, sy, zA0 + q * (i + 0.5));
    c.rotation.y = Math.PI / 2; g.add(c);
  }
  // return: one seat to xB1, chaise seat on to the roll
  seat(xF - P, cz + bt, xB1 + P, zF - 0.003, 21);
  seat(xB1 - P, cz + 0.012, xB2 - endW + 0.01, zF - 0.003, 31);   // backless: full depth

  // back cushions, all one height and lean, touching
  const zb = bt + (railTop - seatTop) * Math.tan(S.lean) + S.backTk * 0.6;   // depth taken by a back cushion
  // north (return + corner): from the west cushion's front to the rail end (cushion overhangs the end a little)
  const n0 = cx + zb, n1 = xB1 + 0.05, nl = (n1 - n0) / 3;
  for (let i = 0; i < 3; i++) g.add(backOn(M, 'N', cz, n0 + nl * (i + 0.5), nl + press, 6 + i * 8));
  // west: corner cushion + two along the run, up to the arm
  const w0 = cz + zb, w1 = zArm - 0.002, wl = (w1 - w0) / 3;
  for (let i = 0; i < 3; i++) g.add(backOn(M, 'W', cx, w0 + wl * (i + 0.5), wl + press, 13 + i * 3));
  return g;
}

// --------------------------------------------------------------- club chair (faces +z), round 3-5 proportions
export function clubChair(M, { W = 0.84, D = 0.9, H = 0.82, seatH = 0.47, armH = 0.63, armW = 0.13, legH = 0.14 } = {}) {
  const g = new THREE.Group(), G = S.gap;
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const l = mesh(new THREE.CylinderGeometry(0.018, 0.011, legH, 10), M.legWood);
    l.position.set(x * (W / 2 - 0.05), legH / 2, z * (D / 2 - 0.06)); l.rotation.z = -x * 0.08; l.rotation.x = z * 0.08; g.add(l);
  }
  g.add(contactShadow(W + 0.28, D + 0.28, 0, 0, { opacity: 0.8 }));
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(contactShadow(0.16, 0.16, x * (W / 2 - 0.05), z * (D / 2 - 0.06), { y: 0.0145 }));
  const y0 = legH, deck = 0.15, bt = 0.17;
  const iw = W - 2 * (armW + G);
  // deck between the arms, crisp outer back, track arms
  g.add(at(frame(M, iw, deck, D - bt - G, { r: 0.02 }), 0, y0 + deck / 2, (bt + G) / 2));
  g.add(at(frame(M, W, H - y0, bt, { r: 0.05, crown: 0.01, m: [8, 6, 2] }), 0, y0 + (H - y0) / 2, -D / 2 + bt / 2));
  for (const s of [-1, 1]) g.add(at(frame(M, armW, armH - y0, D - bt - G, { r: 0.05, crown: 0.01, m: [3, 6, 8] }), s * (W / 2 - armW / 2), y0 + (armH - y0) / 2, (bt + G) / 2));
  // single seat cushion
  const sh = seatH - (y0 + deck), lean = 0.12, zb = -D / 2 + bt + 0.03;
  const sc = block(M, iw - G, sh, D - bt - 0.035, { r: 0.026, crown: 0.012, bulge: 0.005, wrinkle: 0.0015, seed: 5, m: [8, 2, 8], shade: 0.4 }, [1, -1]);
  g.add(at(sc, 0, y0 + deck + sh / 2 + 0.002, (zb + D / 2) / 2 + 0.0));
  // back cushion leaning on the back
  const BH = 0.36, BT = 0.15;
  const bc = block(M, iw - G, BT, BH, { r: 0.03, crown: 0.022, bulge: 0.006, wrinkle: 0.002, seed: 9, m: [8, 2, 8], shade: 0.15, up: [0, Math.sin(lean), -Math.cos(lean)] }, [1]);
  bc.rotation.x = Math.PI / 2 - lean;
  const sl = Math.sin(lean), cl = Math.cos(lean);
  bc.position.set(0, seatH + 0.006 + (BT / 2) * sl + (BH / 2) * cl, -D / 2 + bt + 0.005 + (BT / 2) * cl - (BH / 2) * sl + 0.04);
  g.add(bc);
  // no clearcoat on the chairs: at their grazing view angle it mirrors the bright windows as a grey wash
  M.chairLeather = M.chairLeather || Object.assign(M.sofaLeather.clone(), { clearcoat: 0, envMapIntensity: 0.4, specularIntensity: 0.35, color: new THREE.Color(1.9, 1.6, 1.12),
    onBeforeCompile: M.sofaLeather.onBeforeCompile, customProgramCacheKey: M.sofaLeather.customProgramCacheKey });
  // lift the baked side/underside shade on the chairs: the photo's chair sides stay close to their tops in tone
  g.traverse((o) => {
    if (o.material !== M.sofaLeather) return;
    o.material = M.chairLeather;
    const c = o.geometry.attributes.color;
    if (c) for (let i = 0; i < c.array.length; i++) c.array[i] = Math.pow(c.array[i], 0.62);
  });
  return g;
}
