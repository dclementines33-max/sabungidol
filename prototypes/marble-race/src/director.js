// The camera: TV (cuts between fixed trackside cameras, the nearest one follows the action), Chase (behind the leader)
// or Free (orbit with the mouse). Before the start and after the finish it circles the scene slowly.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export function createDirector(camera, dom, track) {
  const controls = new OrbitControls(camera, dom);
  controls.enableDamping = true;
  controls.target.set(0, 6, 8);
  controls.enabled = false;
  // trackside cameras: every 1/20 of the lap, alternately left and right, above the trough; plus one at the lift
  const spots = Array.from({ length: 20 }, (_, j) => {
    const i = Math.floor(((j + 0.5) / 20) * (track.n - 1));
    return track.pts[i].clone().addScaledVector(track.side[i], j % 2 ? 5 : -5).add(new THREE.Vector3(0, 3.2, 0));
  });
  const bottom = track.pts[track.n - 1];
  spots.push(bottom.clone().add(new THREE.Vector3(7, 3, 7)));
  let mode = "tv", spot = -1, t = 0;
  const look = new THREE.Vector3(0, 6, 8);

  function frame(dt, focus, tangent, phase) {
    t += dt;
    if (mode === "free") { controls.enabled = true; controls.update(); return; }
    controls.enabled = false;
    if (phase !== "running" || !focus) { // idle / finished: a slow circle around the arena
      const a = t * 0.12;
      camera.position.lerp(new THREE.Vector3(Math.cos(a) * 46, 30, 8 + Math.sin(a) * 46), 0.03);
      look.lerp(phase === "finished" ? bottom : new THREE.Vector3(0, 6, 8), 0.05);
      camera.lookAt(look);
      return;
    }
    if (mode === "chase") {
      const want = focus.clone().addScaledVector(tangent, -5.5).add(new THREE.Vector3(0, 2.8, 0));
      camera.position.lerp(want, 1 - Math.pow(0.002, dt));
      look.lerp(focus.clone().addScaledVector(tangent, 3), 1 - Math.pow(0.0005, dt));
    } else {
      let best = 0, d = Infinity;
      spots.forEach((s, j) => { const x = s.distanceTo(focus); if (x < d) { d = x; best = j; } });
      if (best !== spot) { spot = best; camera.position.copy(spots[best]); look.copy(focus); } // a cut
      look.lerp(focus, 1 - Math.pow(0.001, dt));
      const fov = THREE.MathUtils.clamp(64 - d * 2.2, 22, 55); // zoom in on far action
      camera.fov += (fov - camera.fov) * Math.min(1, dt * 3); camera.updateProjectionMatrix();
    }
    camera.lookAt(look);
  }

  return { frame, setMode: (m) => { mode = m; spot = -1; if (m !== "tv") { camera.fov = 55; camera.updateProjectionMatrix(); } }, get mode() { return mode; } };
}
