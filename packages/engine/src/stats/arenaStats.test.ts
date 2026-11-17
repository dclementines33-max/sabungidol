import { describe, expect, it } from "vitest";
import { type ArenaRow, arenaHonours, arenaNews, arenaUsage, idolArenaRecords } from "./arenaStats";

const row = (a: string, b: string, result: "A" | "B" | "D", arenas: string[], games: ("A" | "B")[] = [], rating = 80): ArenaRow =>
  ({ seasonId: "S01", idolA: a, idolB: b, result, games, arenas, ratingA: rating, ratingB: 80 });

describe("arena stats", () => {
  it("counts W-D-L per idol per arena; a grand final counts each game on its own arena", () => {
    const rec = idolArenaRecords([row("x", "y", "A", ["jeju"]), row("x", "y", "D", ["jeju"]), row("x", "y", "B", ["sky", "jeju", "kings"], ["B", "A", "B"])]);
    expect(rec.get("x")!.get("jeju")).toEqual({ w: 2, d: 1, l: 0 });
    expect(rec.get("x")!.get("sky")).toEqual({ w: 0, d: 0, l: 1 });
    expect(rec.get("y")!.get("kings")).toEqual({ w: 1, d: 0, l: 0 });
    expect(arenaUsage([row("x", "y", "A", ["jeju"]), row("x", "y", "B", ["jeju", "jeju", "sky"], ["B", "B", "B"])])).toEqual(new Map([["jeju", 2], ["sky", 1]]));
  });

  it("names the honours: most used arena, ruler, globetrotter, specialist", () => {
    const rows = [
      ...Array.from({ length: 5 }, () => row("x", "y", "A", ["jeju"])),
      row("z", "y", "A", ["sky"]), row("z", "y", "A", ["kings"]), row("z", "y", "A", ["seoul"]),
    ];
    expect(arenaHonours(rows)).toEqual({
      mostUsed: { arena: "jeju", matches: 5 },
      ruler: { idol: "x", arena: "jeju", wins: 5 },
      globetrotter: { idol: "z", arenas: 3 },
      specialist: { idol: "x", arena: "jeju", pct: 1, played: 5 },
    });
    expect(arenaHonours([])).toEqual({ mostUsed: null, ruler: null, globetrotter: null, specialist: null });
  });

  it("finds fortresses (4+ wins, unbeaten) and curses (85+ rated, 3+ losses, no win)", () => {
    const rows = [
      ...Array.from({ length: 4 }, () => row("x", "y", "A", ["jeju"])),
      ...Array.from({ length: 3 }, () => row("star", "y", "B", ["sky"], [], 92)),
      ...Array.from({ length: 3 }, () => row("mid", "y", "B", ["sky"], [], 80)),
    ];
    expect(arenaNews(rows)).toEqual([
      { kind: "arena-fortress", idol: "y", arena: "sky", wins: 6, draws: 0 },
      { kind: "arena-fortress", idol: "x", arena: "jeju", wins: 4, draws: 0 },
      { kind: "arena-curse", idol: "star", arena: "sky", losses: 3, rating: 92 },
    ]);
  });
});
