// One game = one run on one arena. A race: first over the line wins (the other runs on 2.5 s for the finish photo).
// Sumo: the first marble out of the bowl loses (time limit: nearer the centre wins). Physics decides everything; the
// higher-rated marble gets a physical edge (a small steady push along the run — towards the centre in sumo — a little
// less drag, a little heavier, a short head start), scaled by `advantage`. Nothing is kept once the game is over.
import * as THREE from "three";
import { makeGuide } from "./kit/guide.js";
import { createKit } from "./kit/kit.js";

export const DT = 1 / 120;
export const R = 0.34;
const GRAVITY = 24, BASE_DRAG = 0.03, PUSH = 0.9, LANES = [-0.6, 0.6];

export const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

// The edge per marble from the two ratings: e in about −1…1 (50 rating points = 1) times the advantage setting.
export function edges(ratings, advantage) {
  const e = Math.max(-1, Math.min(1, ((ratings[0] - ratings[1]) / 50) * advantage));
  return [e, -e].map((x) => ({ e: x, drag: BASE_DRAG * (1 - 0.3 * x), density: 1 + 0.3 * x, head: Math.max(0, x) * 14, push: Math.max(0, x) * PUSH }));
}

export function createGame({ RAPIER, arena, ratings, advantage, seed, group }) {
  const rand = rng(seed);
  const world = new RAPIER.World({ x: 0, y: -GRAVITY, z: 0 });
  world.timestep = DT;
  const kit = createKit({ RAPIER, world, group, theme: arena.theme, rand });
  const built = arena.build(kit);
  const guide = makeGuide(built.sections);
  const sumo = built.kind === "sumo";
  const groundY = Math.min(guide.minY - 1.6, new THREE.Box3().setFromObject(group).min.y - 0.05);
  kit.finish(groundY);
  const swap = rand() < 0.5; // which corner starts on which side: drawn, so no colour owns the inside line
  const marbles = edges(ratings, advantage).map((ed, k) => {
    const idx = 4 + Math.round(ed.head);
    const p = sumo ? built.start(swap ? 1 - k : k) : guide.lane(idx, LANES[swap ? 1 - k : k] + (rand() - 0.5) * 0.1, R + 0.06);
    const body = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(p.x, p.y, p.z).setCcdEnabled(true).setLinearDamping(ed.drag).setAngularDamping(0.02));
    world.createCollider(RAPIER.ColliderDesc.ball(R).setDensity(ed.density).setFriction(0.45).setRestitution(0.2), body);
    return { k, body, edge: ed, idx, prog: guide.prog[idx], best: guide.prog[idx], still: 0, stall: 0, tries: 0, hold: 0, falls: 0, finished: null, out: null };
  });
  const state = { t: 0, marbles, winner: null, done: false, events: [], decidedAt: null };
  const hz = (p) => Math.hypot(p.x - built.center?.x, p.z - built.center?.z);

  const respawn = (m, ahead = 4, why = "fall") => { // back on the run a little ahead, held still for a moment (the time lost is the penalty)
    m.idx = Math.min(guide.n - 2, m.idx + ahead);
    m.body.setBodyType(RAPIER.RigidBodyType.KinematicPositionBased, true);
    m.body.setTranslation(guide.lane(m.idx, 0, R + 0.1), true);
    m.hold = 0.8; m.falls++; m.still = 0; m.stall = 0;
    state.events.push({ t: state.t, type: "fall", why, k: m.k });
  };
  const decide = (k) => { if (state.winner === null) { state.winner = k; state.decidedAt = state.t; state.events.push({ t: state.t, type: "win", k }); } };

  function step() {
    kit.update(state.t + DT);
    world.step();
    state.t += DT;
    for (const m of marbles) {
      if (m.finished !== null || m.out !== null) continue;
      if (m.hold > 0) {
        m.hold -= DT;
        if (m.hold <= 0) { m.body.setBodyType(RAPIER.RigidBodyType.Dynamic, true); m.body.setLinvel(guide.T[m.idx].clone().multiplyScalar(3), true); }
        continue;
      }
      const pos = m.body.translation();
      if (sumo) {
        if (pos.y < built.center.y - 1.5 || hz(pos) > built.rim + 0.6) { m.out = state.t; state.events.push({ t: state.t, type: "out", k: m.k }); decide(1 - m.k); continue; }
        if (m.edge.push) { const d = new THREE.Vector3(built.center.x - pos.x, 0, built.center.z - pos.z).normalize(); m.body.applyImpulse(d.multiplyScalar(m.edge.push * m.body.mass() * DT), true); }
        continue;
      }
      const near = guide.nearest(new THREE.Vector3(pos.x, pos.y, pos.z), m.prog);
      m.idx = near.i; m.prog = guide.prog[near.i];
      if (pos.y < guide.minY - 6 || near.d > (built.offTrack ?? 3.2)) { respawn(m, 4, `off ${near.d.toFixed(1)}`); continue; }
      if (m.edge.push) m.body.applyImpulse(guide.T[m.idx].clone().multiplyScalar(m.edge.push * m.body.mass() * DT), true);
      // stuck: nearly still for 1.5 s, or no progress for 8 s (a funnel's orbits are progress too slow to count) → a hop
      const v = m.body.linvel();
      m.still = Math.hypot(v.x, v.y, v.z) < 0.3 ? m.still + DT : 0;
      if (m.prog > m.best + 0.5) { m.best = m.prog; m.stall = 0; m.tries = 0; } else m.stall += DT;
      if (m.still > 1.5 || m.stall > 8) {
        m.still = 0; m.stall = 0;
        if (++m.tries > 3) respawn(m, 8, "stuck");
        else m.body.applyImpulse(guide.T[m.idx].clone().multiplyScalar(0.35).addScaledVector(guide.side[m.idx], rand() < 0.5 ? -0.35 : 0.35).addScaledVector(guide.up[m.idx], 0.3), true);
      }
      if (m.prog >= guide.total - 0.8) { m.finished = state.t; state.events.push({ t: state.t, type: "finish", k: m.k }); decide(m.k); }
    }
    if (sumo && state.winner === null && state.t >= built.limit) { // time: nearer the centre wins
      const d = marbles.map((m) => hz(m.body.translation()));
      decide(d[0] <= d[1] ? 0 : 1);
    }
    if (state.winner !== null && (marbles.every((m) => m.finished !== null || m.out !== null) || state.t - state.decidedAt > (sumo ? 1.5 : 2.5))) state.done = true;
  }

  // standing: finished first (by time), then furthest along; sumo: still in, then nearer the centre
  const order = () => [...marbles].sort(sumo
    ? (a, b) => (a.out === null ? 0 : 1) - (b.out === null ? 0 : 1) || hz(a.body.translation()) - hz(b.body.translation())
    : (a, b) => (a.finished ?? Infinity) - (b.finished ?? Infinity) || b.prog - a.prog);

  // plays the rest without drawing; capped so a stuck game still ends (the leader then wins)
  function finish(limit = 240) {
    while (!state.done && state.t < limit) step();
    if (!state.done) { decide(order()[0].k); state.done = true; }
  }

  return { state, step, finish, order, guide, built, kit, sumo, groundY, dispose: () => world.free() };
}
