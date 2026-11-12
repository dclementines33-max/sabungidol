// Test helper: a synthetic 240-idol roster (12 leagues × 20). 200 idols in 40 girl groups of 5.
import { D1_LEAGUES, D2_LEAGUES } from "@sabung/shared";
import { matchRng } from "../rng";
import { shuffle } from "../shuffle";
import type { LeagueCode, SeasonInput } from "./types";

export function testSeason(seed = "golden", season = 1): SeasonInput {
  const rng = matchRng("roster", seed);
  const idols = Array.from({ length: 240 }, (_, i) => ({
    id: `idol${String(i + 1).padStart(3, "0")}`,
    groupId: i < 200 ? `gg${String(Math.floor(i / 5) + 1).padStart(2, "0")}` : null,
    rating: Math.max(40, Math.min(99, Math.round(72 + rng.normal(9)))),
    active: true,
  }));
  const ids = shuffle(idols.map((i) => i.id), rng);
  const leagues = Object.fromEntries([...D1_LEAGUES, ...D2_LEAGUES].map((code, l) => [code, ids.slice(l * 20, l * 20 + 20)])) as Record<LeagueCode, string[]>;
  return { season, seed, idols, leagues };
}
