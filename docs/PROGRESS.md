# Sabung Idol — progress and code map

**Read this first in every new session.** It says where the project stands, where every part of the
code lives and why things are the way they are, so nobody has to read the code file by file. Open a
file only when the task touches it. Keep this file current: update it at the end of every step.

- Spec: `PRD_1.md` (phases in §15). UI references: `design/refs/` + `design/NOTES.md`.
- Running log and user decisions: memory note `C:\Users\danim\Documents\Second Brain\Memory\Claude.md`.
- The user writes Indonesian; answer in Indonesian. Plan a phase, wait for approval, then build step by
  step; the user said "run several steps in a row, efficiently" — stop only for real decisions.

## Status (2026-11-13)

| Phase | State |
| --- | --- |
| Fase 0 Engine & data core | done, gate passed |
| Fase 1 Design system & shell | done, gate passed |
| Fase 2 Studio | done, gate passed (240 idols + photos in 30.5 s; backup → restore elsewhere = identical checksums) |
| **Fase 3 Play** | **in progress: steps 1–8 done, next is step 9** |
| Fase 4 Wiki, Fase 5 Backend | not started |

### Fase 3 plan (approved) — gate: 3 seasons in a row, no integrity errors, no duplicate matches

1. ✅ `960aaa3` Engine replay + Settings in the engine
2. ✅ `6692f2d` Season lifecycle (start, play in chunks, pause) + integrity check
3. ✅ `c3ac2cf` Sabung Idol simulator page (`/play`) — The Idols roster fixed at season start
4. ✅ `d9e74b9` League panels (`/play/d1`, `/play/d2`, `/play/the-idols`)
5. ✅ `2c162d5` Cup panels (Unzure road, Inkigayo, Nugu, B-Side, Daesang, Music Bank)
6. ✅ MatchModal live: league fixture "Main", cup bracket and Unzure knockout clicks open
   `components/play/PlayMatchDialog` → MatchModal (Simulate = the engine's own games for that match /
   Manual = click the winner of each game in order / Wheel) → "Accept Result" → Worker `acceptMatch`
   checks the games end the series exactly, saves with its method; the replay reuses it. Only open
   (pending) matches; editing an already played result is not built (`playSeason` stale clean-up is ready).
7. ✅ Season close (user 2026-11-13: cup points by round out, ties share the average; draws = half a win;
   progression OPTIONAL, not required before a new season): engine season/seasonClose.ts (PRESTIGE, seasonPoints,
   promotionPlan, seasonProgression from the ratings stored in the matches = rerun gives the same), db ratings.ts
   applyRatings (1 tx + rating_history) + archiveSeason, web data/seasonClose.ts, components/play/SeasonClose.
   Was: Season close: archive guard (Blocker naming unfinished competitions), Rating Progression PRD §6.2–6.3
   (preview → save into rating_history), promotion/relegation (D1 18–20 ↔ D2 1–3, preview), "Start New
   Season" (new draft season N+1), auto-snapshot before.
8. ✅ Rating Manager + Engine Lab (`/studio/ratings`): draft (nothing saved before Save Now), steps for
   Revert, Discard, diff old → new, confirm on all three; `components/ratingManager/` ratingPresets (Seed,
   Realistic Variety μ72 σ9 in rating order, Reset 75), RatingTable (scope, search, select, Set/Add bulk),
   RatingActions, EngineLab (per game + per BoN odds, 100/1,000 sims, score histogram); Worker
   `data/ratingSources.ts` lastSeasonProgression (§6.4) + careerSync Replace/Blend (§6.5, 0.85^age, → 45–98);
   saves through db applyRatings source "manager".
   FIX found by its e2e: saving ratings reseeded finished cups in the replay → `seasonInput` now gives an
   idol who already played this season the rating stored with those matches (ratings fixed within a season).
9. ⏭ Carry-overs: clicks before hydration do nothing (Ctrl+K, mobile Play sheet — the e2e retries), slow
   storage banner in the main app, WebKit/Safari e2e, mobile LCP 2.4 s, CLS 0.083.
10. Gate e2e: 3 seasons in a row through the app; integrity clean; all match ids unique.

Deferred on purpose: Home cinematic, Rebuild Stats, achievements, stats pages → Fase 4 (PRD §15).

## Architecture in one picture

```
page (React, apps/web/src/pages) ──Comlink──▶ Worker (apps/web/src/data/worker.ts)
   │ TanStack Query (IDOLS_QUERY, SEASON_QUERY)          ├─ @sabung/db   (Drizzle + PGlite on OPFS)
   │ IdolDataProvider feeds @sabung/ui components       ├─ @sabung/engine (pure season simulation)
   └ engine() from data/engineClient.ts                 └─ OPFS files: photos, snapshots, marker files
```

- Monorepo: pnpm workspaces + Turborepo. `apps/web` (TanStack Start SPA, routes in `src/pages`),
  `packages/ui` (design system + Storybook), `packages/engine`, `packages/db`, `packages/shared`.
- **One OPFS database per Worker**; `engine(name)` makes the Worker, which reads its database name from
  `self.name`. Main database name: `sabung-idol` (`MAIN_DATABASE`).
- Every database call goes through `worker.ts` (the API object; ~180 lines). Pages never touch PGlite.
- Packages are `sideEffects: false`; never import a value from `@sabung/db` into a page (it would pull
  PGlite into the main bundle) — type imports are fine; shared constants live in `@sabung/shared`.

## Where things live

### packages/shared (pure, used everywhere)
- `competitions.ts` codes (D1A–F, D2A–F, IDL, SWS, LCQ, UZC, INK, NUG, BSA–F, DSG, MBK) · `stages.ts` ·
  `matchId.ts` (`buildMatchId`, `classifyMatch` — ids are deterministic: `S01-D1A-LG-MD01-M01`).
- `bestOf.ts` PRD default BoN · `seasonConfig.ts` Settings model: competitions on/off + dependencies,
  BoN per stage, Engine Tuning (+ `TUNING_PRESETS`), `seasonBestOf`, `competitionKeyOf`.
- `idolSchema.ts` (Zod), `idolRules.ts` (duplicate rules), `idolBatch.ts` (paste/CSV/JSON → preview),
  `tier.ts`, `backupSections.ts`, `ulid.ts`.

### packages/engine (pure, no I/O)
- `series.ts`/`probability.ts`/`form.ts`/`rng.ts` one match; `standings.ts` tables + tie-breaks;
  `roundRobin`, `swiss*`, `groupDraw`, `knockout*`, `doubleElimination`, `nuguPlan`, `bracket.ts`.
- `season/runSeason.ts` the whole season: league phase → interleaved cups → Gala Night.
  **Replay model (Fase 3):** input `saved` results are reused (same pairing), a match not saved is only
  played if `input.target(match)` allows it, otherwise it is *pending*. League matches can be pending
  and the league goes on (fixtures don't depend on results); a cup stops at its first pending match
  (throws `PENDING`, caught per track in `interleave.ts`) while other cups continue; the gala waits.
  Result: `matches, titles, pending (what can be played next), stale (saved but no longer happening),
  draws (Swiss/LCQ groups, Unzure pots and groups), done`.
- `season/matchPlayer.ts` replay logic; `leaguePhase.ts` (`pickTheIdols`; uses `input.theIdols` if
  given); `unzurePath.ts`, `cups.ts` (B-Side reports each cup separately), `gala.ts`, `splitLeagues.ts`
  (Data Maker: top 120 → D1, next 120 → D2, snake over 6, seeds spread, rest reserves).
- Golden test (`runSeason.test.ts`) must never change unless the engine is meant to change.

### packages/db (Drizzle + PGlite)
- `schema.ts` tables: groups, idols (unique lower(name)+group), photos, seasons (config jsonb),
  competitions (branding per season), entries (rosters: comp + stage LG; The Idols = comp `IDL`,
  stored at season start), matches (append-only, games bitmask), placements, rating_history,
  achievements, stats_cache, event_log. Migrations bundled (`migrations.ts`).
- `idols.ts` add/update/active/delete (+ `deleteBlocker`: matches or a roster), `groups.ts`, `photos.ts`
  (`forgetPhotos`), `seasons.ts` (draft season, rosters, `replaceInRoster`, `updateSeason`,
  `setLeagueRosters` draft-only, branding, `resetSeason`), `seasonPlay.ts` (`listSeasonMatches`,
  `deleteMatches`, `startSeason` with problems + The Idols), `saveMatches.ts`, `leagueTable.ts`,
  `integrity.ts`, `backupRead.ts`/`backupWrite.ts` (Merge by name+group, Replace, preview = rolled-back
  import), `eventLog.ts` (`lastEventAt`).

### apps/web/src/data (saving and loading; Worker side and its clients)
- `worker.ts` the Worker API · `engineClient.ts` `engine()` · `seasonRunner.ts` **season play**:
  `playSeason(target)` (targets: all / phase / stage / round / ids / comps; chunks of 1,000, pause,
  one transaction per round, stale removed), `seasonOverview`, `leagueView`, `cupView`, `seasonInput` · `singleMatch.ts` `matchPreview(id)` /
  `acceptMatch(id, games, method)` (one match through the MatchModal).
- `loadDefaultData.ts`/`seedData.ts` default idols from `seed/idols.json` (marker I-SEED-001) ·
  `firstSeason.ts` Season 1 draft · `startDefaultData.ts` start-up chain (+ backup reminder, integrity).
- `photoFiles.ts`/`photoSizes.ts`/`photoCache.ts` photos in OPFS `<db>-photos/<id>/` (64/256/1024, never
  enlarged) · `backup/sabungFile.ts` (.sabung ZIP format) · `backup/backupWorker.ts` (export/import,
  snapshots in `<db>-snapshots`, 3 kept) · `integrityWorker.ts` · `databaseReset.ts`/`resetOffer.ts`.
- `notices.ts` notifications (Zustand; `notify`, `{log:false}`, `{oncePerDay}`) · `seasonQuery.ts`
  (`useCurrentSeason`, `useLeagueRosters` = the 12 leagues, without IDL).

### apps/web/src/pages and components (screens and their pieces)
- `/` Home welcome while draft (`components/home`) · `/play` simulator (`components/play`) ·
  `/play/$comp` panels (`components/competition`: LeaguePanel, CupPanel, UnzurePanel, Tabs, …).
- `/wiki/idols` Idol Database (`components/idolDatabase`) · `/studio/input` Input Data
  (`components/inputData`) · `/studio/inactive` (`components/inactiveManager`) · `/studio/settings`
  (`components/settings`: Season, Branding, Roster, DataMaker, EngineTuning, Data + IntegrityList,
  Backup, DangerZone) · shell in `components/shell` · `/dev/*` check pages (not in the menu).
- packages/ui: IdolCard (trading card), IdolPhoto, RatingBadge (`TIER_FILL`), VirtualTable,
  PhotoDropZone, ColorSwatchPicker, Button (danger = outlined), Modal, ConfirmDialog (typeToConfirm),
  ImportDialog, LeagueRosterModal, SearchableIdolSelect, MatchModal, WheelPicker, brackets, notices.

## Rules and decisions that are easy to break

- **Never delete a database automatically.** An automatic clean-up wiped a real database once (reverted
  in `3f02beb`). Deleting needs the user: `<db>.ready` is written after every successful open; a reset is
  only offered when it is missing and needs "HAPUS"; the Worker deletes before opening only with a
  `<db>.reset` request (and still no `.ready`) or a `<db>.wipe` request (Danger Zone, "HAPUS SEMUA").
- Database lock waits up to 5 s (a reload is not "another tab"). A reload in the first seconds of a
  fresh install can break PGlite's OPFS pool → the confirmed reset is the way out (e2e `firstOpen`).
- Colours only through tokens (`packages/ui/src/tokens.css`), named by role: `accent` (crimson fill,
  text `on-accent`), `accent-bright` (text/focus), `cool`, `muted`, `danger`, `tier-s…d`. Crimson and navy
  are fills only. Contrast is tested (`tokens.test.ts`).
- Settings sections save only their own config fields over the latest saved config.
- Empty rating in input = 75 (yellow). Deleting an idol in a roster is refused (offer deactivate).
- The Idols roster is fixed at season start (else rating changes would rewrite the season); likewise an
  idol's rating is fixed within a season once played (`seasonInput` reads it from the saved matches).
- Engine Tuning preset numbers are ours (PRD gives none): Realistic 40/σ4, Chaotic 60/σ8, Dominant 28/σ2.
- Project rules (CLAUDE.md): screens in `pages/`, pieces in `components/`, saving/loading in `data/`,
  one job per file, ≤ 300 lines, minimal code, ask instead of guessing, test every change, report real
  results. Ponytail mode is on (full). Don't commit `design/refs/*` pictures unless asked.

## How to run and test (Windows, Git Bash)

- Put Node on the path first: `export PATH="/c/Program Files/nodejs:$(cygpath "$APPDATA")/npm:$PATH"`.
- Dev app: `pnpm --filter @sabung/web dev` → http://localhost:5173 (use real Chrome/Edge; the in-app
  browser pane's storage is not persistent and lost all data once).
- Typecheck all: `pnpm -r exec tsc --noEmit`. Unit tests: `pnpm --filter @sabung/<pkg> test`
  (shared, engine, db, ui, web). Don't pass `--testTimeout` (already in the scripts).
- E2E (Playwright, own server on port 5180): `pnpm --filter @sabung/web e2e [name]`; expect timeout is
  15 s because every fresh profile opens its own database under parallel load. Screenshots for a human
  look go to `apps/web/test-results/` (git-ignored). Bundle: `pnpm --filter @sabung/web budget` (148 KB
  of 180 KB). Lighthouse: `pnpm --filter @sabung/web lighthouse`.
- Shell pitfalls: no Python on this machine; sed eats `\d` (use the Edit tool for regex text); a heredoc
  with tricky quoting can fail silently — check the file was written; never edit package.json while
  pnpm is running.

## Open items

- Fase 3 steps 7–10 (above). MatchModal is taller than a 720 px screen (title/Accept need a scroll).
- Flakes under load: db `backup.test` setup hook > 10 s (default hookTimeout) in most full runs (passes
  alone at ~9.8 s) — fix: raise the hook timeout in the db test script;
  full e2e run 1 of 3 on 2026-11-13 had 6 fails waiting for "Season 1 · Draft" on fresh profiles.
- Hydration dead clicks. WebKit e2e. Mobile LCP/CLS.
- Gala notices show raw idol ids ("01M7… won both sides") — engine notice text, should use names.
- Display font: the mood references use a bold sans; `--font-display` is still Fraunces (undecided).
- `design/refs/overall vibe layout & ui.mp4` not reviewed. Photo focal point not built.
- A one-off E-DB-001 on an existing database after rapid reloads (unreproduced; a reload fixes it).
