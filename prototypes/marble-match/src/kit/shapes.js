// Bigger shapes: the pachinko board, the coin funnel and the sumo bowl. Each returns the guide section for its stretch.
import * as THREE from "three";
import { alignUp } from "./kit.js";
import { pathSection } from "./guide.js";

// Faces wound so their normal agrees with `want(point)` (the physics mesh is one-sided).
function orient(positions, indices, want) {
  const v = (k) => new THREE.Vector3().fromArray(positions, k * 3);
  let score = 0;
  for (let t = 0; t < indices.length; t += 3) {
    const a = v(indices[t]), b = v(indices[t + 1]), c = v(indices[t + 2]);
    const n = new THREE.Vector3().crossVectors(b.clone().sub(a), c.clone().sub(a));
    score += Math.sign(n.dot(want(a)));
  }
  if (score < 0) for (let t = 0; t < indices.length; t += 3) [indices[t + 1], indices[t + 2]] = [indices[t + 2], indices[t + 1]];
  return indices;
}

// A surface of revolution around a vertical axis at `center` from profile [r, y] pairs (inside = towards the axis, up).
function lathe(kit, center, profile, { segments = 72, friction = 0.4, material }) {
  const geo = new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), segments);
  geo.translate(center.x, center.y, center.z);
  const pos = new Float32Array(geo.attributes.position.array);
  const idx = Uint32Array.from(geo.index.array);
  orient(pos, idx, (p) => new THREE.Vector3(center.x - p.x, 1.2, center.z - p.z));
  kit.fixedMesh(pos, idx, { friction });
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, material);
  mesh.receiveShadow = true; mesh.castShadow = true;
  kit.group.add(mesh);
  return mesh;
}

// An inclined board with walls and (optionally) a staggered pin grid; top edge centred on `top`, running down along `dir`
// (horizontal). exit = width of the centre gap the last metres narrow to (null: open). Also used as a fork / merge plate.
export function plinko(kit, { top, dir, width = 9, length = 20, slope = 0.5, pitch = 1.45, rows = 1.7, exit = 1.4, pins = true }) {
  const d = new THREE.Vector3(dir.x, 0, dir.z).normalize();
  const down = d.clone().multiplyScalar(Math.cos(slope)).add(new THREE.Vector3(0, -Math.sin(slope), 0)).normalize();
  const side = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), down).normalize();
  const n = new THREE.Vector3().crossVectors(down, side).normalize(); // board normal (up-ish); (side, n, down) is right-handed
  const rot = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(side, n, down));
  const at = (s, u, h = 0) => top.clone().addScaledVector(down, s).addScaledVector(side, u).addScaledVector(n, h);
  kit.box({ pos: at(length / 2, 0, -0.1), size: new THREE.Vector3(width + 0.6, 0.2, length), rot, material: kit.mat.board, friction: 0.3 });
  for (const s of [-1, 1]) kit.box({ pos: at(length / 2, s * (width / 2 + 0.15), 0.5), size: new THREE.Vector3(0.3, 1.0, length), rot, material: kit.mat.wall });
  // the last metres narrow to a centre exit
  const funnelLen = 3.2, gap = (width - (exit ?? width)) / 2;
  if (exit) for (const s of [-1, 1]) {
    const a = Math.atan2(gap, funnelLen) * -s;
    const q = rot.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), a));
    kit.box({ pos: at(length - funnelLen / 2, s * (exit / 2 + gap / 2), 0.45), size: new THREE.Vector3(0.25, 0.9, Math.hypot(gap, funnelLen)), rot: q, material: kit.mat.wall });
  }
  if (pins) for (let r = 0, s = 1.6; s < length - funnelLen - 0.6; r++, s += rows) {
    for (let u = -width / 2 + 0.9 + (r % 2) * pitch / 2; u < width / 2 - 0.6; u += pitch) kit.pin(at(s, u, 0.35), n, { r: 0.13, h: 0.7, bounce: 0.55 });
  }
  return { ...pathSection([at(-0.5, 0, 0.35), at(length / 2, 0, 0.35), at(length + 0.4, 0, 0.35)]), at, rot }; // at(s, u, h): a point on the board
}

// A coin funnel: marbles roll round and round, faster as they sink, and drop out of the hole at the bottom.
export function funnel(kit, { center, rTop = 4.6, hole = 0.6, depth = 3.2, laps = 2.5, start = 0 }) {
  const prof = [];
  for (let i = 0; i <= 24; i++) {
    const r = hole + (rTop - hole) * (i / 24) ** 1.6;
    prof.push([r, -depth * (1 - Math.log(r / hole) / Math.log(rTop / hole))]);
  }
  prof.push([rTop + 0.05, 0.6], [rTop + 0.25, 0.6]); // the rim wall
  lathe(kit, center, prof, { material: kit.mat.board, friction: 0.25, segments: 80 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(rTop + 0.15, 0.06, 6, 80), kit.mat.rail);
  ring.rotation.x = Math.PI / 2; ring.position.copy(center).add(new THREE.Vector3(0, 0.62, 0)); kit.group.add(ring);
  const spiral = [];
  for (let i = 0; i <= 60; i++) {
    const f = i / 60, r = rTop - 0.6 - (rTop - 0.6 - hole) * f, a = start + f * laps * Math.PI * 2;
    spiral.push(center.clone().add(new THREE.Vector3(Math.cos(a) * r, -depth * (1 - Math.log(r / hole) / Math.log(rTop / hole)) + 0.35, Math.sin(a) * r)));
  }
  return pathSection(spiral);
}

// The sumo bowl: a ring valley between a centre post and a low rim; marbles flung over the rim are out.
export const BOWL = { rim: 6.2, post: 0.9 };
const bowlY = (r) => (r < 2.8 ? 0.25 * ((2.8 - r) / 1.9) ** 2 : 1.05 * ((r - 2.8) / 3.4) ** 1.8);
export function bowl(kit, { center }) {
  const prof = [[BOWL.post, 0.9], [BOWL.post + 0.02, 0.25]];
  for (let r = 1.0; r <= BOWL.rim; r += 0.2) prof.push([r, bowlY(r)]);
  prof.push([BOWL.rim + 0.2, bowlY(BOWL.rim)], [BOWL.rim + 0.5, -0.4]);
  lathe(kit, center, prof, { material: kit.mat.board, friction: 0.45, segments: 72 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(BOWL.rim + 0.1, 0.07, 6, 80), kit.mat.rail);
  ring.rotation.x = Math.PI / 2; ring.position.copy(center).add(new THREE.Vector3(0, bowlY(BOWL.rim) + 0.05, 0)); kit.group.add(ring);
  // one sweeper arm riding just over the floor, spinning faster and faster (one arm: it never hits both at once)
  const parts = [];
  for (const s of [1]) for (let r = 1.25; r < BOWL.rim - 0.4; r += 0.55) parts.push({ size: new THREE.Vector3(0.58, 0.26, 0.24), at: new THREE.Vector3(s * r, bowlY(r) + 0.3, 0) });
  parts.push({ size: new THREE.Vector3(1.6, 1.0, 1.6), at: new THREE.Vector3(0, 0.85, 0), round: true, material: kit.mat.rail });
  const phase = kit.rand() * Math.PI * 2, dir = kit.rand() < 0.5 ? -1 : 1; // a different sweep every game
  const angle = (t) => phase + dir * (0.5 * t + 0.03 * t * t); // ~0.5 rad/s at the start, ~1.7 after 20 s, ~2.3 after 30 s
  kit.mover((t) => ({ pos: center, rot: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle(t)) }), parts);
  return pathSection([center.clone().add(new THREE.Vector3(-3, 0.4, 0)), center.clone().add(new THREE.Vector3(0, 0.4, 3)), center.clone().add(new THREE.Vector3(3, 0.4, 0))]);
}
export { alignUp };
