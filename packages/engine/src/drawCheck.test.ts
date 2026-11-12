import { describe, expect, it } from "vitest";
import { checkGroups, checkKnockout } from "./drawCheck";
import { drawGroups } from "./groupDraw";
import { seedKnockout } from "./knockoutSeeding";
import { matchRng } from "./rng";

const idol = (k: number) => ({ id: `i${k}`, league: `D1${"ABCDEF"[k % 6]}`, groupId: k < 50 ? `g${k % 20}` : null });
const pots = [0, 1, 2, 3].map((p) => Array.from({ length: 16 }, (_, i) => idol(p * 16 + i)));
const potOf = (id: string) => Math.floor(Number(id.slice(1)) / 16);

describe("checkGroups", () => {
  it("a draw from drawGroups has no problems", () => {
    expect(checkGroups(drawGroups(pots, matchRng("d", "1")).groups, potOf).problems).toEqual([]);
  });

  it("finds a short group, two from one pot, and a girl group clash", () => {
    const { groups } = drawGroups(pots, matchRng("d", "2"));
    const edited = groups.map((g) => [...g]);
    edited[0].push(edited[1].pop()!); // A has 5, B has 3
    const { problems } = checkGroups(edited, potOf);
    expect(problems).toContain("Grup A berisi 5 idol, harus 4");
    expect(problems).toContain("Grup B berisi 3 idol, harus 4");
    expect(problems).toContain("Grup A punya dua idol dari pot yang sama");

    const clash = [[{ id: "i0", league: "D1A", groupId: "x" }, { id: "i16", league: "D1B", groupId: "x" }, idol(32), idol(48)]];
    expect(checkGroups(clash, potOf).problems).toEqual(["Grup A punya dua idol dari girl group yang sama"]);
  });

  it("league mates are a warning only", () => {
    const sameLeague = [[idol(0), idol(22), idol(38), idol(54)]]; // all D1A, pots 0–3, different girl groups
    expect(checkGroups(sameLeague, potOf)).toEqual({ problems: [], warnings: ["Grup A punya rekan satu liga"] });
  });
});

describe("checkKnockout", () => {
  const groups = Array.from({ length: 16 }, (_, g) => ({
    winner: { id: `w${g}`, league: `D1${"ABCDEF"[g % 6]}` },
    runnerUp: { id: `r${g}`, league: `D1${"ABCDEF"[(g + 1) % 6]}` },
  }));
  const about = (id: string) => ({ group: Number(id.slice(1)), league: groups[Number(id.slice(1))][id[0] === "w" ? "winner" : "runnerUp"].league, isWinner: id[0] === "w" });

  it("a seeding from seedKnockout has no problems", () => {
    expect(checkKnockout(seedKnockout(groups, matchRng("k", "1")).pairs, about).problems).toEqual([]);
  });

  it("finds two winners together and a group rematch", () => {
    expect(checkKnockout([["w1", "w2"], ["w3", "r3"]], about).problems).toEqual([
      "Match 1 harus juara grup melawan runner-up",
      "Match 2 mempertemukan dua idol dari Grup D",
    ]);
  });
});
