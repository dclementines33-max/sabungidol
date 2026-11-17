// 14 · Dragon Slalom: a lantern-lit slalom with bumper posts at every apex, then a wide bobsled half-pipe where the
// marbles ride the walls, then a boost into the final straight.
import * as THREE from "three";
import { boost } from "../kit/extras.js";
import { after } from "./join.js";

export default {
  id: "dragon", name: "Dragon Slalom", tagline: "Lantern slalom · bobsled half-pipe",
  theme: { sky: ["#1a0005", "#8b0000", "#ffb703"], wall: "#c1121f", wallDark: "#780000", floor: "#1b0d0a", floorAlt: "#2a1410", kerb: ["#ffb703", "#c1121f"], rail: "#ffb703", rail2: "#ff595e", pillar: "#3d0c02", ground: "#160302", glow: "#ffb703", hazard: "#ffb703", boost: "#ffd60a", groundStyle: "rings" },
  build(kit) {
    const a = kit.trough([[0, 34, 0], [8, 33, 2.5], [16, 32, -2.5], [24, 31, 2.5], [32, 30, -2.5], [40, 29, 2.5], [48, 28, -2.5], [56, 27, 0], [62, 26.2, -4]], { checker: "start" });
    for (let k = 1; k <= 6; k++) { // a bumper post at each apex, on its inside
      const i = a.pts.reduce((best, q, j) => (Math.abs(q.x - k * 8) < Math.abs(a.pts[best].x - k * 8) ? j : best), 0);
      kit.pin(a.pts[i].clone().addScaledVector(a.side[i], (k % 2 ? 1 : -1) * 0.45).addScaledVector(a.up[i], 0.45), a.up[i], { r: 0.2, bounce: 0.5 });
    }
    const b = kit.trough(after(a, [66, 24.6, -14], [64, 23.4, -22], [56, 22.2, -28], [46, 21, -30], [38, 19.8, -26], [30, 18.6, -30], [22, 17.4, -36], [12, 16.2, -36], [5, 15, -30], [2, 13.8, -22]), { width: (f) => (f > 0.85 ? 5 - 2.4 * ((f - 0.85) / 0.15) : 5), wall: (f) => (f > 0.85 ? 1.6 - 0.5 * ((f - 0.85) / 0.15) : 1.6), bank: 0.25 }); // narrows back before the final straight
    const c = kit.trough(after(b, [1.5, 12.4, -10], [3, 11.2, 0], [8, 10, 8]), { checker: "end" });
    boost(kit, a, 0.88, 0.96); boost(kit, b, 0.5, 0.56); boost(kit, c, 0.2, 0.38);
    const lantern = new THREE.MeshStandardMaterial({ color: "#ff4d2e", emissive: "#ff2a00", emissiveIntensity: 1.6 });
    for (let j = 0; j < 30; j++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 10), lantern); l.scale.y = 1.25; l.position.set(-6 + kit.rand() * 78, 14 + kit.rand() * 26, -40 + kit.rand() * 46); kit.group.add(l); }
    return { kind: "race", sections: [a, b, c], offTrack: 4.2 }; // the half-pipe is wide: riding its wall is not a fall
  },
};
