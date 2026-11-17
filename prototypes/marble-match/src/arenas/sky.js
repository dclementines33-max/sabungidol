// 13 · Rookie Sky Bridges: wide golden platforms joined by narrow low-railed bridges high above the clouds — go fast and you
// may fly off; the boosts sit on the platforms.
import * as THREE from "three";
import { boost } from "../kit/extras.js";

const BANDS = 8; // platform, bridge, platform, bridge…
const band = (f) => { const x = f * BANDS, k = Math.floor(x), e = Math.min(1, Math.min(x - k, k + 1 - x) * 8); return k % 2 ? 1 - e : 1; }; // 1 = platform
export default {
  id: "sky", name: "Rookie Sky Bridges", tagline: "Nugu rookies above the clouds · don't fall",
  theme: { cup: "Nugu Cup", sky: ["#2b6cb0", "#7cc4ff", "#fff1d0"], wall: "#ffffff", wallDark: "#c9dcef", floor: "#e9c46a", floorAlt: "#f4d58d", kerb: ["#ffffff", "#84cc16"], rail: "#ffffff", rail2: "#84cc16", pillar: "#ffffff", ground: "#dbeeff", glow: "#ffffff", hazard: "#84cc16", boost: "#ff006e", groundStyle: "clouds" },
  build(kit) {
    const t = kit.trough([[0, 40, 0], [16, 38.4, 4], [30, 36.6, 0], [44, 34.6, -6], [56, 32.6, -2], [66, 30.4, 8], [72, 28.2, 20], [70, 26, 32], [60, 24, 40], [46, 22, 42], [32, 20, 38], [20, 18, 30], [12, 16.2, 18], [10, 14.6, 6]],
      { width: (f) => 1.6 + 2.2 * band(f), wall: (f) => 0.45 + 0.8 * band(f), bank: 0.35, checker: "end" });
    for (const k of [0, 2, 4, 6]) boost(kit, t, (k + 0.35) / BANDS, (k + 0.6) / BANDS);
    const puff = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 1 });
    for (let j = 0; j < 26; j++) { const c = new THREE.Mesh(new THREE.SphereGeometry(2 + kit.rand() * 3, 16, 12), puff); c.position.set(-10 + kit.rand() * 90, 4 + kit.rand() * 14, -20 + kit.rand() * 70); c.scale.y = 0.45; kit.group.add(c); }
    return { kind: "race", sections: [t], offTrack: 3.6 };
  },
};
