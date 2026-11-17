// Track = data (a centre line from the lift top down to the lift bottom, its theme, its pins) → one generator builds the
// 3D trough (banked in corners), the physics mesh, the neon rails, the pillars and the lift. 24 tracks later = 24 entries
// like SEOUL below; nothing else changes.
import * as THREE from "three";

export const SEOUL = {
  name: "Seoul Neon Circuit",
  // [x, height, z]: one descending lap; the last point sits right under the first (the lift joins them)
  points: [
    [0, 30.4, 0], [12, 29.4, 0], [24, 28.2, 2], [30, 26.8, 8], [28, 25.2, 16], [20, 24, 18], [12, 22.6, 14],
    [6, 21.3, 18], [0, 20.2, 26], [-10, 18.4, 28], [-20, 16.7, 22], [-22, 15, 12], [-16, 13.3, 6], [-24, 11.4, -2],
    [-20, 9.5, -12], [-8, 7.6, -14], [4, 5.6, -10], [9, 3.7, -4], [5, 2, -1], [0, 1, 0],
  ],
  width: 2.6, wall: 0.95,
  pins: [{ at: 0.46, u: 0.05 }, { at: 0.49, u: -0.08 }, { at: 0.8, u: 0.06 }, { at: 0.83, u: -0.05 }], // single pins near the middle of straights: a wide way past on both sides
  theme: { sky: ["#05010d", "#2a0730", "#7d0018"], wall: "#7d0018", wallDark: "#3a0612", floor: "#1a1b26", floorAlt: "#22232f", kerb: ["#ff4d63", "#f2f2f2"], rail: "#ff4d63", rail2: "#9fd8ff", pillar: "#2b2d3a", ground: "#0b0408", glow: "#ff4d63" },
};

const SAMPLES = 720;
const MAX_BANK = 0.6; // tan of the steepest bank (~31°)

export function buildTrack(def) {
  const curve = new THREE.CatmullRomCurve3(def.points.map((p) => new THREE.Vector3(...p)), false, "centripetal");
  const pts = curve.getSpacedPoints(SAMPLES);
  const n = pts.length;
  const step = curve.getLength() / SAMPLES;
  const T = pts.map((_, i) => pts[Math.min(i + 1, n - 1)].clone().sub(pts[Math.max(i - 1, 0)]).normalize());

  // banking: lean the floor's normal toward the centre of the corner, smoothed so it rolls in and out
  const raw = T.map((_, i) => {
    const k = T[Math.min(i + 3, n - 1)].clone().sub(T[Math.max(i - 3, 0)]).divideScalar(6 * step);
    return new THREE.Vector3(k.x, 0, k.z).multiplyScalar(2.2);
  });
  const lean = raw.map((_, i) => {
    const sum = new THREE.Vector3();
    let c = 0;
    for (let j = Math.max(0, i - 12); j <= Math.min(n - 1, i + 12); j++, c++) sum.add(raw[j]);
    sum.divideScalar(c);
    return sum.length() > MAX_BANK ? sum.setLength(MAX_BANK) : sum;
  });
  const up = [], side = [];
  for (let i = 0; i < n; i++) {
    const u = new THREE.Vector3(0, 1, 0).add(lean[i]).normalize();
    const s = new THREE.Vector3().crossVectors(T[i], u).normalize();
    side.push(s);
    up.push(new THREE.Vector3().crossVectors(s, T[i]).normalize());
  }

  // the trough's cross-section (u across, v up): wall, slope, kerb, floor, kerb, slope, wall
  const W = def.width / 2;
  const prof = [[-W, def.wall], [-W, 0.3], [-W + 0.35, 0], [-W + 0.6, 0], [W - 0.6, 0], [W - 0.35, 0], [W, 0.3], [W, def.wall]];
  const P = prof.length;
  const at = (i, u, v) => pts[i].clone().addScaledVector(side[i], u).addScaledVector(up[i], v);
  const positions = new Float32Array(n * P * 3);
  for (let i = 0; i < n; i++) prof.forEach(([u, v], k) => at(i, u, v).toArray(positions, (i * P + k) * 3));
  const indices = [];
  for (let i = 0; i < n - 1; i++) for (let k = 0; k < P - 1; k++) {
    const a = i * P + k, b = a + 1, c = a + P, d = c + 1;
    indices.push(a, b, c, b, d, c); // wound so the normal points up into the trough (the physics mesh is one-sided)
  }

  // render mesh: flat colours per strip (walls, kerbs striped in corners, floor in bands, a checker at the start)
  const th = def.theme, col = (h) => new THREE.Color(h);
  const C = { wall: col(th.wall), dark: col(th.wallDark), floor: col(th.floor), alt: col(th.floorAlt), k1: col(th.kerb[0]), k2: col(th.kerb[1]), white: col("#f4f4f4"), black: col("#111") };
  const vpos = [], vcol = [];
  for (let i = 0; i < n - 1; i++) {
    const corner = lean[i].length() > 0.12;
    for (let k = 0; k < P - 1; k++) {
      let c = k === 0 || k === P - 2 ? C.wall : k === 1 || k === P - 3 ? C.dark : k === 3 ? (Math.floor(i / 24) % 2 ? C.alt : C.floor) : corner ? (Math.floor(i / 3) % 2 ? C.k1 : C.k2) : C.floor;
      if (k === 3 && i >= n - 8) c = (Math.floor(i / 2) + Math.floor(k)) % 2 ? C.white : C.black; // the lap line before the lift
      const quad = [i * P + k, i * P + k + 1, (i + 1) * P + k, i * P + k + 1, (i + 1) * P + k + 1, (i + 1) * P + k];
      for (const q of quad) { vpos.push(positions[q * 3], positions[q * 3 + 1], positions[q * 3 + 2]); vcol.push(c.r, c.g, c.b); }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vpos, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(vcol, 3));
  geometry.computeVertexNormals();

  const rail = (u) => new THREE.CatmullRomCurve3(Array.from({ length: Math.ceil(n / 4) }, (_, j) => at(Math.min(j * 4, n - 1), u, def.wall + 0.05)));
  const pins = def.pins.map(({ at: f, u }) => { const i = Math.round(f * (n - 1)); return { pos: at(i, u * W, 0.45), up: up[i].clone() }; });
  const pillars = [];
  for (let i = 10; i < n - 10; i += 16) pillars.push(pts[i].clone().addScaledVector(up[i], -0.05));

  return {
    def, curve, pts, T, side, up, n, step, length: curve.getLength(), positions, indices: new Uint32Array(indices), geometry,
    rails: [rail(-W - 0.02), rail(W + 0.02)], pins, pillars, minY: Math.min(...pts.map((p) => p.y)),
    lane: (i, u, v) => at(Math.max(0, Math.min(n - 1, i)), u, v),
  };
}

// The track sample nearest to a position, searched around the last known one (a marble only moves forward a little per step).
export function nearestIndex(track, p, guess) {
  let best = guess, bestD = Infinity;
  for (let i = Math.max(0, guess - 12); i <= Math.min(track.n - 1, guess + 40); i++) {
    const d = track.pts[i].distanceToSquared(p);
    if (d < bestD) { bestD = d; best = i; }
  }
  return { i: best, d: Math.sqrt(bestD) };
}
