# Default idol data

Every fresh install of Sabung Idol starts with the idols in `idols.json` (user decision 2026-11-13;
this changes PRD §1, which had no built-in idol data).

- One JSON file; each idol carries its own photo inside the file, so no photo ever has to be
  matched to an idol by file name.
- Four fields are used: **photo, name, group and rating** (rating added 2026-11-13). Everything else in the file is ignored.
- Group "Solo / Independent" means Soloist (no group).
- 242 idols for 240 league places: the league split leaves 2 as reserves.

Loaded automatically on first open (built in Fase 2). Each photo is stored once in the browser (OPFS)
and resized to 64 / 256 / 1024 px.
