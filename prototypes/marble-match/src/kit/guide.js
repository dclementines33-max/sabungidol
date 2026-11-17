// The guide: one line of samples through a whole arena (troughs, boards, funnels, both branches of a fork), each with its
// distance from the start (prog). Used for positions, the finish, respawns, the edge's push and the cameras — never for
// collisions. A branch section = two paths that cover the same stretch of progress.
import * as THREE from "three";

const STEP = 0.26; // metres between samples

// A path section through points (no collider): spaced samples with a frame (side, up) — up leans into corners if banked.
export function pathSection(points, { bank = 0, closed = false } = {}) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => (p.isVector3 ? p : new THREE.Vector3(...p))), closed, "centripetal");
  const n = Math.max(8, Math.round(curve.getLength() / STEP));
  const pts = curve.getSpacedPoints(n);
  const T = pts.map((_, i) => pts[Math.min(i + 1, pts.length - 1)].clone().sub(pts[Math.max(i - 1, 0)]).normalize());
  const step = curve.getLength() / n;
  const raw = T.map((_, i) => {
    const k = T[Math.min(i + 3, T.length - 1)].clone().sub(T[Math.max(i - 3, 0)]).divideScalar(6 * step);
    return new THREE.Vector3(k.x, 0, k.z).multiplyScalar(2.2);
  });
  const lean = raw.map((_, i) => {
    const sum = new THREE.Vector3();
    let c = 0;
    for (let j = Math.max(0, i - 12); j <= Math.min(T.length - 1, i + 12); j++, c++) sum.add(raw[j]);
    sum.divideScalar(c);
    return sum.length() > bank ? sum.setLength(bank) : sum;
  });
  const up = [], side = [];
  for (let i = 0; i < pts.length; i++) {
    const u = new THREE.Vector3(0, 1, 0).add(lean[i]).normalize();
    const s = new THREE.Vector3().crossVectors(T[i], u).normalize();
    side.push(s);
    up.push(new THREE.Vector3().crossVectors(s, T[i]).normalize());
  }
  return { pts, T, side, up, lean, n: pts.length, step, length: curve.getLength() };
}

// Joins sections (and { branches: [a, b] }) into one guide.
export function makeGuide(sections) {
  const g = { pts: [], T: [], side: [], up: [], prog: [] };
  let at = 0;
  for (const s of sections) {
    const parts = s.branches ?? [s];
    const span = Math.max(...parts.map((p) => p.length));
    for (const p of parts) {
      p.base = g.pts.length; // where this section starts in the guide (boost pads find their stretch through it)
      for (let i = 0; i < p.n; i++) {
        g.pts.push(p.pts[i]); g.T.push(p.T[i]); g.side.push(p.side[i]); g.up.push(p.up[i]);
        g.prog.push(at + (i / (p.n - 1)) * span);
      }
    }
    at += span;
  }
  g.n = g.pts.length;
  g.total = at;
  g.minY = Math.min(...g.pts.map((p) => p.y));
  g.lane = (i, u, v) => { const k = Math.max(0, Math.min(g.n - 1, i)); return g.pts[k].clone().addScaledVector(g.side[k], u).addScaledVector(g.up[k], v); };
  // nearest sample, only among those a little behind to well ahead of the progress so far (a spiral's turns, the
  // two branches and a lap that passes under its own start never confuse it)
  g.nearest = (p, prog) => {
    let best = 0, bestD = Infinity;
    for (let i = 0; i < g.n; i++) {
      if (g.prog[i] < prog - 8 || g.prog[i] > prog + 30) continue;
      const d = g.pts[i].distanceToSquared(p);
      if (d < bestD) { bestD = d; best = i; }
    }
    return { i: best, d: Math.sqrt(bestD) };
  };
  return g;
}
