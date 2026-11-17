// 2 · Comeback Sprint: a long fast downhill with two jumps — kicker lips, a gap, wide high-walled landings.
const landing = (f) => 2.8 + 1.6 * Math.max(0, 1 - f / 0.16);
const landingWall = (f) => 1.0 + 0.7 * Math.max(0, 1 - f / 0.16);
export default {
  id: "busan", name: "Comeback Sprint", tagline: "Comeback stage · downhill · two big leaps",
  theme: { cup: "Division 2", sky: ["#1a0b2e", "#c2410c", "#fbbf24"], wall: "#c2410c", wallDark: "#7c2d12", floor: "#1f1b24", floorAlt: "#2a2430", kerb: ["#fb923c", "#fff7ed"], rail: "#fbbf24", rail2: "#f472b6", pillar: "#3b2f3a", ground: "#1a0d0a", glow: "#fb923c", hazard: "#fde047" },
  build(kit) {
    const a = kit.trough([[0, 36, 0], [10, 34.2, 1], [20, 32.3, -1], [30, 30.5, 1], [37, 29.4, 0], [41, 29.2, 0], [43.5, 29.5, 0]], { checker: "start" });
    const b = kit.trough([[46.3, 27.8, 0], [54, 26.3, 0], [64, 24.2, -4], [74, 22, -2], [84, 20.2, 3], [92, 18.9, 2], [96, 18.7, 1], [98.5, 19, 1]], { width: landing, wall: landingWall });
    const c = kit.trough([[101.3, 17.3, 1], [110, 15.6, 1], [120, 13.4, -2], [130, 11.2, 0], [140, 9.3, 2], [150, 7.8, 0]], { width: landing, wall: landingWall, checker: "end" });
    // a post on each long straight: speed alone does not settle it
    for (const [sec, f, u] of [[b, 0.6, 0.15], [c, 0.5, -0.12]]) {
      const i = Math.round(f * (sec.n - 1));
      kit.pin(sec.pts[i].clone().addScaledVector(sec.side[i], u).addScaledVector(sec.up[i], 0.45), sec.up[i], { r: 0.18, bounce: 0.45 });
    }
    return { kind: "race", sections: [a, b, c] };
  },
};
