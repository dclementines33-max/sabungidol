// 12 · Factory 9: two spinning tumble drums with fins, hammers and gates between them, boosts after each drum.
import * as THREE from "three";
import { boost, drum } from "../kit/extras.js";

const into = (f) => (f > 0.88 ? 2.6 - 1.2 * ((f - 0.88) / 0.12) : 2.6); // narrows to fit inside a drum's mouth
export default {
  id: "factory", name: "Factory 9", tagline: "Tumble drums · hammers · gates · hazard stripes",
  theme: { sky: ["#0b0b0b", "#262626", "#f59e0b"], wall: "#f5b700", wallDark: "#3a3a3a", floor: "#2a2a2a", floorAlt: "#333333", kerb: ["#f5b700", "#111111"], rail: "#f5b700", rail2: "#ff3b30", pillar: "#4b4b4b", ground: "#121212", glow: "#f59e0b", hazard: "#ff3b30", boost: "#ff3b30", groundStyle: "grid" },
  build(kit) {
    const a = kit.trough([[0, 30, 0], [10, 28.8, 0], [20, 27.4, 0], [26, 26.6, 0], [30.8, 26.3, 0]], { width: into, checker: "start" });
    const d1 = drum(kit, { from: new THREE.Vector3(30.2, 27.5, 0), to: new THREE.Vector3(37.2, 26.8, 0), speed: 1.7 });
    const b = kit.trough([[37.6, 25, 0], [44, 24, 1], [52, 22.6, -3], [58, 21.2, -10], [58, 19.8, -18], [52, 18.5, -23], [44, 17.4, -23], [38, 16.6, -21], [35.2, 16.3, -20.5]], { width: into, wall: 1.3 });
    const d2 = drum(kit, { from: new THREE.Vector3(34.4, 17.5, -20.5), to: new THREE.Vector3(27.4, 16.8, -20.5), speed: -2.0 });
    const c = kit.trough([[27, 15, -20.5], [20, 14, -20], [12, 12.6, -16], [6, 11.2, -8], [4, 10, 0], [6, 8.8, 8], [12, 7.8, 14]], { checker: "end" });
    kit.hammer(b, Math.round(0.3 * (b.n - 1)), { speed: 1.9 });
    kit.gate(b, Math.round(0.45 * (b.n - 1)), { speed: 1.8 });
    kit.hammer(b, Math.round(0.6 * (b.n - 1)), { speed: 2.1, phase: 1.2 });
    boost(kit, b, 0.05, 0.13); boost(kit, c, 0.08, 0.16); boost(kit, c, 0.62, 0.72);
    return { kind: "race", sections: [a, d1, b, d2, c] };
  },
};
