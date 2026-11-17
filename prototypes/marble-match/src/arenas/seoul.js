// 1 · Seoul Neon Circuit: the prototype's circuit, one descent from the start gate to the finish (no lift any more).
export default {
  id: "seoul", name: "Seoul Neon Circuit", tagline: "Classic circuit · banked corners · pin chicanes",
  theme: { sky: ["#05010d", "#2a0730", "#7d0018"], wall: "#7d0018", wallDark: "#3a0612", floor: "#1a1b26", floorAlt: "#22232f", kerb: ["#ff4d63", "#f2f2f2"], rail: "#ff4d63", rail2: "#9fd8ff", pillar: "#2b2d3a", ground: "#0b0408", glow: "#ff4d63", hazard: "#f0c75e" },
  build(kit) {
    const t = kit.trough([
      [0, 30.4, 0], [12, 29.4, 0], [24, 28.2, 2], [30, 26.8, 8], [28, 25.2, 16], [20, 24, 18], [12, 22.6, 14], [6, 21.3, 18],
      [0, 20.2, 26], [-10, 18.4, 28], [-20, 16.7, 22], [-22, 15, 12], [-16, 13.3, 6], [-24, 11.4, -2], [-20, 9.5, -12],
      [-8, 7.6, -14], [4, 5.6, -10], [9, 3.7, -4], [5, 2, -1], [0, 1, 0],
    ], { checker: "end" });
    for (const [f, u] of [[0.46, 0.06], [0.49, -0.1], [0.8, 0.08], [0.83, -0.06]]) { const i = Math.round(f * (t.n - 1)); kit.pin(t.pts[i].clone().addScaledVector(t.side[i], u).addScaledVector(t.up[i], 0.45), t.up[i]); }
    return { kind: "race", sections: [t] };
  },
};
