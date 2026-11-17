// The camera: TV (cuts between trackside cameras placed along each arena's guide, the nearest follows the action),
// Chase (behind the leader) or Free (orbit with the mouse). Before a game it circles the new arena (the intro); after
// the finish it pulls back slowly. Sumo: cameras ring the bowl.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export function createDirector(camera, dom) {
  const controls = new OrbitControls(camera, dom);
  controls.enableDamping = true;
  controls.enabled = false;
  let mode = "tv", spot = -1, t = 0, spots = [], mid = new THREE.Vector3(), reach = 30;
  const look = new THREE.Vector3();

  function setArena(game, view) {
    mid = view.mid; reach = view.reach; spot = -1;
    const g = game.guide;
    if (game.sumo) {
      const c = game.built.center;
      spots = Array.from({ length: 6 }, (_, j) => { const a = (j / 6) * Math.PI * 2; return c.clone().add(new THREE.Vector3(Math.cos(a) * 9.5, 5.5, Math.sin(a) * 9.5)); });
    } else {
      spots = [];
      for (let p = 6, j = 0; p < g.total; p += 11, j++) {
        const i = g.prog.findIndex((x) => x >= p);
        if (i >= 0) spots.push(g.pts[i].clone().addScaledVector(g.side[i], j % 2 ? 5 : -5).add(new THREE.Vector3(0, 3.4, 0)));
      }
    }
    controls.target.copy(mid);
    camera.position.copy(mid).add(new THREE.Vector3(reach * 1.1, reach * 0.7, reach * 1.1));
    look.copy(mid);
  }

  function frame(dt, focus, tangent, phase) {
    t += dt;
    if (mode === "free") { controls.enabled = true; controls.update(); return; }
    controls.enabled = false;
    if (phase !== "running" || !focus) { // intro / between games: a slow circle around the arena
      const a = t * 0.15;
      camera.position.lerp(mid.clone().add(new THREE.Vector3(Math.cos(a) * reach * 1.05, reach * 0.62 + 6, Math.sin(a) * reach * 1.05)), 1 - Math.pow(0.15, dt));
      look.lerp(mid, 1 - Math.pow(0.05, dt));
      camera.lookAt(look);
      return;
    }
    if (mode === "chase" && tangent) {
      const want = focus.clone().addScaledVector(tangent, -5.5).add(new THREE.Vector3(0, 2.8, 0));
      camera.position.lerp(want, 1 - Math.pow(0.002, dt));
      look.lerp(focus.clone().addScaledVector(tangent, 3), 1 - Math.pow(0.0005, dt));
    } else {
      let best = 0, d = Infinity;
      spots.forEach((s, j) => { const x = s.distanceTo(focus); if (x < d) { d = x; best = j; } });
      if (best !== spot) { spot = best; camera.position.copy(spots[best]); look.copy(focus); } // a cut
      look.lerp(focus, 1 - Math.pow(0.001, dt));
      const fov = THREE.MathUtils.clamp(64 - d * 2.2, 22, 55);
      camera.fov += (fov - camera.fov) * Math.min(1, dt * 3); camera.updateProjectionMatrix();
    }
    camera.lookAt(look);
  }

  return { setArena, frame, setMode: (m) => { mode = m; spot = -1; if (m !== "tv") { camera.fov = 55; camera.updateProjectionMatrix(); } }, get mode() { return mode; } };
}
