// 6 · Arena of Kings: sumo. Both marbles drop into a bowl at random spots; a sweeper arm spins faster and faster; the first marble
// flung over the rim loses. If both survive 75 s, the one nearer the centre wins.
import * as THREE from "three";
import { bowl } from "../kit/shapes.js";

export default {
  id: "kings", name: "Arena of Kings", tagline: "Sumo bowl · last marble standing",
  theme: { sky: ["#0a0204", "#3b0a12", "#7d0018"], wall: "#b45309", wallDark: "#78350f", floor: "#2a1a10", floorAlt: "#3a2414", kerb: ["#f0c75e", "#ffffff"], rail: "#f0c75e", rail2: "#ff4d63", pillar: "#3a2a20", ground: "#0d0605", glow: "#f0c75e", hazard: "#ff4d63" },
  build(kit) {
    const center = new THREE.Vector3(0, 6, 0);
    const path = bowl(kit, { center });
    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(5.6, 7, 6, 32), new THREE.MeshStandardMaterial({ color: "#1d0f0a", metalness: 0.3, roughness: 0.6 }));
    plinth.position.set(0, 2.6, 0); plinth.receiveShadow = true; kit.group.add(plinth);
    return {
      kind: "sumo", sections: [path], center, rim: 6.4, limit: 75,
      start: (() => { const a = kit.rand() * Math.PI * 2, gap = Math.PI * (0.5 + kit.rand()); return (k) => center.clone().add(new THREE.Vector3(Math.cos(a + k * gap) * 3.4, 2.4, Math.sin(a + k * gap) * 3.4)); })(), // random spots, never side by side
    };
  },
};
