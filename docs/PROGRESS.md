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
| Fase 3 Play | done, gate passed, approved 2026-11-13 |
| Fase 4 Wiki | done, gate passed, approved 2026-11-13 |
| Fase 5 Backend | done, gate passed, approved 2026-11-13 — all PRD §15 phases done |

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
9. ✅ Carry-overs: early clicks/Ctrl+K are queued by an inline script and replayed after hydration
   (`components/shell/earlyInput.ts`, `<html data-hydrated>`; e2e earlyInput holds the JS back to prove it;
   the e2e retry loops are gone); slow IndexedDB storage → pinned warning W-STORAGE-002 at start-up
   (startNotifications; Playwright Chromium always has OPFS, so not e2e'd). Measured (Lighthouse,
   prod build): mobile slow-4G perf 95–98, LCP 2.5–2.7 s; PRD's own mid-4G profile LCP 1.7–1.9 s (< 2.0, now
   checked by scripts/lighthouse.mjs 'mid4g'); CLS 0.083 on / and /wiki/career = the late 'penyimpanan permanen'
   warning (< 0.1 'good', PRD sets no CLS target). Safari: storageChoice sends Safari/WebKit to IndexedDB
   (PGlite opfs-ahp needs more sync handles than Safari allows; first query failed). Playwright WebKit on
   Windows can't run the app (its OPFS has no file operations → photos fail), so no WebKit project: test
   real Safari on a Mac/iPhone. React hydration mismatch only on /dev/worker in WebKit (check page).
10. ✅ GATE e2e `fase3Gate`: 3 seasons in a row through the app (start, whole season, save progression,
   Start New Season), each exactly 5,590 matches, integrity clean — 31.8 s. Full e2e 34/34.

### Fase 4 plan (APPROVED 2026-11-13; Podium 100, +4 proposed badges, Dashboard fixed order) — gate: "Rebuild Stats" = cache, identical, on 20 synthetic seasons

User rule (2026-11-13): anything complicated or hard to integrate (esp. cross-browser) → skip it and say so.
1. ✅ Stats foundation (engine season/placements.ts seasonPlacements — also feeds seasonPoints; stats/careerStats.ts
   foldSeason/careerRows; season/synthetic.ts syntheticSeasons; db stats.ts replacePlacements/readCache/writeCache;
   web data/careerWorker.ts updateCareerCache/careerStats/rebuildStats; Settings → Data "Rebuild Stats").
   GATE TEST careerWorker.test.ts: 20 synthetic seasons, cache = rebuild, placements identical (35 s). Placements
   are written when a whole season is finished (not per competition); the live season is added on read.
   Was: Stats foundation: `placements` written per finished competition (§7.2, reuses seasonClose bracket places),
   career stats §7.1 per idol × competition + Combined into `stats_cache`, "Rebuild Stats" in Settings → Data,
   a headless 20-season synthetic generator (promotion + progression) for tests; the GATE test built here first.
2. ✅ Records engine: engine stats/records.ts (RECORD_CATEGORIES, rankRecords competition ranking, allTimeRecords
   minMatches + include scope, rankLabel), stats/matchRecords.ts (pairs = H2H per pair, top-100 upsets), fold got
   reverseSweeps/finals/invincibleSeasons/bestLeagueSeasonPoints; cache {seasons, state, records}; careerStats returns
   {rows, pairs, upsets}. Not tracked: "first season reached" tie step, season-range scope.
   Was: Records engine §7.3 (pure): competition ranking 1, 2, T3, T3, 5; fixed global rank; min matches 50; scope
   filters; deterministic tie-breaks; all categories.
3. ✅ Achievements: engine stats/achievements.ts seasonAchievements (title runs, Invincible, Grand Slam, Dual
   Crown, Idol of The Season by §6.2 score, milestones once, Rookie, Trainee to Star, Giant Killer = careerLine
   giantKills); names in shared/badges.ts BADGES; db replaceAchievements/listAchievements; folded per finished
   season in careerWorker (cache has achievements state); /play close section shows "Badge baru season ini"
   (no popup); no evidence match id stored. Gate test also checks badges = rebuild.
   Was: Achievements §7.4: badges computed when a competition finishes, stored with proof match, celebration popup.
4. ✅ Idol Profile `/wiki/idols/$id` (components/idolProfile/*; shared wiki pieces in components/wiki: MatchLog = paged
   list via Worker matchPage (db matchQuery.ts queryMatches cursor on id + countMatchesWhere), IdolLink, careerColumns,
   compLabel; Worker data/wikiWorker.ts: wikiStats = careerStats memoised on (match count, season statuses),
   idolProfile, rivalsOf). Wiki queries use staleTime 0 (app default is ∞). Not built: edit / change photo / toggle
   active buttons (Input Data + Inactive Manager do that), form, group logo. E2E wiki.e2e.ts plays one season once.
5. ✅ Career Stats `/wiki/career` (components/careerStats: CareerTable = Worker careerTable(comp) + VirtualTable, sticky
   photo+name, sort select, CSV via careerCsv; ColumnPicker; scope = Status/Group/Liga reusing idolDatabase
   filterIdols + exported Select). Not built: season-range scope (cache keeps career totals only), click-to-sort headers.
6. ✅ Head to Head `/wiki/h2h?a=&b=` (components/h2h: H2HCompare, TopRivalries; Worker headToHead + seasonList). Streak
   shown = each idol's career best win streak (no pair-only streak). Match log filters: competition, season.
7. ✅ Hall of Champions `/wiki/champions` (components/champions: WallOfFame = IdolCards with N× most titles first,
   ChampionList; Worker champions = placements rank 1 + rank 2 + FN match score). Tabs skip Swiss/LCQ (no titles).
8. ✅ All-time Records `/wiki/records` (components/records/RecordCard top 10 + "Lihat semua"; Worker records(minMatches)
   = allTimeRecords + upsets + H2H meetings ranked by rankRecords). Name search hides rows, rank stays; min matches
   select. Not built: scope filters on this page (Career Stats has them).
9. ✅ Match Database `/wiki/matches` (reuses components/wiki/MatchLog; filters season, competition, stage, idol, result —
   Menang/Kalah only with an idol —, order by id = season/competition/stage, Reset Filters). "Newest" = id order, not
   play time.
10. ✅ Season Archive `/wiki/seasons` (Worker data/archiveWorker.ts replays the season: titles → SeasonHonours, 13 final
   tables → competition/LeagueStandings without form/trend, cup top 4 from placements, promotionPlan, db
   listSeasonRatingChanges). Not built: Swiss grid, Unzure groups and cup BRACKETS in the archive (the panels only read
   the current season; reworking them per season = big), season story inside the archive (own page).
11. ✅ Season Story `/story` (engine stats/seasonStory.ts: first titles (hidden in the first season), top-5 upsets, reverse
   sweeps, top-3 streaks, Idol of the Month per MD 1–10/11–20/21–30/31–38 by league wins; components/story/StoryCard
   templates; links → the pair's H2H) + Girl Group Stats `/wiki/groups` (components/groups/groupStats; click a group →
   member grid). Not built: "records broken" and "dramatic promotion" stories, group logo / own group route.
12. ✅ Dashboard `/dashboard` (fixed card grid: components/dashboard DashboardCard, CompetitionProgress, RatingHistogram;
   reuses groupStats) + Home cinematic `/` (components/home HomeHero = last Unzure champion, HomeActions = continue %,
   next match, latest story card; OnThisDay = same matchday LG round in earlier seasons, biggest upsets first; On Fire =
   current win streak ≥ 5; last backup line). Worker data/overviewWorker.ts; db MatchFilter got `round`. Welcome stays
   only for Season 1 draft. Not built: "records just broken" card, form table (On Fire instead), carousel animation.
13. ✅ GATE PASSED 2026-11-13: careerWorker.test.ts — 20 synthetic seasons, cache = Rebuild Stats (rows, placements,
   badges identical), and every wiki read timed on that data (Node + in-memory PGlite, ms): career 44, profile 123,
   H2H 27, champions 175, records 465, match page 12 / 5, archive 277, story 364, home/dashboard 225 (asserted < 3 s).
   Browser on OPFS will be slower; not measured in a real browser with 20 seasons.

### Fase 5 plan (started 2026-11-13; user: email + password login only, Supabase + Cloudflare accounts exist) — gate: a cloud backup from device A restored on device B; the app works 100% offline without login

1. ✅ `46e5328` PWA: `public/manifest.webmanifest` + `icon.svg`, Workbox `scripts/serviceWorker.mjs` after `vite build`
   (precaches all 84 files / 20.7 MB incl. PGlite WASM; every route → `index.html`), registered in `__root.tsx` only in
   the production build. e2e `offline.e2e.ts` (own preview server on 5181): open once online, then offline a deep link
   loads and the database answers. No skipWaiting (shortcut: new version after all tabs close). Icon is SVG only (no PNG
   apple-touch-icon yet).
2. ✅ `20d48f3` `apps/api` Cloudflare Worker: Better Auth (email + password) + Drizzle on Supabase Postgres (postgres.js,
   pooler port 6543, one client per request), tables user/session/account/verification/cloud_backup, RLS on with no
   policies (0001_rls.sql), .sabung files in the private Supabase Storage bucket `backups` (service key, server only).
   Routes `/api/auth/*`, `/api/backups` GET/POST(?name=…sabung, ≤ 90 MB), `/api/backups/:id` GET/DELETE, each filtered on
   the session user. Test `app.test.ts` on PGlite: 2 users, 401, wrong name 400, download = same bytes, other user 404,
   delete, RLS on all 5 tables. The SPA shell is now `index.html` (vite.config `prerender.outputPath: "/index"`) so
   Cloudflare's single-page-application fallback works. `wrangler deploy --dry-run`: 422 KB gzip.
3. ✅ `a6545e4` Settings → Backup → Cloud (`components/settings/CloudBackup.tsx`, `data/cloudApi.ts`): login / sign up,
   "Backup ke cloud" (full .sabung), list, "Pulihkan…" opens the usual ImportDialog with the downloaded file (new
   `file` prop: no picker), "Hapus" with ConfirmDialog. Offline/no API: "Cloud tidak bisa dihubungi", nothing else
   breaks. Dev: vite proxies `/api` → `wrangler dev` on 8787.
4. ✅ `be24d0a` Supabase project `sabung-idol` (ref `wulhgztfikmtzlfiuxpf`, region ap-south-1 Mumbai, free plan). Pooler
   host is `aws-1-ap-south-1.pooler.supabase.com:6543`, user `postgres.wulhgztfikmtzlfiuxpf`. `pnpm --filter @sabung/api setup`
   applied both migrations (5 tables, RLS on) and created the private bucket `backups`; anonymous REST → 401.
   `apps/api/.dev.vars` holds DB_HOST/DB_USER/DB_PASSWORD (helpers, user-friendly) + SUPABASE_DB_URL (built from them,
   password URL-encoded) + SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (legacy JWT) + BETTER_AUTH_SECRET.
5. ✅ Deployed: **https://sabung-idol.sabung-api.workers.dev** (`pnpm --filter @sabung/web build` then
   `pnpm --filter @sabung/api exec wrangler deploy`). Secrets: `npx.cmd wrangler secret bulk .dev.vars` in apps/api (run by
   the user; the auto-mode check refuses Claude moving keys). Free plan: sign-up was NOT blocked by the CPU limit.
6. ✅ GATE PASSED 2026-11-13: `cloud.e2e.ts` (device A sign up → "Backup ke cloud" → device B log in → "Pulihkan…" →
   Replace → identical table checksums → delete) on wrangler dev (1.2 min) AND on the deployed URL (4.3 min);
   `offline.e2e.ts` on the preview build AND on the deployed URL (`OFFLINE_URL=…`). Each run leaves one
   `gate-<time>@example.com` user in Supabase (backup deleted, user not).

Deferred on purpose: Home cinematic, Rebuild Stats, achievements, stats pages → Fase 4 (PRD §15).

### Fase 6 plan (APPROVED 2026-11-13, post-PRD updates) — each step: tests, preview upload, user says "deploy"

User decisions: Daesang + Music Bank = OPENER of season N+1 with season N's champions (Season 1 has none);
Perennial Podium = 100 (already in code). NOT wanted: seeded seasons, undo matchday, Safari/browser-specific
work, any speed fix that makes the app or database heavier (so no memfs2opfs = whole db in memory).
A big layout/theme redesign of almost every page comes AFTER this plan, from user references.
1. ✅ Branding per D1 league: Settings rows D1A–D1F + the other cups (no D1/D2 rows); `components/play/competitionLinks` brandOf/labelOf (D2X = D1X logo/colour, "{name} · Divisi 2"), `data/branding.ts` useBranding = every screen that names a competition, `components/CompetitionLogo`; league tabs + heading show logo/name; createDraftSeason copies the last season's branding.
2. ✅ Roster cards (logo/name/colour) + `components/settings/rosterProblems` = every problem of the 12 leagues in ONE list outside the popup (size, twice, in two leagues, inactive). LeagueRosterModal got `title`/`logo` props.
3. ✅ `components/competition/MatchRow` (an open match IS the button, name "Main A vs B") + `MatchList` (rounds) in league fixtures and under every Swiss group, LCQ group and Unzure group table; brackets were already clickable.
4. ✅ MatchModal: preset scores (every valid BoN score), Manual = set the score directly (+/−), more content
   (big photos, rating + win chance, H2H, last-5 form, season record). Direct scores: games alternate, winner
   takes the last game (no fake reverse sweep).
5. ✅ Wheel picker: physical wheel, 12–16 alternating segments, ticking pointer, ease-out; Spin all = one spin per
   game with a pause (Bo3 ≤ 3, Bo5 ≤ 5…).
6. ✅ (with step 3) Every match playable one by one: IDL LG/UB/LB/FN, SWS, LCQ, UZC groups + KO, INK, NUG, B-Side, DSG, MBK.
7. ✅ Daesang + Music Bank = opener: engine `season/gala.ts` openerPairs (at Start New Season → `config.opener`, zod `Opener`) + playOpener before the league phase (pending opener never holds up the leagues; done needs it). Season 1: status "none" (not a close blocker). Season 1 = 5,583 matches, later 5,590. "Sampai fase berikutnya" plays the opener first.
8. ✅ Small bugs: Engine Tuning table scrolls, notices show names (`withNames` in usePlaySeason), clash notice in Indonesian. NOT done: floating the storage warning (it covered buttons; CLS 0.083 is already "good").
9. (partly ✅ 2026-11-14: profile edit buttons = idolProfile/ProfileEdit (updateIdol, replacePhoto; rating stays in Rating Manager);
   archive brackets/Swiss/groups = archive/ArchiveBrackets via cupView(comps, seasonId); stories points-record + late-promotion =
   engine stats/seasonDrama (+test), storyWorker best from db leagueTotals. Then ✅: photo focal point (db setPhotoFocal, listIdols focalX/Y,
   IdolPhoto objectPosition, idolProfile/PhotoFocal), group page /wiki/group/$id + logo (db setGroupLogo, listGroups logoId).
   Still open: Career Stats season range (cache keeps career totals only).) Skipped features: archive brackets/Swiss/groups, Career Stats season range, group logo + group page, edit
   buttons on profile, "records broken" + "dramatic promotion" stories, photo focal point.
10. (partly ✅: Trophy cabinet = idolProfile/TrophyCabinet; Rivalry label = h2h/rivalryLabel (+test) in H2H and profile Rivals.
    Then ✅: Season Recap = archive/recapCard drawRecap (canvas 1080×1350) + RecapButton on Season Archive; final predictions =
    data/predictionsWorker (event_log code PREDICTION, latest pick per match; hidden from notices) + play/FinalPredictions on cup
    panels + Dashboard accuracy.) PRD §16: Season Recap card 1080×1350, Rivalry label, light theme, final predictions, retirement & debut,
    transfer window (propose rules first) + Trophy cabinet on the idol profile.
11. ✅ (2026-11-14) Measured: engine replay of a full season 15–25 ms; db listSeasonMatches ~145 ms (the biggest cost, 2× per
    panel, 12× on Season Progression). Fix: data/seasonMatches = cached read keyed by db seasonMatchStamp (count + latest
    played_at), max 2 seasons kept; every reader uses it except playSeason (extends its own copy). Bundle: 23 MB = PGlite wasm 9 MB +
    data 6 MB (needed) + default idols.json 4 MB (kept: offline first install); app JS 360 KB + worker 810 KB — left as is.
    Swiss / LCQ through-out ✅ (engine foldSeason, own line only; career cache key career-v2). Season range DROPPED by the user.
    Lighter + faster without growing the app or the db: measure first (bundle, start-up, page reads), fix the biggest.
User 2026-11-13 (later): retirement & debut and transfer window DROPPED. Final predictions stay.

### Redesign plan (APPROVED 2026-11-13) — brief: design/NOTES.md "penjelasan…" row
R1 ✅ Foundation: strong sans (proposal: Archivo variable = body + wide/condensed headlines from one file; a
   blackletter accent only for ornamental numbers), no outlines/boxes (fills, glow, single lines), freer use of the
   palette on dark, inline-SVG grain/halftone/torn edges + gothic ornaments, shared components restyled.
   Built: theme.css = Archivo variable (wdth) + UnifrakturMaguntia (`font-gothic`, ornaments only) + Geist Mono; tokens.css base =
   crimson/navy glows on black, fixed SVG grain overlay, h1/h2/.font-display wide 800 caps; components = `.tag` `.kicker`
   `.outline-text` `.corner-marks` `.torn` `.panel`. Button = fills (no outline), caps. Modal = top crimson line + shadow.
   IdolCard = frameless, torn photo, blackletter rating + tier chip, group-colour glow. Script removed every boxed
   outline (58 files): fields = underline on a fill, cards = `.panel`, chips = fills. Only text sizes xs…3xl exist.
R2 ✅ Home, Sabung Idol, competition panels: `components/competition/CompetitionCover` (tag, issue line, huge name + giant
   outline word, stats with colour lines, leader/champion torn photo) on every league and cup panel + Unzure; league Overview =
   top-5 IdolCards with blackletter ranks. HomeHero = cover with giant UNZURE outline, vertical label, Issue Nº tag; Home
   progress number huge; On Fire = torn photo strip. /play header with giant blackletter season number; timeline phases 01–03
   with lines, no panels.
R3 Wiki pages. R4 Studio pages. Then steps 9–11 in the new style (light theme dropped: the brief keeps it dark).

### Update 2 plan (APPROVED 2026-11-13) — refs: design/NOTES.md "Update 2"; replaces R3, R4 stays after
U1 ✅ Sim controls: PlayTarget `comps` takes an optional `round` ("R1" = every group's "A-R1"…; data/seasonRunner `allows` + test).
   /play "Main matchday N semua liga"; Unzure "Main Swiss R1" (all groups) / "Main sampai akhir {fase}" / juara; B-Side
   "Ronde X di semua cup" + "Semua cup sampai selesai". League panels already had matchday / end of league.
U2 ✅ data/bracketSkeleton (engine templates → every slot from the start, id "" = blank, cells sorted in template order;
   a match is OPEN when it has no score: group draws have no winner). TournamentBracketTree = photos, score per side,
   connectors, round names. SwissPlayInBracket = 5 rounds × record buckets with blanks + clickable open (prop open[round]).
   components/competition GroupStage (group tabs, table beside schedule), GroupTable with photos, GalaStage (DSG/MBK),
   Nugu rounds with more than 8 matches = MatchList, bracket from R16.
U3 ✅ data/homeFacts (leaders + facts, pure + test) via overview (leaders, facts, totals; next/reigning/onFire removed).
   Home = HomeNumbers / HomeFact / HomeLeaders. Dashboard = header, dashboard/D1Board (6 D1 tabs, LineRace title race +
   zone table), dashboard/TournamentMap (static order + formats), loose CSS columns of DashboardCard (no box).
U4 ✅ /wiki/progression: progression/RaceGrid (6 races), Bump (positions), progress bars, TitleShare. charts/LineRace +
   charts/titleRace (pointsByMatchday + test) are shared.
U5 ✅ Groups: groupStats(+byComp, record) + GroupEntry list; worker titlesByComp. Career: careerColumns columnsFor(comp)
   (no titles for SWS/LCQ; UZC group exit/advance), ColumnPicker per tab, Podium. Profile: ProfileHero dossier with picker,
   CareerScope; /wiki/profile = top-rated idol. H2H: tale of the tape (games, last 5 from headToHead). Champions: per
   season, many-champion comps grouped; champions() returns third. NOT done: Swiss/LCQ "lolos/gugur" career counts
   (no placements for SWS/LCQ; would change the engine stats + golden snapshots).
U6 ✅ components/PageHeader on Studio + remaining wiki pages + Story. R4 ✅ (2026-11-14): tokens.css .studio-flow/.studio-section
   (numbered chapter: crimson rule, blackletter 01…, big h2) = settings SECTION + Input Data + Rating Manager sections. Nav: Idol Profile, Season Progression.

### Update 3 plan (APPROVED 2026-11-14) — doc "Beberapa update dan perubahan 2.docx" (12 pictures, not in git)
V1 ✅ engine season/types pendingBatch: a round (bracket), a Swiss round of all groups, and EVERY group matchday are played or
   listed pending together (was: the first pending match stopped the track, so panels showed 1 match at a time). SeasonResult
   .entrants = each bracket cup's seeds → bracketSkeleton fills seeded slots early. WheelPicker spin has its own timer (the
   "Spin all" pause clean-up cancelled it: stuck after one spin). Bracket: final/GF in its own column at the right (big,
   gold), 3RD under it; double-elim round names (Ronde 1, Final upper, Lower ronde N, Final lower). CupPanel champions above
   the play buttons; IdolCard glow smaller. The Idols playoff = "Playoff" tab of LeaguePanel; D1/D2 "Simulate semua liga".
V2 ✅ MatchHeader theme {accent token, kicker, grandFinal} (PlayMatchDialog ACCENT map; leagues/B-Side use league branding colour):
   tilted big photos, faded blackletter competition word, gothic VS, gold + trophies for F/GF/Daesang. LiveMatchVisualizer:
   tug-of-war per game, "Game N berlangsung" (never the total), Match point, winner line. WheelPicker: rim bulbs blink,
   gold pointer/hub, spin winner photo lights up, big score. e2e cupPanels checks no spoiler + Spin all to the end.
V3 ✅ tokens.css .photo-frame (crimson→gold passe-partout) replaces .torn everywhere; tier colours S gold, A red, B violet,
   C teal, D navy; WallOfFame count = gold blackletter number above the card; engine rankLabel "#3 bersama" (was T3);
   StoryCard = newspaper (lead story big, coloured rule per kind, framed photo, no crimson blocks); /wiki/progression
   chapter 03 = Bump codes={["IDL"]} (Bump takes codes); engine seasonScores + seasonTop → honours podium = season top 3
   (seasonOverview / archive .seasonTop, uzcThird gone); components/TierStrip (Rating Manager + Idol Database);
   ratingManager/RatingCards + RatingCard (slider commits on release, number field, ±5, quick values, record, titles).
V4 ✅ /wiki/groups = Tabs "Peringkat" (GroupEntry now shows the group logo) + "Semua grup" (groups/AllGroups: every group,
   logo, members, link; form "Tambah grup" with optional logo → db addGroup (+test) / worker addGroup). /wiki/group/$id
   works for a group without members. H2H TopRivalries: the whole row is one link. Backup section "base" (shared
   SECTION_LABELS, db SECTION_TABLES): groups, photos, idols, + the current season's seasons/competitions/entries, no
   matches (+test). Replace with it on a database that has matches fails and rolls back (FKs, same as the Idol section).
V5 ✅ (golden snapshot updated twice: intended engine changes)
   - Re-roll: SeasonInput.salt {matchId: n} → matchRng(seed, id, salt). data/singleMatch simulateMatch(id, salt) (worker);
     PlayMatchDialog simulate = a random salt per press; MatchModal simulate is async + "Simulate ulang". matchPreview
     no longer carries games. Bulk "Main …" buttons stay on the season seed.
   - Momentum (series.ts): the side behind gets +3% per game behind (max 6%). PRD §5.10 check now on games with nobody
     behind (still 64%); more Bo5 go to 5 games.
   - Upset cups (matchPlayer): NUG / BS* use scale ×1.4, sigma ×1.5, and fatigue −0.75 per big-cup match this season
     (SWS, LCQ, UZC, INK, IDL playoff — not the IDL league), at most −6. Measured over 10 seasons: a 10+ favourite lost
     20.0% → 26.8% (upsetCups.test). Form already counted every competition (last 5, ±3/−2).
   - Progression (seasonClose): PRESTIGE UZC/SWS/LCQ 1, IDL .9, D1 .8, INK .7, NUG .6, BS .5, DSG .4, MBK .35, D2 .25
     ("Crown Cup" = Inkigayo). Gain = performance (±6) + titles 3 × prestige (≤ 5) + giant kills 0.5 (≤ 2) ± 2 promotion,
     × clamp((100 − rating) / 30, 0.2, 1.5) when positive; losses in full. The >92 regression is gone. Reason string says
     the factor. seasonScores/seasonTop unchanged in shape.
V6 ✅ part 1 (user: web data OVERWRITES; new idols: user sends a list; photos: test with IVE first)
   - idols.role (migration 0002_idol_role, nullable text; shared idolInputSchema role optional, max 80). updateIdol only
     sets role when given. Profile: edit form field + shown in the hero facts.
   - db updateIdolDetails(rows, dryRun) (+test): match name + group (case-insensitive), overwrite birthday / nationality
     / role that the row gives; returns { updated, unknown }. Worker updateIdolDetails. Input Data section
     inputData/IdolDetailsImport (JSON file → preview → Terapkan), e2e idolDetails.
   - seed/idol-details.json: all 242 default idols (birthday, ISO nationality, kprofiles position; 23 without official
     position have no role), applied by loadDefaultData on a fresh install (+ seedData test). Same file is
     import/idol-details.json for the user's existing database. Sources: kprofiles.com member profiles (2026-11-14),
     Jini's birthday checked on Wikipedia (2004-04-16).
   - import/ (git-ignored): ive-photos/ (6 kprofiles photos named as in the database, for Photo Import),
     ive-details.json, idol-details.json.

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

### apps/api (Cloudflare Worker: cloud backup API + serves the built web app)
- `src/index.ts` Worker entry (`/api/*` → `app.ts`, else static assets) · `app.ts` routes · `auth.ts` Better Auth ·
  `backups.ts` list/upload/download/delete per user · `files.ts` Supabase Storage (+ in-memory for tests) · `schema.ts`
  · `db.ts` the Db type · `migrations/` (drizzle-kit, `pnpm db:generate`) · `scripts/setupSupabase.mjs` ·
  `wrangler.jsonc` (assets = `../web/dist/client`, worker first only on `/api/*`). Secrets: `.dev.vars` (git-ignored).

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
  LeagueRosterModal paste has two buttons: "Tambahkan dari teks" (append) and "Ganti roster dengan teks" (drop the old roster, keep only the pasted names; nothing saved until Apply).

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
- Cloud is optional: no screen may need `/api`; every cloudApi call can fail offline. Secrets live only in
  `apps/api/.dev.vars` / `wrangler secret`, never in the web app or git. RLS stays on with no policies.
- Don't shrink PGlite's opfs-ahp spare pool (maintainedPoolSize): a new database then hangs in its first migration
  (0000_init needs 57 new files; tried and reverted 2026-11-13).
- Editing `apps/web/vite.config.ts` restarts every running vite dev server; the long-running 5173 one came back
  answering "Cannot GET" (2026-11-13) and needs a manual restart.
- Empty rating in input = 75 (yellow). Deleting an idol in a roster is refused (offer deactivate).
- The Idols roster is fixed at season start (else rating changes would rewrite the season); likewise an
  idol's rating is fixed within a season once played (`seasonInput` reads it from the saved matches).
- Engine Tuning preset numbers are ours (PRD gives none): Realistic 40/σ4, Chaotic 60/σ8, Dominant 28/σ2.
- Photos are prepared with tools/photos (K-pop Wiki concept photos / Wikimedia Commons, numbered contact sheets, every pick
  checked by eye). Files are named "Name GROUP.jpg" so Photo Import matches them for sure.
- Default photo rule (user 2026-11-14): never from kprofiles; the face must be fully visible and clean — no glasses, masks,
  hands or props over the face (concept shots are out). This is for the default base photo only; comeback photos later.
- Update 3 engine rules (user): Nugu/B-Side upset cups (fatigue + flatter scale), in-series momentum, MatchModal re-roll,
  new progression and prestige order — PRD §5.10 and §6.1–6.3 numbers are superseded where they differ (see V5).
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
- `pnpm --filter @sabung/web budget` now builds first (before 2026-11-13 it measured whatever dist/ held, so the
  148.3 KB reported in Fase 3 steps 6–10 was a stale build; real: 154.2 KB at Fase 4 step 3).
- Cloud API: `pnpm --filter @sabung/api test` (PGlite) · `pnpm --filter @sabung/api dev` (wrangler, :8787, serves
  `apps/web/dist/client` — build web first) · `pnpm --filter @sabung/api setup` (Supabase migrations + bucket).
  Offline e2e builds the app and serves it on 5181; cloud gate e2e needs `CLOUD_URL`.
- DEPLOY FLOW (user 2026-11-13): after EVERY change, build and upload a PREVIEW (never straight to production):
  `pnpm --filter @sabung/web build && pnpm --filter @sabung/api exec wrangler versions upload --preview-alias test --message "…"`
  → https://test-sabung-idol.sabung-api.workers.dev. The user tests, says "deploy", then
  `pnpm --filter @sabung/api exec wrangler versions deploy <version-id>@100% -y`. Login/cloud backup may not work on the
  preview host (Better Auth knows the main URL only). Tell the user: close ALL tabs of the site to get the new version (PWA).
- Deploy: `pnpm --filter @sabung/web build && pnpm --filter @sabung/api exec wrangler deploy`. Gate e2e online:
  `CLOUD_URL=https://sabung-idol.sabung-api.workers.dev pnpm --filter @sabung/web e2e cloud.e2e.ts` and
  `OFFLINE_URL=… e2e offline.e2e.ts`. In the user's PowerShell `npx` is blocked (execution policy): use `npx.cmd`.
- Shell pitfalls: no Python on this machine; sed eats `\d` (use the Edit tool for regex text); a heredoc
  with tricky quoting can fail silently — check the file was written; never edit package.json while
  pnpm is running.

## Open items
- FASE 4 GATE PASSED 2026-11-13 — waiting for approval before Fase 5. MatchModal is taller than a 720 px screen (title/Accept need a scroll).
- E2E flake under load: a full e2e run 1 of 3 on 2026-11-13 had 6 fails waiting for "Season 1 · Draft" on
  fresh profiles. (Fixed: db tests have `--hookTimeout=30000`; opening two PGlite dbs takes ~10 s.)
- Real Safari (Mac/iPhone) untested: IndexedDB database + OPFS photo files. CLS 0.083 from the late
  storage warning could be removed by reserving its space (optional).
- `design/refs/overall vibe layout & ui.mp4` not reviewed.
- A one-off E-DB-001 on an existing database after rapid reloads (unreproduced; a reload fixes it).
- Reload with 2 seasons (10,530 matches, Playwright Chromium, dev server): the database is ready after ~6.6 s on EVERY page (season chip); the Fase 4 pages themselves then take ~0.1–0.8 s. CAUSE (measured): PGlite `opfs-ahp` opens one sync access handle per file on every open (1,043 Postgres files, mostly the empty system catalog, + 100 spare pool files) at ~5 ms each = ~5.5 s; lock 14 ms, migrations ~30 ms. It does not grow with matches (an empty database also takes 5.2 s). Option: PGlite `memfs2opfs` reopens in 1.2 s but keeps the whole database in memory (58 MB at 2 seasons) and needs the stored data converted. Tried a smaller pool (maintainedPoolSize 50): REVERTED. A new database refills its pool only to that size before the first migration, and 0000_init needs 57 new files: opfs-ahp then hangs with no error (worker e2e). A safe size (~70+) would save only ~0.15 s. Left as is; memfs2opfs is the only real fix (whole database in memory + data conversion), not done.
