// @vitest-environment jsdom
import { matchRng, runSwiss } from "@sabung/engine";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { IdolSourceProvider } from "./idolSource";
import { SwissPlayInBracket } from "./SwissPlayInBracket";

afterEach(cleanup);

const seeds = Array.from({ length: 16 }, (_, i) => `s${i + 1}`);
const source = { idol: (id: string) => ({ id, name: `Idol ${id.slice(1)}`, groupName: null, rating: 70 }), photo: () => undefined };
const rng = matchRng("swiss-ui", "1");
const rounds = runSwiss(seeds, rng, () => (rng.next() < 0.5 ? "A" : "B")).matches;

describe("SwissPlayInBracket (PRD §9)", () => {
  it("has a column per round, grouped by record", () => {
    render(<IdolSourceProvider source={source}><SwissPlayInBracket group="A" seededIds={seeds} rounds={rounds} /></IdolSourceProvider>);
    expect(screen.getByText("Round 1")).toBeTruthy();
    expect(screen.getByText("Round 5")).toBeTruthy();
    expect(screen.getAllByText("0–0")).toHaveLength(1);
    expect(screen.getAllByText("1–0")).toHaveLength(1);
  });

  it("result column: 5 through, 3 to the LCQ, 8 out", () => {
    render(<IdolSourceProvider source={source}><SwissPlayInBracket group="A" seededIds={seeds} rounds={rounds} /></IdolSourceProvider>);
    const results = within(screen.getByRole("list", { name: "Swiss results" })).getAllByRole("listitem").map((li) => li.textContent);
    expect(results.filter((t) => t?.endsWith("Through"))).toHaveLength(5);
    expect(results.filter((t) => t?.endsWith("LCQ"))).toHaveLength(3);
    expect(results.filter((t) => t?.endsWith("Out"))).toHaveLength(8);
  });
});
