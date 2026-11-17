// A marble: a glass ball with the idol's photo inside (always facing the camera) and corner-coloured bands that show the
// roll, a coloured outline and halo that read at any distance, and a fading light trail.
import * as THREE from "three";

const load = (url) => new Promise((ok) => { const img = new Image(); img.onload = () => ok(img); img.onerror = () => ok(null); img.src = url; });

// The face inside the glass: the photo in a circle with a white and a corner-coloured ring (always turned to the camera).
async function face(photoUrl, color, label) {
  const img = photoUrl ? await load(photoUrl) : null;
  const c = document.createElement("canvas"); c.width = c.height = 512;
  const g = c.getContext("2d");
  g.save(); g.beginPath(); g.arc(256, 256, 236, 0, Math.PI * 2); g.clip();
  g.fillStyle = color; g.fillRect(0, 0, 512, 512);
  if (img) { const s = Math.min(img.width, img.height); g.drawImage(img, (img.width - s) / 2, 0, s, s, 20, 20, 472, 472); }
  else { g.fillStyle = "#fff"; g.font = "bold 260px Arial Black, Arial"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(label, 256, 270); }
  g.restore();
  g.lineWidth = 18; g.strokeStyle = "#fff"; g.beginPath(); g.arc(256, 256, 236, 0, Math.PI * 2); g.stroke();
  g.lineWidth = 12; g.strokeStyle = color; g.beginPath(); g.arc(256, 256, 250, 0, Math.PI * 2); g.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// The glass shell: faint tint plus corner-coloured bands, so the roll still shows.
function shell(color) {
  const c = document.createElement("canvas"); c.width = 512; c.height = 256;
  const g = c.getContext("2d");
  g.fillStyle = "rgba(255,255,255,0.10)"; g.fillRect(0, 0, 512, 256);
  g.fillStyle = color;
  for (let x = 0; x < 512; x += 128) g.fillRect(x, 0, 14, 256);
  g.fillRect(0, 120, 512, 16);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const haloTex = (() => {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const g = c.getContext("2d"), r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, "rgba(255,255,255,0.9)"); r.addColorStop(0.35, "rgba(255,255,255,0.25)"); r.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
})();

const TRAIL = 70;

export async function createMarble(scene, { photoUrl, color, label, R }) {
  const group = new THREE.Group();
  const portrait = new THREE.Sprite(new THREE.SpriteMaterial({ map: await face(photoUrl, color, label) }));
  portrait.scale.setScalar(R * 1.55);
  portrait.renderOrder = 1;
  const ball = new THREE.Mesh(new THREE.SphereGeometry(R, 40, 28), new THREE.MeshPhysicalMaterial({ map: shell(color), transparent: true, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.03, depthWrite: false }));
  ball.renderOrder = 2;
  ball.castShadow = true;
  const outline = new THREE.Mesh(new THREE.SphereGeometry(R * 1.12, 24, 16), new THREE.MeshBasicMaterial({ color, side: THREE.BackSide }));
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.8 }));
  halo.scale.setScalar(R * 6);
  group.add(portrait, ball, outline, halo);
  scene.add(group);

  const pos = new Float32Array(TRAIL * 3), col = new Float32Array(TRAIL * 3);
  const base = new THREE.Color(color);
  for (let i = 0; i < TRAIL; i++) base.clone().multiplyScalar(1 - i / TRAIL).toArray(col, i * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const trail = new THREE.Line(geo, new THREE.LineBasicMaterial({ vertexColors: true, blending: THREE.AdditiveBlending, transparent: true }));
  trail.frustumCulled = false;
  scene.add(trail);
  let filled = false;

  return {
    group,
    update(t, q) {
      const jump = group.position.distanceToSquared(t) > 4; // a respawn or a skipped stretch: restart the trail, no streak
      group.position.set(t.x, t.y, t.z);
      if (jump) filled = false;
      ball.quaternion.set(q.x, q.y, q.z, q.w);
      if (!filled) { for (let i = 0; i < TRAIL; i++) group.position.toArray(pos, i * 3); filled = true; }
      pos.copyWithin(3, 0, (TRAIL - 1) * 3);
      group.position.toArray(pos, 0);
      geo.attributes.position.needsUpdate = true;
    },
    resetTrail() { filled = false; },
    dispose() { scene.remove(group, trail); },
  };
}
