import { computeStandings, runSeason } from "@sabung/engine";
import { beforeAll, describe, expect, it } from "vitest";
import { testSeason } from "../../engine/src/season/testRoster";
import { createSeason } from "./createSeason";
import { leagueTotals } from "./leagueTable";
import { type Db, openDb } from "./openDb";
import { type PlayedMatch, saveMatches } from "./saveMatches";
import { idols } from "./schema";

const played = (id: string, idolA: string, idolB: string, games: ("A" | "B")[], result: "A" | "B" | "D"): PlayedMatch => ({
  id, comp: "D1A", stage: "LG", round: "MD01", idolA, idolB, games, result,
  scoreA: games.filter((g) => g === "A").length, scoreB: games.filter((g) => g === "B").length,
  ratingA: 70, ratingB: 70, formA: "Steady", formB: "Steady",
});

describe("league table from SQL (Fase 0 gate: stats = manual count)", () => {
  it("matches a table counted by hand", async () => {
    const db = await openDb();
    await db.insert(idols).values(["a", "b", "c"].map((id) => ({ id, name: id, rating: 70 })));
    await createSeason(db, { id: "S01", number: 1, name: "S1", seed: "x" });
    await saveMatches(db, "S01", [
      played("S01-D1A-LG-MD01-M01", "a", "b", ["A", "A", "B", "A"], "A"), // a 3–1 b
      played("S01-D1A-LG-MD02-M01", "b", "c", ["A", "B", "B", "A"], "D"), // b 2–2 c
      played("S01-D1A-LG-MD03-M01", "c", "a", ["A", "A", "A"], "A"), // c 3–0 a
    ]);
    // By hand: a = W1 L1, 3 pts, games 3–4 · b = D1 L1, 1 pt, 3–5 · c = W1 D1, 4 pts, 5–2
    expect(await leagueTotals(db, "S01", "D1A")).toEqual([
      { idolId: "a", played: 2, wins: 1, draws: 0, losses: 1, points: 3, gamesWon: 3, gamesLost: 4 },
      { idolId: "b", played: 2, wins: 0, draws: 1, losses: 1, points: 1, gamesWon: 3, gamesLost: 5 },
      { idolId: "c", played: 2, wins: 1, draws: 1, losses: 0, points: 4, gamesWon: 5, gamesLost: 2 },
    ]);
  });

  describe("a full saved season", () => {
    const input = testSeason();
    const season = runSeason(input);
    let db: Db;
    beforeAll(async () => {
      db = await openDb();
      await db.insert(idols).values(input.idols.map((i) => ({ id: i.id, name: i.id, rating: i.rating })));
      await createSeason(db, { id: "S01", number: 1, name: "S1", seed: input.seed });
      await saveMatches(db, "S01", season.matches);
    });

    it("SQL totals equal the engine's table for all 12 leagues and The Idols", async () => {
      for (const code of [...Object.keys(input.leagues), "IDL"]) {
        const ids = season.matches.filter((m) => m.comp === code && m.stage === "LG").flatMap((m) => [m.idolA, m.idolB]);
        const engine = computeStandings([...new Set(ids)].map((id) => ({ id, startRating: 0 })),
          season.matches.filter((m) => m.comp === code && m.stage === "LG"));
        const sql = await leagueTotals(db, "S01", code);
        expect(sql.length).toBe(20);
        for (const row of sql) {
          const { rank, gameDiff, idolId, ...totals } = engine.find((r) => r.idolId === row.idolId)!;
          expect({ idolId, ...totals }).toEqual(row);
          expect(row.played).toBe(38);
        }
      }
    });
  });
});
