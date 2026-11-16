// How important one Season Story item is (2026-11-15), 0–100, so Home shows only the big or rare news. Our own numbers
// (no PRD figure): records and unbeaten seasons top, titles weighted by the competition's prestige, the rest by size.
import { competitionKeyOf } from "@sabung/shared";
import { PRESTIGE } from "../season/seasonClose";
import type { DramaStory } from "./seasonDrama";
import type { NewsStory } from "./seasonNews";
import type { MomentStory } from "./seasonMoments";
import type { CareerStory } from "./careerNews";
import type { TitleStory } from "./titleNews";
import type { Story } from "./seasonStory";

export type AnyStory = Story | DramaStory | NewsStory | MomentStory | CareerStory | TitleStory;

export const BREAKING = 80; // from this score a story gets the breaking-news headline
const prestige = (title: string) => PRESTIGE[competitionKeyOf(title.split("-")[0]!)];

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
    case "rivalry-renewed": return Math.min(80, 30 + 3 * (s.meetings + s.earlier));
    case "farewell": return Math.min(85, 50 + 5 * s.titles);
    case "runner-up-streak": return Math.min(85, 60 + 10 * s.seasons);
    case "finalist-streak": return Math.min(90, 66 + 10 * s.seasons);
    case "drought": return Math.min(80, 45 + 5 * s.seasons + (s.rating - 90));
    case "drought-ended": return Math.min(92, 56 + 6 * s.gap);
    case "repeat-champion": return Math.min(95, 58 + 12 * s.seasons);
    case "promoted-champion": return 88;
    case "relegated-again": return 60;
    case "stuck-in-d2": return Math.min(75, 40 + 8 * s.seasons);
    case "early-exit-again": return Math.min(90, 45 + 20 * s.times);
    case "big-match": return 35 + (s.ratingLoser - 90) * 3;
    // Title news: an underdog by how far below the favourite and past how many better-rated idols; level points = tiebreak.
    case "underdog-champion": return Math.min(95, 35 + 2 * (s.favouriteRating - s.rating) + 2 * s.above + 15 * prestige(s.title));
    case "favourite-flop": return Math.min(80, 30 + 30 * prestige(s.title) + ((s.rank !== null ? s.rank >= 4 : !["F", "GF"].includes(s.round)) ? 10 : 0));
    case "title-race": return s.how === "level" ? 85 : s.how === "narrow" ? 75 - 5 * s.margin : Math.min(80, 45 + 2 * s.margin);
    case "final-thriller": return 45 + 30 * prestige(s.title);
  }
}

// The n most important items, at most one per kind (so Home never shows three upsets).
export function topNews<T extends AnyStory>(stories: T[], n = 4): T[] {
  const seen = new Set<string>();
  return stories.map((s, i) => ({ s, i, score: newsScore(s) })).sort((a, b) => b.score - a.score || a.i - b.i)
    .filter(({ s }) => !seen.has(s.kind) && !!seen.add(s.kind)).slice(0, n).map(({ s }) => s);
}
