// 10 · Unzure Glass Spiral: glass tubes — a three-turn corkscrew and a blind S-bend — between open troughs with boosts.
import * as THREE from "three";
import { boost, pipe } from "../kit/extras.js";

const taper = (f) => (f > 0.85 ? 2.6 - 1.2 * ((f - 0.85) / 0.15) : 2.6); // narrows into a tube's mouth
export default {
  id: "crystal", name: "Unzure Glass Spiral", tagline: "Unzure Cup · glass corkscrew · blind S-bend",
  theme: { cup: "Unzure Cup", sky: ["#0b0418", "#2e1065", "#a99bf0"], wall: "#7c3aed", wallDark: "#3b1d7a", floor: "#ece8ff", floorAlt: "#ddd6fe", kerb: ["#f0c75e", "#ffffff"], rail: "#c4b5fd", rail2: "#f0c75e", pillar: "#3b2d5c", ground: "#0b0418", glow: "#a99bf0", hazard: "#f0c75e", boost: "#f0c75e", glass: "#e4dcff", groundStyle: "rings" },
  build(kit) {
    const a = kit.trough([[0, 36, 0], [10, 34.8, 0], [18, 33.6, 2], [22, 33, 3], [24.5, 32.85, 3.2]], { width: taper, checker: "start" });
    const helix = [];
    for (let k = 0; k <= 36; k++) { const ang = -Math.PI / 2 + (k / 12) * Math.PI * 2; helix.push(new THREE.Vector3(25 + 4 * Math.cos(ang), 33.45 - (k / 12) * 4, 7.2 + 4 * Math.sin(ang))); }
    helix.push(new THREE.Vector3(28, 21.25, 3.2), new THREE.Vector3(31, 21.05, 3.2));
    const p1 = pipe(kit, helix);
    const b = kit.trough([[31.4, 20.2, 3.2], [38, 19, 3], [46, 17.6, -2], [52, 16.2, -10], [54, 14.8, -18], [52.5, 14.1, -23], [51.5, 13.95, -25.5]], { width: taper });
    const p2 = pipe(kit, [[51.39, 14.55, -25.78], [50.3, 14.2, -28.5], [46, 13, -33], [40, 11.6, -33], [36, 10.4, -29], [32, 9.2, -29], [28, 8.4, -33], [25, 7.9, -34]]);
    const c = kit.trough([[24.7, 7.08, -34.1], [18, 6.2, -36], [8, 5, -36], [-2, 3.8, -32], [-10, 2.8, -26]], { checker: "end" });
    boost(kit, b, 0.12, 0.22); boost(kit, c, 0.3, 0.42);
    return { kind: "race", sections: [a, p1, b, p2, c] };
  },
};
