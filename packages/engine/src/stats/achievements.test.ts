import { describe, expect, it } from "vitest";
import { syntheticSeasons } from "../season/synthetic";
import { type Badge, emptyAchievements, seasonAchievements } from "./achievements";
import { type CareerState, foldSeason } from "./careerStats";

describe("achievements (PRD §7.4)", () => {
  it("over 6 seasons: one Idol of The Season each, title runs match the champions, milestones once", () => {
    let career: CareerState = {};
    let ach = emptyAchievements();
    const badges: Badge[] = [];
    const champions: Map<string, string>[] = []; // per season: title key → champion
    for (const s of syntheticSeasons(6, "badges")) {
      const after = foldSeason(career, s.input.season, s.result.matches, s.placements);
      const scores = new Map(s.placements.map((p) => [p.idolId, p.finalRank === 1 ? 10 : 0])); // any score map will do here
      const out = seasonAchievements(ach, s.input.season, s.placements, career, after, scores);
      badges.push(...out.badges);
      [career, ach] = [after, out.state];
      champions.push(new Map(s.placements.filter((p) => p.finalRank === 1).map((p) => [p.comp, p.idolId])));
    }
    expect(new Set(badges.map((b) => `${b.idolId}|${b.badge}|${b.season}`)).size).toBe(badges.length);
    for (let n = 1; n <= 6; n++) expect(badges.filter((b) => b.badge === "idol-of-season" && b.season === n)).toHaveLength(1);
    const backToBack = new Set(badges.filter((b) => b.badge === "back-to-back").map((b) => `${b.idolId}|${b.season}`));
    const expected = new Set<string>();
    for (let n = 1; n < 6; n++) for (const [key, idol] of champions[n]!) if (champions[n - 1]!.get(key) === idol && champions[n - 2]?.get(key) !== idol) expected.add(`${idol}|${n + 1}`);
    expect(backToBack).toEqual(expected);
    for (const milestone of ["century", "half-century", "streak-master", "giant-killer", "comeback-queen"]) {
      const ids = badges.filter((b) => b.badge === milestone).map((b) => b.idolId);
      expect(new Set(ids).size).toBe(ids.length);
    }
    expect(badges.some((b) => b.badge === "rookie-sensation" && b.season === 1)).toBe(true); // every season-1 champion is a rookie
  });
});
