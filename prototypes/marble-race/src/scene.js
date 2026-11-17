// The look: stylised, not realistic — a gradient night sky with fog, a dark arena floor with a glow, the trough in solid
// colours with neon rails, steel pillars, the lift tower and a start gantry. Lighting = one soft shadow-casting key light
// + a generated environment (RoomEnvironment, no download) for the glossy marbles.
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const canvasTex = (w, h, draw) => {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
};

export function createScene(canvas, track, quality) {
  const th = track.def.theme;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, quality === "high" ? 2 : 1.25));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = quality === "high";
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(th.sky[1], 45, 140);
  scene.background = canvasTex(4, 512, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, th.sky[0]); grad.addColorStop(0.55, th.sky[1]); grad.addColorStop(1, th.sky[2]);
    g.fillStyle = grad; g.fillRect(0, 0, w, h);
  });
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  scene.add(new THREE.HemisphereLight("#9fb8ff", "#2a0610", 0.9));
  const key = new THREE.DirectionalLight("#ffe9d6", 2.2);
  key.position.set(30, 45, 20);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 1, far: 140 });
  key.shadow.bias = -0.0005;
  scene.add(key);
  const rim = new THREE.DirectionalLight(th.glow, 1.2);
  rim.position.set(-30, 10, -30);
  scene.add(rim);

  // arena floor: a glowing disc with rings
  const floorTex = canvasTex(1024, 1024, (g, w) => {
    const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    r.addColorStop(0, "#3a0a18"); r.addColorStop(0.5, th.ground); r.addColorStop(1, "#000");
    g.fillStyle = r; g.fillRect(0, 0, w, w);
    g.strokeStyle = "rgba(255,77,99,0.18)"; g.lineWidth = 3;
    for (let i = 1; i < 9; i++) { g.beginPath(); g.arc(w / 2, w / 2, i * 56, 0, Math.PI * 2); g.stroke(); }
  });
  const ground = new THREE.Mesh(new THREE.CircleGeometry(120, 64), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.9 }));
  ground.rotation.x = -Math.PI / 2; ground.position.set(3, track.minY - 1.4, 7);
  ground.receiveShadow = true;
  scene.add(ground);

  const trough = new THREE.Mesh(track.geometry, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.15, side: THREE.DoubleSide }));
  trough.castShadow = true; trough.receiveShadow = true;
  scene.add(trough);
  track.rails.forEach((curve, i) => {
    const color = i ? th.rail2 : th.rail;
    scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, Math.floor(track.n / 2), 0.07, 6), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.6, roughness: 0.3 })));
  });

  // pillars from the floor to the trough
  const pillarGeo = new THREE.CylinderGeometry(0.11, 0.16, 1, 8);
  const pillars = new THREE.InstancedMesh(pillarGeo, new THREE.MeshStandardMaterial({ color: th.pillar, metalness: 0.7, roughness: 0.35 }), track.pillars.length);
  const m4 = new THREE.Matrix4();
  track.pillars.forEach((p, i) => {
    const h = p.y - ground.position.y;
    m4.compose(new THREE.Vector3(p.x, ground.position.y + h / 2, p.z), new THREE.Quaternion(), new THREE.Vector3(1, h, 1));
    pillars.setMatrixAt(i, m4);
  });
  pillars.castShadow = true;
  scene.add(pillars);

  for (const pin of track.pins) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.9, 16), new THREE.MeshStandardMaterial({ color: "#f0c75e", emissive: "#f0c75e", emissiveIntensity: 0.6, metalness: 0.6, roughness: 0.3 }));
    mesh.position.copy(pin.pos); mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pin.up);
    mesh.castShadow = true; scene.add(mesh);
  }

  // the lift tower between the lap line (bottom) and the start (top)
  const bottom = track.pts[track.n - 1], topP = track.pts[0];
  const towerH = topP.y - ground.position.y + 2;
  const tower = new THREE.Group();
  const post = new THREE.MeshStandardMaterial({ color: "#2b2d3a", metalness: 0.8, roughness: 0.3 });
  for (const [dx, dz] of [[-1.3, -1.3], [1.3, -1.3], [-1.3, 1.3], [1.3, 1.3]]) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.22, towerH, 0.22), post);
    m.position.set(bottom.x + dx, ground.position.y + towerH / 2, bottom.z + dz); m.castShadow = true; tower.add(m);
  }
  for (let y = ground.position.y + 1; y < topP.y + 1; y += 1.6) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.75, 0.05, 6, 4), new THREE.MeshStandardMaterial({ color: th.rail, emissive: th.rail, emissiveIntensity: 1.4 }));
    ring.rotation.set(Math.PI / 2, 0, Math.PI / 4); ring.position.set(bottom.x, y, bottom.z); tower.add(ring);
  }
  scene.add(tower);

  // start gantry with the circuit's name
  const banner = canvasTex(1024, 128, (g, w, h) => {
    for (let x = 0; x < w; x += 32) for (let y = 0; y < h; y += 32) { g.fillStyle = (x + y) / 32 % 2 ? "#111" : "#f2f2f2"; g.fillRect(x, y, 32, 32); }
    g.fillStyle = "rgba(125,0,24,0.92)"; g.fillRect(0, 24, w, 80);
    g.fillStyle = "#fff"; g.font = "bold 58px Arial Black, Arial, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(track.def.name.toUpperCase(), w / 2, 66);
  });
  const gi = 30, gp = track.pts[gi], gs = track.side[gi], gu = track.up[gi];
  const gantry = new THREE.Group();
  for (const s of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.2, 0.18), post);
    leg.position.copy(gp).addScaledVector(gs, s * 1.9).addScaledVector(gu, 1.4); gantry.add(leg);
  }
  const board = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 0.55), new THREE.MeshStandardMaterial({ map: banner, emissive: "#ffffff", emissiveMap: banner, emissiveIntensity: 0.35, side: THREE.DoubleSide }));
  board.position.copy(gp).addScaledVector(gu, 2.9);
  board.lookAt(board.position.clone().sub(track.T[gi]));
  gantry.add(board);
  scene.add(gantry);

  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 400);
  camera.position.set(30, 30, 40);
  return { renderer, scene, camera, ground };
}
