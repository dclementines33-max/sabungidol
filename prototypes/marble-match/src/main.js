// Marble Match preview: two idols, a Best-of-N series, one game per arena (drawn at random, all different), watch or
// skip, get the series result. Nothing is stored: each game's world is thrown away when the next one starts.
import RAPIER from "rapier";
import * as THREE from "three";
import { ARENAS } from "./arenas/index.js";
import { createDirector } from "./director.js";
import { COLORS, createHud } from "./hud.js";
import { createMarble } from "./marbles.js";
import { createMatch, playHeadless, seriesState } from "./match.js";
import { DT, R, createGame, edges } from "./race.js";
import { createScene, freeGroup } from "./scene.js";

const $ = (id) => document.getElementById(id);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
await RAPIER.init();

const quality = new URLSearchParams(location.search).get("q") === "low" ? "low" : "high";
document.querySelectorAll("[data-quality]").forEach((b) => b.classList.toggle("on", b.dataset.quality === quality));
const view3d = createScene($("view"), quality);
const { renderer, camera } = view3d;
const director = createDirector(camera, renderer.domElement);
renderer.domElement.addEventListener("webglcontextlost", () => { $("lost").hidden = false; });
renderer.domElement.addEventListener("webglcontextrestored", () => { $("lost").hidden = true; });
$("reload").onclick = () => location.reload();

const files = await fetch("/photos.json").then((r) => r.json()).catch(() => []);
const nameOf = (f) => f.replace(/\.jpg$/, "").replace(/ IVE$/, "");
for (const [id, pick] of [["photo-a", 2], ["photo-b", 1]]) $(id).innerHTML = files.length ? files.map((f, i) => `<option value="${f}" ${i === pick ? "selected" : ""}>${nameOf(f)}</option>`).join("") : `<option value="">${id.endsWith("a") ? "Red" : "Blue"} marble</option>`;
$("try").innerHTML = `<option value="">— a full match —</option>` + ARENAS.map((a) => `<option value="${a.id}">${a.name}</option>`).join("");

let bestOf = 5, speed = 1, phase = "idle", acc = 0, slowmo = 1, token = 0;
let match = null, game = null, group = null, marbles = [], players = [], hud = null;
const ratings = () => [+$("rating-a").value, +$("rating-b").value];

const showEdge = () => {
  const r = ratings(), adv = +$("advantage").value;
  $("ra-out").textContent = r[0]; $("rb-out").textContent = r[1]; $("adv-out").textContent = `${adv.toFixed(1)}×`;
  const e = edges(r, adv), fav = r[0] === r[1] || adv === 0 ? -1 : r[0] > r[1] ? 0 : 1;
  $("edge").textContent = fav < 0 ? "Equal marbles: pure physics." : `${["Red", "Blue"][fav]} edge: a ${e[fav].push.toFixed(2)} m/s² push, ${Math.round((1 - e[fav].drag / e[1 - fav].drag) * 100)}% less drag, ${Math.round((e[fav].density / e[1 - fav].density - 1) * 100)}% heavier.`;
};
["rating-a", "rating-b", "advantage"].forEach((id) => $(id).addEventListener("input", showEdge));
showEdge();

async function loadGame(g) {
  game?.dispose(); marbles.forEach((m) => m.dispose()); if (group) freeGroup(group);
  group = new THREE.Group();
  game = createGame({ RAPIER, arena: match.arenas[g], ratings: match.ratings, advantage: match.advantage, seed: match.gameSeed(g), group });
  director.setArena(game, view3d.setArena(match.arenas[g], game, group));
  marbles = await Promise.all(players.map((p, k) => createMarble(view3d.scene, { photoUrl: p.photo, color: COLORS[k], label: p.name[0], R })));
  window.__mm = { game, match }; // for the console
  draw();
}

async function playGame(g) {
  const my = token;
  hud.arena(match, g); hud.series(match, g);
  await loadGame(g);
  if (my !== token) return;
  phase = "intro"; hud.intro(match, g, true);
  await wait(2600);
  if (my !== token) return;
  hud.intro(match, g, false);
  for (let i = 1; i <= 3; i++) { hud.lights(i); await wait(450); }
  await wait(250 + Math.random() * 450);
  if (my !== token) return;
  hud.lights(-1); hud.banner("Go!", 700);
  phase = "running"; acc = 0; slowmo = 1; hud.photo = false;
}

function gameDone() {
  if (phase !== "running" && phase !== "intro") return;
  phase = "between";
  const side = game.state.winner === 0 ? "A" : "B";
  match.games.push(side);
  hud.series(match); hud.update(game); hud.lights(-1); hud.intro(match, 0, false);
  hud.banner(`${players[game.state.winner].name} takes game ${match.games.length}`, 1800);
  const my = token, s = seriesState(match.bestOf, match.games);
  setTimeout(() => {
    if (my !== token) return;
    if (s.result) { phase = "finished"; $("start").disabled = false; hud.result(match, startMatch); }
    else playGame(match.games.length);
  }, s.result ? 1900 : 2600);
}

function startMatch() {
  token++;
  $("result").hidden = true;
  const one = ARENAS.find((a) => a.id === $("try").value);
  const seed = (Math.random() * 2 ** 31) | 0;
  $("seed").textContent = seed;
  players = ["photo-a", "photo-b"].map((id, k) => ({ name: $(id).value ? nameOf($(id).value) : ["Red", "Blue"][k], photo: $(id).value ? `/photos/${encodeURIComponent($(id).value)}` : null }));
  match = createMatch({ bestOf: one ? 1 : bestOf, ratings: ratings(), advantage: +$("advantage").value, seed });
  if (one) match.arenas = [one];
  hud = createHud(players);
  $("start").disabled = true;
  $("panel").classList.add("folded"); $("fold").setAttribute("aria-expanded", "false");
  playGame(0);
}

$("start").onclick = startMatch;
$("skip").onclick = () => { if (game && (phase === "running" || phase === "intro")) { token++; game.finish(); phase = "running"; gameDone(); } }; // a skipped intro still counts as the game played
$("skip-all").onclick = () => {
  if (!match || phase === "finished" || phase === "idle") return;
  token++;
  if (phase === "running" || phase === "intro") { game.finish(); match.games.push(game.state.winner === 0 ? "A" : "B"); }
  while (!seriesState(match.bestOf, match.games).result) match.games.push(playHeadless(RAPIER, match, match.games.length));
  phase = "finished"; $("start").disabled = false;
  hud.lights(-1); hud.intro(match, 0, false); hud.series(match); hud.update(game);
  hud.result(match, startMatch);
};
$("fold").onclick = () => { const f = $("panel").classList.toggle("folded"); $("fold").setAttribute("aria-expanded", String(!f)); };
document.querySelectorAll("[data-bo]").forEach((b) => b.onclick = () => { bestOf = +b.dataset.bo; document.querySelectorAll("[data-bo]").forEach((x) => x.classList.toggle("on", x === b)); });
document.querySelectorAll("[data-cam]").forEach((b) => b.onclick = () => { director.setMode(b.dataset.cam); document.querySelectorAll("[data-cam]").forEach((x) => x.classList.toggle("on", x === b)); });
document.querySelectorAll("[data-speed]").forEach((b) => b.onclick = () => { speed = +b.dataset.speed; document.querySelectorAll("[data-speed]").forEach((x) => x.classList.toggle("on", x === b)); });
document.querySelectorAll("[data-quality]").forEach((b) => b.onclick = () => { location.search = b.dataset.quality === "low" ? "?q=low" : ""; });

const resize = () => { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); };
addEventListener("resize", resize); resize();

const tags = [...document.querySelectorAll("#tags .tag")];
const proj = new THREE.Vector3();
function draw() { game.state.marbles.forEach((m, k) => marbles[k]?.update(m.body.translation(), m.body.rotation())); game.kit.sync(); }
function drawTags() {
  game?.state.marbles.forEach((m, k) => {
    const t = m.body.translation();
    proj.set(t.x, t.y + R * 2.2, t.z).project(camera);
    const show = proj.z < 1 && phase === "running";
    tags[k].hidden = !show;
    if (show) { tags[k].style.left = `${(proj.x + 1) / 2 * innerWidth}px`; tags[k].style.top = `${(1 - proj.y) / 2 * innerHeight}px`; tags[k].textContent = players[k].name; tags[k].style.setProperty("--c", COLORS[k]); }
  });
}

let last = performance.now();
const focus = new THREE.Vector3();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (phase === "running") {
    const [a, b] = game.order();
    const close = !game.sumo && a.finished === null && a.prog > game.guide.total - 14 && a.prog - b.prog < 3; // a photo finish
    slowmo += ((close ? 0.3 : 1) - slowmo) * Math.min(1, dt * 4);
    if (close && slowmo < 0.6 && !hud.photo) { hud.photo = true; hud.banner("Photo finish!", 1300); }
    acc += dt * speed * slowmo;
    let n = 0;
    while (acc >= DT && n++ < 40 && !game.state.done) { game.step(); acc -= DT; }
    draw(); hud.update(game);
    if (game.state.done) gameDone();
  }
  const lead = game?.order()[0];
  if (lead) focus.copy(lead.body.translation());
  director.frame(dt, lead ? focus : null, lead && !game.sumo ? game.guide.T[lead.idx] : null, phase === "running" ? "running" : "idle");
  renderer.render(view3d.scene, camera);
  drawTags();
  requestAnimationFrame(loop);
}

// the first arena on show while idle
match = createMatch({ bestOf, ratings: ratings(), advantage: 1, seed: 1 });
players = [{ name: "Red", photo: null }, { name: "Blue", photo: null }];
hud = createHud(players);
await loadGame(0);
hud.arena(match, 0); $("arena-tag").textContent = `${ARENAS.length} arenas · ${match.arenas[0].tagline}`;
$("loading").hidden = true;
requestAnimationFrame(loop);
// console: __view("tokyo") shows an arena while idle
window.__view = async (id) => { if (phase !== "idle" && phase !== "finished") return; match = createMatch({ bestOf: 1, ratings: ratings(), advantage: 1, seed: 2 }); match.arenas = [ARENAS.find((a) => a.id === id)]; await loadGame(0); hud.arena(match, 0); };
