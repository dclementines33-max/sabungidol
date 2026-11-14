import { D1_LEAGUES, D2_LEAGUES } from "@sabung/shared";
import { describe, expect, it } from "vitest";
import { addIdols } from "./idols";
import { openDb } from "./openDb";
import { saveMatches } from "./saveMatches";
import { startSeason } from "./seasonPlay";
import { createDraftSeason, leagueRosters } from "./seasons";
import { replaceTheIdols, theIdolsChanges } from "./theIdols";

describe("The Idols sync rating", () => {
  it("re-picks the roster until its first match is played, then refuses", async () => {
    const db = await openDb();
    const ids = (await addIdols(db, Array.from({ length: 240 }, (_, i) => ({ name: `I${i}`, groupName: null, rating: 70, seed: null, nationality: null, birthday: null })))).added;
    await createDraftSeason(db, { id: "S01", number: 1, name: "Season 1", seed: "s", leagues: Object.fromEntries([...D1_LEAGUES, ...D2_LEAGUES].map((c, l) => [c, ids.slice(l * 20, l * 20 + 20)])) });
    await startSeason(db, "S01", ids.slice(0, 20));
    const picked = [...ids.slice(2, 20), ids[30]!, ids[31]!];
    expect(await theIdolsChanges(db, "S01", picked)).toEqual({ in: [ids[30], ids[31]], out: [ids[0], ids[1]], played: false });
    expect(await replaceTheIdols(db, "S01", picked)).toEqual({ ok: true });
    expect((await leagueRosters(db, "S01")).IDL).toEqual(picked);
    expect((await replaceTheIdols(db, "S01", picked.slice(1))).ok).toBe(false); // 19 is not a roster

    await saveMatches(db, "S01", [{ id: "S01-IDL-LG-MD01-M01", comp: "IDL", stage: "LG", round: "MD01", idolA: picked[0]!, idolB: picked[1]!,
      games: ["A", "A", "A"], scoreA: 3, scoreB: 0, result: "A", ratingA: 70, ratingB: 70, formA: "Steady", formB: "Steady" }]);
    expect((await theIdolsChanges(db, "S01", ids.slice(0, 20))).played).toBe(true);
    expect(await replaceTheIdols(db, "S01", ids.slice(0, 20))).toEqual({ ok: false, reason: "Match The Idols sudah dimainkan, roster tidak bisa diubah lagi" });
    expect((await leagueRosters(db, "S01")).IDL).toEqual(picked);
  });
});
