import { describe, expect, it } from "vitest";
import { judgeBatch, judgeIdol } from "./idolRules";
import { idolInputSchema } from "./idolSchema";

const existing = [{ name: "Mina", groupName: "TWICE" }, { name: "Yuna", groupName: null }];

describe("idol rules (PRD §8, §14.3)", () => {
  it("a new name is green", () => {
    expect(judgeIdol({ name: "Karina", groupName: "aespa" }, existing)).toMatchObject({ status: "new", reasons: [] });
  });

  it("same name in the same group (any case, any spaces) is a red exact duplicate", () => {
    expect(judgeIdol({ name: "  mina ", groupName: "twice" }, existing)).toEqual({ status: "duplicate", reasons: ["Duplikat persis: Mina (TWICE) sudah ada"] });
  });

  it("two soloists with the same name are a duplicate too", () => {
    expect(judgeIdol({ name: "YUNA", groupName: null }, existing).status).toBe("duplicate");
  });

  it("same name in another group is a yellow warning, not a refusal", () => {
    expect(judgeIdol({ name: "Mina", groupName: "Aurora" }, existing))
      .toMatchObject({ status: "warning", reasons: ["Nama sama dengan Mina (TWICE) — dianggap idol berbeda"] });
  });

  it("a rating outside 0–100 is a warning with the value that will be used", () => {
    expect(judgeIdol({ name: "New", groupName: null, rating: 120 }, existing))
      .toEqual({ status: "warning", reasons: ["Rating 120 di luar 0–100, dipakai 100"], rating: 100 });
    expect(judgeIdol({ name: "Newer", groupName: null, rating: -3 }, existing).rating).toBe(0);
  });

  it("a batch also catches duplicates between its own lines", () => {
    const verdicts = judgeBatch([{ name: "Wonyoung", groupName: "IVE" }, { name: "wonyoung", groupName: "IVE" }], existing);
    expect(verdicts.map((v) => v.status)).toEqual(["new", "duplicate"]);
  });
});

describe("idol schema (what may be saved)", () => {
  it("accepts a full idol and fills missing optional fields", () => {
    expect(idolInputSchema.parse({ name: " Jang Wonyoung ", groupName: "IVE", rating: 92 }))
      .toEqual({ name: "Jang Wonyoung", groupName: "IVE", rating: 92, seed: null, nationality: null, birthday: null });
  });

  it("refuses an empty name, a fractional or out-of-range rating, and a bad date", () => {
    for (const bad of [
      { name: " ", groupName: null, rating: 70 },
      { name: "A", groupName: null, rating: 70.5 },
      { name: "A", groupName: null, rating: 101 },
      { name: "A", groupName: null, rating: 70, birthday: "12-11-2004" },
      { name: "A", groupName: null, rating: 70, nationality: "Korea" },
    ]) expect(idolInputSchema.safeParse(bad).success).toBe(false);
  });
});
