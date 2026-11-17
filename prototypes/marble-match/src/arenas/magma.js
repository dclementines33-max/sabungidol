// 11 · Pyro Stage Inferno: one and a quarter laps down round a volcano, wrecking balls swinging over the run, a jump over the
// lava, boosts that let the back of the field fight back.
import * as THREE from "three";
import { boost } from "../kit/extras.js";

export default {
  id: "magma", name: "Pyro Stage Inferno", tagline: "Pyro stage · wrecking balls · fire jump",
  theme: { cup: "Grand Final", sky: ["#0a0000", "#3d0700", "#ff4800"], wall: "#2b0f0a", wallDark: "#140806", floor: "#151010", floorAlt: "#1d1412", kerb: ["#ff6b00", "#ffd166"], rail: "#ff6b00", rail2: "#ffd166", pillar: "#2a1410", ground: "#200500", glow: "#ff4800", hazard: "#ffd166", boost: "#ffd166", groundStyle: "lava" },
  build(kit) {
    const pts = [];
    for (let k = 0; k <= 30; k++) { const ang = (k / 24) * Math.PI * 2, r = 17 + 1.6 * Math.sin(3 * ang); pts.push(new THREE.Vector3(Math.cos(ang) * r, 34 - k * 0.72, Math.sin(ang) * r)); }
    const end = pts.at(-1), dir = end.clone().sub(pts.at(-2)).setY(0).normalize();
    pts.push(end.clone().addScaledVector(dir, 3).add(new THREE.Vector3(0, -0.1, 0)), end.clone().addScaledVector(dir, 5.5).add(new THREE.Vector3(0, 0.12, 0))); // the kicker
    const a = kit.trough(pts, { wall: 1.25, checker: "start" }); // high walls: the wrecking balls knock marbles about, not out
    const lip = pts.at(-1), at = (d, y) => lip.clone().addScaledVector(dir, d).add(new THREE.Vector3(0, y, 0));
    const side = new THREE.Vector3(-dir.z, 0, dir.x);
    const c = kit.trough([at(0.6, -1.2), at(3, -1.25), at(10, -2.2), at(20, -3.8).addScaledVector(side, 3), at(32, -5).addScaledVector(side, 1), at(42, -6)], { width: (f) => 2.8 + 2.4 * Math.max(0, 1 - f / 0.25), wall: (f) => 1 + 0.9 * Math.max(0, 1 - f / 0.25), checker: "end" });
    for (const [f, ph] of [[0.24, 0], [0.48, 1.6], [0.72, 3.1]]) kit.hammer(a, Math.round(f * (a.n - 1)), { ball: true, speed: 1.6, phase: ph, swing: 0.7 });
    boost(kit, a, 0.14, 0.19); boost(kit, a, 0.58, 0.64); boost(kit, a, 0.9, 0.96); boost(kit, c, 0.4, 0.55);
    const cone = new THREE.Mesh(new THREE.CylinderGeometry(3, 12, 30, 40), new THREE.MeshStandardMaterial({ color: "#1a0a06", roughness: 0.9, side: THREE.DoubleSide }));
    cone.position.set(0, 13, 0); kit.group.add(cone);
    const crater = new THREE.Mesh(new THREE.CircleGeometry(2.6, 32), new THREE.MeshBasicMaterial({ color: "#ff6b00" }));
    crater.rotation.x = -Math.PI / 2; crater.position.set(0, 28.05, 0); kit.group.add(crater);
    return { kind: "race", sections: [a, c] };
  },
};
