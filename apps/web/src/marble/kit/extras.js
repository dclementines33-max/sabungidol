// More arena pieces: boost pads (glowing chevrons on the floor that push marbles — harder the further behind they are,
// see race.js), glass pipes (closed tubes for corkscrews and blind bends), tumble drums (a spinning barrel with fins).
import * as THREE from "three";
import { pathSection } from "./guide.js";

const chevrons = (color) => {
  const c = document.createElement("canvas"); c.width = 128; c.height = 128;
  const g = c.getContext("2d");
  g.fillStyle = "rgba(0,0,0,0)"; g.clearRect(0, 0, 128, 128);
  g.strokeStyle = color; g.lineWidth = 18; g.lineCap = "round"; g.lineJoin = "round";
  g.beginPath(); g.moveTo(20, 96); g.lineTo(64, 40); g.lineTo(108, 96); g.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
};

// A small boost pad somewhere in the stretch f0…f1 of a trough — where exactly, and how far across, is drawn every game:
// only a marble that happens to roll over it gets the push (race.js; harder the further behind it is).
export function boost(kit, sec, f0, f1, { power = 14, color = kit.theme.boost ?? "#39ff88", len = 1.4, width = 0.8, u } = {}) {
  const span = Math.max(2, Math.round(len / sec.step));
  const lo = Math.round(f0 * (sec.n - 1)), hi = Math.max(lo, Math.round(f1 * (sec.n - 1)) - span);
  const i0 = Math.min(sec.n - 1 - span, lo + Math.floor(kit.rand() * (hi - lo + 1))), i1 = i0 + span;
  const room = Math.max(0, (sec.half ? sec.half(i0) : 1.3) - 0.6 - width / 2);
  const uc = u ?? (kit.rand() * 2 - 1) * room;
  kit.boosts.push({ sec, i0, i1, power, u0: uc - width / 2 - 0.15, u1: uc + width / 2 + 0.15 }); // a marble touching the edge counts
  const pos = [], uv = [], idx = [];
  for (let i = i0; i <= i1; i++) {
    for (const du of [-width / 2, width / 2]) sec.pts[i].clone().addScaledVector(sec.side[i], uc + du).addScaledVector(sec.up[i], 0.03).toArray(pos, pos.length);
    const v = ((i - i0) * sec.step) / (width * 0.9);
    uv.push(0, v, 1, v);
    if (i < i1) { const k = (i - i0) * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  const tex = chevrons(color);
  kit.scrolls.push(tex);
  const strip = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }));
  strip.renderOrder = 1;
  kit.group.add(strip);
  const glow = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), new THREE.MeshBasicMaterial({ color, toneMapped: false }));
  glow.position.copy(sec.pts[i0]).addScaledVector(sec.side[i0], uc).addScaledVector(sec.up[i0], 0.15);
  kit.group.add(glow);
}

// Each game, a few things land in new places: 3–6 bumper posts and 5 small boost pads on the wider troughs (never next to
// a moving piece). The same arena never plays the same way twice.
export function scatter(kit, sections) {
  const troughs = sections.flatMap((s) => s.branches ?? [s]).filter((s) => s.kind === "trough" && s.n > 60);
  if (!troughs.length) return;
  const pick = () => troughs[Math.floor(kit.rand() * troughs.length)];
  const bumpers = 3 + Math.floor(kit.rand() * 4);
  for (let k = 0; k < bumpers; k++) for (let tries = 0; tries < 12; tries++) {
    const sec = pick(), i = Math.floor((0.15 + 0.7 * kit.rand()) * (sec.n - 1));
    if (sec.half(i) < 1.2 || kit.busy.some((b) => b.sec === sec && Math.abs(b.i - i) < 16)) continue;
    const u = (kit.rand() * 2 - 1) * (sec.half(i) - 0.8);
    kit.pin(sec.pts[i].clone().addScaledVector(sec.side[i], u).addScaledVector(sec.up[i], 0.45), sec.up[i], { r: 0.17, bounce: 0.6 });
    kit.busy.push({ sec, i });
    break;
  }
  for (let k = 0; k < 5; k++) { const f = 0.12 + 0.76 * kit.rand(); boost(kit, pick(), f, f + 0.03); }
}

// A closed glass tube along points (radius r): the inside is the physics surface, the glass is see-through with rings.
export function pipe(kit, points, { radius = 0.72, rings = 9 } = {}) {
  const sec = pathSection(points, { bank: 0 });
  const S = 18, pos = new Float32Array(sec.n * S * 3), idx = [];
  for (let i = 0; i < sec.n; i++) for (let s = 0; s < S; s++) {
    const a = (s / S) * Math.PI * 2;
    sec.pts[i].clone().addScaledVector(sec.side[i], Math.cos(a) * radius).addScaledVector(sec.up[i], Math.sin(a) * radius).toArray(pos, (i * S + s) * 3);
  }
  for (let i = 0; i < sec.n - 1; i++) for (let s = 0; s < S; s++) {
    const a = i * S + s, b = i * S + ((s + 1) % S), c = a + S, d = b + S;
    idx.push(a, b, c, b, d, c);
  }
  // normals must face the axis (one-sided physics mesh): check one face, flip all if needed
  const v = (k) => new THREE.Vector3().fromArray(pos, k * 3);
  const n0 = new THREE.Vector3().crossVectors(v(idx[1]).sub(v(idx[0])), v(idx[2]).sub(v(idx[0])));
  if (n0.dot(sec.pts[0].clone().sub(v(idx[0]))) < 0) for (let t = 0; t < idx.length; t += 3) [idx[t + 1], idx[t + 2]] = [idx[t + 2], idx[t + 1]];
  kit.fixedMesh(pos, Uint32Array.from(idx), { friction: 0.3, restitution: 0.1 });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setIndex(idx); geo.computeVertexNormals();
  kit.group.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: kit.theme.glass ?? "#d9fbff", transparent: true, opacity: 0.16, roughness: 0.05, metalness: 0.1, side: THREE.DoubleSide, depthWrite: false })));
  for (let i = 0; i < sec.n; i += rings) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius + 0.04, 0.035, 6, 24), kit.mat.rail);
    ring.position.copy(sec.pts[i]);
    ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), sec.T[i]);
    kit.group.add(ring);
    if (i % (rings * 3) === 0) kit.pillar(sec.pts[i].clone().add(new THREE.Vector3(0, -radius, 0)));
  }
  return sec;
}

// A tumble drum: a barrel spinning about its (slightly downhill) axis with fins inside that lift and drop the marbles.
export function drum(kit, { from, to, radius = 1.5, speed = 1.8, fins = 4 }) {
  speed *= 0.8 + 0.4 * kit.rand(); // a new rhythm every game
  const axis = to.clone().sub(from), length = axis.length();
  axis.normalize();
  const mid = from.clone().add(to).multiplyScalar(0.5);
  const base = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), axis);
  const S = 28, L = 10, pos = [], idx = [];
  for (let j = 0; j <= L; j++) for (let s = 0; s < S; s++) { const a = (s / S) * Math.PI * 2; pos.push(Math.cos(a) * radius, Math.sin(a) * radius, -length / 2 + (j / L) * length); }
  for (let j = 0; j < L; j++) for (let s = 0; s < S; s++) { const a = j * S + s, b = j * S + ((s + 1) % S); idx.push(a, a + S, b, b, a + S, b + S); }
  const p32 = new Float32Array(pos);
  const v = (k) => new THREE.Vector3().fromArray(p32, k * 3);
  const n0 = new THREE.Vector3().crossVectors(v(idx[1]).sub(v(idx[0])), v(idx[2]).sub(v(idx[0])));
  if (n0.dot(new THREE.Vector3(0, 0, v(idx[0]).z).sub(v(idx[0]))) < 0) for (let t = 0; t < idx.length; t += 3) [idx[t + 1], idx[t + 2]] = [idx[t + 2], idx[t + 1]];
  const body = kit.mover((t) => ({ pos: mid, rot: base.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), speed * t)) }),
    Array.from({ length: fins }, (_, f) => { const a = (f / fins) * Math.PI * 2; return { size: new THREE.Vector3(0.5, 0.18, length * 0.9), at: new THREE.Vector3(Math.cos(a) * (radius - 0.25), Math.sin(a) * (radius - 0.25), 0) }; }));
  kit.world.createCollider(kit.RAPIER.ColliderDesc.trimesh(p32, Uint32Array.from(idx), kit.RAPIER.TriMeshFlags.FIX_INTERNAL_EDGES).setFriction(0.5), body);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(p32, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  const shell = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: kit.theme.wall, metalness: 0.5, roughness: 0.4, side: THREE.DoubleSide, transparent: true, opacity: 0.55 }));
  const holder = kit.group.children.at(-1); // the mover's group: the shell spins with it
  holder.add(shell);
  for (const z of [-length / 2, length / 2]) { const ring = new THREE.Mesh(new THREE.TorusGeometry(radius + 0.06, 0.09, 8, 40), kit.mat.rail); ring.position.z = z; holder.add(ring); }
  kit.pillar(from.clone().add(new THREE.Vector3(0, -radius, 0))); kit.pillar(to.clone().add(new THREE.Vector3(0, -radius, 0)));
  const floor = (p) => p.clone().add(new THREE.Vector3(0, -radius + 0.4, 0));
  return pathSection([floor(from), floor(mid), floor(to)]);
}
