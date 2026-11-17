// The arena kit: what an arena is built from. Each piece adds its look (to `group`) and its physics (to `world`) in one
// call. Moving pieces (spinners, hammers, gates, sweepers) are kinematic: `update(t)` poses them every physics step and
// `sync()` copies the pose to their meshes every frame.
import * as THREE from "three";
import { addTrough } from "./trough.js";
import { pathSection } from "./guide.js";

const Y = new THREE.Vector3(0, 1, 0);
export const alignUp = (up) => new THREE.Quaternion().setFromUnitVectors(Y, up.clone().normalize());
const basis = (x, y, z) => new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
// a guide frame as a rotation: (side, up, −T) is right-handed (side = T × up, so side × up = −T)
const frameRot = (sec, i) => basis(sec.side[i], sec.up[i], sec.T[i].clone().negate());

export function createKit({ RAPIER, world, group, theme, rand = Math.random }) {
  const glow = (c, i = 1.4) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: i, roughness: 0.35 });
  const mat = {
    trough: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.15, side: THREE.DoubleSide }),
    rail: glow(theme.rail, 1.6), rail2: glow(theme.rail2, 1.6),
    steel: new THREE.MeshStandardMaterial({ color: theme.pillar, metalness: 0.75, roughness: 0.32 }),
    hazard: new THREE.MeshStandardMaterial({ color: theme.hazard ?? "#f0c75e", emissive: theme.hazard ?? "#f0c75e", emissiveIntensity: 0.55, metalness: 0.5, roughness: 0.3 }),
    board: new THREE.MeshStandardMaterial({ color: theme.floor, roughness: 0.6, metalness: 0.2, side: THREE.DoubleSide }),
    wall: new THREE.MeshStandardMaterial({ color: theme.wall, roughness: 0.5, metalness: 0.2, side: THREE.DoubleSide }),
  };
  const moving = [], pillars = [], scrolls = [];
  const add = (mesh, shadow = true) => { mesh.castShadow = shadow; mesh.receiveShadow = true; group.add(mesh); return mesh; };
  const fixedBody = (pos, rot) => world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(pos.x, pos.y, pos.z).setRotation(rot ?? new THREE.Quaternion()));

  const kit = {
    theme, group, mat, RAPIER, world, rand, boosts: [], scrolls, // rand: the game's seeded randomness; boosts: pads; scrolls: textures that flow
    fixedMesh(positions, indices, { friction = 0.45, restitution = 0.15, oneSided = true } = {}) {
      const flags = oneSided ? RAPIER.TriMeshFlags.FIX_INTERNAL_EDGES : 0;
      world.createCollider(RAPIER.ColliderDesc.trimesh(positions, indices, flags).setFriction(friction).setRestitution(restitution));
    },
    trough: (points, opts) => addTrough(kit, points, opts),
    path: (points, opts) => pathSection(points, opts),
    pillar: (p) => pillars.push(p),

    // a solid box (plates, walls, wedges): size = full extents along (x, y, z) of the rotation
    box({ pos, size, rot, material = mat.wall, friction = 0.4, restitution = 0.2, visible = true }) {
      const body = fixedBody(pos, rot);
      world.createCollider(RAPIER.ColliderDesc.cuboid(size.x / 2, size.y / 2, size.z / 2).setFriction(friction).setRestitution(restitution), body);
      if (visible) { const m = add(new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), material)); m.position.copy(pos); if (rot) m.quaternion.copy(rot); }
    },
    pin(pos, up, { r = 0.16, h = 0.9, bounce = 0.6 } = {}) {
      const q = alignUp(up);
      world.createCollider(RAPIER.ColliderDesc.cylinder(h / 2, r).setRestitution(bounce), fixedBody(pos, q));
      const m = add(new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 14), bounce > 0.9 ? kit.mat.rail : mat.hazard));
      m.position.copy(pos); m.quaternion.copy(q);
    },
    // a kinematic body with child colliders/meshes in its own frame; pose(t) → { pos, rot }
    mover(pose, parts) {
      const p0 = pose(0);
      const body = world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(p0.pos.x, p0.pos.y, p0.pos.z).setRotation(p0.rot));
      const holder = new THREE.Group();
      for (const { size, at = new THREE.Vector3(), material = mat.hazard, round, sphere } of parts) {
        const d = sphere ? RAPIER.ColliderDesc.ball(size.x / 2) : round ? RAPIER.ColliderDesc.cylinder(size.y / 2, size.x / 2) : RAPIER.ColliderDesc.cuboid(size.x / 2, size.y / 2, size.z / 2);
        world.createCollider(d.setTranslation(at.x, at.y, at.z).setRestitution(0.5).setFriction(0.3), body);
        const m = new THREE.Mesh(sphere ? new THREE.SphereGeometry(size.x / 2, 24, 16) : round ? new THREE.CylinderGeometry(size.x / 2, size.x / 2, size.y, 16) : new THREE.BoxGeometry(size.x, size.y, size.z), material);
        m.position.copy(at); m.castShadow = true; holder.add(m);
      }
      group.add(holder);
      moving.push({ body, holder, pose });
      return body;
    },
    // a bar spinning flat over the floor around `pos` (a section sample), crossing the whole width
    spinner(sec, i, { length = 2.3, speed = 1.4, phase = 0 } = {}) {
      const up = sec.up[i], base = alignUp(up), pos = sec.pts[i].clone().addScaledVector(up, 0.33);
      return kit.mover((t) => ({ pos, rot: base.clone().multiply(new THREE.Quaternion().setFromAxisAngle(Y, phase + speed * t)) }),
        [{ size: new THREE.Vector3(length, 0.22, 0.2) }, { size: new THREE.Vector3(0.36, 0.5, 0.36), round: true, material: kit.mat.rail }]);
    },
    // a pendulum hammer swinging across the trough, hung from a gantry
    hammer(sec, i, { height = 3.2, swing = 0.95, speed = 2.2, phase = 0, ball = false } = {}) { // ball: a wrecking ball
      const up = sec.up[i], T = sec.T[i], pivot = sec.pts[i].clone().addScaledVector(up, height);
      const base = frameRot(sec, i);
      for (const s of [-1, 1]) kit.box({ pos: sec.pts[i].clone().addScaledVector(sec.side[i], s * 1.9).addScaledVector(up, height / 2), size: new THREE.Vector3(0.16, height, 0.16), rot: base, material: mat.steel });
      kit.box({ pos: pivot.clone().addScaledVector(up, 0.1), size: new THREE.Vector3(4, 0.16, 0.16), rot: base, material: mat.steel });
      return kit.mover((t) => ({ pos: pivot, rot: new THREE.Quaternion().setFromAxisAngle(T, swing * Math.sin(speed * t + phase)).multiply(base) }),
        [{ size: new THREE.Vector3(0.08, height - 0.6, 0.08), at: new THREE.Vector3(0, -(height - 0.6) / 2, 0), material: mat.steel },
         ball ? { size: new THREE.Vector3(1.0, 1.0, 1.0), at: new THREE.Vector3(0, -(height - 0.55), 0), sphere: true } : { size: new THREE.Vector3(0.7, 0.55, 0.55), at: new THREE.Vector3(0, -(height - 0.3), 0) }]);
    },
    // a block sliding from wall to wall
    gate(sec, i, { speed = 1.6, phase = 0, travel = 0.75 } = {}) {
      const up = sec.up[i], side = sec.side[i], base = frameRot(sec, i);
      const mid = sec.pts[i].clone().addScaledVector(up, 0.4);
      return kit.mover((t) => ({ pos: mid.clone().addScaledVector(side, travel * Math.sin(speed * t + phase)), rot: base }), [{ size: new THREE.Vector3(1.0, 0.8, 0.4) }]);
    },
    // moving pieces: pose them for time t (physics) / copy poses to meshes (render)
    update(t) { for (const m of moving) { const { pos, rot } = m.pose(t); m.body.setNextKinematicTranslation(pos); m.body.setNextKinematicRotation(rot); } },
    sync(dt = 0) { for (const t of scrolls) t.offset.y -= dt * 2.2; for (const m of moving) { const p = m.body.translation(), q = m.body.rotation(); m.holder.position.set(p.x, p.y, p.z); m.holder.quaternion.set(q.x, q.y, q.z, q.w); } },
    // pillars down to the floor, once the floor height is known
    finish(groundY) {
      if (!pillars.length) return;
      const im = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.11, 0.16, 1, 8), mat.steel, pillars.length);
      const m4 = new THREE.Matrix4();
      pillars.forEach((p, i) => { const h = Math.max(0.1, p.y - groundY); m4.compose(new THREE.Vector3(p.x, groundY + h / 2, p.z), new THREE.Quaternion(), new THREE.Vector3(1, h, 1)); im.setMatrixAt(i, m4); });
      im.castShadow = true; group.add(im);
    },
  };
  return kit;
}
