// 8 · Music Bank Cascade: a steep mountain-road descent, six straights joined by tight banked hairpins.
export default {
  id: "cascade", name: "Music Bank Cascade", tagline: "Music Bank · six banked hairpins",
  theme: { cup: "Music Bank Cup", sky: ["#140713", "#6b1d3a", "#f9a8d4"], wall: "#be185d", wallDark: "#831843", floor: "#2a1520", floorAlt: "#341a28", kerb: ["#f9a8d4", "#fff1f2"], rail: "#fbcfe8", rail2: "#fda4af", pillar: "#3b1f2b", ground: "#12060c", glow: "#f472b6", hazard: "#fde68a" },
  build(kit) {
    const pts = [];
    let y = 34;
    for (let k = 0; k < 6; k++) {
      const dir = k % 2 ? -1 : 1, z = k * 6.4, x0 = dir > 0 ? 0 : 22, x1 = dir > 0 ? 22 : 0;
      pts.push([x0, y, z], [(x0 + x1) / 2, y - 0.9, z], [x1, y - 1.8, z]);
      y -= 1.8;
      if (k < 5) { for (const th of [Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4]) pts.push([x1 + dir * 3.2 * Math.sin(th), y - (th / Math.PI) * 1.3, z + 3.2 - 3.2 * Math.cos(th)]); y -= 1.3; }
    }
    pts.push([-6, y - 0.8, 32], [-12, y - 1.6, 32]);
    const t = kit.trough(pts, { wall: 1.25, checker: "end" });
    // a post in the middle of every other straight, on alternating sides
    for (const k of [1, 3, 5]) { const i = t.pts.reduce((best, q, j) => (Math.abs(q.z - k * 6.4) < 0.3 && Math.abs(q.x - 11) < Math.abs(t.pts[best].x - 11) ? j : best), 0); kit.pin(t.pts[i].clone().addScaledVector(t.side[i], k % 2 ? 0.3 : -0.3).addScaledVector(t.up[i], 0.45), t.up[i], { r: 0.16, bounce: 0.5 }); }
    return { kind: "race", sections: [t] };
  },
};
