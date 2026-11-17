// Marble Match preview: a field of 2–20 idols. Two: a Best-of-N series (the app's rules). More: a Grand Prix with points.
// Every game on a different arena drawn at random; watch or skip. Nothing is stored: each game's world is thrown away.
import RAPIER from "rapier";
import * as THREE from "three";
import { ARENAS } from "./arenas/index.js";
import { createDirector } from "./director.js";
import { COLORS, createHud } from "./hud.js";
import { createMarble } from "./marbles.js";
import { createMatch, isOver, playHeadless } from "./match.js";
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

// the field: who races, with which rating (photos from import/, git-ignored)
const photos = await fetch("/photos.json").then((r) => r.json()).catch(() => []);
const option = (sel) => photos.map((p, i) => `<option value="${i}" ${i === sel ? "selected" : ""}>${p.name} · ${p.group}</option>`).join("") || `<option value="-1">No photo</option>`;
let field = [{ photo: photos.findIndex((p) => p.name === "Jang Wonyoung"), rating: 95 }, { photo: photos.findIndex((p) => p.name === "Gaeul"), rating: 84 }];
const drawField = () => {
  $("count").value = field.length; $("count-out").textContent = field.length;
  $("field").innerHTML = field.map((f, k) => `<li style="--c:${COLORS[k]}"><span class="dot"></span><select data-k="${k}" aria-label="Marble ${k + 1}">${option(f.photo)}</select><input data-k="${k}" type="number" min="50" max="100" value="${f.rating}" aria-label="Rating ${k + 1}"></li>`).join("");
  $("mode").textContent = field.length === 2 ? "Best of (games, first to a majority)" : `Grand Prix (races, ${field.length} marbles, F1 points)`;
  showEdge();
};
$("field").addEventListener("change", (e) => { const k = +e.target.dataset.k; if (e.target.tagName === "SELECT") field[k].photo = +e.target.value; else field[k].rating = Math.max(50, Math.min(100, +e.target.value || 75)); showEdge(); });
const randomEntry = (used) => { const free = photos.map((_, i) => i).filter((i) => !used.includes(i)); return { photo: free.length ? free[Math.floor(Math.random() * free.length)] : -1, rating: 70 + Math.floor(Math.random() * 29) }; };
$("count").addEventListener("input", () => {
  const n = +$("count").value;
  while (field.length < n) field.push(randomEntry(field.map((f) => f.photo)));
  field.length = n; drawField();
});
$("shuffle").onclick = () => { const used = []; field = field.map(() => { const e = randomEntry(used); used.push(e.photo); return e; }); drawField(); };
const ratings = () => field.map((f) => f.rating);
function showEdge() {
  const r = ratings(), adv = +$("advantage").value;
  $("adv-out").textContent = `${adv.toFixed(1)}×`;
  const e = edges(r, adv), top = e.reduce((b, x, k) => (x.e > e[b].e ? k : b), 0);
  $("edge").textContent = e[top].push > 0 ? `Strongest edge (marble ${top + 1}): a ${e[top].push.toFixed(2)} m/s² push, ${Math.round(e[top].e * 30)}% less drag. Boost pads help whoever is behind.` : "Equal marbles: pure physics.";
}
$("advantage").addEventListener("input", showEdge);
drawField();
$("try").innerHTML = `<option value="">— a full match —</option>` + ARENAS.map((a) => `<option value="${a.id}">${a.name}</option>`).join("");

let bestOf = 5, speed = 1, phase = "idle", acc = 0, slowmo = 1, token = 0;
let match = null, game = null, group = null, marbles = [], players = [], hud = null, tags = [];

async function loadGame(g) {
  game?.dispose(); marbles.forEach((m) => m.dispose()); if (group) freeGroup(group);
  group = new THREE.Group();
  game = createGame({ RAPIER, arena: match.arenas[g], ratings: match.ratings, advantage: match.advantage, seed: match.gameSeed(g), group });
  director.setArena(game, view3d.setArena(match.arenas[g], game, group));
  marbles = await Promise.all(players.map((p, k) => createMarble(view3d.scene, { photoUrl: p.photo, color: COLORS[k], label: p.name[0], R })));
  $("tags").innerHTML = players.map(() => `<span class="tag" hidden></span>`).join("");
  tags = [...$("tags").children];
  window.__mm = { game, match };
  draw();
}

async function playGame(g) {
  const my = token;
  hud.arena(match, g); hud.series(match, g); hud.scoreboard(match, g);
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
  match.results.push([...game.state.results]);
  const g = match.results.length - 1;
  hud.series(match); hud.scoreboard(match, g); hud.update(game); hud.lights(-1); hud.intro(match, 0, false);
  hud.banner(`${players[game.state.winner].name} wins ${match.gp ? "race" : "game"} ${g + 1}`, 1800);
  const my = token, over = isOver(match);
  setTimeout(() => {
    if (my !== token) return;
    if (over) { phase = "finished"; $("start").disabled = false; hud.result(match, startMatch); }
    else playGame(match.results.length);
  }, over ? 1900 : 2600);
}

function startMatch() {
  token++;
  $("result").hidden = true;
  const one = ARENAS.find((a) => a.id === $("try").value);
  const seed = (Math.random() * 2 ** 31) | 0;
  $("seed").textContent = seed;
  players = field.map((f, k) => (f.photo >= 0 ? { name: photos[f.photo].name, photo: `/photos/${photos[f.photo].file.split("/").map(encodeURIComponent).join("/")}` } : { name: `Marble ${k + 1}`, photo: null }));
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
  if (phase === "running" || phase === "intro") { game.finish(); match.results.push([...game.state.results]); }
  while (!isOver(match)) match.results.push(playHeadless(RAPIER, match, match.results.length));
  phase = "finished"; $("start").disabled = false;
  hud.lights(-1); hud.intro(match, 0, false); hud.series(match); hud.scoreboard(match, match.results.length - 1); hud.update(game);
  hud.result(match, startMatch);
};
$("fold").onclick = () => { const f = $("panel").classList.toggle("folded"); $("fold").setAttribute("aria-expanded", String(!f)); };
document.querySelectorAll("[data-bo]").forEach((b) => b.onclick = () => { bestOf = +b.dataset.bo; document.querySelectorAll("[data-bo]").forEach((x) => x.classList.toggle("on", x === b)); });
document.querySelectorAll("[data-cam]").forEach((b) => b.onclick = () => { director.setMode(b.dataset.cam); document.querySelectorAll("[data-cam]").forEach((x) => x.classList.toggle("on", x === b)); });
document.querySelectorAll("[data-speed]").forEach((b) => b.onclick = () => { speed = +b.dataset.speed; document.querySelectorAll("[data-speed]").forEach((x) => x.classList.toggle("on", x === b)); });
document.querySelectorAll("[data-quality]").forEach((b) => b.onclick = () => { location.search = b.dataset.quality === "low" ? "?q=low" : ""; });

const resize = () => { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); };
addEventListener("resize", resize); resize();

const proj = new THREE.Vector3();
function draw() { game.state.marbles.forEach((m, k) => marbles[k]?.update(m.body.translation(), m.body.rotation(), m.boosting)); }
function drawTags() { // names over the marbles; with a big field only the top five, so the screen stays readable
  if (!game) return;
  const shown = new Set(game.order().slice(0, players.length > 6 ? 5 : players.length).map((m) => m.k));
  game.state.marbles.forEach((m, k) => {
    if (!tags[k]) return;
    const t = m.body.translation();
    proj.set(t.x, t.y + R * 2.2, t.z).project(camera);
    const show = proj.z < 1 && phase === "running" && shown.has(k);
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
  game?.kit.sync(dt);
  const lead = game?.order()[0];
  if (lead) focus.copy(lead.body.translation());
  director.frame(dt, lead ? focus : null, lead && !game.sumo ? game.guide.T[lead.idx] : null, phase === "running" ? "running" : "idle");
  renderer.render(view3d.scene, camera);
  drawTags();
  requestAnimationFrame(loop);
}

// the first arena on show while idle
players = field.map((f, k) => ({ name: f.photo >= 0 ? photos[f.photo].name : `Marble ${k + 1}`, photo: null }));
match = createMatch({ bestOf, ratings: ratings(), advantage: 1, seed: 1 });
hud = createHud(players);
await loadGame(0);
hud.arena(match, 0); $("arena-tag").textContent = `${ARENAS.length} arenas · ${match.arenas[0].tagline}`;
$("loading").hidden = true;
requestAnimationFrame(loop);
// console: __view("neon") shows an arena while idle
window.__view = async (id) => { if (phase !== "idle" && phase !== "finished") return; match = createMatch({ bestOf: 1, ratings: ratings(), advantage: 1, seed: 2 }); match.arenas = [ARENAS.find((a) => a.id === id)]; players = field.map((f, k) => ({ name: `M${k + 1}`, photo: null })); await loadGame(0); hud.arena(match, 0); };
