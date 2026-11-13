import { readFileSync } from "node:fs";
import { idolInputSchema, judgeBatch } from "@sabung/shared";
import { describe, expect, it } from "vitest";
import { seedIdols } from "./seedData";

// The real default data file, as it is committed.
const file = JSON.parse(readFileSync(new URL("../../../../seed/idols.json", import.meta.url), "utf8"));

describe("default idol data (seed/idols.json)", () => {
  const idols = seedIdols(file);

  it("keeps all 242 idols with name, group, rating and photo only", () => {
    expect(idols).toHaveLength(242);
    expect(Object.keys(idols[0]).sort()).toEqual(["groupName", "name", "photo", "rating"]);
    expect(idols[0]).toMatchObject({ name: "Jang Wonyoung", groupName: "IVE" });
  });

  it("turns Solo / Independent into soloists and keeps 43 groups", () => {
    expect(idols.filter((i) => i.groupName === null)).toHaveLength(6);
    expect(new Set(idols.flatMap((i) => (i.groupName ? [i.groupName] : []))).size).toBe(43);
  });

  it("every idol is valid to save and none is a duplicate", () => {
    for (const i of idols) expect(idolInputSchema.safeParse({ name: i.name, groupName: i.groupName, rating: i.rating }).success).toBe(true);
    expect(judgeBatch(idols, []).filter((v) => v.status === "duplicate")).toEqual([]);
  });

  it("refuses a file that is not idol data instead of loading half of it", () => {
    expect(() => seedIdols({ idols: [] })).toThrow();
    expect(() => seedIdols({ idols: [{ name: "A", rating: 70, photoUrl: "https://example.com/a.jpg" }] })).toThrow();
  });
});

describe("default idol details (seed/idol-details.json, Update 3)", () => {
  const details = JSON.parse(readFileSync(new URL("../../../../seed/idol-details.json", import.meta.url), "utf8")) as { name: string; group: string | null; birthday: string; nationality: string; role?: string }[];
  it("covers every default idol once, with a valid birthday, nationality and role", () => {
    const key = (name: string, group: string | null) => `${name.toLowerCase()}|${(group ?? "").toLowerCase()}`;
    expect(details.map((d) => key(d.name, d.group)).sort()).toEqual(seedIdols(file).map((i) => key(i.name, i.groupName)).sort());
    for (const d of details) expect(idolInputSchema.pick({ birthday: true, nationality: true, role: true }).safeParse(d).success).toBe(true);
  });
});
