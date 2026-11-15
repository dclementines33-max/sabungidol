// @vitest-environment jsdom
import { IdolSourceProvider } from "@sabung/ui";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GrandFinalCelebration } from "./GrandFinalCelebration";
import { useCelebration } from "./celebrationStore";

const row = (id: string, comp: string, stage: string, round: string, idolB: string) => ({ id, seasonId: "s1", comp, stage, round, idolA: "mina", idolB, scoreA: 3, scoreB: 1, result: "A", ratingA: 90, ratingB: 85 });
vi.mock("../../data/seasonQuery", () => ({ useCurrentSeason: () => ({ id: "s1" }) }));
vi.mock("../../data/engineClient", () => ({ engine: () => ({ matchPage: async () => ({ rows: [row("f", "UZC", "KO", "F", "yuna"), row("w", "SWS", "SW", "R1", "aki"), row("q", "UZC", "KO", "QF", "rei")] }) }) }));
afterEach(cleanup);

describe("GrandFinalCelebration", () => {
  it("names the champion, lists the run in order (Swiss first, final last), and Continue closes it", async () => {
    render(<IdolSourceProvider source={{ idol: (id) => ({ id, name: id, rating: 80 }) as never, photo: () => undefined }}><GrandFinalCelebration /></IdolSourceProvider>);
    expect(screen.queryByRole("dialog")).toBeNull();
    act(() => useCelebration.getState().show({ champion: "mina", runnerUp: "yuna", score: "3–1" }));
    expect(screen.getByRole("dialog", { name: "mina" })).toBeTruthy();
    const steps = await screen.findAllByRole("listitem");
    expect(steps.map((li) => li.textContent)).toEqual(["Swiss R1W 3–1 vs aki", "Quarter-finalW 3–1 vs rei", "FinalW 3–1 vs yuna"]);
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(useCelebration.getState().now).toBeNull();
  });
});
