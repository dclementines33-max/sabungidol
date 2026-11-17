// 7 · Split Decision: a fork plate with a wedge sends each marble left (long, smooth) or right (short, pinned and
// spinner-guarded); both branches drop onto a merge plate before the final straight.
import * as THREE from "three";
import { plinko } from "../kit/shapes.js";

export default {
  id: "split", name: "Split Decision", tagline: "Fork in the road · long & smooth or short & brutal",
  theme: { sky: ["#050505", "#1c1917", "#57534e"], wall: "#d4a017", wallDark: "#7a5c0a", floor: "#141414", floorAlt: "#1d1d1d", kerb: ["#facc15", "#0a0a0a"], rail: "#facc15", rail2: "#fafafa", pillar: "#262626", ground: "#080808", glow: "#facc15", hazard: "#ef4444" },
  build(kit) {
    const a = kit.trough([[0, 32, 0], [10, 30.6, 0], [18, 29.3, 0], [22, 28.8, 0]], { checker: "start" });
    const fork = plinko(kit, { top: new THREE.Vector3(22.6, 28.3, 0), dir: new THREE.Vector3(1, 0, 0), width: 5.3, length: 5, slope: 0.25, pins: false, exit: null });
    kit.box({ pos: fork.at(3.0, 0, 0.4), size: new THREE.Vector3(0.9, 0.8, 0.9), rot: fork.rot.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 4)), material: kit.mat.hazard });
    kit.box({ pos: fork.at(4.35, 0, 0.45), size: new THREE.Vector3(0.3, 0.9, 2.1), rot: fork.rot, material: kit.mat.hazard }); // the divider: no way down the middle
    const l0 = fork.at(5.5, 1.4, -0.6), r0 = fork.at(5.5, -1.4, -0.6); // the board's +side points to −z
    const left = kit.trough([[l0.x, l0.y, l0.z], [33, 25.4, -5], [40, 23.9, -10.5], [47, 22.3, -9.5], [50.6, 21.1, -4.4], [51.8, 20.7, -1.6]]);
    const right = kit.trough([[r0.x, r0.y, r0.z], [33, 25.2, 3], [40, 23.6, 3.4], [46, 22.1, 3.1], [50.6, 21.1, 1.6], [51.8, 20.7, 1.6]]);
    for (const f of [0.3, 0.42, 0.66]) { const i = Math.round(f * (right.n - 1)); kit.pin(right.pts[i].clone().addScaledVector(right.side[i], f === 0.42 ? 0.35 : -0.3).addScaledVector(right.up[i], 0.45), right.up[i]); }
    kit.spinner(right, Math.round(0.84 * (right.n - 1)), { speed: 1.7 });
    const merge = plinko(kit, { top: new THREE.Vector3(52.3, 20.1, 0), dir: new THREE.Vector3(1, 0, 0), width: 6, length: 5.5, slope: 0.3, pins: false, exit: 2.2 });
    const m = merge.at(6.1, 0, -0.6);
    const c = kit.trough([[m.x, m.y, m.z], [64, 17.1, 0], [72, 15.3, 4], [80, 13.6, 0], [88, 12.2, -2]], { checker: "end" });
    return { kind: "race", sections: [a, fork, { branches: [left, right] }, merge, c] };
  },
};
