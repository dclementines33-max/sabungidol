// 5 · Jeju Spiral Tower: three banked turns of a helix around a glowing tower, then a dash to the line.
import * as THREE from "three";

export default {
  id: "jeju", name: "Jeju Spiral Tower", tagline: "Three-turn helix · constant G",
  theme: { sky: ["#03140f", "#064e3b", "#10b981"], wall: "#059669", wallDark: "#064e3b", floor: "#1a2622", floorAlt: "#22312b", kerb: ["#34d399", "#ecfdf5"], rail: "#6ee7b7", rail2: "#fde68a", pillar: "#1f3a33", ground: "#04120d", glow: "#34d399", hazard: "#fde68a" },
  build(kit) {
    const pts = [];
    for (let k = 0; k <= 36; k++) { const a = (k / 12) * Math.PI * 2; pts.push([Math.cos(a) * 8, 36 - (k / 12) * 8, Math.sin(a) * 8]); }
    pts.push([8.6, 11.2, 6], [9, 10.4, 12], [9, 9.6, 20], [7, 8.8, 28]);
    const t = kit.trough(pts, { wall: 1.1, checker: "end" });
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 4.2, 40, 24), new THREE.MeshStandardMaterial({ color: "#0b231c", metalness: 0.4, roughness: 0.4 }));
    tower.position.set(0, 18, 0); tower.castShadow = true; kit.group.add(tower);
    for (let y = 4; y < 38; y += 3) { const ring = new THREE.Mesh(new THREE.TorusGeometry(3.75 - y * 0.012, 0.07, 6, 48), kit.mat.rail); ring.rotation.x = Math.PI / 2; ring.position.set(0, y, 0); kit.group.add(ring); }
    return { kind: "race", sections: [t] };
  },
};
