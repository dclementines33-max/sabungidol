# Sabung Idol â€” progress and code map

**Read this first in every new session.** It says where the project stands, where every part of the
code lives and why things are the way they are, so nobody has to read the code file by file. Open a
file only when the task touches it. Keep this file current: update it at the end of every step.

- Spec: `PRD_1.md` (phases in Â§15). UI references: `design/refs/` + `design/NOTES.md`.
- Running log and user decisions: memory note `C:\Users\danim\Documents\Second Brain\Memory\Claude.md`.
- The user writes Indonesian; answer in Indonesian. Plan a phase, wait for approval, then build step by
  step; the user said "run several steps in a row, efficiently" â€” stop only for real decisions.

## â–¶ RESUME HERE (saved 2026-11-14, end of session)

Production = version 01ce8996 (Update 3 V1â€“V6 + import fixes), deployed at the user's request; latest code is committed.
The user tests on another device. Nothing is half-built in the code.

**FIXES 2026-11-16 (router): brackets drawn in feeder order (engine bracketDisplayOrder, used by bracketSkeleton â†’ every cup panel, Unzure KO, playoffs, archive; engine pairing unchanged; bracketDisplay.test). Settings soft lock: readSeasonConfig never throws (repairs each field), clampTuning/TUNING_LIMITS shared, Engine Tuning clamps on save, db updateSeason repairs config on write; SectionBoundary (E-PANEL-002) around Settings sections, Dashboard cards/blocks and Home blocks.**

**WHEEL (2026-11-15, router): the wheel is back and Simulate is gone from the match dialog (presets + Manual stay; bulk season buttons stay). WheelPicker.tsx = stage (spotlight, lit/grey portraits, gallery flash, match point/decider call + longer spin, crowd meter, series chance, split-flap score, UPSET stamp, gold burst for finals); WheelDisc.tsx = the wheel; wheelMath.ts = landing (50:50), seriesChance, tension, spinMs, crowd, isUpset (tested). Stored method "sim" untouched. LiveMatchVisualizer and worker simulateMatch removed.**

**SPOTLIGHT PICKER (2026-11-15, router): WheelPicker.tsx is now a spotlight duel (two framed portraits, a beam swings between them and stops on the winner; sweep() schedules the flips, unit-tested). Same draw: one random number per game, < 0.5 = A. Mode label "Spotlight Picker"; stored method stays "wheel". Screenshot e2e: test-results/spotlight-picker.png. Also: competition panels "Playingâ€¦" (was Memainkan).**

**PREVIEW 2026-11-16: version 0bc2edce-73ac-4da1-a5ea-ab24c6437c53 (alias test) = main with cloud sync, timeline revamp, career news, gallery add photos, photo lazy load. NOT deployed to production (production = 01ce8996).**

**RATING MANAGER REBUILT (2026-11-15, router): calm rows (RatingList + RatingRow): checkbox, photo, name + group Â· league, slider (commits on release), number field, tier chip, "was N" when changed. Order: Draft â†’ Ratings â†’ Presets â†’ Engine Lab. No W-D-L, no step/quick buttons, no career query.**

**TIERS (2026-11-15, router): S+ â‰¥96, S â‰¥90, A â‰¥83, B â‰¥75, C â‰¥65, D â‰¥55, F below â€” one table `TIERS` in packages/shared/src/tier.ts (tierOf, TierStrip, Idol Database filter all read it). Colours tier-splusâ€¦tier-f in tokens.css: gold, coral, crimson, ice, steel, muted, navy (light text only on F).**

**ENGLISH UI (2026-11-15, router task 1): every UI text is English (semi-formal sports voice); news headlines + kickers stay Indonesian (StoryCard, lang="id"). Numbers/dates en-GB (5,583). Competitions "Division 1/2", settings view ?s=leagues (was liga), confirm words DELETE / DELETE ALL. /dev/* check pages left Indonesian. Scanner scripts were in the session scratchpad (not kept).**
**DESIGN PASS (2026-11-15, router task 2):** Engine Tuning unboxed (same numbered chapter as every Settings section), podium caption = small kicker (Season Honours stays the one headline), /story ordered by newsScore (lead = biggest story), Rating Manager: selection + bulk edit grouped under "Bulk edit Â· n selected", leftover labels (W/D/L, P column, Compare, Value). Settings e2e saves settings-season.png + settings-leagues.png in apps/web/test-results (git-ignored).

**HEAVY QUEUE (router "Redesign dan UI polish kompetisi", 2026-11-15) â€” BUILT, committed 9f97a04 (by the router), no preview yet.**
- Home: top = all-time #1 (`home/AllTimeTop.tsx`) = Career Stats "Semua" by titles via the shared engine `careerOrder(sort)`
  (CareerTable uses it too; `homeFacts.allTimeTop`, overview `.allTimeTop`). `home/HomeSeason.tsx` (was HomeActions) = season
  block + "Berita penting". Backgrounds = design/assets photos, stored SIDEWAYS (no EXIF) â†’ rotated â†’ `public/home/porch.webp`,
  `sky.webp`. Unzure champion cover moved to `dashboard/ChampionCover.tsx` (was home/HomeHero), top of Dashboard.
- News: engine `stats/seasonNews.ts` (rivalry â‰¥3 meetings, multi-title, title-milestone 5/10/15â€¦, slump = rating â‰¥85 losing 4+,
  unbeaten = no loss in a finished D1/D2 league) added by storyWorker; `stats/newsScore.ts` newsScore 0â€“100 (our numbers; titles
  by PRESTIGE) + topNews(n, one per kind) â†’ Home shows 4. /story order unchanged.
- Settings: `/studio/settings?s=season|leagues|branding|backup|data|danger`, side nav (strip on phones), one view at a time;
  Home "Buka Backup" + Welcome restore link open ?s=backup. e2e tests go to the view they need.

**UPDATE 4 â€” BUILT 2026-11-14, on preview 96975b81 (test alias), NOT deployed, NOT committed.** User list + decisions:
- Tebak Juara removed (FinalPredictions, predictionsWorker, dashboard card, e2e part). Old PREDICTION log rows stay hidden.
- MatchModal gallery: 3 RANDOM photos per idol (supersedes "all"); `PhotoLightbox` (packages/ui) = fixed 70vh frame,
  â€¹ â€º on the left/right middle (position never moves with the photo's shape), arrow keys, wraps. `GalleryThumb` shared.
- Idol Profile: tab "Galeri (n)" = all photos (components/idolProfile/ProfileGallery.tsx).
- Records: `rankLabel` = plain number ("3", ties show the same number); "#3 bersama" gone.
- League Overview (D1/D2 and The Idols): rank numbers over the top-5 cards removed.
- Rating Manager restyled (RatingCard = framed portrait, tier edge, gothic rating, oldâ†’new, tier slider; steps
  âˆ’5 âˆ’3 âˆ’1 +1 +3 +5; RatingActions = two editorial columns Preset / Dari hasil season). Theme text scale ends at
  text-3xl: text-4xl/5xl are NO-OPS (still used, pre-existing, in WallOfFame, TournamentMap, HomeLeaders, MatchHeader VS, WheelPicker).
- The Idols "Sync rating" (SyncTheIdols.tsx; db theIdols.ts theIdolsChanges/replaceTheIdols; Worker theIdolsChanges/
  syncTheIdols): re-pick the 20 by current rating, confirm shows in/out; ONLY before The Idols' first match (user).
- BACKUP FIXED (db backupSetup.ts + backupWrite importShape; test backupSections.test.ts covers every section Ã— mode Ã—
  fresh/played device): "Data dasar" is exported as Season 1 draft (league rosters only, no IDL, no opener);
  Replace = all seasons wiped, Season 1 draft + backup idols/ratings; Merge = add missing idols, rosters only into a
  draft without matches. Idols Replace = update by name+group, never delete. Roster = into the current draft season,
  refused (conflict message) when it is running. Season Replace = delete that season, re-insert with mapped idol ids.
  Merge of Season/Full drops an unplayed draft numbered â‰¤ the backup's seasons (a new device's Season 1).
  Before: base restored "Season 6 live" on a new device; idols/roster/season Replace failed (FK / foreign idol ids).
- Settings â†’ Danger Zone "Reset statistikâ€¦" (type RESET; snapshot first; db resetStatistics.ts): everything played +
  rating history + archived seasons go; idols keep CURRENT ratings (user), groups, photos, galleries, settings, branding,
  league rosters stay as Season 1 draft.

**LIGHT QUEUE (2026-11-15, router, NOT committed):** tokens.css `--color-border` now 40% alpha (+ studio-section rule 35%);
CompetitionCover compact (max-w-3xl, smaller name/logo/photo, 2-col stats); LeaguePanel stat "Rating rata-rata"
(competition/averageRating.ts + test; also The Idols); RatingCards: shared `Select` + new Group filter. e2e not run
(web build broken by the other session's Home work: HomeActions missing).

**GALLERY FEATURE â€” BUILT 2026-11-14, on preview 9a9a9686 (test alias), NOT deployed, NOT committed.** Main photo stays
fixed; the MatchModal shows ALL gallery photos of each idol (user: "semua, bisa scroll"), in a NEW random order every
time it opens (user), left/right on â‰¥lg (modal widens to max-w-6xl, strips 8rem, sticky, scroll down), stacked under
the header on phones (horizontal scroll). Click = lightbox (shared Modal, â€¹ â€º buttons + arrow keys, wraps).
Photos live in the app (OPFS), never fetched live. Code: db `idols.gallery` jsonb string[] (migration 0003),
`gallery.ts setGallery` (replaces, returns removed ids), `unusedPhotoIds` keeps gallery ids, `forgetPhotos` removes them
from galleries, backup Merge gives an existing idol without a gallery the backup's one; Worker `setGallery(idolId, blobs)`
(+ deleteIdol drops gallery photos); ui `MatchGallery.tsx` + `idolSource` (`gallery`, optional `galleryPhoto`,
`useGalleryPhoto`); web `IdolDataProvider` feeds them, Studio â†’ Input Data `GalleryImport.tsx` = "Pilih folder galeriâ€¦"
(webkitdirectory; subfolder "Name GROUP" matched by `matchName` from matchPhotos.ts; preview, replace per idol).
Tests: db gallery.test, ui MatchGallery.test, web groupByFolder.test. Stored per photo: orig + 1024/256/64 WebP (orig kept).
NEXT: user imports import/gallery on the preview (or after deploy) and checks; then "deploy". Bundle was already
188.8 KB before this (budget 180) â€” pre-existing, measured with the change stashed.
- Collecting now: one folder per idol in import/gallery/<Name GROUP>/ (282 folders; "/" and ":" in names â†’ "-"; README
  inside). The user also drops his own photos there. Files are 01.jpg, 02.jpg â€¦ (â‰¤1200 px JPEG).
- First 25 to fill (user list): Ahn Yujin, Danielle, Gawon, Ella Gross, Ian, Karina, Kim Chaewon (LE SSERAFIM, assumed),
  Kim Jiwoo, Kim Minji, Kyujin, Liz, Pham Hanni, Rei, Ryujin, Sullyoon, Winter, Jang Wonyoung, Yeji, Carmen, Haerin,
  Iroha, Haewon (user typed "Haewnon"), Umji, Juun, Sasha. ALL 25 DONE (249 photos, 38 MB): 7 from own IG, the rest
  from Pinterest search (Kim Chaewon 9, all others 10). Review sheet: import/gallery-sheet.jpg. Small ones (<600 px):
  Hanni 01. Identity less sure (Pinterest mixes members): Ian, Kim Jiwoo â€” user to check.
- RULE (user, 2026-11-14): CHECK FOR A PERSONAL IG BEFORE USING PINTEREST â€” search Instagram itself, never assume.
  Real = blue tick + millions of followers + followed by members/group (paid ticks with 40â€“160K and odd spelling are
  fans). Group-IG photos (concept photos etc.) are allowed too. Checked: personal IG = Yeji @yezyizhere, Ryujin
  @iamfinethankyouandryu, Ella @ellagross, Gawon @gawon, Umji @ummmmm_j.i (re-done from own IG, topped up to 10 with
  the largest old Pinterest picks; old Pinterest sets in import/old-gallery/). No personal IG: NewJeans 4, NMIXX 4,
  Hearts2Hearts 3, Iroha, Sasha. Group IGs are mostly reels/group shots and captions rarely name the member, so only
  Haewon got 2 labelled (#HAEWON) group-IG photos (11â€“12). The tagging collector (localStorage.__igtag, __tag) reads the
  caption too early â€” fix (wait for the caption to change) before relying on it.
- ALL IDOLS pass (2026-11-14, user: "fan IG accounts are fine, do every idol"): import/gallery now has 240 of 282 idols
  filled, 2,316 photos, 351 MB (mostly 10 each, Pinterest search "<name> <group>", picks by eye from the numbered grid).
  42 STILL EMPTY (list in import/empty-galleries.txt): Pinterest has nothing or mixes members â€” A2O LITE (9), QWER (4,
  the word "qwer" returns 0 pins), Loossemble (5), HEART OF WOMAN Ji Hyun/Liri/Liuyin, BILLIE Moon Sua/Siyoon/Suhyeon,
  tripleS Kwak Yeonji/Lee Jiwoo/Mayu/Nien/Xinyu, MÎ›DEIN MiU/Serina, RESCENE Minami/Zena, and Handong, Jiana, Nana,
  Pharita, Seunghee, Yeoreum, Yewon, Yihyun, Yoon Seeun, Yuha. Next for them: fan IG accounts (search IG by name).
  Identity was judged from small thumbnails: some sets may hold a wrong member (flagged: Beni, Dami, Gahyeon, Haseul 4,
  Kim Lip 5, Luda 5, Jieun 6, Jurin 5, Mia Hinano 2). The app stores orig + 3 sizes, so importing all may need ~1 GB of
  browser storage (estimate, not measured).
- FAN-IG pass (2026-11-14): +12 idols (QWER 4, A2O LITE Ayune/Himeki/Merci/Oa/Rada/Vora/Xili, Gowon) â†’ 252/282 filled,
  2,423 photos. 30 STILL EMPTY (import/empty-galleries.txt). Stopped: this session's context had become very costly;
  the user agreed to continue in a NEW session. Recipe that works (Claude in Chrome, user logged in to IG):
  1. https://www.instagram.com/explore/search/keyword/?q=<name>%20<group> ; read post links + caption from each grid
     link's img.alt; keep posts whose caption names this member and no other member (avoids wrong people).
  2. Navigate to each /p/<id>/ (6â€“7 posts); collect <img> with naturalWidth â‰¥ 1000 AND on-screen in the post area
     (rect.top < 900, width > 250) â€” without that filter the "more posts" thumbnails below leak in; click
     button[aria-label="Next"] up to 6Ã— for carousels; keep the list in localStorage (window vars die on navigation).
  3. Numbered overlay grid â†’ one screenshot (scale 0.6) â†’ pick by eye â†’ fetch + <a download> "<Name GROUP> NN.jpg".
  4. `node import/ig-tools/gallery.mjs` moves + resizes into import/gallery.
  IG pages' CSP sometimes blocks new Function(), so inline the code. "Young" (A2O LITE) is too generic to search.
  CHEAP MODE (user 2026-11-14): Tampermonkey userscript `import/ig-tools/sabung-ig.user.js` (the user installs it in
  Chrome). Per idol: `__ig.start("hina","qwer",["chodan","magenta","siyeon"])` (other members' names exclude posts) â†’
  it searches, visits up to 7 posts by itself and shows the grid (tab title "IG n ready"; `__ig.status()`) â†’ one
  screenshot at scale 0.4 â†’ `await __ig.save("Hina QWER",[..6 picks..])` â†’ `node import/ig-tools/gallery.mjs`.
  Target now 6 photos per idol; gallery.mjs resizes to â‰¤800 px, quality 82 (earlier photos stay â‰¤1200 px).
- Pinterest: the user allowed Automatic downloads for pinterest.com (2026-11-14). The collector text is kept in
  pinterest.com localStorage.__pinjs â†’ on a search page run `new Function(localStorage.__pinjs)(); await __pin(2)`,
  screenshot (pins 0â€“5 are ads/featured boards, the grid shows from 6), `await __dlMany([..], "Name GROUP", from=1)`.
- How (IG): inject the collector (window.__collect â†’ sessionStorage.__all), screenshot the numbered grid, pick, then
  reload and fetch the picks from sessionStorage with a 10 s timeout (fetching straight after the overlay froze the tab),
  save as "<Name GROUP> NN.jpg"; then `node import/ig-tools/gallery.mjs` moves + resizes them into import/gallery.
  Pinterest: window.__pin(2) collects i.pinimg.com pins (originals, fallback 736x); gallery.mjs also unpacks
  "pack <Name GROUP>.json" (name â†’ base64) if a page packs a set into one download.

**Older task: better default photos via the user's own Chrome (Pinterest, or any site).**
- 2026-11-14 progress: Claude in Chrome works (user logged in to IG). IVE 6/6 DONE from each member's own IG
  (for_everyoung10, _yujin_an, fallingin__fall, reinyourheart, liz.yeyo, eeseooes) â†’ import/ive-photos/ (old picks in
  import/old-photos/ive/), sheet import/ive-sheet.jpg. Next: tripleS / TUIDE / A2O LITE (40) â€” most have no personal IG.
- How: in the IG tab inject a small script (open the first ~6 posts in the modal, collect every <img> â‰¥1000 px wide,
  show a numbered grid overlay, screenshot, pick), save the pick with a blob <a download>. Chrome saves into
  Documents\SKRIPSII\sitasi dump (its last folder); move from there, resize with a sharp script (â‰¤1200 px, optional top
  crop). The user allowed Automatic downloads for instagram.com. Image URLs can't be read out (blocked) â€” not needed.
  Both scripts are saved in import/ig-tools/ (git-ignored): ig.js = paste its text into javascript_tool on a profile page,
  then `__collect(6,4)` â†’ `__wait()` â†’ screenshot â†’ `__dl(n, "Name GROUP.jpg")`; if the grid is empty, the page had not
  loaded yet â€” run `__collect` again. finish.mjs = `node finish.mjs <rawDir> <outDir> <sheet.jpg> [crops.json]`.
- The user asked: the photos found so far are "kurang menarik"; search Pinterest / Instagram / X, pick the most popular
  and best-looking ones (good for "adu visual"). Rule: never kprofiles; face fully visible, no glasses, masks, hands or
  props over it; this is the default base photo only.
- Scope first: 6 IVE + the 40 new idols (tripleS 24, TUIDE 7, A2O LITE 9). Later the 242 default idols.
- Blocked on: Claude in Chrome was not connected. The user must install the extension
  (https://chromewebstore.google.com/detail/fcoeoabgfenejglbffodgkkbkcdhcgfn), sign in with the same account, and log in
  to Pinterest in that Chrome. Then: tabs_context_mcp â†’ new tab â†’ search pins per idol â†’ choose by saves + looks.
- Tried and failed: the in-app browser pane renders Pinterest blank (React hydration error); calling Pinterest's internal
  /resource/ API was denied by the auto-mode classifier â€” do not try that again. Instagram login page did load in the
  pane (fallback). X/Instagram/Pinterest all need the user's login; the user types passwords, never Claude.
- Tools: tools/photos (README) builds numbered contact sheets and saves picks as "Name GROUP.jpg" (JPEG â‰¤ 1200 px).

**Files waiting in import/ (git-ignored, only on this PC) â€” the user imports them in Studio â†’ Input Data:**
- new-idols-paste.txt â†’ "Tambah idol â†’ Paste" (40 new idols; rating empty = 75).
- idol-details.json (242 default idols: birthday, nationality, role) and new-idols-details.json (40 new) â†’
  "Perbarui data idol". (Or put a details file into "Tambah idol â†’ File": duplicates offer "Perbarui lahir & negara".)
- ive-photos/ (6) + new-photos/{tripleS,TUIDE,A2O LITE}/ (40) â†’ Photo Import; current picks are Commons / K-pop Wiki
  concept photos, all checked by eye, 46/46 sure filename matches â€” the user wants better ones (task above).
- The user once put idol-details.json into "Tambah idol" by mistake (all refused as duplicates); explained, fixed with
  the update button. The user only needs birthday + nationality for the 242 (role came along in the same file).

## Status (2026-11-14)

| Phase | State |
| --- | --- |
| Fase 0 Engine & data core | done, gate passed |
| Fase 1 Design system & shell | done, gate passed |
| Fase 2 Studio | done, gate passed (240 idols + photos in 30.5 s; backup â†’ restore elsewhere = identical checksums) |
| Fase 3 Play | done, gate passed, approved 2026-11-13 |
| Fase 4 Wiki | done, gate passed, approved 2026-11-13 |
| Fase 5 Backend | done, gate passed, approved 2026-11-13 â€” all PRD Â§15 phases done |
| Fase 6 + Redesign + Update 2 | done, deployed |
| Update 3 (V1â€“V6) | done, deployed 2026-11-14 (01ce8996); open: better default photos (see RESUME HERE) |

### Fase 3 plan (approved) â€” gate: 3 seasons in a row, no integrity errors, no duplicate matches

1. âœ… `960aaa3` Engine replay + Settings in the engine
2. âœ… `6692f2d` Season lifecycle (start, play in chunks, pause) + integrity check
3. âœ… `c3ac2cf` Sabung Idol simulator page (`/play`) â€” The Idols roster fixed at season start
4. âœ… `d9e74b9` League panels (`/play/d1`, `/play/d2`, `/play/the-idols`)
5. âœ… `2c162d5` Cup panels (Unzure road, Inkigayo, Nugu, B-Side, Daesang, Music Bank)
6. âœ… MatchModal live: league fixture "Main", cup bracket and Unzure knockout clicks open
   `components/play/PlayMatchDialog` â†’ MatchModal (Simulate = the engine's own games for that match /
   Manual = click the winner of each game in order / Wheel) â†’ "Accept Result" â†’ Worker `acceptMatch`
   checks the games end the series exactly, saves with its method; the replay reuses it. Only open
   (pending) matches; editing an already played result is not built (`playSeason` stale clean-up is ready).
7. âœ… Season close (user 2026-11-13: cup points by round out, ties share the average; draws = half a win;
   progression OPTIONAL, not required before a new season): engine season/seasonClose.ts (PRESTIGE, seasonPoints,
   promotionPlan, seasonProgression from the ratings stored in the matches = rerun gives the same), db ratings.ts
   applyRatings (1 tx + rating_history) + archiveSeason, web data/seasonClose.ts, components/play/SeasonClose.
   Was: Season close: archive guard (Blocker naming unfinished competitions), Rating Progression PRD Â§6.2â€“6.3
   (preview â†’ save into rating_history), promotion/relegation (D1 18â€“20 â†” D2 1â€“3, preview), "Start New
   Season" (new draft season N+1), auto-snapshot before.
8. âœ… Rating Manager + Engine Lab (`/studio/ratings`): draft (nothing saved before Save Now), steps for
   Revert, Discard, diff old â†’ new, confirm on all three; `components/ratingManager/` ratingPresets (Seed,
   Realistic Variety Î¼72 Ïƒ9 in rating order, Reset 75), RatingTable (scope, search, select, Set/Add bulk),
   RatingActions, EngineLab (per game + per BoN odds, 100/1,000 sims, score histogram); Worker
   `data/ratingSources.ts` lastSeasonProgression (Â§6.4) + careerSync Replace/Blend (Â§6.5, 0.85^age, â†’ 45â€“98);
   saves through db applyRatings source "manager".
   FIX found by its e2e: saving ratings reseeded finished cups in the replay â†’ `seasonInput` now gives an
   idol who already played this season the rating stored with those matches (ratings fixed within a season).
9. âœ… Carry-overs: early clicks/Ctrl+K are queued by an inline script and replayed after hydration
   (`components/shell/earlyInput.ts`, `<html data-hydrated>`; e2e earlyInput holds the JS back to prove it;
   the e2e retry loops are gone); slow IndexedDB storage â†’ pinned warning W-STORAGE-002 at start-up
   (startNotifications; Playwright Chromium always has OPFS, so not e2e'd). Measured (Lighthouse,
   prod build): mobile slow-4G perf 95â€“98, LCP 2.5â€“2.7 s; PRD's own mid-4G profile LCP 1.7â€“1.9 s (< 2.0, now
   checked by scripts/lighthouse.mjs 'mid4g'); CLS 0.083 on / and /wiki/career = the late 'penyimpanan permanen'
   warning (< 0.1 'good', PRD sets no CLS target). Safari: storageChoice sends Safari/WebKit to IndexedDB
   (PGlite opfs-ahp needs more sync handles than Safari allows; first query failed). Playwright WebKit on
   Windows can't run the app (its OPFS has no file operations â†’ photos fail), so no WebKit project: test
   real Safari on a Mac/iPhone. React hydration mismatch only on /dev/worker in WebKit (check page).
10. âœ… GATE e2e `fase3Gate`: 3 seasons in a row through the app (start, whole season, save progression,
   Start New Season), each exactly 5,590 matches, integrity clean â€” 31.8 s. Full e2e 34/34.

### Fase 4 plan (APPROVED 2026-11-13; Podium 100, +4 proposed badges, Dashboard fixed order) â€” gate: "Rebuild Stats" = cache, identical, on 20 synthetic seasons

User rule (2026-11-13): anything complicated or hard to integrate (esp. cross-browser) â†’ skip it and say so.
1. âœ… Stats foundation (engine season/placements.ts seasonPlacements â€” also feeds seasonPoints; stats/careerStats.ts
   foldSeason/careerRows; season/synthetic.ts syntheticSeasons; db stats.ts replacePlacements/readCache/writeCache;
   web data/careerWorker.ts updateCareerCache/careerStats/rebuildStats; Settings â†’ Data "Rebuild Stats").
   GATE TEST careerWorker.test.ts: 20 synthetic seasons, cache = rebuild, placements identical (35 s). Placements
   are written when a whole season is finished (not per competition); the live season is added on read.
   Was: Stats foundation: `placements` written per finished competition (Â§7.2, reuses seasonClose bracket places),
   career stats Â§7.1 per idol Ã— competition + Combined into `stats_cache`, "Rebuild Stats" in Settings â†’ Data,
   a headless 20-season synthetic generator (promotion + progression) for tests; the GATE test built here first.
2. âœ… Records engine: engine stats/records.ts (RECORD_CATEGORIES, rankRecords competition ranking, allTimeRecords
   minMatches + include scope, rankLabel), stats/matchRecords.ts (pairs = H2H per pair, top-100 upsets), fold got
   reverseSweeps/finals/invincibleSeasons/bestLeagueSeasonPoints; cache {seasons, state, records}; careerStats returns
   {rows, pairs, upsets}. Not tracked: "first season reached" tie step, season-range scope.
   Was: Records engine Â§7.3 (pure): competition ranking 1, 2, T3, T3, 5; fixed global rank; min matches 50; scope
   filters; deterministic tie-breaks; all categories.
3. âœ… Achievements: engine stats/achievements.ts seasonAchievements (title runs, Invincible, Grand Slam, Dual
   Crown, Idol of The Season by Â§6.2 score, milestones once, Rookie, Trainee to Star, Giant Killer = careerLine
   giantKills); names in shared/badges.ts BADGES; db replaceAchievements/listAchievements; folded per finished
   season in careerWorker (cache has achievements state); /play close section shows "Badge baru season ini"
   (no popup); no evidence match id stored. Gate test also checks badges = rebuild.
   Was: Achievements Â§7.4: badges computed when a competition finishes, stored with proof match, celebration popup.
4. âœ… Idol Profile `/wiki/idols/$id` (components/idolProfile/*; shared wiki pieces in components/wiki: MatchLog = paged
   list via Worker matchPage (db matchQuery.ts queryMatches cursor on id + countMatchesWhere), IdolLink, careerColumns,
   compLabel; Worker data/wikiWorker.ts: wikiStats = careerStats memoised on (match count, season statuses),
   idolProfile, rivalsOf). Wiki queries use staleTime 0 (app default is âˆž). Not built: edit / change photo / toggle
   active buttons (Input Data + Inactive Manager do that), form, group logo. E2E wiki.e2e.ts plays one season once.
5. âœ… Career Stats `/wiki/career` (components/careerStats: CareerTable = Worker careerTable(comp) + VirtualTable, sticky
   photo+name, sort select, CSV via careerCsv; ColumnPicker; scope = Status/Group/Liga reusing idolDatabase
   filterIdols + exported Select). Not built: season-range scope (cache keeps career totals only), click-to-sort headers.
6. âœ… Head to Head `/wiki/h2h?a=&b=` (components/h2h: H2HCompare, TopRivalries; Worker headToHead + seasonList). Streak
   shown = each idol's career best win streak (no pair-only streak). Match log filters: competition, season.
7. âœ… Hall of Champions `/wiki/champions` (components/champions: WallOfFame = IdolCards with NÃ— most titles first,
   ChampionList; Worker champions = placements rank 1 + rank 2 + FN match score). Tabs skip Swiss/LCQ (no titles).
8. âœ… All-time Records `/wiki/records` (components/records/RecordCard top 10 + "Lihat semua"; Worker records(minMatches)
   = allTimeRecords + upsets + H2H meetings ranked by rankRecords). Name search hides rows, rank stays; min matches
   select. Not built: scope filters on this page (Career Stats has them).
9. âœ… Match Database `/wiki/matches` (reuses components/wiki/MatchLog; filters season, competition, stage, idol, result â€”
   Menang/Kalah only with an idol â€”, order by id = season/competition/stage, Reset Filters). "Newest" = id order, not
   play time.
10. âœ… Season Archive `/wiki/seasons` (Worker data/archiveWorker.ts replays the season: titles â†’ SeasonHonours, 13 final
   tables â†’ competition/LeagueStandings without form/trend, cup top 4 from placements, promotionPlan, db
   listSeasonRatingChanges). Not built: Swiss grid, Unzure groups and cup BRACKETS in the archive (the panels only read
   the current season; reworking them per season = big), season story inside the archive (own page).
11. âœ… Season Story `/story` (engine stats/seasonStory.ts: first titles (hidden in the first season), top-5 upsets, reverse
   sweeps, top-3 streaks, Idol of the Month per MD 1â€“10/11â€“20/21â€“30/31â€“38 by league wins; components/story/StoryCard
   templates; links â†’ the pair's H2H) + Girl Group Stats `/wiki/groups` (components/groups/groupStats; click a group â†’
   member grid). Not built: "records broken" and "dramatic promotion" stories, group logo / own group route.
12. âœ… Dashboard `/dashboard` (fixed card grid: components/dashboard DashboardCard, CompetitionProgress, RatingHistogram;
   reuses groupStats) + Home cinematic `/` (components/home HomeHero = last Unzure champion, HomeActions = continue %,
   next match, latest story card; OnThisDay = same matchday LG round in earlier seasons, biggest upsets first; On Fire =
   current win streak â‰¥ 5; last backup line). Worker data/overviewWorker.ts; db MatchFilter got `round`. Welcome stays
   only for Season 1 draft. Not built: "records just broken" card, form table (On Fire instead), carousel animation.
13. âœ… GATE PASSED 2026-11-13: careerWorker.test.ts â€” 20 synthetic seasons, cache = Rebuild Stats (rows, placements,
   badges identical), and every wiki read timed on that data (Node + in-memory PGlite, ms): career 44, profile 123,
   H2H 27, champions 175, records 465, match page 12 / 5, archive 277, story 364, home/dashboard 225 (asserted < 3 s).
   Browser on OPFS will be slower; not measured in a real browser with 20 seasons.

### Fase 5 plan (started 2026-11-13; user: email + password login only, Supabase + Cloudflare accounts exist) â€” gate: a cloud backup from device A restored on device B; the app works 100% offline without login

1. âœ… `46e5328` PWA: `public/manifest.webmanifest` + `icon.svg`, Workbox `scripts/serviceWorker.mjs` after `vite build`
   (precaches all 84 files / 20.7 MB incl. PGlite WASM; every route â†’ `index.html`), registered in `__root.tsx` only in
   the production build. e2e `offline.e2e.ts` (own preview server on 5181): open once online, then offline a deep link
   loads and the database answers. No skipWaiting (shortcut: new version after all tabs close). Icon is SVG only (no PNG
   apple-touch-icon yet).
2. âœ… `20d48f3` `apps/api` Cloudflare Worker: Better Auth (email + password) + Drizzle on Supabase Postgres (postgres.js,
   pooler port 6543, one client per request), tables user/session/account/verification/cloud_backup, RLS on with no
   policies (0001_rls.sql), .sabung files in the private Supabase Storage bucket `backups` (service key, server only).
   Routes `/api/auth/*`, `/api/backups` GET/POST(?name=â€¦sabung, â‰¤ 90 MB), `/api/backups/:id` GET/DELETE, each filtered on
   the session user. Test `app.test.ts` on PGlite: 2 users, 401, wrong name 400, download = same bytes, other user 404,
   delete, RLS on all 5 tables. The SPA shell is now `index.html` (vite.config `prerender.outputPath: "/index"`) so
   Cloudflare's single-page-application fallback works. `wrangler deploy --dry-run`: 422 KB gzip.
3. âœ… `a6545e4` Settings â†’ Backup â†’ Cloud (`components/settings/CloudBackup.tsx`, `data/cloudApi.ts`): login / sign up,
   "Backup ke cloud" (full .sabung), list, "Pulihkanâ€¦" opens the usual ImportDialog with the downloaded file (new
   `file` prop: no picker), "Hapus" with ConfirmDialog. Offline/no API: "Cloud tidak bisa dihubungi", nothing else
   breaks. Dev: vite proxies `/api` â†’ `wrangler dev` on 8787.
4. âœ… `be24d0a` Supabase project `sabung-idol` (ref `wulhgztfikmtzlfiuxpf`, region ap-south-1 Mumbai, free plan). Pooler
   host is `aws-1-ap-south-1.pooler.supabase.com:6543`, user `postgres.wulhgztfikmtzlfiuxpf`. `pnpm --filter @sabung/api setup`
   applied both migrations (5 tables, RLS on) and created the private bucket `backups`; anonymous REST â†’ 401.
   `apps/api/.dev.vars` holds DB_HOST/DB_USER/DB_PASSWORD (helpers, user-friendly) + SUPABASE_DB_URL (built from them,
   password URL-encoded) + SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (legacy JWT) + BETTER_AUTH_SECRET.
5. âœ… Deployed: **https://sabung-idol.sabung-api.workers.dev** (`pnpm --filter @sabung/web build` then
   `pnpm --filter @sabung/api exec wrangler deploy`). Secrets: `npx.cmd wrangler secret bulk .dev.vars` in apps/api (run by
   the user; the auto-mode check refuses Claude moving keys). Free plan: sign-up was NOT blocked by the CPU limit.
6. âœ… GATE PASSED 2026-11-13: `cloud.e2e.ts` (device A sign up â†’ "Backup ke cloud" â†’ device B log in â†’ "Pulihkanâ€¦" â†’
   Replace â†’ identical table checksums â†’ delete) on wrangler dev (1.2 min) AND on the deployed URL (4.3 min);
   `offline.e2e.ts` on the preview build AND on the deployed URL (`OFFLINE_URL=â€¦`). Each run leaves one
   `gate-<time>@example.com` user in Supabase (backup deleted, user not).

Deferred on purpose: Home cinematic, Rebuild Stats, achievements, stats pages â†’ Fase 4 (PRD Â§15).

### Fase 6 plan (APPROVED 2026-11-13, post-PRD updates) â€” each step: tests, preview upload, user says "deploy"

User decisions: Daesang + Music Bank = OPENER of season N+1 with season N's champions (Season 1 has none);
Perennial Podium = 100 (already in code). NOT wanted: seeded seasons, undo matchday, Safari/browser-specific
work, any speed fix that makes the app or database heavier (so no memfs2opfs = whole db in memory).
A big layout/theme redesign of almost every page comes AFTER this plan, from user references.
1. âœ… Branding per D1 league: Settings rows D1Aâ€“D1F + the other cups (no D1/D2 rows); `components/play/competitionLinks` brandOf/labelOf (D2X = D1X logo/colour, "{name} Â· Divisi 2"), `data/branding.ts` useBranding = every screen that names a competition, `components/CompetitionLogo`; league tabs + heading show logo/name; createDraftSeason copies the last season's branding.
2. âœ… Roster cards (logo/name/colour) + `components/settings/rosterProblems` = every problem of the 12 leagues in ONE list outside the popup (size, twice, in two leagues, inactive). LeagueRosterModal got `title`/`logo` props.
3. âœ… `components/competition/MatchRow` (an open match IS the button, name "Main A vs B") + `MatchList` (rounds) in league fixtures and under every Swiss group, LCQ group and Unzure group table; brackets were already clickable.
4. âœ… MatchModal: preset scores (every valid BoN score), Manual = set the score directly (+/âˆ’), more content
   (big photos, rating + win chance, H2H, last-5 form, season record). Direct scores: games alternate, winner
   takes the last game (no fake reverse sweep).
5. âœ… Wheel picker: physical wheel, 12â€“16 alternating segments, ticking pointer, ease-out; Spin all = one spin per
   game with a pause (Bo3 â‰¤ 3, Bo5 â‰¤ 5â€¦).
6. âœ… (with step 3) Every match playable one by one: IDL LG/UB/LB/FN, SWS, LCQ, UZC groups + KO, INK, NUG, B-Side, DSG, MBK.
7. âœ… Daesang + Music Bank = opener: engine `season/gala.ts` openerPairs (at Start New Season â†’ `config.opener`, zod `Opener`) + playOpener before the league phase (pending opener never holds up the leagues; done needs it). Season 1: status "none" (not a close blocker). Season 1 = 5,583 matches, later 5,590. "Sampai fase berikutnya" plays the opener first.
8. âœ… Small bugs: Engine Tuning table scrolls, notices show names (`withNames` in usePlaySeason), clash notice in Indonesian. NOT done: floating the storage warning (it covered buttons; CLS 0.083 is already "good").
9. (partly âœ… 2026-11-14: profile edit buttons = idolProfile/ProfileEdit (updateIdol, replacePhoto; rating stays in Rating Manager);
   archive brackets/Swiss/groups = archive/ArchiveBrackets via cupView(comps, seasonId); stories points-record + late-promotion =
   engine stats/seasonDrama (+test), storyWorker best from db leagueTotals. Then âœ…: photo focal point (db setPhotoFocal, listIdols focalX/Y,
   IdolPhoto objectPosition, idolProfile/PhotoFocal), group page /wiki/group/$id + logo (db setGroupLogo, listGroups logoId).
   Still open: Career Stats season range (cache keeps career totals only).) Skipped features: archive brackets/Swiss/groups, Career Stats season range, group logo + group page, edit
   buttons on profile, "records broken" + "dramatic promotion" stories, photo focal point.
10. (partly âœ…: Trophy cabinet = idolProfile/TrophyCabinet; Rivalry label = h2h/rivalryLabel (+test) in H2H and profile Rivals.
    Then âœ…: Season Recap = archive/recapCard drawRecap (canvas 1080Ã—1350) + RecapButton on Season Archive; final predictions =
    data/predictionsWorker (event_log code PREDICTION, latest pick per match; hidden from notices) + play/FinalPredictions on cup
    panels + Dashboard accuracy.) PRD Â§16: Season Recap card 1080Ã—1350, Rivalry label, light theme, final predictions, retirement & debut,
    transfer window (propose rules first) + Trophy cabinet on the idol profile.
11. âœ… (2026-11-14) Measured: engine replay of a full season 15â€“25 ms; db listSeasonMatches ~145 ms (the biggest cost, 2Ã— per
    panel, 12Ã— on Season Progression). Fix: data/seasonMatches = cached read keyed by db seasonMatchStamp (count + latest
    played_at), max 2 seasons kept; every reader uses it except playSeason (extends its own copy). Bundle: 23 MB = PGlite wasm 9 MB +
    data 6 MB (needed) + default idols.json 4 MB (kept: offline first install); app JS 360 KB + worker 810 KB â€” left as is.
    Swiss / LCQ through-out âœ… (engine foldSeason, own line only; career cache key career-v2). Season range DROPPED by the user.
    Lighter + faster without growing the app or the db: measure first (bundle, start-up, page reads), fix the biggest.
User 2026-11-13 (later): retirement & debut and transfer window DROPPED. Final predictions stay.

### Redesign plan (APPROVED 2026-11-13) â€” brief: design/NOTES.md "penjelasanâ€¦" row
R1 âœ… Foundation: strong sans (proposal: Archivo variable = body + wide/condensed headlines from one file; a
   blackletter accent only for ornamental numbers), no outlines/boxes (fills, glow, single lines), freer use of the
   palette on dark, inline-SVG grain/halftone/torn edges + gothic ornaments, shared components restyled.
   Built: theme.css = Archivo variable (wdth) + UnifrakturMaguntia (`font-gothic`, ornaments only) + Geist Mono; tokens.css base =
   crimson/navy glows on black, fixed SVG grain overlay, h1/h2/.font-display wide 800 caps; components = `.tag` `.kicker`
   `.outline-text` `.corner-marks` `.torn` `.panel`. Button = fills (no outline), caps. Modal = top crimson line + shadow.
   IdolCard = frameless, torn photo, blackletter rating + tier chip, group-colour glow. Script removed every boxed
   outline (58 files): fields = underline on a fill, cards = `.panel`, chips = fills. Only text sizes xsâ€¦3xl exist.
R2 âœ… Home, Sabung Idol, competition panels: `components/competition/CompetitionCover` (tag, issue line, huge name + giant
   outline word, stats with colour lines, leader/champion torn photo) on every league and cup panel + Unzure; league Overview =
   top-5 IdolCards with blackletter ranks. HomeHero = cover with giant UNZURE outline, vertical label, Issue NÂº tag; Home
   progress number huge; On Fire = torn photo strip. /play header with giant blackletter season number; timeline phases 01â€“03
   with lines, no panels.
R3 Wiki pages. R4 Studio pages. Then steps 9â€“11 in the new style (light theme dropped: the brief keeps it dark).

### Update 2 plan (APPROVED 2026-11-13) â€” refs: design/NOTES.md "Update 2"; replaces R3, R4 stays after
U1 âœ… Sim controls: PlayTarget `comps` takes an optional `round` ("R1" = every group's "A-R1"â€¦; data/seasonRunner `allows` + test).
   /play "Main matchday N semua liga"; Unzure "Main Swiss R1" (all groups) / "Main sampai akhir {fase}" / juara; B-Side
   "Ronde X di semua cup" + "Semua cup sampai selesai". League panels already had matchday / end of league.
U2 âœ… data/bracketSkeleton (engine templates â†’ every slot from the start, id "" = blank, cells sorted in template order;
   a match is OPEN when it has no score: group draws have no winner). TournamentBracketTree = photos, score per side,
   connectors, round names. SwissPlayInBracket = 5 rounds Ã— record buckets with blanks + clickable open (prop open[round]).
   components/competition GroupStage (group tabs, table beside schedule), GroupTable with photos, GalaStage (DSG/MBK),
   Nugu rounds with more than 8 matches = MatchList, bracket from R16.
U3 âœ… data/homeFacts (leaders + facts, pure + test) via overview (leaders, facts, totals; next/reigning/onFire removed).
   Home = HomeNumbers / HomeFact / HomeLeaders. Dashboard = header, dashboard/D1Board (6 D1 tabs, LineRace title race +
   zone table), dashboard/TournamentMap (static order + formats), loose CSS columns of DashboardCard (no box).
U4 âœ… /wiki/progression: progression/RaceGrid (6 races), Bump (positions), progress bars, TitleShare. charts/LineRace +
   charts/titleRace (pointsByMatchday + test) are shared.
U5 âœ… Groups: groupStats(+byComp, record) + GroupEntry list; worker titlesByComp. Career: careerColumns columnsFor(comp)
   (no titles for SWS/LCQ; UZC group exit/advance), ColumnPicker per tab, Podium. Profile: ProfileHero dossier with picker,
   CareerScope; /wiki/profile = top-rated idol. H2H: tale of the tape (games, last 5 from headToHead). Champions: per
   season, many-champion comps grouped; champions() returns third. NOT done: Swiss/LCQ "lolos/gugur" career counts
   (no placements for SWS/LCQ; would change the engine stats + golden snapshots).
U6 âœ… components/PageHeader on Studio + remaining wiki pages + Story. R4 âœ… (2026-11-14): tokens.css .studio-flow/.studio-section
   (numbered chapter: crimson rule, blackletter 01â€¦, big h2) = settings SECTION + Input Data + Rating Manager sections. Nav: Idol Profile, Season Progression.

Production (2026-11-14): version 01ce8996 = Update 3 V1â€“V6 + import fixes.

### Update 3 plan (APPROVED 2026-11-14) â€” doc "Beberapa update dan perubahan 2.docx" (12 pictures, not in git)
V1 âœ… engine season/types pendingBatch: a round (bracket), a Swiss round of all groups, and EVERY group matchday are played or
   listed pending together (was: the first pending match stopped the track, so panels showed 1 match at a time). SeasonResult
   .entrants = each bracket cup's seeds â†’ bracketSkeleton fills seeded slots early. WheelPicker spin has its own timer (the
   "Spin all" pause clean-up cancelled it: stuck after one spin). Bracket: final/GF in its own column at the right (big,
   gold), 3RD under it; double-elim round names (Ronde 1, Final upper, Lower ronde N, Final lower). CupPanel champions above
   the play buttons; IdolCard glow smaller. The Idols playoff = "Playoff" tab of LeaguePanel; D1/D2 "Simulate semua liga".
V2 âœ… MatchHeader theme {accent token, kicker, grandFinal} (PlayMatchDialog ACCENT map; leagues/B-Side use league branding colour):
   tilted big photos, faded blackletter competition word, gothic VS, gold + trophies for F/GF/Daesang. LiveMatchVisualizer:
   tug-of-war per game, "Game N berlangsung" (never the total), Match point, winner line. WheelPicker: rim bulbs blink,
   gold pointer/hub, spin winner photo lights up, big score. e2e cupPanels checks no spoiler + Spin all to the end.
V3 âœ… tokens.css .photo-frame (crimsonâ†’gold passe-partout) replaces .torn everywhere; tier colours S gold, A red, B violet,
   C teal, D navy; WallOfFame count = gold blackletter number above the card; engine rankLabel "#3 bersama" (was T3);
   StoryCard = newspaper (lead story big, coloured rule per kind, framed photo, no crimson blocks); /wiki/progression
   chapter 03 = Bump codes={["IDL"]} (Bump takes codes); engine seasonScores + seasonTop â†’ honours podium = season top 3
   (seasonOverview / archive .seasonTop, uzcThird gone); components/TierStrip (Rating Manager + Idol Database);
   ratingManager/RatingList + RatingRow (rows since 2026-11-15) (slider commits on release, number field, Â±5, quick values, record, titles).
V4 âœ… /wiki/groups = Tabs "Peringkat" (GroupEntry now shows the group logo) + "Semua grup" (groups/AllGroups: every group,
   logo, members, link; form "Tambah grup" with optional logo â†’ db addGroup (+test) / worker addGroup). /wiki/group/$id
   works for a group without members. H2H TopRivalries: the whole row is one link. Backup section "base" (shared
   SECTION_LABELS, db SECTION_TABLES): groups, photos, idols, + the current season's seasons/competitions/entries, no
   matches (+test). Replace with it on a database that has matches fails and rolls back (FKs, same as the Idol section).
V5 âœ… (golden snapshot updated twice: intended engine changes)
   - Re-roll: SeasonInput.salt {matchId: n} â†’ matchRng(seed, id, salt). data/singleMatch simulateMatch(id, salt) (worker);
     PlayMatchDialog simulate = a random salt per press; MatchModal simulate is async + "Simulate ulang". matchPreview
     no longer carries games. Bulk "Main â€¦" buttons stay on the season seed.
   - Momentum (series.ts): the side behind gets +3% per game behind (max 6%). PRD Â§5.10 check now on games with nobody
     behind (still 64%); more Bo5 go to 5 games.
   - Upset cups (matchPlayer): NUG / BS* use scale Ã—1.4, sigma Ã—1.5, and fatigue âˆ’0.75 per big-cup match this season
     (SWS, LCQ, UZC, INK, IDL playoff â€” not the IDL league), at most âˆ’6. Measured over 10 seasons: a 10+ favourite lost
     20.0% â†’ 26.8% (upsetCups.test). Form already counted every competition (last 5, Â±3/âˆ’2).
   - Progression (seasonClose): PRESTIGE UZC/SWS/LCQ 1, IDL .9, D1 .8, INK .7, NUG .6, BS .5, DSG .4, MBK .35, D2 .25
     ("Crown Cup" = Inkigayo). Gain = performance (Â±6) + titles 3 Ã— prestige (â‰¤ 5) + giant kills 0.5 (â‰¤ 2) Â± 2 promotion,
     SUPERSEDED 2026-11-15: season delta = sum of expectation parts (season/expectation.ts: per competition group, value vs a rating fit; record; giants; Â±1 move), gains Ã— gainFactor (55â†’2.5, 65â†’2, 72â†’1.4, 80â†’1, 86â†’0.5, 90â†’0.3, 95â†’0.12, 100â†’0.04), losses in full with the part past âˆ’2 Ã— up to 1.5 for 80+, floor âˆ’12. Locked by progressionShape.test + expectation.test. The >92 regression is gone. Reason string says
     the factor. seasonScores/seasonTop unchanged in shape.
V6 âœ… part 1 (user: web data OVERWRITES; new idols: user sends a list; photos: test with IVE first)
   - idols.role (migration 0002_idol_role, nullable text; shared idolInputSchema role optional, max 80). updateIdol only
     sets role when given. Profile: edit form field + shown in the hero facts.
   - db updateIdolDetails(rows, dryRun) (+test): match name + group (case-insensitive), overwrite birthday / nationality
     / role that the row gives; returns { updated, unknown }. Worker updateIdolDetails. Input Data section
     inputData/IdolDetailsImport (JSON file â†’ preview â†’ Terapkan), e2e idolDetails.
   - seed/idol-details.json: all 242 default idols (birthday, ISO nationality, kprofiles position; 23 without official
     position have no role), applied by loadDefaultData on a fresh install (+ seedData test). Same file is
     import/idol-details.json for the user's existing database. Sources: kprofiles.com member profiles (2026-11-14),
     Jini's birthday checked on Wikipedia (2004-04-16).
   - import/ (git-ignored): ive-photos/ (6 kprofiles photos named as in the database, for Photo Import),
     ive-details.json, idol-details.json.

## Architecture in one picture

```
page (React, apps/web/src/pages) â”€â”€Comlinkâ”€â”€â–¶ Worker (apps/web/src/data/worker.ts)
   â”‚ TanStack Query (IDOLS_QUERY, SEASON_QUERY)          â”œâ”€ @sabung/db   (Drizzle + PGlite on OPFS)
   â”‚ IdolDataProvider feeds @sabung/ui components       â”œâ”€ @sabung/engine (pure season simulation)
   â”” engine() from data/engineClient.ts                 â””â”€ OPFS files: photos, snapshots, marker files
```

- Monorepo: pnpm workspaces + Turborepo. `apps/web` (TanStack Start SPA, routes in `src/pages`),
  `packages/ui` (design system + Storybook), `packages/engine`, `packages/db`, `packages/shared`.
- **One OPFS database per Worker**; `engine(name)` makes the Worker, which reads its database name from
  `self.name`. Main database name: `sabung-idol` (`MAIN_DATABASE`).
- Every database call goes through `worker.ts` (the API object; ~180 lines). Pages never touch PGlite.
- Packages are `sideEffects: false`; never import a value from `@sabung/db` into a page (it would pull
  PGlite into the main bundle) â€” type imports are fine; shared constants live in `@sabung/shared`.

## Where things live

### packages/shared (pure, used everywhere)
- `competitions.ts` codes (D1Aâ€“F, D2Aâ€“F, IDL, SWS, LCQ, UZC, INK, NUG, BSAâ€“F, DSG, MBK) Â· `stages.ts` Â·
  `matchId.ts` (`buildMatchId`, `classifyMatch` â€” ids are deterministic: `S01-D1A-LG-MD01-M01`).
- `bestOf.ts` PRD default BoN Â· `seasonConfig.ts` Settings model: competitions on/off + dependencies,
  BoN per stage, Engine Tuning (+ `TUNING_PRESETS`), `seasonBestOf`, `competitionKeyOf`.
- `idolSchema.ts` (Zod), `idolRules.ts` (duplicate rules), `idolBatch.ts` (paste/CSV/JSON â†’ preview),
  `tier.ts`, `backupSections.ts`, `ulid.ts`.

### packages/engine (pure, no I/O)
- `series.ts`/`probability.ts`/`form.ts`/`rng.ts` one match; `standings.ts` tables + tie-breaks;
  `roundRobin`, `swiss*`, `groupDraw`, `knockout*`, `doubleElimination`, `nuguPlan`, `bracket.ts`.
- `season/runSeason.ts` the whole season: league phase â†’ interleaved cups â†’ Gala Night.
  **Replay model (Fase 3):** input `saved` results are reused (same pairing), a match not saved is only
  played if `input.target(match)` allows it, otherwise it is *pending*. League matches can be pending
  and the league goes on (fixtures don't depend on results); a cup stops at its first pending match
  (throws `PENDING`, caught per track in `interleave.ts`) while other cups continue; the gala waits.
  Result: `matches, titles, pending (what can be played next), stale (saved but no longer happening),
  draws (Swiss/LCQ groups, Unzure pots and groups), done`.
- `season/matchPlayer.ts` replay logic; `leaguePhase.ts` (`pickTheIdols`; uses `input.theIdols` if
  given); `unzurePath.ts`, `cups.ts` (B-Side reports each cup separately), `gala.ts`, `splitLeagues.ts`
  (Data Maker: top 120 â†’ D1, next 120 â†’ D2, snake over 6, seeds spread, rest reserves).
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
- `src/index.ts` Worker entry (`/api/*` â†’ `app.ts`, else static assets) Â· `app.ts` routes Â· `auth.ts` Better Auth Â·
  `backups.ts` list/upload/download/delete per user Â· `files.ts` Supabase Storage (+ in-memory for tests) Â· `schema.ts`
  Â· `db.ts` the Db type Â· `migrations/` (drizzle-kit, `pnpm db:generate`) Â· `scripts/setupSupabase.mjs` Â·
  `wrangler.jsonc` (assets = `../web/dist/client`, worker first only on `/api/*`). Secrets: `.dev.vars` (git-ignored).

### apps/web/src/data (saving and loading; Worker side and its clients)
- `worker.ts` the Worker API Â· `engineClient.ts` `engine()` Â· `seasonRunner.ts` **season play**:
  `playSeason(target)` (targets: all / phase / stage / round / ids / comps; chunks of 1,000, pause,
  one transaction per round, stale removed), `seasonOverview`, `leagueView`, `cupView`, `seasonInput` Â· `singleMatch.ts` `matchPreview(id)` /
  `acceptMatch(id, games, method)` (one match through the MatchModal).
- `loadDefaultData.ts`/`seedData.ts` default idols from `seed/idols.json` (marker I-SEED-001) Â·
  `firstSeason.ts` Season 1 draft Â· `startDefaultData.ts` start-up chain (+ backup reminder, integrity).
- `photoFiles.ts`/`photoSizes.ts`/`photoCache.ts` photos in OPFS `<db>-photos/<id>/` (64/256/1024, never
  enlarged) Â· `backup/sabungFile.ts` (.sabung ZIP format) Â· `backup/backupWorker.ts` (export/import,
  snapshots in `<db>-snapshots`, 3 kept) Â· `integrityWorker.ts` Â· `databaseReset.ts`/`resetOffer.ts`.
- Simulation Timeline (revamp 2026-11-16): engine `stats/simHighlights.ts` (types, tracks, whole-season mode, points per round), `leagueTimeline.ts` (leaders, zones, upsets, rivalries, top-6 miss, finale) and `cupTimeline.ts` (Swiss/LCQ/groups/knockout); rivals = db `mostMetPairs` (H2H top 10). UI `components/play/SimTimeline.tsx` + `TimelineFinale.tsx` + `timelineText.ts` (labels, timeline-only headlines; news kinds via storyText). Timeline-only story kinds are NOT in AnyStory (so storyText/newsScore stay untouched).
- Story/highlights (2026-11-16): engine `stats/seasonMoments.ts` (big match, shock exit, clinched, champion), `simHighlights.ts` (one bulk play, from before/after replays; returned by `playSeason`), `careerNews.ts` (rivalry renewed, farewell), `newsScore` BREAKING=80. Web: `data/storyContext.ts` (earlier seasons), `components/story/storyText.ts` (all headlines), `components/play/SimTimeline.tsx` + `timelineStore.ts` and `GrandFinalCelebration.tsx` + `celebrationStore.ts` (UZC round F accepted in PlayMatchDialog); both rendered once in AppShell.
- Season Honours (2026-11-16): `data/honoursWorker.ts` `podiumOf` (one replay: record/games/best run via `podiumDetail.seasonRecord`, titles, places from `seasonPlacements` — NOT the saved placements, which only exist once the career cache folds the season); news = the shared ["season-story", id] query. UI: `PodiumDetail.tsx` (podium spread + Unzure champion) and `HonoursIdol.tsx` (one idol). Per-season #1 = `seasonArchive(id).seasonTop[0]`. e2e waits must skip infinite animations (breaking-news dot).
- Full storage (2026-11-16): `data/storageFull.ts` (isStorageFull, W-STORAGE-003); `notify()` maps any error whose context says the disk is full to one pinned warning (not logged). Photo writes are all-or-nothing (`storePhotoFiles` cleans its folder; worker `keepPhoto`). Dashboard `components/dashboard/StorageTile.tsx` (used of quota, bar, warning > 80%).
- Cloud sync (2026-11-16, user decisions): photos + idol/group info (and league logos) between a user's devices; NOT stats, matches, seasons; ratings and rosters only as a starting value (new idol / fresh device); deletes and gallery removals never sync. Local: `updatedAt` ($onUpdate) + frozen `syncKey` (lower(name)|lower(group)) on groups/idols, `hash` (SHA-256 of the original) on photos — migration 0004. DB logic `packages/db/src/sync.ts` (localChanges, applyRemote: newer wins, cloud wins on a device's first link, photo never cleared; rosterRows/applyFirstRosters). API `apps/api/src/sync.ts` (sync_record per user+kind+key with seq for pulls, gallery add-only; sync_file + Storage `sync/<user>/<sha256>` in the backups bucket) — migration 0002. Worker `data/cloudSync.ts` (pull, then push; state in stats_cache "cloud-sync"); started in `startDefaultData` after Season 1 exists (now, online, tab shown, every 60 s). e2e `sync.e2e.ts` runs the real API in memory (`apps/api/src/memoryCloud.ts`). Deploy: `pnpm --filter @sabung/api setup` → `pnpm --filter @sabung/api exec wrangler deploy` → web build/deploy.
- `notices.ts` notifications (Zustand; `notify`, `{log:false}`, `{oncePerDay}`) Â· `seasonQuery.ts`
  (`useCurrentSeason`, `useLeagueRosters` = the 12 leagues, without IDL).

### apps/web/src/pages and components (screens and their pieces)
- `/` Home welcome while draft (`components/home`) Â· `/play` simulator (`components/play`) Â·
  `/play/$comp` panels (`components/competition`: LeaguePanel, CupPanel, UnzurePanel, Tabs, â€¦).
- `/wiki/idols` Idol Database (`components/idolDatabase`) Â· `/studio/input` Input Data
  (`components/inputData`) Â· `/studio/inactive` (`components/inactiveManager`) Â· `/studio/settings`
  (`components/settings` in 6 views via ?s=: Season, Branding, Roster, DataMaker, EngineTuning, Data + IntegrityList,
  Backup, DangerZone) Â· shell in `components/shell` Â· `/dev/*` check pages (not in the menu).
- packages/ui: IdolCard (trading card), IdolPhoto, RatingBadge (`TIER_FILL`), VirtualTable,
  PhotoDropZone, ColorSwatchPicker, Button (danger = outlined), Modal, ConfirmDialog (typeToConfirm),
  ImportDialog, LeagueRosterModal, SearchableIdolSelect, MatchModal, WheelPicker, brackets, notices.
  LeagueRosterModal paste has two buttons: "Tambahkan dari teks" (append) and "Ganti roster dengan teks" (drop the old roster, keep only the pasted names; nothing saved until Apply).

## Rules and decisions that are easy to break

- **Never delete a database automatically.** An automatic clean-up wiped a real database once (reverted
  in `3f02beb`). Deleting needs the user: `<db>.ready` is written after every successful open; a reset is
  only offered when it is missing and needs "DELETE" (was HAPUS); the Worker deletes before opening only with a
  `<db>.reset` request (and still no `.ready`) or a `<db>.wipe` request (Danger Zone, "DELETE ALL", was HAPUS SEMUA).
- Database lock waits up to 5 s (a reload is not "another tab"). A reload in the first seconds of a
  fresh install can break PGlite's OPFS pool â†’ the confirmed reset is the way out (e2e `firstOpen`).
- Colours only through tokens (`packages/ui/src/tokens.css`), named by role: `accent` (crimson fill,
  text `on-accent`), `accent-bright` (text/focus), `cool`, `muted`, `danger`, `tier-sâ€¦d`. Crimson and navy
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
- Engine Tuning preset numbers are ours (PRD gives none): Realistic 40/Ïƒ4, Chaotic 60/Ïƒ8, Dominant 28/Ïƒ2.
- Photos are prepared with tools/photos (K-pop Wiki concept photos / Wikimedia Commons, numbered contact sheets, every pick
  checked by eye). Files are named "Name GROUP.jpg" so Photo Import matches them for sure.
- Default photo rule (user 2026-11-14): never from kprofiles; the face must be fully visible and clean â€” no glasses, masks,
  hands or props over the face (concept shots are out). This is for the default base photo only; comeback photos later.
- Update 3 engine rules (user): Nugu/B-Side upset cups (fatigue + flatter scale), in-series momentum, MatchModal re-roll,
  new progression and prestige order â€” PRD Â§5.10 and Â§6.1â€“6.3 numbers are superseded where they differ (see V5).
- Project rules (CLAUDE.md): screens in `pages/`, pieces in `components/`, saving/loading in `data/`,
  one job per file, â‰¤ 300 lines, minimal code, ask instead of guessing, test every change, report real
  results. Ponytail mode is on (full). Don't commit `design/refs/*` pictures unless asked.

## How to run and test (Windows, Git Bash)

- Put Node on the path first: `export PATH="/c/Program Files/nodejs:$(cygpath "$APPDATA")/npm:$PATH"`.
- Dev app: `pnpm --filter @sabung/web dev` â†’ http://localhost:5173 (use real Chrome/Edge; the in-app
  browser pane's storage is not persistent and lost all data once).
- Typecheck all: `pnpm -r exec tsc --noEmit`. Unit tests: `pnpm --filter @sabung/<pkg> test`
  (shared, engine, db, ui, web). Don't pass `--testTimeout` (already in the scripts).
- E2E (Playwright, own server on port 5180): `pnpm --filter @sabung/web e2e [name]`; expect timeout is
  15 s because every fresh profile opens its own database under parallel load. Screenshots for a human
  look go to `apps/web/test-results/` (git-ignored). Bundle: `pnpm --filter @sabung/web budget` (148 KB
  of 180 KB). Lighthouse: `pnpm --filter @sabung/web lighthouse`.
- `pnpm --filter @sabung/web budget` now builds first (before 2026-11-13 it measured whatever dist/ held, so the
  148.3 KB reported in Fase 3 steps 6â€“10 was a stale build; real: 154.2 KB at Fase 4 step 3).
- Cloud API: `pnpm --filter @sabung/api test` (PGlite) Â· `pnpm --filter @sabung/api dev` (wrangler, :8787, serves
  `apps/web/dist/client` â€” build web first) Â· `pnpm --filter @sabung/api setup` (Supabase migrations + bucket).
  Offline e2e builds the app and serves it on 5181; cloud gate e2e needs `CLOUD_URL`.
- DEPLOY FLOW (user 2026-11-13): after EVERY change, build and upload a PREVIEW (never straight to production):
  `pnpm --filter @sabung/web build && pnpm --filter @sabung/api exec wrangler versions upload --preview-alias test --message "â€¦"`
  â†’ https://test-sabung-idol.sabung-api.workers.dev. The user tests, says "deploy", then
  `pnpm --filter @sabung/api exec wrangler versions deploy <version-id>@100% -y`. Login/cloud backup may not work on the
  preview host (Better Auth knows the main URL only). Tell the user: close ALL tabs of the site to get the new version (PWA).
- Deploy: `pnpm --filter @sabung/web build && pnpm --filter @sabung/api exec wrangler deploy`. Gate e2e online:
  `CLOUD_URL=https://sabung-idol.sabung-api.workers.dev pnpm --filter @sabung/web e2e cloud.e2e.ts` and
  `OFFLINE_URL=â€¦ e2e offline.e2e.ts`. In the user's PowerShell `npx` is blocked (execution policy): use `npx.cmd`.
- e2e: every bulk play can open the Simulation highlights popup, which covers the page (role queries and clicks fail). After a bulk-play wait call `closeHighlights(page)` (e2e/highlights.ts); pass `true` when the play crowns a champion (popup certain). Note `pnpm e2e gate.e2e.ts` also runs fase3Gate (name filter).
- Shell pitfalls: no Python on this machine; sed eats `\d` (use the Edit tool for regex text); a heredoc
  with tricky quoting can fail silently â€” check the file was written; never edit package.json while
  pnpm is running.

## Open items
- FASE 4 GATE PASSED 2026-11-13 â€” waiting for approval before Fase 5. MatchModal is taller than a 720 px screen (title/Accept need a scroll).
- E2E flake under load: a full e2e run 1 of 3 on 2026-11-13 had 6 fails waiting for "Season 1 Â· Draft" on
  fresh profiles. (Fixed: db tests have `--hookTimeout=30000`; opening two PGlite dbs takes ~10 s.)
- Real Safari (Mac/iPhone) untested: IndexedDB database + OPFS photo files. CLS 0.083 from the late
  storage warning could be removed by reserving its space (optional).
- `design/refs/overall vibe layout & ui.mp4` not reviewed.
- A one-off E-DB-001 on an existing database after rapid reloads (unreproduced; a reload fixes it).
- Reload with 2 seasons (10,530 matches, Playwright Chromium, dev server): the database is ready after ~6.6 s on EVERY page (season chip); the Fase 4 pages themselves then take ~0.1â€“0.8 s. CAUSE (measured): PGlite `opfs-ahp` opens one sync access handle per file on every open (1,043 Postgres files, mostly the empty system catalog, + 100 spare pool files) at ~5 ms each = ~5.5 s; lock 14 ms, migrations ~30 ms. It does not grow with matches (an empty database also takes 5.2 s). Option: PGlite `memfs2opfs` reopens in 1.2 s but keeps the whole database in memory (58 MB at 2 seasons) and needs the stored data converted. Tried a smaller pool (maintainedPoolSize 50): REVERTED. A new database refills its pool only to that size before the first migration, and 0000_init needs 57 new files: opfs-ahp then hangs with no error (worker e2e). A safe size (~70+) would save only ~0.15 s. Left as is; memfs2opfs is the only real fix (whole database in memory + data conversion), not done.
- Gallery fill (cheap mode, 2026-11-14): Handong Dreamcatcher 5 photos done; Hyeju Loossemble skipped (grid mixed faces). Remaining 29 in import/empty-galleries.txt untouched. Note: `__ig` is only visible ~3 s after page load; `start()` navigates, so poll with short waits (<30 s) instead of one long await.
- Also skipped 2026-11-14: Kim Hyunjin Loossemble (search returned a male group), Vivi Loossemble (only 3 uncertain selfies). Generic names need the user's fan-account handles.
- 2026-11-14: Pharita BABYMONSTER 6 photos (stage shots, medium confidence); Yuha skipped (mixed). Grid can contain leftovers from the previous idol's collection - check.
- 2026-11-14 Pinterest (cleaner than IG): Yuha, Zena, Yihyun 6 each (medium confidence, user should eyeball). Skipped as mixed/duo: Yewon, Yoon Seeun (duo shots), Moon Sua, Minami. Not tried: Yeojin, Siyoon, Nana, Jiana.
- 2026-11-14 Pinterest pass: ALL listed idols got 6 photos (single-person picks, hair-colour matching, confidence medium/low; user checks by eye). Only Young A2O LITE still empty (no Pinterest results). Weakest identity: Ji Hyun, Hyeju, MiU, Yihyun, Mayu, Jiana.

## Two-session workflow (user 2026-11-14)
- Router + light work = a Sonnet session. Heavy work = an Opus (medium effort) session the USER starts by hand
  (a Sonnet session cannot start a stronger model). User gives an update description to the router; router splits it.
- Light (Sonnet): copy/text changes, styling tweaks, renames, small UI wiring, data fill/import, docs, running scripts/tests.
- Heavy (Opus): new features/logic across files, simulation/rating maths, data model or save-format changes, hard bugs,
  anything where a wrong guess is costly or needs critical thinking.
- Router writes each heavy task as a brief (goal, files, done = what) and sends it with SendMessage to the Opus session id.
- Sessions (confirmed by user 2026-11-14): "Sonnet lighter task" = local_bae9947b-6cf5-4542-8513-c8a152412a20 (Sonnet, effort low);
  "Opus Hard Task" = local_ccbd1d15-6161-4700-8127-82730a97a786 (Opus, effort medium). If an id is not found, run list_sessions and match by title.

- Sessions renewed 2026-11-16: router = "Router Sabung Idol" local_ef6a9f50-c87f-4a91-a0fc-422ab93ee0a3 (Opus medium, user chats here, Indonesian). Token rules: workers run related tests only (full e2e only before deploy) and send short reports.
