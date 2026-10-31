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
export function upholsteryGeo(w, h, d, { r = 0.025, crown = 0, crownB = 0, bulge = 0, wrinkle = 0, seed = 1, k = 3, m = [8, 2, 6], shade = 0.3, p = 2.5, up = [0, 1, 0] } = {}) {
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
    const X = P[0] + bulge * fx * n[0], Y = P[1] + dy + wr, Z = P[2] + bulge * fz * n[2];
    // under-cushion shade: darker low on the sides and on the bottom
    const ndu = n[0] * up[0] + n[1] * up[1] + n[2] * up[2];
    const t = (P[0] * up[0] + P[1] * up[1] + P[2] * up[2] + ext) / (2 * ext);
    let c = 1 - shade * Math.pow(1 - t, 2);
    if (ndu < -0.5) c *= 0.55;
    c *= 0.5 + 0.5 * Math.max(0, ndu);
    col[v * 3] = c; col[v * 3 + 1] = c * 0.98; col[v * 3 + 2] = c * 0.96;
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

// --------------------------------------------------------------- sectional parts
// Local frame for every part: seat runs along +x from 0..L, outer back at z=0, front at z=D, y up.
const S = { foot: 0.06, baseTop: 0.3, seatTop: 0.46, backTop: 0.66, backT: 0.18, armW: 0.2, armTop: 0.63, gap: 0.008, lean: 0.18 };

function feet(M, g, L, D) {
  for (const [x, z] of [[0.06, 0.06], [L - 0.06, 0.06], [0.06, D - 0.06], [L - 0.06, D - 0.06]]) g.add(box(0.05, S.foot, 0.05, M.legWood, x, S.foot / 2, z));
}
function seatCushion(M, w, d, seed) {
  const h = S.seatTop - S.baseTop;
  return block(M, w, h, d, { r: 0.042, crown: 0.022, bulge: 0.012, wrinkle: 0.002, seed, m: [10, 2, 8], shade: 0.4, k: 4 }, [1, -1]);
}
// back cushion: thickness along its local y (front face +y), height along z. Leans back against the frame top.
function backCushion(M, w, seed, { H = 0.4, T = 0.21, lean = S.lean, zBack = S.backT } = {}) {
  const c = block(M, w, T, H, { r: 0.065 + 0.04 * (lean - S.lean), crown: 0.045, crownB: 0.03 + 0.08 * (lean - S.lean), bulge: 0.018, wrinkle: 0.0025, seed, m: [10, 2, 8], shade: 0.15, k: 4, up: [0, Math.sin(lean), -Math.cos(lean)] }, [1, -1]);
  c.rotation.x = Math.PI / 2 - lean;
  // the back face touches the frame's top front edge; the bottom rests on the seat cushions
  const zb = zBack + (S.backTop - S.seatTop) * Math.tan(lean) + 0.005;
  const sl = Math.sin(lean), cl = Math.cos(lean);
  c.position.set(0, S.seatTop + 0.006 + (T / 2) * sl + (H / 2) * cl, zb + (T / 2) * cl - (H / 2) * sl);
  return c;
}
const frame = (M, w, h, d, opt = {}) => block(M, w, h, d, { r: 0.032, bulge: 0.008, m: [6, 6, 4], shade: 0.25, ...opt });

function section(M, L, { D = 1.0, armL = false, armR = false, seats = 1, seed = 1, lean = S.lean, endGap = [true, true], armTopR = S.armTop, armWR = S.armW } = {}) {
  const g = new THREE.Group(), G = S.gap;
  g.add(contactShadow(L + 0.3, D + 0.34, L / 2, D / 2 + 0.02));
  feet(M, g, L, D);
  const e0 = endGap[0] ? G / 2 : 0, e1 = endGap[1] ? G / 2 : 0;
  const x0 = armL ? S.armW + G : e0, x1 = L - (armR ? armWR + G : e1);
  const bh = S.baseTop - S.foot, fh = S.backTop - S.foot;
  // base (seat deck) and outer back between the arms
  g.add(at(frame(M, x1 - x0, bh, D - S.backT, { r: 0.02 }), (x0 + x1) / 2, S.foot + bh / 2, S.backT + (D - S.backT) / 2));
  g.add(at(frame(M, x1 - x0, fh, S.backT, { crown: 0.006 }), (x0 + x1) / 2, S.foot + fh / 2, S.backT / 2));
  // tailored track arms, full depth, to the floor line
  const ah = S.armTop - S.foot;
  if (armL) g.add(at(frame(M, S.armW, ah, D, { crown: 0.012, r: 0.045, m: [4, 6, 8] }), S.armW / 2, S.foot + ah / 2, D / 2));
  const ahR = armTopR - S.foot;
  if (armR) g.add(at(frame(M, armWR, ahR, D, { crown: armWR > 0.3 ? 0.025 : 0.012, r: 0.045, m: [6, 6, 8] }), L - armWR / 2, S.foot + ahR / 2, D / 2));
  // seat + back cushions
  const sw = (x1 - x0) / seats, zb = S.backT + (S.backTop - S.seatTop) * Math.tan(S.lean);
  for (let i = 0; i < seats; i++) {
    const cx = x0 + sw * (i + 0.5);
    g.add(at(seatCushion(M, sw - G, D - S.backT - G - 0.003, seed + i), cx, (S.baseTop + S.seatTop) / 2 + 0.002, (S.backT + G + D - 0.003) / 2));
    const b = backCushion(M, sw - G, seed + 10 + i, { lean }); b.position.x = cx; g.add(b);
  }
  return g;
}

// square corner: backs on z=0 and x=0
function corner(M, D = 1.0, seed = 3) {
  const g = new THREE.Group(), G = S.gap;
  g.add(contactShadow(D + 0.3, D + 0.3, D / 2, D / 2));
  feet(M, g, D, D);
  const bh = S.baseTop - S.foot, fh = S.backTop - S.foot;
  const L1 = D - G / 2;   // joins neighbours on x=D and z=D
  g.add(at(frame(M, L1 - S.backT, bh, L1 - S.backT, { r: 0.02 }), S.backT + (L1 - S.backT) / 2, S.foot + bh / 2, S.backT + (L1 - S.backT) / 2));
  g.add(at(frame(M, L1, fh, S.backT, { crown: 0.006 }), L1 / 2, S.foot + fh / 2, S.backT / 2));
  g.add(at(frame(M, S.backT, fh, L1 - S.backT - 0.004, { crown: 0.006 }), S.backT / 2, S.foot + fh / 2, S.backT + 0.002 + (L1 - S.backT) / 2));
  const zb = S.backT + (S.backTop - S.seatTop) * Math.tan(S.lean), s0 = S.backT + G, s = L1 - s0 - G / 2;
  g.add(at(seatCushion(M, s, s, seed), s0 + s / 2, (S.baseTop + S.seatTop) / 2 + 0.002, s0 + s / 2));
  // north back cushion spans the full seat; the west one butts against its front face
  const T = 0.2;
  const b1 = backCushion(M, L1 - zb - G, seed + 5); b1.position.x = zb + (L1 - zb) / 2; g.add(b1);
  const w2 = L1 - (zb + T + 0.02);
  const b2 = backCushion(M, w2 - G, seed + 6);
  // built for a back on z=0; a +90° turn about y maps its +z (front) to +x
  const q = new THREE.Group(); q.rotation.y = Math.PI / 2; q.position.set(0, 0, zb + T + 0.02 + w2 / 2);
  q.add(b2); g.add(q);
  return g;
}

// backless, armless chaise end
function bumper(M, L, D = 1.0, seed = 31) {
  const g = new THREE.Group(), G = S.gap;
  g.add(contactShadow(L + 0.3, D + 0.34, L / 2, D / 2 + 0.02));
  feet(M, g, L, D);
  const bh = S.baseTop - S.foot;
  g.add(at(frame(M, L - G / 2, bh, D, { r: 0.022 }), G / 2 + (L - G / 2) / 2, S.foot + bh / 2, D / 2));
  g.add(at(seatCushion(M, L - G / 2 - 0.01, D - 0.01, seed), G / 2 + (L - G / 2) / 2, (S.baseTop + S.seatTop) / 2 + 0.002, D / 2));
  return g;
}

// Builds the L-sectional at round 5's footprint: corner at (cx,cz), section A south along x=cx..cx+D,
// section B east along z=cz..cz+D to xB1, then the chaise end to xB2.
export function buildSectional(M, { D = 1.0, cx = -0.3, cz = -1.55, zA1 = 1.64, xB1 = 1.75, xB2 = 2.32 } = {}) {
  const g = new THREE.Group(); g.name = 'sectional';
  const c = corner(M, D); c.position.set(cx, 0, cz); g.add(c);
  const LA = zA1 - (cz + D);
  const A = section(M, LA, { D, armL: true, seats: 2, seed: 11 });
  A.rotation.y = Math.PI / 2; A.position.set(cx, 0, cz + D + LA); g.add(A);
  // return: one seat and back cushion, ending in a wide, low arm (the photo's near end under the knit throw)
  const B = section(M, xB2 - (cx + D), { D, seats: 1, seed: 21, lean: 0.42, armR: true, armTopR: 0.56, armWR: 0.55 });
  B.position.set(cx + D, 0, cz); g.add(B);
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
  M.chairLeather = M.chairLeather || Object.assign(M.sofaLeather.clone(), { clearcoat: 0, envMapIntensity: 0.3, specularIntensity: 0.3 });
  g.traverse((o) => { if (o.material === M.sofaLeather) o.material = M.chairLeather; });
  return g;
}
