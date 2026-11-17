# Marble Match (preview, separate from the app)

**Update 2026-11-18 (round 2):** a scoreboard on top; a field of **2–20 marbles** (2 = a Best-of-N series as below, 3+ =
a **Grand Prix**: 3/4/5/7 races, F1 points 25-18-15-12-10-8-6-4-2-1, ties by wins, podium + table at the end); 7 more
arenas (15 in all, no second sumo) built for close racing with **boost pads**: they push up to a top speed that is
higher the further a marble is behind the leader (13 m/s + up to 6), so the back of the field catches up. Measured on
equal pairs: the gap between 1st and 2nd is mostly 0.1–1 s. Photos now come from import/ive-photos and
import/new-photos/<group> (46 named idols).

| Round 2 arena | What happens |
|---|---|
| Neon Overdrive | synthwave highway, huge banked sweepers, two jumps (landings start under the lips), gates, 3 boosts |
| Crystal Corkscrew | glass tubes: a 3-turn corkscrew and a blind S-bend between open troughs, 2 boosts |
| Magma Core | 1¼ laps down round a volcano over a lava floor, three wrecking balls, a lava jump, 4 boosts |
| Factory 9 | two spinning tumble drums with fins, hammers and a gate between them, 3 boosts |
| Sky Bridges | golden platforms joined by narrow low-railed bridges above the clouds; falls are part of it; 4 boosts |
| Dragon Slalom | lantern slalom with bumper posts at each apex, a wide bobsled half-pipe, 3 boosts |
| Abyss Trench | a giant glass spiral, a wide trench run with three "jellyfish" spinners, 3 boosts |

New kit pieces in `src/kit/extras.js`: boost pads, glass pipes (inside = physics surface), tumble drums (a kinematic
barrel with a trimesh and fins); `kit.hammer({ ball: true })` = wrecking ball. Lessons: a boost without a top speed
throws marbles off (seen at 20–50 m/s); a wide section must narrow back before a narrow one; a landing must start under
its lip. 20 marbles: a headless race takes 0.6–2.7 s of CPU for ~25 s of racing.

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
