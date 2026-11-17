// Starts a new trough right where a section ends (a hair lower, the same heading), so two troughs of different widths
// join without a step: then come the given points.
import * as THREE from "three";

export const after = (sec, ...points) => {
  const end = sec.pts.at(-1), T = sec.T.at(-1);
  return [end.clone().addScaledVector(T, 0.12).add(new THREE.Vector3(0, -0.05, 0)), end.clone().addScaledVector(T, 3).add(new THREE.Vector3(0, -0.3, 0)), ...points.map((p) => new THREE.Vector3(...p))];
};
