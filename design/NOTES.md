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

Open: the mood references use a bold grotesk sans for headlines; `--font-display` is still the Fraunces serif (not decided yet).
