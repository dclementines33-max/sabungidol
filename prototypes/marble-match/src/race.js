// One game = one run on one arena, for 2 to 20 marbles. A race: the finishing order (the field runs on a few seconds
// after the winner). Sumo: the order the marbles leave the bowl, last one in wins (time limit: nearer the centre).
// Physics decides everything. Rating edge, relative to the field's average: a small steady push along the run (towards
// the centre in sumo), a little less drag, a little heavier, a spot nearer the front of the grid; scaled by `advantage`.
// Small boost pads push whoever happens to roll over them, harder the further behind it is; a marble tucked in behind
// another gets a slipstream pull. Bumpers and pads land in new places every game.
import * as THREE from "three";
import { makeGuide } from "./kit/guide.js";
import { scatter } from "./kit/extras.js";
import { createKit } from "./kit/kit.js";

export const DT = 1 / 120;
export const R = 0.34;
const GRAVITY = 24, BASE_DRAG = 0.03, PUSH = 0.9, DRAFT = 2.2; // DRAFT: m/s² for a marble right behind another (slipstream)

export const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

// e per marble in about −1…1: twice its distance from the field's average rating, 50 points = 1 (two marbles: the
// same as the gap between them), times the advantage setting.
export function edges(ratings, advantage) {
  const mean = ratings.reduce((a, b) => a + b, 0) / ratings.length;
  return ratings.map((r) => {
    const x = Math.max(-1, Math.min(1, ((2 * (r - mean)) / 50) * advantage));
    return { e: x, drag: BASE_DRAG * (1 - 0.3 * x), density: 1 + 0.3 * x, push: Math.max(0, x) * PUSH };
  });
}

// Grid slots: rows of up to three across the run, front row first; the order is drawn, the edge moves you up a little.
function grid(n, edge, rand) {
  const key = edge.map((ed, k) => ({ k, v: rand() - ed.e * 0.35 })).sort((a, b) => a.v - b.v);
  const per = n <= 2 ? 2 : 3, lanes = per === 2 ? [-0.6, 0.6] : [-0.85, 0, 0.85];
  const slot = [];
  key.forEach(({ k }, j) => { slot[k] = { row: Math.floor(j / per), lane: lanes[j % per] }; });
  return slot;
}

export function createGame({ RAPIER, arena, ratings, advantage, seed, group }) {
  const rand = rng(seed);
  const world = new RAPIER.World({ x: 0, y: -GRAVITY, z: 0 });
  world.timestep = DT;
  const kit = createKit({ RAPIER, world, group, theme: arena.theme, rand });
  const built = arena.build(kit);
  if (built.kind !== "sumo") scatter(kit, built.sections); // bumpers and pads in new places every game
  const guide = makeGuide(built.sections);
  const boosts = kit.boosts.map((b) => ({ ...b, from: guide.prog[b.sec.base + b.i0], to: guide.prog[b.sec.base + b.i1] }));
  const sumo = built.kind === "sumo";
  const groundY = Math.min(guide.minY - 1.6, new THREE.Box3().setFromObject(group).min.y - 0.05);
  kit.finish(groundY);
  const n = ratings.length;
  const edge = edges(ratings, advantage);
  const slots = grid(n, edge, rand);
  const rows = Math.ceil(n / (n <= 2 ? 2 : 3));
  const marbles = edge.map((ed, k) => {
    const idx = 4 + (rows - 1 - slots[k].row) * 4; // ~1 m between rows, the front row furthest down
    const p = sumo ? built.start(k, n) : guide.lane(idx, slots[k].lane + (rand() - 0.5) * 0.08, R + 0.06);
    // no two marbles, and no two games, quite alike: grip, bounce and drag vary a little, and the start gate gives each
    // its own small shove and spin
    const vary = (x, by) => x * (1 + (rand() * 2 - 1) * by);
    const body = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(p.x, p.y, p.z).setCcdEnabled(true).setLinearDamping(vary(ed.drag, 0.25)).setAngularDamping(0.02));
    world.createCollider(RAPIER.ColliderDesc.ball(R).setDensity(ed.density).setFriction(vary(0.45, 0.2)).setRestitution(vary(0.2, 0.4)), body);
    if (!sumo) {
      const T = guide.T[idx], S = guide.side[idx];
      body.setLinvel({ x: T.x * vary(1, 0.6) + S.x * (rand() - 0.5) * 0.6, y: T.y, z: T.z * vary(1, 0.6) + S.z * (rand() - 0.5) * 0.6 }, true);
      body.setAngvel({ x: (rand() - 0.5) * 6, y: (rand() - 0.5) * 6, z: (rand() - 0.5) * 6 }, true);
    }
    return { k, body, edge: ed, idx, prog: guide.prog[idx], best: guide.prog[idx], still: 0, stall: 0, tries: 0, hold: 0, falls: 0, finished: null, out: null, boosting: 0 };
  });
  const state = { t: 0, marbles, winner: null, done: false, events: [], decidedAt: null, results: [] }; // results: k in finishing order
  const hz = (p) => Math.hypot(p.x - built.center?.x, p.z - built.center?.z);

  const respawn = (m, ahead = 4, why = "fall") => { // back on the run a little ahead, held still a moment (the time lost is the penalty)
    m.idx = Math.min(guide.n - 2, m.idx + ahead);
    m.body.setBodyType(RAPIER.RigidBodyType.KinematicPositionBased, true);
    m.body.setTranslation(guide.lane(m.idx, 0, R + 0.1), true);
    m.hold = 0.8; m.falls++; m.still = 0; m.stall = 0;
    state.events.push({ t: state.t, type: "fall", why, k: m.k });
  };
  const finishLine = (m) => { m.finished = state.t; state.results.push(m.k); state.events.push({ t: state.t, type: "finish", k: m.k }); if (state.winner === null) { state.winner = m.k; state.decidedAt = state.t; } };

  function step() {
    kit.update(state.t + DT);
    world.step();
    state.t += DT;
    const lead = Math.max(...marbles.filter((m) => m.finished === null).map((m) => m.prog), 0);
    for (const m of marbles) {
      m.boosting = Math.max(0, m.boosting - DT);
      if (m.finished !== null || m.out !== null) continue;
      if (m.hold > 0) {
        m.hold -= DT;
        if (m.hold <= 0) { m.body.setBodyType(RAPIER.RigidBodyType.Dynamic, true); m.body.setLinvel(guide.T[m.idx].clone().multiplyScalar(3), true); }
        continue;
      }
      const pos = m.body.translation();
      if (sumo) {
        if (pos.y < built.center.y - 1.5 || hz(pos) > built.rim + 0.6) { m.out = state.t; state.results.unshift(m.k); state.events.push({ t: state.t, type: "out", k: m.k }); continue; }
        if (m.edge.push) { const d = new THREE.Vector3(built.center.x - pos.x, 0, built.center.z - pos.z).normalize(); m.body.applyImpulse(d.multiplyScalar(m.edge.push * m.body.mass() * DT), true); }
        continue;
      }
      const near = guide.nearest(new THREE.Vector3(pos.x, pos.y, pos.z), m.prog);
      m.idx = near.i; m.prog = guide.prog[near.i];
      if (pos.y < guide.minY - 6 || near.d > (built.offTrack ?? 3.2)) { respawn(m, 4, `off ${near.d.toFixed(1)}`); continue; }
      let a = m.edge.push;
      const vel = m.body.linvel(), along = vel.x * guide.T[m.idx].x + vel.y * guide.T[m.idx].y + vel.z * guide.T[m.idx].z;
      const across = (pos.x - guide.pts[m.idx].x) * guide.side[m.idx].x + (pos.y - guide.pts[m.idx].y) * guide.side[m.idx].y + (pos.z - guide.pts[m.idx].z) * guide.side[m.idx].z;
      for (const b of boosts) if (m.prog >= b.from && m.prog <= b.to && across >= b.u0 && across <= b.u1) { // only over the pad itself; up to a top speed — higher the further behind you are
        const behind = Math.min(1, (lead - m.prog) / 12);
        if (along < 13 + 6 * behind) a += b.power * (1 + behind);
        m.boosting = 0.4;
      }
      // slipstream: tucked in 0.6–5 m behind someone, a marble is pulled along — the closer, the stronger (overtakes!)
      let gap = Infinity;
      for (const o of marbles) if (o !== m && o.finished === null && o.hold <= 0) { const d = o.prog - m.prog; if (d > 0.6 && d < gap) gap = d; }
      if (gap < 5) a += DRAFT * (1 - gap / 5);
      if (a) m.body.applyImpulse(guide.T[m.idx].clone().multiplyScalar(a * m.body.mass() * DT), true);
      // stuck: nearly still for 1.5 s, or no progress for 8 s (a funnel's orbits are progress too slow to count) → a hop
      const v = m.body.linvel();
      m.still = Math.hypot(v.x, v.y, v.z) < 0.3 ? m.still + DT : 0;
      if (m.prog > m.best + 0.5) { m.best = m.prog; m.stall = 0; m.tries = 0; } else m.stall += DT;
      if (m.still > 1.5 || m.stall > 8) {
        m.still = 0; m.stall = 0;
        if (++m.tries > 3) respawn(m, 8, "stuck");
        else m.body.applyImpulse(guide.T[m.idx].clone().multiplyScalar(0.35).addScaledVector(guide.side[m.idx], rand() < 0.5 ? -0.35 : 0.35).addScaledVector(guide.up[m.idx], 0.3), true);
      }
      if (m.prog >= guide.total - 0.8) finishLine(m);
    }
    if (sumo) {
      const inside = marbles.filter((m) => m.out === null);
      if (state.winner === null && (inside.length === 1 || state.t >= built.limit)) { // the last one in; at the limit, by distance
        inside.sort((x, y) => hz(y.body.translation()) - hz(x.body.translation())).forEach((m) => { m.out ??= state.t; state.results.unshift(m.k); });
        state.winner = state.results[0]; state.decidedAt = state.t;
      }
    }
    const settled = marbles.every((m) => m.finished !== null || m.out !== null);
    if (state.winner !== null && (settled || state.t - state.decidedAt > (sumo ? 1.5 : n === 2 ? 2.5 : 6))) close();
  }

  // the rest of the field, by how far they got, after those who finished
  function close() {
    for (const m of [...marbles].filter((x) => !state.results.includes(x.k)).sort((x, y) => y.prog - x.prog)) state.results.push(m.k);
    state.done = true;
  }

  // standing now: finished first (by time), then furthest along; sumo: still in (nearer the centre first), then by exit
  const order = () => [...marbles].sort(sumo
    ? (a, b) => (a.out ?? Infinity) !== (b.out ?? Infinity) ? (b.out ?? Infinity) - (a.out ?? Infinity) : hz(a.body.translation()) - hz(b.body.translation())
    : (a, b) => (a.finished ?? Infinity) - (b.finished ?? Infinity) || b.prog - a.prog);

  // plays the rest without drawing; capped so a stuck game still ends (the standing then decides)
  function finish(limit = 240) {
    while (!state.done && state.t < limit) step();
    if (!state.done) { if (state.winner === null) { state.winner = order()[0].k; state.decidedAt = state.t; } close(); }
  }

  return { state, step, finish, order, guide, built, kit, sumo, groundY, boosts, dispose: () => world.free() };
}
