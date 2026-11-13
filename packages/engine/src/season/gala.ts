// Gala (PRD §4, user decision 2026-11-13): Daesang Cup and Music Bank Cup OPEN season N+1 with season N's
// champions. Daesang = The Idols league winner v Unzure Cup champion; Music Bank per D1 league = league
// champion v that league's B-Side champion. Clash rule: if one idol won both sides, the runner-up of the
// second competition plays instead. The pairs are fixed when season N+1 is created (seasonConfig.opener).
import { B_SIDE_CUPS, D1_LEAGUES, type Opener } from "@sabung/shared";
import type { MatchPlayer } from "./matchPlayer";
import type { Title } from "./types";

const pair = (a: string, second: Title, label: string, notices: string[]): [string, string] => {
  if (second.champion !== a) return [a, second.champion];
  notices.push(`${label}: ${a} juara di kedua sisi, jadi runner-up yang main`);
  return [a, second.runnerUp];
};

// From the finished season's titles; a side switched off (or missing) skips that final.
export function openerPairs(titles: Partial<Record<string, Title>>, off: string[], notices: string[]): Opener {
  const opener: Opener = {};
  if (!off.includes("DSG") && titles.IDL && titles.UZC) opener.DSG = pair(titles.IDL.champion, titles.UZC, "Daesang Cup", notices);
  if (!off.includes("MBK")) {
    const mbk = Object.fromEntries(D1_LEAGUES.flatMap((code, i) => {
      const league = titles[code];
      const bSide = titles[B_SIDE_CUPS[i]!];
      return league && bSide ? [[code, pair(league.champion, bSide, `Music Bank Cup ${code}`, notices)]] : [];
    }));
    if (Object.keys(mbk).length) opener.MBK = mbk;
  }
  return opener;
}

// Plays the opener before the league phase. A match not allowed yet stays pending without holding up the
// leagues; an idol who is no longer in the season (deleted) skips that final.
export function playOpener(player: MatchPlayer, opener: Opener | undefined, inSeason: (id: string) => boolean) {
  const titles: Record<string, Title> = {};
  const final = (comp: "DSG" | "MBK", round: string, [a, b]: [string, string]) => {
    if (!inSeason(a) || !inSeason(b)) return null;
    const m = player.play(comp, "FN", round, 1, a, b);
    return m && m.result !== "D" ? (m.result === "A" ? { champion: a, runnerUp: b } : { champion: b, runnerUp: a }) : null;
  };
  if (opener?.DSG) { const t = final("DSG", "F", opener.DSG); if (t) titles.DSG = t; }
  for (const [code, p] of Object.entries(opener?.MBK ?? {})) { const t = final("MBK", code, p); if (t) titles[`MBK-${code}`] = t; }
  return titles;
}
