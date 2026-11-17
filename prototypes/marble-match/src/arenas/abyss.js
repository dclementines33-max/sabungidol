// 15 · B-Side Abyss: a giant glass spiral down into the deep, a wide trench run guarded by jellyfish spinners, boosts.
import * as THREE from "three";
import { boost, pipe } from "../kit/extras.js";
import { after } from "./join.js";

const taper = (f) => (f > 0.8 ? 2.6 - 1.2 * ((f - 0.8) / 0.2) : 2.6);
export default {
  id: "abyss", name: "B-Side Abyss", tagline: "Deep cut · giant glass spiral · trench run",
  theme: { cup: "B-Side Cup", sky: ["#000814", "#001d3d", "#003566"], wall: "#0d9488", wallDark: "#134e4a", floor: "#03045e", floorAlt: "#04086e", kerb: ["#5eead4", "#7b2cbf"], rail: "#00f5d4", rail2: "#9b5de5", pillar: "#012a4a", ground: "#000510", glow: "#00f5d4", hazard: "#f15bb5", boost: "#00f5d4", glass: "#7cf6ff", groundStyle: "deep" },
  build(kit) {
    const a = kit.trough([[0, 38, 0], [10, 36.8, 0], [16, 36, 0], [18.5, 35.75, 0]], { width: taper, checker: "start" });
    const spiral = [];
    for (let k = 0; k <= 24; k++) { const ang = -Math.PI / 2 + (k / 12) * Math.PI * 2; spiral.push(new THREE.Vector3(18.8 + 6 * Math.cos(ang), 36.35 - (k / 12) * 5, 6 + 6 * Math.sin(ang))); }
    spiral.push(new THREE.Vector3(22, 26.15, 0), new THREE.Vector3(25, 25.95, 0));
    const p = pipe(kit, spiral, { radius: 0.8 });
    const b = kit.trough([[25.4, 25.05, 0], [32, 24, 0], [40, 22.6, 4], [46, 21.2, 12], [46, 19.8, 22], [40, 18.6, 28], [32, 17.4, 28], [24, 16.2, 24], [18, 15, 26], [14, 13.8, 32], [14, 12.6, 40]], { width: (f) => (f > 0.85 ? 4.2 - 1.6 * ((f - 0.85) / 0.15) : 4.2), wall: 1.4, bank: 0.35 }); // narrows back before the last straight
    for (const [f, sp] of [[0.32, 1.4], [0.55, -1.7], [0.74, 2]]) kit.spinner(b, Math.round(f * (b.n - 1)), { length: 3.8, speed: sp });
    const c = kit.trough(after(b, [14.5, 11.2, 48], [17, 10.2, 56], [22, 9.2, 62]), { wall: (f) => 1.4 - 0.45 * Math.min(1, f / 0.3), checker: "end" });
    boost(kit, b, 0.1, 0.18); boost(kit, b, 0.62, 0.68); boost(kit, c, 0.3, 0.45);
    const glow = new THREE.MeshStandardMaterial({ color: "#9b5de5", emissive: "#9b5de5", emissiveIntensity: 1.4, transparent: true, opacity: 0.7 });
    for (let j = 0; j < 22; j++) { const jf = new THREE.Mesh(new THREE.SphereGeometry(0.7, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), glow); jf.position.set(-4 + kit.rand() * 56, 6 + kit.rand() * 30, -8 + kit.rand() * 74); kit.group.add(jf); }
    return { kind: "race", sections: [a, p, b, c], offTrack: 4 };
  },
};
