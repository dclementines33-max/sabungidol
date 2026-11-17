// Sabung Idol stage dressing around every arena (looks only, no physics): a sea of lightsticks on the floor in the arena's
// colours, giant LED screens and stage spotlight beams sweeping the sky. The LED screens take turns: text screens show
// "SABUNG IDOL", the competition being played (`led.title`, e.g. "UNZURE CUP") and the arena; photo screens show
// `led.photos` (the two idols, the competition logo, the user's own LED photos), each drawn once its image loads.
import * as THREE from "three";

const scanlines = (g) => { for (let y = 0; y < 512; y += 4) { g.fillStyle = "rgba(0,0,0,0.18)"; g.fillRect(0, y, 1024, 1); } };
const screenTex = (arena, led) => {
  const c = document.createElement("canvas"); c.width = 1024; c.height = 512;
  const g = c.getContext("2d"), th = arena.theme;
  const bg = g.createLinearGradient(0, 0, 1024, 512);
  bg.addColorStop(0, th.wallDark); bg.addColorStop(1, "#05010a");
  g.fillStyle = bg; g.fillRect(0, 0, 1024, 512);
  g.fillStyle = th.glow; g.fillRect(0, 0, 1024, 14); g.fillRect(0, 498, 1024, 14);
  g.textAlign = "center"; g.textBaseline = "middle";
  g.fillStyle = "#ffffff"; g.font = "bold 120px Arial Black, Arial, sans-serif"; g.fillText("SABUNG IDOL", 512, 190);
  g.fillStyle = th.glow; g.font = "bold 56px Arial Black, Arial, sans-serif"; g.fillText((led?.title ?? th.cup ?? "Marble Match").toUpperCase(), 512, 300);
  g.fillStyle = "#ffffffcc"; g.font = "bold 44px Arial, sans-serif"; g.fillText(arena.name.toUpperCase(), 512, 385);
  scanlines(g); // LED rows
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

// A photo screen: the picture cover-fitted (faces sit high, so the crop keeps the top), a caption band at the bottom.
const photoTex = (arena, photo) => {
  const c = document.createElement("canvas"); c.width = 1024; c.height = 512;
  const g = c.getContext("2d"), th = arena.theme;
  g.fillStyle = th.wallDark; g.fillRect(0, 0, 1024, 512);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const img = new Image();
  img.onload = () => {
    const s = Math.max(1024 / img.width, 512 / img.height), w = img.width * s, h = img.height * s;
    g.drawImage(img, (1024 - w) / 2, photo.contain ? (512 - h) / 2 : 0, w, h);
    if (photo.caption) { g.fillStyle = "rgba(5,1,10,0.75)"; g.fillRect(0, 420, 1024, 92); g.fillStyle = th.glow; g.fillRect(0, 420, 1024, 6); g.fillStyle = "#fff"; g.font = "bold 54px Arial Black, Arial, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(photo.caption.toUpperCase(), 512, 468); }
    scanlines(g); t.needsUpdate = true;
  };
  img.src = photo.url;
  return t;
};

export function stage(arena, groundY, mid, reach, led) {
  const deco = new THREE.Group(), th = arena.theme;
  const palette = [th.glow, th.rail, th.rail2, th.kerb[0], th.boost ?? th.glow].map((c) => new THREE.Color(c));
  // lightsticks: a ring of fans round the arena, each a stick with a glowing head
  const N = 360, inner = reach + 3, outer = reach + 24;
  const sticks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.09, 0.09, 1.6, 5), new THREE.MeshStandardMaterial({ color: "#1b1b22", roughness: 0.6 }), N);
  const heads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.5, 10, 8), new THREE.MeshBasicMaterial({ toneMapped: false }), N);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
  for (let i = 0; i < N; i++) {
    const a = Math.random() * Math.PI * 2, r = inner + Math.random() * (outer - inner);
    const p = new THREE.Vector3(mid.x + Math.cos(a) * r, groundY + 1.6 + Math.random() * 0.8, mid.z + Math.sin(a) * r);
    q.setFromEuler(new THREE.Euler((Math.random() - 0.5) * 0.6, 0, (Math.random() - 0.5) * 0.6));
    m4.compose(p, q, new THREE.Vector3(1, 1, 1)); sticks.setMatrixAt(i, m4);
    m4.compose(p.clone().add(new THREE.Vector3(0, 0.95, 0).applyQuaternion(q)), q, new THREE.Vector3(1, 1, 1)); heads.setMatrixAt(i, m4);
    heads.setColorAt(i, palette[i % palette.length]);
  }
  deco.add(sticks, heads);
  // LED screens facing the arena
  const text = screenTex(arena, led), photos = (led?.photos ?? []).slice(0, 3).map((p) => photoTex(arena, p));
  const screens = photos.length ? photos.length * 2 : 3;
  for (let j = 0; j < screens; j++) {
    const a = (j / screens) * Math.PI * 2 + 0.6, r = reach + 18;
    const map = j % 2 ? photos[j >> 1] : text; // text and photo screens take turns
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(22, 11), new THREE.MeshBasicMaterial({ map, toneMapped: false, side: THREE.DoubleSide }));
    screen.position.set(mid.x + Math.cos(a) * r, groundY + 12, mid.z + Math.sin(a) * r);
    screen.lookAt(mid.x, groundY + 10, mid.z);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(23, 12, 0.6), new THREE.MeshStandardMaterial({ color: "#0d0d12", metalness: 0.6, roughness: 0.4 }));
    frame.position.copy(screen.position); frame.quaternion.copy(screen.quaternion); frame.translateZ(-0.35);
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.8, 7, 0.8), frame.material);
    leg.position.set(screen.position.x, groundY + 3.5, screen.position.z);
    deco.add(frame, screen, leg);
  }
  // spotlight beams from the floor's edge, leaning in over the arena
  const beamMat = new THREE.MeshBasicMaterial({ color: th.glow, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  for (let j = 0; j < 8; j++) {
    const a = (j / 8) * Math.PI * 2, r = reach + 10, h = 60;
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(4, 0.4, h, 20, 1, true), beamMat);
    beam.position.set(mid.x + Math.cos(a) * r, groundY + h / 2, mid.z + Math.sin(a) * r);
    beam.rotation.set(Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35);
    deco.add(beam);
  }
  return deco;
}
