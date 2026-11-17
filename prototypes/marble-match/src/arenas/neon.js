// 9 · Neon Overdrive: a synthwave highway — huge banked sweepers, two jumps, sliding gates, three boost pads.
// Each landing starts under its lip: a marble never meets the landing's front edge.
import { boost } from "../kit/extras.js";

const landing = (f) => 2.8 + 2.4 * Math.max(0, 1 - f / 0.2);
const landingWall = (f) => 1.0 + 0.9 * Math.max(0, 1 - f / 0.2);
export default {
  id: "neon", name: "Neon Overdrive", tagline: "Synthwave highway · 2 jumps · 3 boost pads",
  theme: { sky: ["#090014", "#3b0764", "#ff2a6d"], wall: "#ff2a6d", wallDark: "#7a0040", floor: "#120a24", floorAlt: "#1a0f33", kerb: ["#05d9e8", "#ff2a6d"], rail: "#05d9e8", rail2: "#ff2a6d", pillar: "#2b1748", ground: "#0b0016", glow: "#ff2a6d", hazard: "#f9f871", boost: "#05d9e8", groundStyle: "grid" },
  build(kit) {
    const a = kit.trough([[0, 40, 0], [14, 38.6, 0], [28, 36.8, -6], [40, 34.8, -16], [46, 32.8, -30], [42, 30.6, -44], [30, 28.6, -50], [18, 27, -46], [12, 25.8, -40], [10.4, 25.6, -36], [9.8, 25.75, -33]], { checker: "start" });
    const b = kit.trough([[9.9, 24.65, -32.4], [9.4, 24.6, -30], [8.6, 23.8, -24], [2, 22, -14], [-8, 20.2, -8], [-20, 18.2, -8], [-30, 16.4, -14], [-34, 14.8, -24], [-30, 13.2, -34], [-22, 12, -38], [-16, 11.6, -40], [-12, 11.75, -41]], { width: landing, wall: landingWall });
    const c = kit.trough([[-11, 10.75, -41.6], [-8.6, 10.7, -42.2], [0, 9.2, -46], [12, 7.6, -48], [24, 6.4, -46], [34, 5.4, -40]], { width: landing, wall: landingWall, checker: "end" });
    boost(kit, a, 0.5, 0.56); boost(kit, b, 0.42, 0.48); boost(kit, c, 0.35, 0.47);
    kit.gate(b, Math.round(0.22 * (b.n - 1)), { speed: 1.7 });
    kit.gate(b, Math.round(0.68 * (b.n - 1)), { speed: 2.1, phase: 1.5 });
    return { kind: "race", sections: [a, b, c] };
  },
};
