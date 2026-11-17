// A trough: the U-shaped marble run along a path — banked in corners, kerbs striped in corners, the floor in bands, a
// checker at the finish — as one render mesh and one physics mesh, plus neon rails on both walls. Width and wall height
// may change along the way (a function of 0…1), e.g. a wide landing after a jump.
import * as THREE from "three";
import { pathSection } from "./guide.js";

export function troughGeometry(sec, { width = 2.6, wall = 0.95, theme, checker = null }) {
  const W = (f) => (typeof width === "function" ? width(f) : width) / 2;
  const H = (f) => (typeof wall === "function" ? wall(f) : wall);
  const profile = (f) => { const w = W(f), h = H(f); return [[-w, h], [-w, 0.3], [-w + 0.35, 0], [-w + 0.6, 0], [w - 0.6, 0], [w - 0.35, 0], [w, 0.3], [w, h]]; };
  const P = 8, n = sec.n;
  const at = (i, u, v) => sec.pts[i].clone().addScaledVector(sec.side[i], u).addScaledVector(sec.up[i], v);
  const positions = new Float32Array(n * P * 3);
  for (let i = 0; i < n; i++) profile(i / (n - 1)).forEach(([u, v], k) => at(i, u, v).toArray(positions, (i * P + k) * 3));
  const indices = [];
  for (let i = 0; i < n - 1; i++) for (let k = 0; k < P - 1; k++) {
    const a = i * P + k, b = a + 1, c = a + P, d = c + 1;
    indices.push(a, b, c, b, d, c); // normal up into the trough: the physics mesh is one-sided
  }
  const col = (h) => new THREE.Color(h);
  const C = { wall: col(theme.wall), dark: col(theme.wallDark), floor: col(theme.floor), alt: col(theme.floorAlt), k1: col(theme.kerb[0]), k2: col(theme.kerb[1]), w: col("#f4f4f4"), b: col("#111") };
  const vpos = [], vcol = [];
  for (let i = 0; i < n - 1; i++) {
    const corner = sec.lean[i].length() > 0.12;
    const chk = (checker === "end" && i >= n - 8) || (checker === "start" && i < 8);
    for (let k = 0; k < P - 1; k++) {
      let c = k === 0 || k === P - 2 ? C.wall : k === 1 || k === P - 3 ? C.dark : k === 3 ? (Math.floor(i / 24) % 2 ? C.alt : C.floor) : corner ? (Math.floor(i / 3) % 2 ? C.k1 : C.k2) : C.floor;
      if (chk && k >= 2 && k <= 4) c = (Math.floor(i / 2) + k) % 2 ? C.w : C.b;
      const q = [i * P + k, i * P + k + 1, (i + 1) * P + k, i * P + k + 1, (i + 1) * P + k + 1, (i + 1) * P + k];
      for (const v of q) { vpos.push(positions[v * 3], positions[v * 3 + 1], positions[v * 3 + 2]); vcol.push(c.r, c.g, c.b); }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vpos, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(vcol, 3));
  geometry.computeVertexNormals();
  const rail = (s) => new THREE.CatmullRomCurve3(Array.from({ length: Math.ceil(n / 4) }, (_, j) => { const i = Math.min(j * 4, n - 1), f = i / (n - 1); return at(i, s * (W(f) + 0.02), H(f) + 0.05); }));
  return { positions, indices: new Uint32Array(indices), geometry, rails: [rail(-1), rail(1)], at };
}

// Builds a trough into the kit (mesh + collider) and returns its path section for the guide.
export function addTrough(kit, points, opts = {}) {
  const sec = pathSection(points, { bank: opts.bank ?? 0.6 });
  const g = troughGeometry(sec, { ...opts, theme: kit.theme });
  kit.fixedMesh(g.positions, g.indices, { friction: opts.friction ?? 0.45, restitution: 0.15 });
  const mesh = new THREE.Mesh(g.geometry, kit.mat.trough);
  mesh.castShadow = true; mesh.receiveShadow = true;
  kit.group.add(mesh);
  g.rails.forEach((c, i) => kit.group.add(new THREE.Mesh(new THREE.TubeGeometry(c, Math.ceil(sec.n / 2), 0.07, 6), i ? kit.mat.rail2 : kit.mat.rail)));
  for (let i = 10; i < sec.n - 6; i += 16) kit.pillar(sec.pts[i].clone().addScaledVector(sec.up[i], -0.05));
  sec.kind = "trough";
  sec.half = (i) => (typeof opts.width === "function" ? opts.width(i / (sec.n - 1)) : opts.width ?? 2.6) / 2; // half the width at sample i
  return sec;
}
