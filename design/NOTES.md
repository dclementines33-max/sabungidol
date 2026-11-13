# Design notes

UI references for Sabung Idol. Put pictures (screenshots, mockups, inspiration) in `design/refs/`
and write here what each one is for, so anyone building a page knows which reference to follow.

The design system itself (colours, type, spacing, components) lives in code:
`packages/ui/src/tokens.css` and the Storybook stories in `packages/ui`. When a reference and the
tokens disagree, the reference says *what* the page shows; its colours and sizes are matched to the
tokens, not copied.

## How to add a reference

1. Save the file in `design/refs/`, named after the page or component, e.g. `idol-profile-hero.png`.
2. Add a line below: file, which page or component, and what to take from it (layout, a detail, a mood).

## References

| File | Page / component | What to take from it |
| --- | --- | --- |
| `Color pallete.jpg` | The whole app | **The palette** (user decision 2026-11-13): crimson `#7D0018`, dark red `#340A13`, black `#010003`, navy `#25435D`, steel `#4C6C81`, `#87A4B5`, `#B9D3E2`. Mapped to roles in `tokens.css`; crimson and navy are fills only (too dark for text). |
| `idol card design 1.jpg` | IdolCard | Trading-card shape: tall card, photo on top, coloured frame, a big number in a corner, a name plate at the bottom. |
| `idol card design 2.jpg` | IdolCard | The rating in a circle sitting on a coloured line, NAME in capitals, small icons under it. Built as: rating circle in the tier colour, group above the name, titles icon; no form (user decision). |
| `Overal vibe layout & ui.jpg` | Overall mood | Calm editorial layout: lots of space, a large headline, small uppercase labels, one strong photo row. |
| `Overal vibe layout & ui 3.jpg` | Overall mood | Big photo hero with huge headline type, rounded photo cards, stat bubbles ("18K+", "#01"). |
| `another ref for layout and visual.jpg` | Overall mood, Home and hero screens | K-pop editorial in crimson and black: huge bold sans headlines in capitals, photo-led panels, red/black cards with thin corner marks. |
| `overall vibe layout & ui.mp4` | Overall mood | A video (not reviewed: cannot be played here). |
| `editrial ui 1.jpg` | Layout, heroes | Editorial magazine: a photo hero with a huge OUTLINED word behind the person, small orange kicker label, condensed sans headlines, photo grids with captions under them. |
| `editorial ui2.jpg` | Layout, type | VOIDMAG: condensed caps nav, a ragged photo row of different sizes with justified caps captions, one giant blackletter title, "ISSUE Nº02" corner label. |
| `editorial  ui3.jpg` | Layout | Split screen: one huge word on a calm half, a dense photo mosaic on the other, tiny labels in the four corners. |
| `swiss punk ui 1.jpg` | Layout, labels | Swiss punk: centred tall photo, scattered blocks, white-on-black tag labels, vertical text, a round logo stamp, giant spaced letters along the bottom. |
| `swiss punk ui 2.jpg` | Mood, texture | Grunge: distorted pink display type, halftone/torn photo, highlighted words in blocks, plant line drawings, thin connector lines between small labels. |
| `swiss punk ui 3.jpg` | Type, buttons | Wide heavy caps headline overlapping a grainy B&W photo, vertical "READ ALL" with an arrow, one long pill button with an arrow. |
| `saptial immersive 2.jpg` | Depth | Spatial: floating panels at angles in a room, each a page with big photos. |
| `saptial immersive 3.jpg` | Depth, light | Dark immersive: a tilted glass screen, coloured edge glow, thin technical lines and corner marks, mono labels. |
| `saptial immersive 1.html` | (background) | A saved chat about 20 UI styles (Editorial, Swiss, Spatial …); no layout of its own. |
| `penjelasan untuk perubahan keseluru.txt` | **The brief (user, 2026-11-13)** | Applies to every page and component, now and later: experimental, unique and elegant layouts mixing Editorial, Swiss punk and Spatial/Immersive; **no outlines and no boxed frames** (if a block is needed, a fill without outline; plain lines are fine); current colours but used more freely, background stays dark, rich and grand; many visuals (photos, charts; ask the user for photos and say where they go); grunge/gothic elements, textures and extra ornaments; a clear, strong sans serif. |

Decided by the brief: headlines and text use a strong sans serif (Fraunces goes).

## Update 2 (user, 2026-11-13) — `design/refs/update-2/`
Source: `Beberapa perubahan dan update.docx` (same folder). The pictures are references for **content**
(which info and stats to show); layout and look follow the brief above (no outlined boxes, not grid-bound).
| File | Shows |
|---|---|
| `1 bracket.png` | Full bracket drawn from the start (empty slots blank), round labels, connecting lines, winner row filled, seed/rating chip, score per row. For IDL playoff, UZC KO, Inkigayo, B-Side, Nugu from R16. |
| `2 group stage.png` | Group tabs; standings (rank, idol + rating, P W D L, GF-GA, diff, pts, form) beside the group's match schedule with a play button. For LCQ and UZC groups. |
| `3 girl group stats.png` | Per group: rank, titles count, members, matches, W/D/L, win rate, game diff, titles per competition; expandable member table (titles per comp, matches, W-D-L, win rate). |
| `4 head to head.png` | Tale of the tape: two pickers, direct H2H W-D-L + bar + game score, rows: rating, titles, career win rate, matches, points, longest streak, last 5; top-10 rivalries below. |
| `5 idol profile hero.png` | Profile with idol picker, big photo, group/country/seed, OVR tier, current division + rank, career W-D-L, win rate, titles, matches. |
| `6 idol profile career.png` | Career scope tabs per competition (with match counts); win rate, matches, titles, podiums, game diff, avg points; summaries: scoring, competition distribution, streaks. |
| `7 hall of champions.png` | Per season card: champion photo, group, final score, runner-up and 3rd. |
