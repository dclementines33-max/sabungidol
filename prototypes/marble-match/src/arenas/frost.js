// 4 · Frostbite Gauntlet: a slippery ice run through spinning bars, swinging hammers and sliding gates.
export default {
  id: "frost", name: "Frostbite Gauntlet", tagline: "Ice · spinners · hammers · sliding gates",
  theme: { sky: ["#020617", "#0c4a6e", "#7dd3fc"], wall: "#0ea5e9", wallDark: "#075985", floor: "#cfe8f7", floorAlt: "#b9dcf2", kerb: ["#38bdf8", "#ffffff"], rail: "#e0f2fe", rail2: "#38bdf8", pillar: "#334155", ground: "#0b1724", glow: "#7dd3fc", hazard: "#f43f5e" },
  build(kit) {
    const t = kit.trough([
      [0, 34, 0], [14, 32, 0], [26, 29.6, 4], [32, 27.6, 12], [30, 25.6, 22], [20, 23.4, 26], [8, 21.2, 24], [0, 19.2, 30],
      [2, 17, 40], [12, 14.8, 44], [24, 12.6, 42], [34, 10.6, 46], [44, 8.8, 44],
    ], { friction: 0.12, checker: "end" });
    const at = (f) => Math.round(f * (t.n - 1));
    kit.spinner(t, at(0.1), { speed: 1.3 });
    kit.hammer(t, at(0.22), { speed: 2.1 });
    kit.gate(t, at(0.34), { speed: 1.5 });
    kit.spinner(t, at(0.47), { speed: -1.6, phase: 1 });
    kit.hammer(t, at(0.6), { speed: 2.5, phase: 1.3 });
    kit.gate(t, at(0.72), { speed: 1.9, phase: 2 });
    kit.spinner(t, at(0.86), { speed: 1.9, phase: 2.2 });
    return { kind: "race", sections: [t] };
  },
};
