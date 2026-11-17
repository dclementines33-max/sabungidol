import { describe, expect, it } from "vitest";
import { ARENAS, arenaOfGame, drawArenas } from "./arenas";

describe("drawArenas", () => {
  it("draws one arena from the pool for a normal match", () => {
    for (let i = 0; i < 20; i++) expect(["jeju", "kings"]).toContain(drawArenas(["jeju", "kings"], false, 5)[0]);
    expect(drawArenas(["jeju"], false, 7)).toEqual(["jeju"]);
  });
  it("gives a grand final a different arena every game, repeating only when the pool is small", () => {
    const five = drawArenas(ARENAS.map((a) => a.id), true, 5);
    expect(new Set(five).size).toBe(5);
    expect(drawArenas(["jeju", "kings"], true, 4).slice(0, 2).sort()).toEqual(["jeju", "kings"]);
  });
  it("falls back to every arena when the pool is empty or unknown", () => {
    expect(ARENAS.map((a) => a.id)).toContain(drawArenas(["nope"], false, 3)[0]);
  });
  it("finds the arena of a game", () => {
    expect(arenaOfGame(["jeju"], 4)).toBe("jeju");
    expect(arenaOfGame(["jeju", "kings", "sky"], 1)).toBe("kings");
  });
});
