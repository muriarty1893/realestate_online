// Roof blocks: gable / hip / open-ended prisms that interpenetrate to form valleys.
// Each block is described in a local frame (a = along the ridge, b = across it) and mapped to world.
import * as THREE from 'three';
import { V3, clip, slopeUV, wallUV, polyNormal } from './util.js';

// spec: { ridge:'x'|'z', a0,a1,b0,b1 (wall-line extents), ys (roof surface at wall line), pitch,
//         ov (eave overhang), rake (gable overhang), ends:[lo,hi] 'gable'|'hip'|'none', hipRun:[lo,hi],
//         gableBottom: y where the gable wall starts, gableStyle:[lo,hi] }
export function roofBlock(spec) {
  const { ridge = 'x', a0, a1, b0, b1, ys, pitch: p, ov = 0.4, rake = 0.3, ends = ['gable', 'gable'] } = spec;
  const s = (b1 - b0) / 2, bc = (b0 + b1) / 2, H = ys + s * p, ye = ys - ov * p;
  const W = (a, y, b) => (ridge === 'x' ? V3(a, y, b) : V3(b, y, a));
  const endInfo = (which) => {
    const kind = ends[which];
    const aw = which === 0 ? a0 : a1, sg = which === 0 ? -1 : 1; // sg: outward along a
    if (kind === 'gable') return { kind, aE: aw + sg * rake, aR: aw + sg * rake, aw, sg };
    if (kind === 'hip') {
      const hr = spec.hipRun?.[which] ?? s;
      const ph = (H - ys) / hr, ovh = (ov * p) / ph;
      return { kind, aE: aw + sg * ovh, aR: aw - sg * hr, aw, sg, ph, ovh };
    }
    return { kind: 'none', aE: aw, aR: aw, aw, sg };
  };
  const L = endInfo(0), R = endInfo(1);
  const out = { spec, H, ye, planes: [], gables: [], eaves: [], rakes: [], ridges: [], hips: [], W, s, bc };
  const up = (pts) => { const n = polyNormal(pts); if (n.y < 0) { pts.reverse(); n.negate(); } return { pts, n }; };
  const dedupe = (pts) => pts.filter((q, i) => q.distanceTo(pts[(i + 1) % pts.length]) > 1e-4);
  // long sides
  out.planes.push({ side: 'b1', ...up(dedupe([W(L.aE, ye, b1 + ov), W(R.aE, ye, b1 + ov), W(R.aR, H, bc), W(L.aR, H, bc)])) });
  out.planes.push({ side: 'b0', ...up(dedupe([W(R.aE, ye, b0 - ov), W(L.aE, ye, b0 - ov), W(L.aR, H, bc), W(R.aR, H, bc)])) });
  out.eaves.push({ side: 'b1', a: [L.aE, R.aE], p0: W(L.aE, ye, b1 + ov), p1: W(R.aE, ye, b1 + ov), out: W(0, 0, 1), y: ye, depth: ov });
  out.eaves.push({ side: 'b0', a: [L.aE, R.aE], p0: W(L.aE, ye, b0 - ov), p1: W(R.aE, ye, b0 - ov), out: W(0, 0, -1), y: ye, depth: ov });
  out.ridges.push([W(L.aR, H, bc), W(R.aR, H, bc)]);
  for (const E of [L, R]) {
    const which = E === L ? 'lo' : 'hi';
    if (E.kind === 'hip') {
      out.planes.push({ side: which, ...up([W(E.aE, ye, b0 - ov), W(E.aE, ye, b1 + ov), W(E.aR, H, bc)]) });
      out.eaves.push({ side: which, a: [b0 - ov, b1 + ov], p0: W(E.aE, ye, b0 - ov), p1: W(E.aE, ye, b1 + ov), out: W(E.sg, 0, 0), y: ye, depth: E.ovh });
      out.hips.push([W(E.aE, ye, b0 - ov), W(E.aR, H, bc)], [W(E.aE, ye, b1 + ov), W(E.aR, H, bc)]);
    } else if (E.kind === 'gable') {
      const yb = spec.gableBottom ?? ys - 0.25;
      const pts = [W(E.aw, yb, b0), W(E.aw, yb, b1), W(E.aw, ys - 0.04, b1), W(E.aw, H - 0.04, bc), W(E.aw, ys - 0.04, b0)];
      // outward normal along a
      const n = polyNormal(pts); const want = W(E.sg, 0, 0);
      if (n.dot(want) < 0) pts.reverse();
      out.gables.push({ side: which, pts, n: want, style: spec.gableStyle?.[which === 'lo' ? 0 : 1] ?? 'stucco' });
      out.rakes.push({ side: which, p0: W(E.aE, ye, b0 - ov), p1: W(E.aE, H, bc), out: W(E.sg, 0, 0), aw: E.aw });
      out.rakes.push({ side: which, p0: W(E.aE, H, bc), p1: W(E.aE, ye, b1 + ov), out: W(E.sg, 0, 0), aw: E.aw });
    }
  }
  return out;
}

// write a block's surfaces into Geo buckets. opts: { clipper(pts)->[pts...], eaveRanges:{side:[[a0,a1],...]}, rakeSides:[..], noRidge }
export function emitRoof(geo, blk, M, opts = {}) {
  const { W, spec } = blk;
  for (const pl of blk.planes) {
    const pieces = opts.clipper ? opts.clipper(pl.pts) : [pl.pts];
    const uvf = slopeUV(pl.n);
    for (const pts of pieces) if (pts.length >= 3) geo.poly(opts.mat || M.shingle, pts, uvf, pl.n);
  }
  // gable walls are emitted by the cladding module (style dependent); keep them on the block
  const FH = opts.fasciaH ?? 0.2;
  for (const e of blk.eaves) {
    const ranges = opts.eaveRanges?.[e.side] ?? (opts.eaveRanges ? [] : [e.a]);
    for (const [r0, r1] of ranges) {
      const lo = Math.max(Math.min(r0, r1), Math.min(...e.a)), hi = Math.min(Math.max(r0, r1), Math.max(...e.a));
      if (hi - lo < 0.02) continue;
      const along = new THREE.Vector3().subVectors(e.p1, e.p0).normalize();
      const at = (t) => { // point on the eave line at local 'a' coordinate t (or b for hip eaves)
        const k = (t - e.a[0]) / (e.a[1] - e.a[0]);
        return e.p0.clone().lerp(e.p1, k);
      };
      const pa = at(lo), pb = at(hi);
      eaveTrim(geo, M, pa, pb, e.out, e.y, e.depth, FH, opts.gutter !== false);
    }
  }
  if (opts.rakes !== false) for (const r of blk.rakes) rakeTrim(geo, M, r, blk, FH);
  if (!opts.noRidge) for (const [a, b] of blk.ridges) if (a.distanceTo(b) > 0.05) geo.beam(M.ridgeCap, a.clone().add(V3(0, 0.035, 0)), b.clone().add(V3(0, 0.035, 0)), 0.26, 0.06);
  if (!opts.noHipCaps) for (const [a, b] of blk.hips) {
    // keep only the parts of the hip line the clipper keeps: a hip that dies into another roof must not run on
    // underneath it (the main roof's west hip used to hang into the master bedroom)
    let segs = [[a.clone(), b.clone()]];
    if (opts.clipper) {
      const d = b.clone().sub(a), L2 = d.lengthSq();
      segs = opts.clipper([a.clone(), b.clone(), b.clone().add(V3(0, 0.001, 0))]).map((pc) => {
        const ts = pc.map((q) => q.clone().sub(a).dot(d) / L2);
        return [a.clone().addScaledVector(d, Math.max(0, Math.min(...ts))), a.clone().addScaledVector(d, Math.min(1, Math.max(...ts)))];
      }).filter(([p, q]) => p.distanceTo(q) > 0.05);
    }
    for (const [p, q] of segs) geo.beam(M.ridgeCap, p.add(V3(0, 0.03, 0)), q.add(V3(0, 0.03, 0)), 0.24, 0.05);
  }
}

// fascia + gutter + horizontal soffit along an eave segment
export function eaveTrim(geo, M, pa, pb, out, y, depth, FH = 0.2, gutter = true) {
  const o = out.clone().normalize();
  const t = 0.03;
  const A = pa.clone().addScaledVector(o, t / 2), B = pb.clone().addScaledVector(o, t / 2);
  A.y = B.y = y + 0.02 - FH / 2;
  geo.beam(M.bronze, A, B, t, FH);
  // soffit: from the fascia back to the wall line
  const yS = y + 0.02 - FH + 0.005;
  const back = (q) => q.clone().addScaledVector(o, -depth);
  const s0 = pa.clone(), s1 = pb.clone(), s2 = back(pb), s3 = back(pa);
  for (const q of [s0, s1, s2, s3]) q.y = yS;
  const pts = [s0, s1, s2, s3];
  const n = polyNormal(pts); if (n.y > 0) pts.reverse();
  geo.poly(M.soffit, pts, (q) => [q.x, q.z]);
  if (gutter) {
    const G0 = pa.clone().addScaledVector(o, t + 0.065), G1 = pb.clone().addScaledVector(o, t + 0.065);
    G0.y = G1.y = y - 0.075;
    geo.beam(M.bronze, G0, G1, 0.13, 0.12);
  }
}

function rakeTrim(geo, M, r, blk, FH) {
  const o = r.out.clone().normalize();
  const t = 0.035;
  const dir = new THREE.Vector3().subVectors(r.p1, r.p0);
  const len = dir.length(); dir.normalize();
  // board perpendicular to the slope, top flush with the shingles (+3 cm)
  const perp = new THREE.Vector3().crossVectors(o, dir).normalize();
  if (perp.y < 0) perp.negate();
  const c0 = r.p0.clone().addScaledVector(o, t / 2).addScaledVector(perp, 0.03 - FH / 2);
  const c1 = r.p1.clone().addScaledVector(o, t / 2).addScaledVector(perp, 0.03 - FH / 2);
  // extend slightly at both ends
  c0.addScaledVector(dir, -0.02); c1.addScaledVector(dir, 0.02);
  geo.beam(M.bronze, c0, c1, t, FH, perp);
  // sloped soffit under the rake overhang (from the rake board back to the gable wall)
  const back = (q) => q.clone().addScaledVector(o, -(Math.abs((q.x - r.aw) * o.x + (q.z - r.aw) * o.z) > 0 ? 0 : 0));
  const d0 = r.p0.clone().addScaledVector(perp, 0.03 - FH + 0.005), d1 = r.p1.clone().addScaledVector(perp, 0.03 - FH + 0.005);
  const rakeDepth = Math.abs(o.x ? d0.x - r.aw : d0.z - r.aw);
  const e0 = d0.clone().addScaledVector(o, -rakeDepth), e1 = d1.clone().addScaledVector(o, -rakeDepth);
  const pts = [d0, d1, e1, e0];
  const n = polyNormal(pts); if (n.y > 0) pts.reverse();
  geo.poly(M.soffit, pts, (q) => [q.x + q.z, q.y]);
  void back; void len; void blk;
}

// clipper that removes the parts of a polygon hidden under a gable roof running along z
// (ridge at x = xr, height H, pitch p) inside its footprint x < xEdge
export function underGableZClipper({ xr, H, p, xEdge }) {
  return (pts) => {
    const res = [];
    const A = clip(pts.map((q) => q.clone()), (q) => q.x - xEdge);
    if (A.length >= 3) res.push(A);
    const B = clip(clip(clip(pts.map((q) => q.clone()), (q) => xEdge - q.x), (q) => q.x - xr), (q) => q.y - (H - (q.x - xr) * p));
    if (B.length >= 3) res.push(B);
    const C = clip(clip(clip(pts.map((q) => q.clone()), (q) => xEdge - q.x), (q) => xr - q.x), (q) => q.y - (H + (q.x - xr) * p));
    if (C.length >= 3) res.push(C);
    return res;
  };
}
