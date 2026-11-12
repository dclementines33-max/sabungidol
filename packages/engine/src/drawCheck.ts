// Checks a hand-edited Unzure draw before it is applied (PRD §9 Manual modals, §5.7–5.8).
// problems block Apply; warnings (league mates, a soft rule) only inform.
import type { DrawIdol } from "./groupDraw";

export type DrawCheck = { problems: string[]; warnings: string[] };
const LETTERS = "ABCDEFGHIJKLMNOP";

export function checkGroups(groups: DrawIdol[][], potOf: (idolId: string) => number): DrawCheck {
  const problems: string[] = [];
  const warnings: string[] = [];
  groups.forEach((group, g) => {
    const label = `Grup ${LETTERS[g]}`;
    if (group.length !== 4) problems.push(`${label} berisi ${group.length} idol, harus 4`);
    const pots = group.map((x) => potOf(x.id));
    if (new Set(pots).size !== pots.length) problems.push(`${label} punya dua idol dari pot yang sama`);
    const girlGroups = group.map((x) => x.groupId).filter((id) => id !== null);
    if (new Set(girlGroups).size !== girlGroups.length) problems.push(`${label} punya dua idol dari girl group yang sama`);
    if (new Set(group.map((x) => x.league)).size !== group.length) warnings.push(`${label} punya rekan satu liga`);
  });
  return { problems, warnings };
}

// pairs[i] = [winner, runnerUp] of round-of-32 match i+1. groupOf / leagueOf / isWinner describe each idol.
export function checkKnockout(
  pairs: [string, string][],
  about: (idolId: string) => { group: number; league: string; isWinner: boolean },
): DrawCheck {
  const problems: string[] = [];
  const warnings: string[] = [];
  pairs.forEach(([a, b], i) => {
    const label = `Match ${i + 1}`;
    const [x, y] = [about(a), about(b)];
    if (x.isWinner === y.isWinner) problems.push(`${label} harus juara grup melawan runner-up`);
    if (x.group === y.group) problems.push(`${label} mempertemukan dua idol dari Grup ${LETTERS[x.group]}`);
    if (x.league === y.league) warnings.push(`${label} mempertemukan rekan satu liga`);
  });
  return { problems, warnings };
}
