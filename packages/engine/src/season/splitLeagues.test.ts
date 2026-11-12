import { describe, expect, it } from "vitest";
import { splitLeagues } from "./splitLeagues";

// 242 idols like the default data: ratings 48–98, names to break ties.
const idols = Array.from({ length: 242 }, (_, i) => ({ id: `i${i}`, name: `Idol ${String(i).padStart(3, "0")}`, rating: 98 - Math.floor(i / 5) }));
const rating = new Map(idols.map((i) => [i.id, i.rating]));
const avg = (ids: string[]) => ids.reduce((s, id) => s + rating.get(id)!, 0) / ids.length;

describe("league split (Data Maker, approved rule)", () => {
  const { leagues, reserves } = splitLeagues(idols);
  const d1 = ["D1A", "D1B", "D1C", "D1D", "D1E", "D1F"] as const;
  const d2 = ["D2A", "D2B", "D2C", "D2D", "D2E", "D2F"] as const;

  it("fills 12 leagues with exactly 20 different idols, the rest are reserves", () => {
    expect(Object.values(leagues).map((ids) => ids.length)).toEqual(Array(12).fill(20));
    expect(new Set(Object.values(leagues).flat()).size).toBe(240);
    expect(reserves).toEqual(["i240", "i241"]);
  });

  it("puts the 120 best in Division 1", () => {
    const lowestD1 = Math.min(...d1.flatMap((c) => leagues[c]).map((id) => rating.get(id)!));
    const highestD2 = Math.max(...d2.flatMap((c) => leagues[c]).map((id) => rating.get(id)!));
    expect(lowestD1).toBeGreaterThanOrEqual(highestD2);
  });

  it("keeps the leagues of a division equally strong", () => {
    for (const division of [d1, d2]) {
      const averages = division.map((c) => avg(leagues[c]));
      expect(Math.max(...averages) - Math.min(...averages)).toBeLessThan(1);
    }
  });

  it("breaks rating ties by name and gives the same split every time", () => {
    const tied = [...idols].map((i) => ({ ...i, rating: 70 }));
    expect(splitLeagues(tied).reserves).toEqual(["i240", "i241"]); // Idol 240, Idol 241 sort last by name
    expect(splitLeagues([...idols].reverse())).toEqual(splitLeagues(idols));
  });

  it("refuses fewer than 240 idols with a clear message", () => {
    expect(() => splitLeagues(idols.slice(0, 239))).toThrow("minimal 240 idol aktif, sekarang ada 239");
  });
});
