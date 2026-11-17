# Marble Race (prototype, separate from the app)

**Frozen as v1** (git tag `marble-race-prototype-v1`, 2026-11-18): kept unchanged as the base for a future project.
The match version for the app lives in `prototypes/marble-match/`.

Two marbles (idol photos inside glass balls) race 3 laps on a 3D track. Physics decides the winner; each lap = one game.
Nothing is saved. Not connected to Sabung Idol yet.

Run: `node prototypes/marble-race/server.mjs` → http://localhost:5190 (or the "marble" entry in .claude/launch.json).
No install: three.js 0.170 and Rapier 0.14 (WASM physics) load from jsDelivr, only on this page.
Photos: `import/ive-photos/*.jpg` (git-ignored) via /photos; without them the marbles show a letter.

| File | Job |
|---|---|
| src/track.js | track = data (centre line, width, pins, theme) → trough mesh with banking, physics mesh, rails, pillars |
| src/race.js | Rapier world, 3 laps, lift (both marbles regroup at the top: each lap is its own heat), stalls/falls, rating edge |
| src/scene.js | the look: sky, fog, arena floor, trough, neon rails, pillars, pins, lift tower, start gantry, lights |
| src/marbles.js | glass marble with the photo inside (always faces the camera), outline, halo, light trail |
| src/director.js | cameras: TV (trackside cuts), Chase, Free (orbit) |
| src/hud.js | lap + clock, position tower, laps won, start lights, banners, result card |
| src/main.js | wiring, setup panel, slow motion on a close finish |

Findings (2026-11-18):
- The trough mesh needs Rapier `TriMeshFlags.FIX_INTERNAL_EDGES` (else the ball trips on every triangle seam) and
  triangles wound with the normal up (that flag makes the mesh one-sided).
- Side-by-side lanes gave the inside lane 10 of 12 wins: lanes are drawn per race and per lap.
- A single-file lift kept the lap-1 leader ahead forever (always 3–0): the lift now regroups both marbles.
- Rating edge = a small steady push (0.9 m/s² at 50 rating points) + slightly less drag, a little heavier, a short head
  start. Measured (12 races each): equal 6–6; 95 v 84 wins 64% of laps (8/12 races); 95 v 70 wins 86% (11/12).
- One race ≈ 80 s (laps ≈ 25 s); a headless race runs in ≈ 0.3 s.
