// Unzure Cup group draw (PRD §5.7): 4 pots × 16 idols → 16 groups of 4, one idol per pot.
// Hard rule: no two idols from the same girl group (soloists, groupId null, never clash).
// Soft rule: different leagues. If it cannot hold, the draw retries without it (relaxed = true).
import type { Rng } from "./rng";
import { shuffle } from "./shuffle";

export type DrawIdol = { id: string; groupId: string | null; league: string };
export type DrawResult = { groups: DrawIdol[][]; relaxed: boolean };

// A few unlucky shuffles search for a long time. Short tries with fresh shuffles are much
// faster than one long search, and the total stays bounded when no draw exists.
const STEP_LIMIT = 2_000;
const ATTEMPTS = 50;

function tryDraw(pots: DrawIdol[][], rng: Rng, useLeagueRule: boolean): DrawIdol[][] | null {
  const groups: DrawIdol[][] = pots[0].map(() => []);
  const order = pots.map((pot) => shuffle(pot, rng));
  let steps = 0;

  const fits = (idol: DrawIdol, group: DrawIdol[]) =>
    group.every((x) => (idol.groupId === null || x.groupId !== idol.groupId) && (!useLeagueRule || x.league !== idol.league));

  const openGroups = (idol: DrawIdol, pot: number) => groups.flatMap((g, i) => (g.length === pot && fits(idol, g) ? [i] : []));

  // Place the idol with the fewest open groups first; a dead end shows up at once.
  const place = (pot: number, left: DrawIdol[]): boolean => {
    if (pot === order.length) return true;
    if (left.length === 0) return place(pot + 1, order[pot + 1] ?? []);
    let idol = left[0];
    let options = openGroups(idol, pot);
    for (const other of left.slice(1)) {
      const o = openGroups(other, pot);
      if (o.length < options.length) [idol, options] = [other, o];
    }
    const rest = left.filter((x) => x !== idol);
    for (const g of shuffle(options, rng)) {
      if (++steps > STEP_LIMIT) return false;
      groups[g].push(idol);
      if (place(pot, rest)) return true;
      groups[g].pop();
    }
    return false;
  };
  return place(0, order[0]) ? groups : null;
}

export function drawGroups(pots: DrawIdol[][], rng: Rng): DrawResult {
  if (pots.length !== 4 || pots.some((pot) => pot.length !== 16)) throw new Error("Group draw needs 4 pots of 16 idols");
  for (const useLeagueRule of [true, false]) {
    for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
      const groups = tryDraw(pots, rng, useLeagueRule);
      if (groups) return { groups, relaxed: !useLeagueRule };
    }
  }
  throw new Error("Group draw impossible: girl group clashes cannot be avoided");
}
