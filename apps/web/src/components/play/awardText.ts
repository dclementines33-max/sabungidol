// What each season award is called, what it is for, how it is worked out (one plain line) and how its number reads.
// Used by Season Honours, All-time Records and the Award Cabinet. Tiers = the rating model's tournament weights.
import type { AwardKey } from "@sabung/engine";

const TIERS = "each counted by its tier (Unzure 1 … Division 2 0.25)";
export const AWARD_TEXT: Record<AwardKey, { name: string; what: string; how: string; value: (v: number) => string }> = {
  mvi: { name: "MVI", what: "Most Valuable Idol", how: `Win rate plus 10 × game difference per match, every match ${TIERS}; 20+ matches`, value: (v) => `${v} MVI score` },
  iots: { name: "Idol of the Season", what: "Best season overall", how: "Season score: her place in every competition × its tier, plus her win rate (the Honours podium)", value: (v) => `${v} season score` },
  mama: { name: "MAMA", what: "Best girl group", how: "The season scores of the group's three best members, added up", value: (v) => `${v} group score` },
  "golden-disk": { name: "Golden Disk", what: "Most titles", how: `Titles won, ${TIERS}`, value: (v) => `${v} title points` },
  "chart-topper": { name: "Chart Topper", what: "Longest at #1", how: "Matchdays at #1 of The Idols (× 0.9) or a Division 1 league (× 0.8)", value: (v) => `${v} matchday points` },
  encore: { name: "Encore", what: "Most wins", how: `Wins, ${TIERS}`, value: (v) => `${v} weighted wins` },
  daebak: { name: "Daebak", what: "Fewest losses", how: `Share of matches lost, ${TIERS}, so a big-stage loss weighs more; 20+ matches`, value: (v) => `${v}% lost` },
  unbreakable: { name: "Unbreakable", what: "Hardest to score on", how: `Games conceded per match, ${TIERS}; 20+ matches`, value: (v) => `${v} conceded per match` },
  "trend-setter": { name: "Trend Setter", what: "Winning everywhere", how: `Competitions where she won more matches than she lost (3+ played), ${TIERS}`, value: (v) => `${v} competition points` },
  "glow-up": { name: "Glow Up", what: "Biggest rating growth", how: "Rating gained at season end (before award bonuses)", value: (v) => `+${v} rating` },
  "hallyu-wave": { name: "Hallyu Wave", what: "Most matches played", how: `Matches played, ${TIERS}`, value: (v) => `${v} weighted matches` },
};
