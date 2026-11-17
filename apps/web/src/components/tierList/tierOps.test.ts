import { describe, expect, it } from "vitest";
import { POOL, addTier, clearAll, fillByRating, moveTier, newList, place, removeTier, tierOfItem } from "./tierOps";

describe("tier list changes", () => {
  const base = newList("idol", "classic", "Mine");
  const [splus, s] = base.tiers;

  it("a preset gives its rows, each empty", () => {
    expect(base.tiers.map((t) => t.label)).toEqual(["S+", "S", "A", "B", "C", "D", "F"]);
    expect(Object.values(base.placed).every((ids) => ids.length === 0)).toBe(true);
  });

  it("an item lives in one tier; moving it within a tier keeps the drop position", () => {
    let l = place(place(place(base, "a", splus!.id, null), "b", splus!.id, null), "c", splus!.id, 0);
    expect(l.placed[splus!.id]).toEqual(["c", "a", "b"]);
    l = place(l, "c", splus!.id, 3); // dropped after b
    expect(l.placed[splus!.id]).toEqual(["a", "b", "c"]);
    l = place(l, "a", s!.id, null);
    expect(l.placed[splus!.id]).toEqual(["b", "c"]);
    expect(tierOfItem(l, "a")).toBe(s!.id);
    expect(tierOfItem(place(l, "a", POOL, null), "a")).toBe(POOL);
  });

  it("removing a tier sends its items to the pool; tiers move and get added", () => {
    let l = place(base, "a", s!.id, null);
    l = removeTier(l, s!.id);
    expect(tierOfItem(l, "a")).toBe(POOL);
    expect(moveTier(l, l.tiers[1]!.id, -1).tiers[0]!.id).toBe(l.tiers[1]!.id);
    expect(moveTier(l, l.tiers[0]!.id, -1)).toBe(l); // already on top
    expect(addTier(l).tiers).toHaveLength(7);
    expect(Object.values(clearAll(place(l, "x", splus!.id, null)).placed).flat()).toEqual([]);
  });

  it("fill by rating only places pool items whose tier exists", () => {
    let l = place(base, "kept", splus!.id, null);
    l = fillByRating(l, [{ id: "kept", rating: 60 }, { id: "x", rating: 97 }, { id: "y", rating: 70 }]);
    expect(l.placed[splus!.id]).toEqual(["kept", "x"]);
    expect(tierOfItem(l, "y")).toBe(l.tiers[4]!.id); // C
    const blank = fillByRating(newList("idol", "blank", "B"), [{ id: "x", rating: 97 }]);
    expect(tierOfItem(blank, "x")).toBe(POOL);
  });
});
