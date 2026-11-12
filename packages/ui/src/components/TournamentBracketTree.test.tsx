// @vitest-environment jsdom
import { idolsPlayoffTemplate, knockoutTemplate, resolveBracket, runBracket } from "@sabung/engine";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IdolSourceProvider } from "./idolSource";
import { TournamentBracketTree } from "./TournamentBracketTree";

afterEach(cleanup);

const ids = (n: number) => Array.from({ length: n }, (_, i) => `s${i + 1}`);
const source = { idol: (id: string) => ({ id, name: `Idol ${id.slice(1)}`, groupName: null, rating: 70 }), photo: () => undefined };
const show = (ui: React.ReactNode) => render(<IdolSourceProvider source={source}>{ui}</IdolSourceProvider>);
const played = (template: ReturnType<typeof knockoutTemplate>, n: number) =>
  resolveBracket(template, ids(n), new Map(runBracket(template, ids(n), (_, a, b) => (Number(a.slice(1)) < Number(b.slice(1)) ? "A" : "B")).map((r) => [r.key, { winner: r.winner, score: "2–0" }])));

describe("TournamentBracketTree (PRD §9)", () => {
  it("shows one column per round, with TBD for sides not decided yet", () => {
    show(<TournamentBracketTree cells={resolveBracket(knockoutTemplate([16]), ids(16), new Map())} />);
    expect(screen.getAllByRole("list").map((l) => l.getAttribute("aria-label"))).toEqual(["Ronde R1", "Ronde QF", "Ronde SF", "Ronde F"]);
    expect(within(screen.getByRole("list", { name: "Ronde F" })).getAllByText("TBD")).toHaveLength(2);
  });

  it("double elimination gets upper, lower and final sections", () => {
    show(<TournamentBracketTree cells={played(idolsPlayoffTemplate(), 10)} />);
    for (const name of ["Upper bracket", "Lower bracket", "Final"]) expect(screen.getByRole("region", { name })).toBeTruthy();
  });

  it("highlights one idol's path and dims the rest", () => {
    const { container } = show(<TournamentBracketTree cells={played(knockoutTemplate([16]), 16)} highlightIdol="s1" />);
    expect(container.querySelectorAll('[data-involved="true"]')).toHaveLength(4); // s1 wins every round: R1, QF, SF, F
    expect(container.querySelectorAll(".opacity-40")).toHaveLength(11);
  });

  it("zoom steps and resets, and a match can be opened", () => {
    const onMatchClick = vi.fn();
    show(<TournamentBracketTree cells={played(knockoutTemplate([16]), 16)} onMatchClick={onMatchClick} />);
    fireEvent.click(screen.getByRole("button", { name: "Perbesar" }));
    expect(screen.getByText("125%")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getByText("100%")).toBeTruthy();
    fireEvent.click(within(screen.getByRole("list", { name: "Ronde F" })).getByRole("button"));
    expect(onMatchClick).toHaveBeenCalledWith(expect.objectContaining({ key: "FN-F-1", winner: "s1" }));
  });
});
