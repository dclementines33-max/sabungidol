# Default photo picker (Update 3)

Rule (user, 2026-11-14): never from kprofiles; the face must be fully visible — no glasses, masks or props over it.

1. `node kpopwiki-candidates.mjs list.json sheets/` — list: `[{ "key": "GROUP__Name", "query": "Name GROUP", "match": "Name" }]`
   (or `"page"` instead of `"query"`). Builds a numbered contact sheet per idol from the K-pop Wiki (official
   concept photos). `commons-candidates.mjs` does the same from Wikimedia Commons (event photos; good for older groups).
2. Look at every sheet and choose. `node kpopwiki-pick.mjs picks.json out/ sheets/candidates.json` with
   `{ "GROUP__Name": n }` or `[n, 0.76]` (keep the top 76 %, to cut text at the bottom). Saves JPEG ≤ 1200 px.
3. Name files `Name GROUP.jpg` so Input Data → Photo Import matches each one for sure.

The scripts load sharp from the pnpm store path inside them; fix that path if sharp's version changes.
