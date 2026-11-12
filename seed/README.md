# Default idol data

Every fresh install of Sabung Idol starts with the idols in this folder (user decision 2026-11-13;
this changes PRD §1, which had no built-in idol data).

- `idols.json` — the idol list.
- `photos/` — one photo per idol; file names are matched to idols when the data is loaded.

Loaded automatically on first open (built in Fase 2). Photos are stored once in the browser (OPFS)
and resized to 64 / 256 / 1024 px, so the originals here can be any reasonable size.
