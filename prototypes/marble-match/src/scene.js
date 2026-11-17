// The look, shared by every arena: renderer, lights, a generated environment (no download), the arena floor. Each game
// swaps in its arena: sky gradient + fog in its theme, the floor under it, the key light's shadow fitted to it, a start
// gate with the arena's name and a checkered finish arch. The previous arena is freed from the GPU.
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { stage } from "./stage.js";

const canvasTex = (w, h, draw) => {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
};

export function freeGroup(group) {
  group.removeFromParent();
  group.traverse((o) => {
    if (o.geometry && !o.isSprite) o.geometry.dispose();
    for (const m of [o.material].flat().filter(Boolean)) { m.map?.dispose(); m.emissiveMap?.dispose(); m.dispose(); }
  });
}

export function createScene(canvas, quality) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, quality === "high" ? 1.5 : 1)); // a GPU that runs out resets the context
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = quality === "high";
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog("#000", 50, 160);
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  const hemi = new THREE.HemisphereLight("#9fb8ff", "#2a0610", 0.9);
  const key = new THREE.DirectionalLight("#ffe9d6", 2.2);
  key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.bias = -0.0006;
  const rim = new THREE.DirectionalLight("#ff4d63", 1.2);
  scene.add(hemi, key, key.target, rim);
  const ground = new THREE.Mesh(new THREE.CircleGeometry(150, 64), new THREE.MeshStandardMaterial({ roughness: 0.9 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
  scene.add(ground);
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 500);
  let deco = null;

  function setArena(arena, game, group) {
    const th = arena.theme;
    scene.background?.dispose();
    scene.background = canvasTex(4, 512, (g, w, h) => {
      const grad = g.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, th.sky[0]); grad.addColorStop(0.55, th.sky[1]); grad.addColorStop(1, th.sky[2]);
      g.fillStyle = grad; g.fillRect(0, 0, w, h);
    });
    scene.fog.color.set(th.sky[1]);
    rim.color.set(th.glow);
    ground.material.map?.dispose();
    ground.material.map = groundTexture(th);
    const glowing = th.groundStyle === "lava" || th.groundStyle === "deep";
    ground.material.emissiveMap = glowing ? ground.material.map : null;
    ground.material.emissive.set(glowing ? "#ffffff" : "#000000");
    ground.material.emissiveIntensity = th.groundStyle === "lava" ? 1.1 : 0.6;
    ground.material.needsUpdate = true;
    const box = new THREE.Box3().setFromObject(group), mid = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3());
    ground.position.set(mid.x, game.groundY, mid.z);
    const reach = Math.max(size.x, size.z) / 2 + 6;
    key.position.copy(mid).add(new THREE.Vector3(reach * 0.6, reach + 20, reach * 0.4)); key.target.position.copy(mid);
    Object.assign(key.shadow.camera, { left: -reach, right: reach, top: reach, bottom: -reach, near: 1, far: reach * 3 + 40 });
    key.shadow.camera.updateProjectionMatrix();
    rim.position.copy(mid).add(new THREE.Vector3(-reach, 12, -reach));
    if (deco) freeGroup(deco);
    deco = decorations(arena, game);
    deco.add(stage(arena, game.groundY, mid, reach)); // lightsticks, LED screens, spotlights
    scene.add(group, deco);
    return { mid, reach };
  }
  return { renderer, scene, camera, setArena };
}

// The floor under an arena, in its theme: neon grid, lava, clouds, the deep sea, or rings.
function groundTexture(th) {
  return canvasTex(1024, 1024, (g, w) => {
    const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    g.fillStyle = "#000"; g.fillRect(0, 0, w, w);
    const style = th.groundStyle ?? "rings";
    if (style === "clouds") { g.fillStyle = th.ground; g.fillRect(0, 0, w, w); for (let i = 0; i < 160; i++) { const x = Math.random() * w, y = Math.random() * w, s = 20 + Math.random() * 70, c = g.createRadialGradient(x, y, 0, x, y, s); c.addColorStop(0, "rgba(255,255,255,0.9)"); c.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = c; g.fillRect(x - s, y - s, 2 * s, 2 * s); } return; }
    r.addColorStop(0, th.wallDark + "99"); r.addColorStop(0.45, th.ground); r.addColorStop(1, "#000"); // a soft glow, not a lit disc
    g.fillStyle = r; g.fillRect(0, 0, w, w);
    if (style === "grid") { g.strokeStyle = th.glow + "55"; g.lineWidth = 2; for (let x = 0; x <= w; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, w); g.stroke(); g.beginPath(); g.moveTo(0, x); g.lineTo(w, x); g.stroke(); } }
    else if (style === "lava") { for (let i = 0; i < 90; i++) { const x = Math.random() * w, y = Math.random() * w, s = 10 + Math.random() * 60, c = g.createRadialGradient(x, y, 0, x, y, s); c.addColorStop(0, "rgba(255,190,60,0.95)"); c.addColorStop(0.5, "rgba(255,70,0,0.6)"); c.addColorStop(1, "rgba(120,10,0,0)"); g.fillStyle = c; g.fillRect(x - s, y - s, 2 * s, 2 * s); } }
    else if (style === "deep") { for (let i = 0; i < 260; i++) { const x = Math.random() * w, y = Math.random() * w, s = 2 + Math.random() * 6; g.fillStyle = Math.random() < 0.6 ? th.glow + "aa" : "#9b5de5aa"; g.beginPath(); g.arc(x, y, s, 0, Math.PI * 2); g.fill(); } }
    else { g.strokeStyle = th.glow + "22"; g.lineWidth = 3; for (let i = 1; i < 10; i++) { g.beginPath(); g.arc(w / 2, w / 2, i * 50, 0, Math.PI * 2); g.stroke(); } }
  });
}

// A gate over the run: two posts and a board (the arena's name at the start, a checker at the finish).
function decorations(arena, game) {
  const deco = new THREE.Group();
  const { guide } = game;
  const steel = new THREE.MeshStandardMaterial({ color: arena.theme.pillar, metalness: 0.8, roughness: 0.3 });
  const gate = (i, tex, width = 4.4) => {
    const p = guide.pts[i], s = guide.side[i], u = guide.up[i];
    for (const k of [-1, 1]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.2, 0.18), steel); leg.position.copy(p).addScaledVector(s, k * 1.9).addScaledVector(u, 1.4); deco.add(leg); }
    const board = new THREE.Mesh(new THREE.PlaneGeometry(width, 0.6), new THREE.MeshStandardMaterial({ map: tex, emissive: "#fff", emissiveMap: tex, emissiveIntensity: 0.4, side: THREE.DoubleSide }));
    board.position.copy(p).addScaledVector(u, 2.9);
    board.lookAt(board.position.clone().sub(guide.T[i]));
    deco.add(board);
  };
  const named = canvasTex(1024, 128, (g, w, h) => {
    for (let x = 0; x < w; x += 32) for (let y = 0; y < h; y += 32) { g.fillStyle = (x + y) / 32 % 2 ? "#111" : "#f2f2f2"; g.fillRect(x, y, 32, 32); }
    g.fillStyle = arena.theme.wallDark + "ee"; g.fillRect(0, 22, w, 84);
    g.fillStyle = "#fff"; g.font = "bold 56px Arial Black, Arial, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(arena.name.toUpperCase(), w / 2, 66);
  });
  const checker = canvasTex(512, 64, (g, w, h) => { for (let x = 0; x < w; x += 32) for (let y = 0; y < h; y += 32) { g.fillStyle = (x + y) / 32 % 2 ? "#111" : "#f2f2f2"; g.fillRect(x, y, 32, 32); } });
  if (game.sumo) {
    const c = game.built.center;
    const board = new THREE.Mesh(new THREE.PlaneGeometry(9, 1.1), new THREE.MeshStandardMaterial({ map: named, emissive: "#fff", emissiveMap: named, emissiveIntensity: 0.4, side: THREE.DoubleSide }));
    board.position.set(c.x, c.y + 6, c.z - 7.5); deco.add(board);
    checker.dispose();
  } else {
    gate(Math.min(guide.n - 1, 18), named);
    gate(guide.n - 3, checker, 4);
  }
  return deco;
}
