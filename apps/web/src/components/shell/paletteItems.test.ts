import { describe, expect, it } from "vitest";
import { filterItems, paletteItems } from "./paletteItems";

const items = paletteItems();
const labels = (query: string) => filterItems(items, query).map((i) => i.label);

describe("command palette items (PRD §8)", () => {
  it("has every panel, the 9 competitions and the commands", () => {
    expect(items.filter((i) => i.group === "Competitions")).toHaveLength(9);
    expect(items.filter((i) => i.to).length).toBe(20 + 9); // Update 2: + Idol Profile, Season Progression; 2026-11-17: + Ranking, Tier List
    expect(items.filter((i) => i.command).map((i) => i.command)).toEqual(["toggle-rail", "mark-read"]);
    expect(new Set(items.map((i) => i.id)).size).toBe(items.length);
  });

  it("an empty query lists everything", () => {
    expect(filterItems(items, "  ")).toHaveLength(items.length);
  });

  it("ranks a label that starts with the query first, ignoring case", () => {
    expect(labels("NUG")[0]).toBe("Nugu Cup");
    // No label starts with "cup"; the word "Cup" matches, in menu order.
    expect(labels("cup")).toEqual(["Unzure Cup", "Inkigayo Cup", "Nugu Cup", "B-Side Cup", "Daesang Cup", "Music Bank Cup"]);
  });

  it("a word inside the label counts before a match in the middle", () => {
    const result = labels("stat");
    expect(result.slice(0, 2)).toEqual(["Girl Group Stats", "Career Stats"]);
  });

  it("the group name finds a whole space", () => {
    expect(labels("studio")).toEqual(["Input Data", "Rating Manager", "Inactive Manager", "Settings"]);
  });

  it("nothing found is an empty list", () => {
    expect(labels("zzz")).toEqual([]);
  });
});
