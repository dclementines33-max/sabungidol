// The marble race behind the app's Marble Race mode (ported from prototypes/marble-match main.js): it draws on a canvas,
// plays a match game by game (2 marbles = a Best-of-N series, 3+ = a Grand Prix) and reports what the overlay shows
// through onUpdate (React draws the overlay). Name tags over the marbles are spans in `tags` (they move every frame).
// The camera follows the leader, or the marble picked with follow(k). Nothing is kept: each game's world is thrown away.
import RAPIER from "@dimforge/rapier3d-compat";
import * as THREE from "three";
import { ARENAS } from "./arenas/index.js";
import { createDirector } from "./director.js";
import { createMarble } from "./marbles.js";
import { createMatch, games, isOver, playHeadless, standing } from "./match.js";
import { DT, R, createGame } from "./race.js";
import { COLORS } from "./colors";
import { createScene, freeGroup } from "./scene.js";

export { COLORS };

let rapier = null;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export async function createRace({ canvas, tags, quality = "high", onUpdate }) {
  await (rapier ??= RAPIER.init());
  const view3d = createScene(canvas, quality);
  const { renderer, camera } = view3d;
  const director = createDirector(camera, renderer.domElement);
  let match = null, game = null, group = null, marbles = [], players = [], led = null, names = {}, tagEls = [];
  let phase = "idle", acc = 0, slowmo = 1, speed = 1, follow = null, token = 0, lights = -1, intro = false, banner = null, bannerTimer = 0;
  let photo = false, lost = false, raf = 0, last = performance.now(), sent = 0;
  renderer.domElement.addEventListener("webglcontextlost", (e) => { e.preventDefault(); lost = true; emit(true); });

  const arenaOf = (id) => { const a = ARENAS.find((x) => x.id === id) ?? ARENAS[0]; return { ...a, name: names[a.id] || a.name }; };
  const note = (m, i, all) => game.sumo ? (m.out !== null ? "Out" : "In") : i === 0 ? (m.finished !== null ? "Winner" : "Leader")
    : m.finished !== null ? `+${(m.finished - all[0].finished).toFixed(2)}s` : `+${Math.max(0, all[0].prog - m.prog).toFixed(1)}m`;
  const snapshot = () => {
    const g = match ? Math.min(match.results.length, match.bestOf - 1) : 0, all = game?.order() ?? [];
    const a = match?.arenas[phase === "finished" ? Math.max(0, match.results.length - 1) : g];
    return {
      phase, lost, intro, lights, banner, follow, g, gp: !!match?.gp, bestOf: match?.bestOf ?? 0, grandFinal: !!match?.grandFinal,
      arena: a ? { id: a.id, name: a.name, tagline: a.tagline } : null,
      arenas: match?.arenas.map((a) => a.name) ?? [], clock: game?.state.t ?? 0,
      order: all.map((m, i) => ({ k: m.k, note: note(m, i, all), boost: m.boosting > 0 })),
      standing: match ? standing(match) : null, winners: match?.results.map((r) => r[0]) ?? [], games: match && !match.gp ? games(match) : [],
    };
  };
  function emit(force = false) { const now = performance.now(); if (force || now - sent > 120) { sent = now; onUpdate(snapshot()); } }
  const say = (text, ms = 1600) => { clearTimeout(bannerTimer); banner = text; emit(true); bannerTimer = setTimeout(() => { banner = null; emit(true); }, ms); };

  async function loadGame(g) {
    game?.dispose(); marbles.forEach((m) => m.dispose()); if (group) freeGroup(group);
    group = new THREE.Group();
    game = createGame({ RAPIER, arena: match.arenas[g], ratings: match.ratings, advantage: match.advantage, seed: match.gameSeed(g), group });
    director.setArena(game, view3d.setArena(match.arenas[g], game, group, led));
    marbles = await Promise.all(players.map((p, k) => createMarble(view3d.scene, { photoUrl: p.photo, color: COLORS[k], label: p.name[0] ?? "?", R })));
    tags.replaceChildren(...players.map((p, k) => { const s = document.createElement("span"); s.className = "marble-tag"; s.textContent = p.name; s.style.setProperty("--c", COLORS[k]); s.hidden = true; return s; }));
    tagEls = [...tags.children];
    draw();
  }

  async function playGame(g) {
    const my = token;
    await loadGame(g);
    if (my !== token) return;
    phase = "intro"; intro = true; emit(true);
    await wait(2600);
    if (my !== token) return;
    intro = false;
    for (let i = 1; i <= 3; i++) { lights = i; emit(true); await wait(450); }
    await wait(250 + Math.random() * 450);
    if (my !== token) return;
    lights = -1; phase = "running"; acc = 0; slowmo = 1; photo = false; say("Go!", 700);
  }

  function gameDone() {
    if (phase !== "running" && phase !== "intro") return;
    phase = "between"; lights = -1; intro = false;
    match.results.push([...game.state.results]);
    const g = match.results.length - 1, over = isOver(match), my = token;
    say(`${players[game.state.winner].name} wins ${match.gp ? "race" : "game"} ${g + 1}`, 1800);
    setTimeout(() => { if (my !== token) return; if (over) { phase = "finished"; emit(true); } else playGame(match.results.length); }, over ? 1900 : 2600);
  }

  const draw = () => game.state.marbles.forEach((m, k) => marbles[k]?.update(m.body.translation(), m.body.rotation(), m.boosting));
  const proj = new THREE.Vector3();
  function drawTags() { // names over the marbles; with a big field only the top five (plus the followed one) stay readable
    const shown = new Set(game.order().slice(0, players.length > 6 ? 5 : players.length).map((m) => m.k));
    if (follow !== null) shown.add(follow);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    game.state.marbles.forEach((m, k) => {
      const el = tagEls[k]; if (!el) return;
      const t = m.body.translation();
      proj.set(t.x, t.y + R * 2.2, t.z).project(camera);
      const show = proj.z < 1 && phase === "running" && shown.has(k);
      el.hidden = !show;
      if (show) { el.style.left = `${(proj.x + 1) / 2 * w}px`; el.style.top = `${(1 - proj.y) / 2 * h}px`; el.classList.toggle("followed", k === follow); }
    });
  }

  const focus = new THREE.Vector3();
  function loop(now) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!game) return;
    if (phase === "running") {
      const [a, b] = game.order();
      const close = !game.sumo && a.finished === null && a.prog > game.guide.total - 14 && a.prog - b.prog < 3; // a photo finish
      slowmo += ((close ? 0.3 : 1) - slowmo) * Math.min(1, dt * 4);
      if (close && slowmo < 0.6 && !photo) { photo = true; say("Photo finish!", 1300); }
      acc += dt * speed * slowmo;
      let n = 0;
      while (acc >= DT && n++ < 40 && !game.state.done) { game.step(); acc -= DT; }
      draw(); emit();
      if (game.state.done) gameDone();
    }
    game.kit.sync(dt);
    const watched = follow !== null ? game.state.marbles[follow] : game.order()[0];
    if (watched) focus.copy(watched.body.translation());
    director.frame(dt, watched ? focus : null, watched && !game.sumo ? game.guide.T[watched.idx] : null, phase === "running" ? "running" : "idle");
    renderer.render(view3d.scene, camera);
    drawTags();
  }

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(canvas); resize();
  raf = requestAnimationFrame(loop);

  const setup = (opts) => {
    players = opts.players; led = opts.led ?? null; names = opts.names ?? {};
    match = createMatch({ bestOf: opts.bestOf, ratings: players.map((p) => p.rating), advantage: opts.advantage ?? 1, arenaIds: opts.arenaIds, grandFinal: opts.arenaIds.length > 1 });
    match.arenas = match.arenas.map((a) => arenaOf(a.id));
  };
  return {
    // opts: { players: [{ name, photo, rating }], bestOf, arenaIds, advantage, led: { title, photos: [{ url, caption }] }, names }
    start(opts) { token++; follow = null; setup(opts); playGame(0); },
    // shows an arena while idle (Marble Race panel preview)
    async show(opts) { token++; phase = "idle"; follow = null; setup({ ...opts, bestOf: 1 }); await loadGame(0); emit(true); },
    skipGame() { if (game && (phase === "running" || phase === "intro")) { token++; game.finish(); phase = "running"; gameDone(); } },
    skipMatch() {
      if (!match || phase === "finished" || phase === "idle") return;
      token++; clearTimeout(bannerTimer); banner = null;
      if (phase === "running" || phase === "intro") { game.finish(); match.results.push([...game.state.results]); }
      while (!isOver(match)) match.results.push(playHeadless(RAPIER, match, match.results.length));
      phase = "finished"; lights = -1; intro = false; draw(); emit(true);
    },
    setSpeed(x) { speed = x; },
    setCamera(mode) { director.setMode(mode); },
    follow(k) { follow = k; emit(true); },
    dispose() {
      token++; cancelAnimationFrame(raf); clearTimeout(bannerTimer); observer.disconnect();
      game?.dispose(); marbles.forEach((m) => m.dispose()); if (group) freeGroup(group);
      renderer.dispose(); renderer.forceContextLoss();
    },
  };
}
