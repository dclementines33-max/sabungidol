# Default idol data

Every fresh install of Sabung Idol starts with the idols in `idols.json` (user decision 2026-11-13;
this changes PRD §1, which had no built-in idol data).

- One JSON file; each idol carries its own photo inside the file, so no photo ever has to be
  matched to an idol by file name.
- Only three fields are used: **photo, name and group**. Everything else in the file is ignored.

Loaded automatically on first open (built in Fase 2). Each photo is stored once in the browser (OPFS)
and resized to 64 / 256 / 1024 px.
