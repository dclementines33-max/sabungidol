// The race itself: Rapier physics on the track's trough, 3 laps, a lift between laps. Who wins is whatever happens in the
// simulation. The higher-rated marble gets a physical edge (a little less rolling drag, a little heavier, a short head
// start each lap, and above all a small steady push along the track, like a tiny motor), scaled by `advantage` (0 =
// equal marbles). Each lap is its own heat (both restart together from the lift) and winning it = one game; nothing is
// recorded after the race.
import * as THREE from "three";
import { nearestIndex } from "./track.js";

export const LAPS = 3;
const DT = 1 / 120;
const R = 0.34; // marble radius
const LIFT_S = 3.2; // seconds on the lift; at the top it waits for the other marble, then both start the next lap together
const LANES = [-0.6, 0.6];
const BASE_DRAG = 0.03;
const PUSH = 0.9; // m/s² at a full edge (50 rating points)
const GRAVITY = 24; // stylised: livelier than 9.81 on a track this long

const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

// The edge for each marble from the two ratings: e in about −1…1 (50 rating points = 1), times the advantage setting.
export function edges(ratings, advantage) {
  const [a, b] = ratings;
  const e = Math.max(-1, Math.min(1, ((a - b) / 50) * advantage));
  return [e, -e].map((x) => ({ e: x, drag: BASE_DRAG * (1 - 0.3 * x), density: 1 + 0.3 * x, head: Math.max(0, x) * 14, push: Math.max(0, x) * PUSH })); // head = samples ahead at the start; push in m/s²
}

export function createRace({ RAPIER, track, ratings, advantage, seed }) {
  const rand = rng(seed);
  const world = new RAPIER.World({ x: 0, y: -GRAVITY, z: 0 });
  world.timestep = DT;
  // FIX_INTERNAL_EDGES: without it the ball trips on every triangle seam of the trough and crawls
  world.createCollider(RAPIER.ColliderDesc.trimesh(track.positions, track.indices, RAPIER.TriMeshFlags.FIX_INTERNAL_EDGES).setFriction(0.45).setRestitution(0.15));
  for (const pin of track.pins) {
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), pin.up);
    const body = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(pin.pos.x, pin.pos.y, pin.pos.z).setRotation(q));
    world.createCollider(RAPIER.ColliderDesc.cylinder(0.45, 0.16).setRestitution(0.6), body);
  }
  const edge = edges(ratings, advantage);
  const top = 6;
  const swap = rand() < 0.5; // which corner starts on which side: drawn, so no colour owns the inside line
  const marbles = edge.map((ed, k) => {
    const p = track.lane(top + Math.round(ed.head), LANES[swap ? 1 - k : k] + (rand() - 0.5) * 0.1, R + 0.03);
    const body = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(p.x, p.y, p.z).setCcdEnabled(true).setLinearDamping(ed.drag).setAngularDamping(0.02));
    world.createCollider(RAPIER.ColliderDesc.ball(R).setDensity(ed.density).setFriction(0.45).setRestitution(0.2), body);
    return { k, body, edge: ed, idx: top, lap: 0, phase: "race", liftT: 0, still: 0, best: top, tries: 0, laps: [], respawns: 0, from: null, to: null };
  });

  const state = { t: 0, marbles, lapWinners: [], done: false, events: [] };
  const toLift = (m) => {
    m.phase = "lift"; m.liftT = 0;
    const other = marbles[1 - m.k]; // side by side at the top: the second one up takes the other lane
    m.laneU = other.phase === "lift" ? -other.laneU : LANES[rand() < 0.5 ? 0 : 1];
    m.from = m.body.translation(); m.to = track.lane(2 + Math.round(m.edge.head), m.laneU, R + 0.05);
    m.body.setBodyType(RAPIER.RigidBodyType.KinematicPositionBased, true);
  };
  const release = (m) => {
    m.phase = "race"; m.idx = 2 + Math.round(m.edge.head); m.best = m.idx; m.still = 0;
    m.body.setBodyType(RAPIER.RigidBodyType.Dynamic, true);
    m.body.setTranslation(m.to, true);
    const v = track.T[2].clone().multiplyScalar(2.2);
    m.body.setLinvel(v, true); m.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
  };
  const respawn = (m, back = 10) => { // back to the track a little behind (or, negative, ahead of) where it left
    const p = track.lane(m.idx - back, 0, R + 0.05);
    m.body.setTranslation(p, true); m.body.setLinvel({ x: 0, y: 0, z: 0 }, true); m.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
    m.idx = Math.max(0, Math.min(track.n - 6, m.idx - back)); m.best = m.idx; m.respawns++;
    state.events.push({ t: state.t, type: "respawn", k: m.k });
  };

  function step() {
    world.step();
    state.t += DT;
    const atTop = (m) => m.phase === "done" || (m.phase === "lift" && m.liftT >= LIFT_S);
    const go = marbles.every(atTop) && marbles.some((m) => m.phase === "lift"); // a new lap starts when both are up
    for (const m of marbles) {
      if (m.phase === "done") continue;
      if (m.phase === "lift") {
        m.liftT += DT;
        const f = Math.min(1, m.liftT / LIFT_S), s = f * f * (3 - 2 * f);
        const p = new THREE.Vector3().lerpVectors(m.from, m.to, s);
        p.y += Math.sin(Math.PI * s) * 0.6;
        m.body.setNextKinematicTranslation(p);
        if (go) release(m);
        continue;
      }
      const pos = m.body.translation();
      const near = nearestIndex(track, new THREE.Vector3(pos.x, pos.y, pos.z), m.idx);
      m.idx = near.i;
      if (pos.y < track.minY - 4 || near.d > 3.2) { respawn(m); continue; }
      if (m.edge.push) m.body.applyImpulse(track.T[m.idx].clone().multiplyScalar(m.edge.push * m.body.mass() * DT), true);
      // stalled (no progress for 1.5 s, e.g. wedged at a pin): a hop forward and to the side; after 3 hops, a few metres on
      if (m.idx > m.best) { m.best = m.idx; m.still = 0; m.tries = 0; } else m.still += DT;
      if (m.still > 1.5) {
        m.still = 0;
        if (++m.tries > 3) { respawn(m, -8); m.tries = 0; }
        else m.body.applyImpulse(track.T[m.idx].clone().multiplyScalar(0.35).addScaledVector(track.side[m.idx], rand() < 0.5 ? -0.35 : 0.35).addScaledVector(track.up[m.idx], 0.3), true);
      }
      if (m.idx >= track.n - 4) { // over the lap line, into the lift
        m.laps.push(state.t);
        const lap = m.laps.length;
        if (state.lapWinners.length < lap) { state.lapWinners.push(m.k); state.events.push({ t: state.t, type: "lap", k: m.k, lap }); }
        if (lap >= LAPS) { m.phase = "done"; m.body.setBodyType(RAPIER.RigidBodyType.KinematicPositionBased, true); m.body.setNextKinematicTranslation(track.lane(track.n - 1, LANES[m.k] * 1.4 + (m.k ? 1 : -1), R)); }
        else toLift(m);
      }
    }
    state.done = marbles.every((m) => m.phase === "done");
  }

  // Order on track: more laps first, then further along the lap.
  const progress = (m) => m.laps.length * track.n + (m.phase === "lift" ? 0 : m.idx);
  const order = () => [...marbles].sort((a, b) => progress(b) - progress(a) || (a.laps.at(-1) ?? 0) - (b.laps.at(-1) ?? 0));
  const score = () => [0, 1].map((k) => state.lapWinners.filter((w) => w === k).length);

  // Plays the rest without drawing (Skip to result); capped so a stuck race still ends.
  function finish(limit = 600) { while (!state.done && state.t < limit) step(); }

  return { state, step, finish, order, score, progress, dispose: () => world.free(), R, DT };
}
