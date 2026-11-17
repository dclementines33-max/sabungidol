// 3 · Lightstick Ocean: a steep pin board scatters the marbles, a chute feeds a coin funnel, the hole drops them onto the
// home straight. Pure chaos — the pin board decides more than speed.
import * as THREE from "three";
import { funnel, plinko } from "../kit/shapes.js";

export default {
  id: "tokyo", name: "Lightstick Ocean", tagline: "Lightstick pin board · fan-chant funnel",
  theme: { cup: "The Idols", sky: ["#02010a", "#1e1b4b", "#6d28d9"], wall: "#7c3aed", wallDark: "#3b0764", floor: "#111027", floorAlt: "#17153a", kerb: ["#22d3ee", "#f0abfc"], rail: "#22d3ee", rail2: "#f0abfc", pillar: "#2a2850", ground: "#07051a", glow: "#a855f7", hazard: "#22d3ee" },
  build(kit) {
    const a = kit.trough([[0, 30.6, 0], [6, 29.6, 0], [11, 28.6, 0]], { checker: "start" });
    const board = plinko(kit, { top: new THREE.Vector3(12, 27.9, 0), dir: new THREE.Vector3(1, 0, 0), width: 9, length: 20, slope: 0.42 });
    const out = board.at(20.6, 0, -0.7);
    const center = new THREE.Vector3(out.x + 5.4, out.y - 5.6, out.z + 3.8);
    // the chute stops outside the funnel's rim and throws the marbles in over it, angled a little towards the centre
    const lip = center.clone().add(new THREE.Vector3(0, 1.2, -5.1)), aim = new THREE.Vector3(Math.cos(0.45), 0, Math.sin(0.45));
    const b = kit.trough([[out.x, out.y, out.z], [out.x + 1.4, out.y - 1.4, out.z + 0.2], [lip.x - aim.x * 3.4, lip.y + 0.9, lip.z - aim.z * 3.4], [lip.x, lip.y, lip.z]], { wall: 1.1 });
    const spin = funnel(kit, { center, rTop: 4.6, hole: 0.62, depth: 3.2, laps: 2.2, start: -Math.PI / 2 });
    const y = center.y - 3.2 - 1.7; // well under the hole: nothing to wedge in between
    const c = kit.trough([[center.x, y, center.z - 0.9], [center.x, y - 0.3, center.z + 1.2], [center.x + 0.6, y - 0.8, center.z + 4.5], [center.x + 2.5, y - 1.5, center.z + 9], [center.x + 7, y - 2.6, center.z + 12], [center.x + 14, y - 3.6, center.z + 12.5], [center.x + 21, y - 4.4, center.z + 11]], { checker: "end" });
    return { kind: "race", sections: [a, board, b, spin, c], offTrack: 6.5 };
  },
};
