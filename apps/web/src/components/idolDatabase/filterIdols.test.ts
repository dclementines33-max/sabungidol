import type { IdolRow } from "@sabung/db";
import { describe, expect, it } from "vitest";
import { NO_FILTER, filterIdols } from "./filterIdols";

const idol = (id: string, rating: number, extra: Partial<IdolRow> = {}): IdolRow => ({
  id, name: id, groupId: "g1", groupName: "Aurora", rating, seed: null, nationality: null, birthday: null, role: null, photoId: null, active: true, gallery: [], ...extra,
});
const idols = [idol("Mina", 92), idol("Yuna", 84, { nationality: "KR" }), idol("Sora", 84, { groupId: null, groupName: null }), idol("Rina", 55, { active: false })];
const leagueOf = new Map([["Mina", "D1A"], ["Yuna", "D1A"], ["Sora", "D2B"]]);
const names = (f: Partial<typeof NO_FILTER>) => filterIdols(idols, leagueOf, { ...NO_FILTER, ...f }).map((i) => i.id);

describe("Idol Database filters", () => {
  it("sorts by rating (ties by name) or by name", () => {
    expect(names({})).toEqual(["Mina", "Sora", "Yuna", "Rina"]);
    expect(names({ sort: "name" })).toEqual(["Mina", "Rina", "Sora", "Yuna"]);
  });
  it("filters by group, Soloist, league, reserves, tier, status and nationality", () => {
    expect(names({ group: "solo" })).toEqual(["Sora"]);
    expect(names({ group: "g1" })).toEqual(["Mina", "Yuna", "Rina"]);
    expect(names({ league: "D1A" })).toEqual(["Mina", "Yuna"]);
    expect(names({ league: "reserve" })).toEqual(["Rina"]);
    expect(names({ tier: "A" })).toEqual(["Sora", "Yuna"]);
    expect(names({ status: "inactive" })).toEqual(["Rina"]);
    expect(names({ status: "active", tier: "S" })).toEqual(["Mina"]);
    expect(names({ nationality: "KR" })).toEqual(["Yuna"]);
  });
});
