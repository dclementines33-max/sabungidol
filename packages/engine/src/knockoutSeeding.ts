// Unzure Cup round of 32 (PRD §5.8): each group winner meets a runner-up from another group.
// The 16 winners fill the 16 matches, so each half of the bracket has 8. Matches 1–8 = top half.
// Soft rule: no league mates in R32. If it cannot hold, it is dropped (relaxed = true).
import type { Rng } from "./rng";
import { shuffle } from "./shuffle";

export type KnockoutEntry = { id: string; league: string };
export type GroupFinish = { winner: KnockoutEntry; runnerUp: KnockoutEntry };
export type KnockoutResult = { pairs: [winner: string, runnerUp: string][]; relaxed: boolean };

function assign(winners: number[], runnersUp: number[], ok: (w: number, r: number) => boolean): number[] | null {
  if (winners.length === 0) return [];
  const [w, ...rest] = winners;
  for (const r of runnersUp) {
    if (!ok(w, r)) continue;
    const sub = assign(rest, runnersUp.filter((x) => x !== r), ok);
    if (sub) return [r, ...sub];
  }
  return null;
}

export function seedKnockout(groups: GroupFinish[], rng: Rng): KnockoutResult {
  if (groups.length !== 16) throw new Error(`R32 seeding needs 16 groups, got ${groups.length}`);
  const winners = shuffle(groups.map((_, i) => i), rng);
  const runnersUp = shuffle(groups.map((_, i) => i), rng);
  const differentGroup = (w: number, r: number) => w !== r;
  const differentLeague = (w: number, r: number) => differentGroup(w, r) && groups[w].winner.league !== groups[r].runnerUp.league;

  const strict = assign(winners, runnersUp, differentLeague);
  const picked = strict ?? assign(winners, runnersUp, differentGroup)!; // a group-only match always exists for 16 groups
  return {
    pairs: winners.map((w, i) => [groups[w].winner.id, groups[picked[i]].runnerUp.id]),
    relaxed: strict === null,
  };
}
