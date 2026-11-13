import type { MatchRef } from "@sabung/engine";
import { describe, expect, it } from "vitest";
import { allows } from "./seasonRunner";

const ref = (comp: string, stage: string, round: string) => ({ id: `${comp}-${round}`, comp, stage, round }) as unknown as MatchRef;

describe("allows", () => {
  it("plays one round of every group, or one round of several cups", () => {
    const step = allows({ kind: "comps", comps: ["SWS"], round: "R1" }, []);
    expect([ref("SWS", "SW", "A-R1"), ref("SWS", "SW", "P-R1"), ref("SWS", "SW", "A-R2"), ref("LCQ", "LQ", "A-R1")].map(step)).toEqual([true, true, false, false]);
    const bside = allows({ kind: "comps", comps: ["BSA", "BSB"], round: "QF" }, []);
    expect([ref("BSA", "KO", "QF"), ref("BSB", "KO", "QF"), ref("BSA", "KO", "SF"), ref("BSC", "KO", "QF")].map(bside)).toEqual([true, true, false, false]);
    expect(allows({ kind: "comps", comps: ["NUG"] }, [])(ref("NUG", "KO", "R9"))).toBe(true);
  });
});
