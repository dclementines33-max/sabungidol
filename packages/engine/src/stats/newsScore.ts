// How important one Season Story item is (2026-11-15), 0–100, so Home shows only the big or rare news. Our own numbers
// (no PRD figure): records and unbeaten seasons top, titles weighted by the competition's prestige, the rest by size.
import { competitionKeyOf } from "@sabung/shared";
import { PRESTIGE } from "../season/seasonClose";
import type { DramaStory } from "./seasonDrama";
import type { NewsStory } from "./seasonNews";
import type { MomentStory } from "./seasonMoments";
import type { Story } from "./seasonStory";

export type AnyStory = Story | DramaStory | NewsStory | MomentStory;

export function newsScore(s: AnyStory): number {
  switch (s.kind) {
    case "points-record": return 95;
    case "unbeaten": return 90;
    case "title-milestone": return Math.min(95, 60 + s.total);
    case "multi-title": return Math.min(95, 50 + 15 * s.titles.length);
    case "first-title": return 40 + 50 * PRESTIGE[competitionKeyOf(s.title.split("-")[0]!)];
    case "upset": return Math.min(90, 30 + 2 * s.gap);
    case "late-promotion": return Math.min(80, 45 + 4 * (s.from - 3));
    case "streak": return Math.min(85, 15 + 5 * s.wins);
    case "rivalry": return Math.min(75, 20 + 8 * s.meetings);
    case "slump": return Math.min(70, 10 + 6 * s.losses + (s.rating - 85));
    case "reverse-sweep": return 40;
    case "idol-of-month": return 20 + s.wins;
    case "champion": return 40 + 45 * PRESTIGE[competitionKeyOf(s.title.split("-")[0]!)];
    case "clinched": return Math.min(90, 70 + 3 * s.left);
    case "shock-exit": return Math.min(88, 60 + 2 * s.gap);
    case "big-match": return 35 + (s.ratingLoser - 90) * 3;
  }
}

// The n most important items, at most one per kind (so Home never shows three upsets).
export function topNews<T extends AnyStory>(stories: T[], n = 4): T[] {
  const seen = new Set<string>();
  return stories.map((s, i) => ({ s, i, score: newsScore(s) })).sort((a, b) => b.score - a.score || a.i - b.i)
    .filter(({ s }) => !seen.has(s.kind) && !!seen.add(s.kind)).slice(0, n).map(({ s }) => s);
}
