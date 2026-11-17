# Marble Match (preview, separate from the app)

The marble race as a way to decide **one match**: a Best-of-N series (Bo3/4/5/7, the app's rules: first to 2/3/4,
Bo4 can end 2–2), **one run = one game**, every game on a **different arena drawn at random** for the match. The result
is the games' winners in order (`["A","B","A"]`, A = red corner) — exactly what the app's `acceptMatch` takes. Nothing
else is kept. The original 3-lap prototype is frozen in `prototypes/marble-race` (git tag `marble-race-prototype-v1`).

Run: `node prototypes/marble-match/server.mjs` → http://localhost:5191 (or "marble-match" in .claude/launch.json).
No install (three 0.170 + Rapier 0.14 from jsDelivr). Photos from `import/ive-photos` (git-ignored).
Console helpers: `__view("tokyo")` shows an arena while idle; `__mm` = the current game and match.

## The 8 arenas (`src/arenas/`, one file each)

| Arena | Kind | What happens | 95 v 84 (favourite wins) |
|---|---|---|---|
| Seoul Neon Circuit | race | the prototype circuit, one descent, pin chicanes | 6/8 |
| Busan Sunset Sprint | race | long fast downhill, two jumps over gaps | 8/8 (a speed track) |
| Tokyo Pachinko | race | pin board → chute → coin funnel → home straight | 2/8 (pure chaos) |
| Frostbite Gauntlet | race | slippery ice, spinners, hammers, sliding gates | 4/8 |
| Jeju Spiral Tower | race | three banked helix turns round a tower | 7/8 |
| Arena of Kings | sumo | a bowl, one sweeper arm spinning faster; first one out loses | 5/8 |
| Split Decision | race | fork plate: long & smooth left or short, pinned, spinner right; merge | 6/8 |
| Hanok Cascade | race | six straights joined by banked hairpins | 6/8 |

Games last ~12–47 s (Tokyo varies most). Equal marbles split evenly within noise on every arena.

## Files

| File | Job |
|---|---|
| src/kit/guide.js | path sections and the guide (one line through the arena: progress, finish, respawns, cameras; branches allowed) |
| src/kit/trough.js | the U trough: banking, kerbs, checker, rails; render + one-sided physics mesh |
| src/kit/kit.js | an arena's building blocks: boxes, pins, movers (spinner, hammer, gate), pillars; `update(t)` / `sync()` |
| src/kit/shapes.js | pin board / plates, coin funnel, sumo bowl with its sweeper |
| src/arenas/*.js | one arena each: `{ id, name, tagline, theme, build(kit) → { kind, sections, … } }`; index.js = list + draw |
| src/race.js | one game: Rapier world, race or sumo rules, falls (held 0.8 s, put back a little ahead), stuck rescue, rating edge |
| src/match.js | series rules, the match (arenas drawn, seeds per game), headless play for Skip |
| src/scene.js / director.js / hud.js / marbles.js / main.js | look per theme + gates, cameras, overlay, glass marbles, the flow |

Physics lessons (also in the v1 README): one-sided trimesh + `FIX_INTERNAL_EDGES`, normals up; rotations from a basis
must be right-handed (side × up = −T for the guide frame); a chute must not overhang a funnel (marbles wedge under it);
a fork needs a full divider; symmetric sweepers make every sumo end at the same second.

Open: sumo games always end around 13–14 s (the arm's speed decides when, the winner is open); Tokyo can run long.
