// Marble race prototype: pick two idols and their ratings, start, watch 3 laps (each lap = one game), get the score.
// Nothing is stored: a new race throws the old world away.
import RAPIER from "rapier";
import * as THREE from "three";
import { createDirector } from "./director.js";
import { COLORS, createHud } from "./hud.js";
import { createMarble } from "./marbles.js";
import { LAPS, createRace, edges } from "./race.js";
import { createScene } from "./scene.js";
import { SEOUL, buildTrack } from "./track.js";

const $ = (id) => document.getElementById(id);
await RAPIER.init();
const track = buildTrack(SEOUL);
$("track-name").textContent = SEOUL.name;

const quality = new URLSearchParams(location.search).get("q") === "low" ? "low" : "high";
document.querySelectorAll("[data-quality]").forEach((b) => b.classList.toggle("on", b.dataset.quality === quality));
const { renderer, scene, camera } = createScene($("view"), track, quality);
const director = createDirector(camera, renderer.domElement, track);

const files = await fetch("/photos.json").then((r) => r.json()).catch(() => []);
const nameOf = (f) => f.replace(/\.jpg$/, "").replace(/ IVE$/, "");
for (const [id, pick] of [["photo-a", 2], ["photo-b", 1]]) {
  $(id).innerHTML = files.length ? files.map((f, i) => `<option value="${f}" ${i === pick ? "selected" : ""}>${nameOf(f)}</option>`).join("") : `<option value="">${id.endsWith("a") ? "Red" : "Blue"} marble</option>`;
}

let race = null, marbles = [], phase = "idle", speed = 1, acc = 0, seed = 0, players = [], hud = null, slowmo = 1, lastLaps = 0;

const showEdge = () => {
  const r = [+$("rating-a").value, +$("rating-b").value], adv = +$("advantage").value;
  $("ra-out").textContent = r[0]; $("rb-out").textContent = r[1]; $("adv-out").textContent = `${adv.toFixed(1)}×`;
  const e = edges(r, adv), fav = r[0] === r[1] || adv === 0 ? -1 : r[0] > r[1] ? 0 : 1;
  $("edge").textContent = fav < 0 ? "Equal marbles: pure physics." : `${["Red", "Blue"][fav]} edge: ${Math.round((1 - e[fav].drag / e[1 - fav].drag) * 100)}% less rolling drag, ${Math.round((e[fav].density / e[1 - fav].density - 1) * 100)}% heavier, ${(e[fav].head * track.step).toFixed(1)} m head start.`;
};
["rating-a", "rating-b", "advantage"].forEach((id) => $(id).addEventListener("input", showEdge));
showEdge();

async function setup() {
  race?.dispose();
  marbles.forEach((m) => m.dispose());
  seed = (Math.random() * 2 ** 31) | 0;
  $("seed").textContent = seed;
  players = ["photo-a", "photo-b"].map((id, k) => ({ name: $(id).value ? nameOf($(id).value) : ["Red", "Blue"][k], photo: $(id).value ? `/photos/${encodeURIComponent($(id).value)}` : null }));
  race = createRace({ RAPIER, track, ratings: [+$("rating-a").value, +$("rating-b").value], advantage: +$("advantage").value, seed });
  marbles = await Promise.all(players.map((p, k) => createMarble(scene, { photoUrl: p.photo, color: COLORS[k], label: p.name[0], R: race.R })));
  hud = createHud(players, track);
  window.__mr = { race, track }; // for inspecting in the console
  hud.update(race);
  lastLaps = 0; slowmo = 1;
  draw();
}

const tags = [...document.querySelectorAll("#tags .tag")];
const proj = new THREE.Vector3();
function draw() {
  race.state.marbles.forEach((m, k) => marbles[k].update(m.body.translation(), m.body.rotation()));
}
function drawTags() { // the names over the marbles, hidden when behind the camera or before a race
  race.state.marbles.forEach((m, k) => {
    const t = m.body.translation();
    proj.set(t.x, t.y + race.R * 2.2, t.z).project(camera);
    const show = proj.z < 1 && phase !== "idle";
    tags[k].hidden = !show;
    if (show) { tags[k].style.left = `${(proj.x + 1) / 2 * innerWidth}px`; tags[k].style.top = `${(1 - proj.y) / 2 * innerHeight}px`; tags[k].textContent = players[k].name; tags[k].style.setProperty("--c", COLORS[k]); }
  });
}

async function start() {
  if (phase === "countdown" || phase === "running") return;
  $("result").hidden = true;
  await setup();
  phase = "countdown";
  $("start").disabled = true;
  $("panel").classList.add("folded"); $("fold").setAttribute("aria-expanded", "false"); // the race gets the screen
  for (let i = 1; i <= 5; i++) { hud.lights(i); await new Promise((r) => setTimeout(r, 600)); }
  await new Promise((r) => setTimeout(r, 400 + Math.random() * 600));
  hud.lights(-1);
  hud.banner("Lights out!", 1000);
  phase = "running"; acc = 0;
}

function finish() {
  phase = "finished";
  $("start").disabled = false;
  draw(); hud.update(race);
  setTimeout(() => hud.result(race, start), 900);
}

$("start").onclick = start;
$("skip").onclick = async () => {
  if (phase === "idle" || phase === "finished") await setup();
  hud.lights(-1);
  race.finish();
  finish();
};
$("fold").onclick = () => { const f = $("panel").classList.toggle("folded"); $("fold").setAttribute("aria-expanded", String(!f)); };
document.querySelectorAll("[data-cam]").forEach((b) => b.onclick = () => { director.setMode(b.dataset.cam); document.querySelectorAll("[data-cam]").forEach((x) => x.classList.toggle("on", x === b)); });
document.querySelectorAll("[data-speed]").forEach((b) => b.onclick = () => { speed = +b.dataset.speed; document.querySelectorAll("[data-speed]").forEach((x) => x.classList.toggle("on", x === b)); });
document.querySelectorAll("[data-quality]").forEach((b) => b.onclick = () => { location.search = b.dataset.quality === "low" ? "?q=low" : ""; });

const resize = () => { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); };
addEventListener("resize", resize); resize();

let last = performance.now();
const tmp = new THREE.Vector3();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (phase === "running") {
    // photo finish: the final metres of the last lap with both close → slow motion
    const [a, b] = race.order();
    const close = a.laps.length === LAPS - 1 && a.idx > track.n - 70 && race.progress(a) - race.progress(b) < 30;
    slowmo += ((close ? 0.3 : 1) - slowmo) * Math.min(1, dt * 4);
    if (close && slowmo < 0.6 && !hud.photo) { hud.photo = true; hud.banner("Photo finish!", 1400); }
    acc += dt * speed * slowmo;
    let n = 0;
    while (acc >= race.DT && n++ < 40) { race.step(); acc -= race.DT; }
    const laps = race.state.lapWinners.length;
    if (laps > lastLaps) { lastLaps = laps; if (laps < LAPS) hud.banner(`${players[race.state.lapWinners[laps - 1]].name} takes lap ${laps}`, 1500); }
    draw(); hud.update(race);
    if (race.state.marbles.some((m) => m.phase === "done") && race.state.done) finish();
  }
  const lead = race && race.order()[0];
  const focus = lead ? tmp.copy(lead.body.translation()) : null;
  director.frame(dt, focus, lead ? track.T[lead.phase === "lift" ? 0 : lead.idx] : null, phase === "running" ? "running" : phase === "finished" ? "finished" : "idle");
  renderer.render(scene, camera);
  drawTags();
  requestAnimationFrame(loop);
}
await setup();
$("loading").hidden = true;
requestAnimationFrame(loop);
