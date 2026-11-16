// @vitest-environment jsdom
import type { Timeline } from "@sabung/engine";
import { IdolSourceProvider } from "@sabung/ui";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SimTimeline } from "./SimTimeline";
import { useSimTimeline } from "./timelineStore";

vi.mock("../../data/branding", () => ({ useBranding: () => ({ label: (k: string) => k, brand: () => ({}) }) }));
afterEach(cleanup);

const d1a: Timeline = {
  track: "D1A",
  points: [
    { comp: "D1A", stage: "LG", round: "MD03", stories: [{ kind: "upset", matchId: "m1", winner: "mina", loser: "yuna", gap: 14 }] },
    { comp: "D1A", stage: "LG", round: "MD07", stories: [{ kind: "new-leader", idol: "mina", league: "D1A", matchday: 7, previous: "yuna" }] },
  ],
  finale: { champions: [{ title: "D1A", idol: "mina", runnerUp: "yuna" }], promoted: [], relegated: ["rei"], qualified: [], path: [], lines: [],
    news: [{ kind: "underdog-champion", idol: "mina", title: "D1A", rating: 78, favourite: "yuna", favouriteRating: 90, above: 9 }] },
};
const ink: Timeline = { track: "INK", points: [{ comp: "INK", stage: "KO", round: "QF", stories: [{ kind: "giant-killer", idol: "rei", comp: "INK", wins: 2 }] }], finale: null };

describe("SimTimeline", () => {
  it("one tab per competition, labelled points in a sideways track, the finale last; Skip goes to the end, Close empties it", () => {
    render(<IdolSourceProvider source={{ idol: (id) => ({ id, name: id, rating: 80 }) as never, photo: () => undefined }}><SimTimeline /></IdolSourceProvider>);
    expect(screen.queryByRole("dialog")).toBeNull();
    act(() => useSimTimeline.getState().show([d1a, ink]));
    expect(screen.getAllByRole("tab").map((t) => t.textContent)).toEqual(["D1A", "INK"]);
    const track = screen.getByRole("list", { name: "Timeline" });
    const points = within(track).getAllByRole("listitem").filter((li) => li.parentElement === track);
    expect(points.map((li) => li.querySelector(".kicker")?.textContent)).toEqual(["Matchday 3", "Matchday 7", "Finale"]);
    expect(within(track).getByText("rei")).toBeTruthy(); // relegated, in the finale
    const news = within(track).getByRole("list", { name: "Biggest news" }); // the top title story, kicker + headline
    expect(within(news).getByText("Kuda hitam · D1A")).toBeTruthy();
    expect(news.textContent).toContain("Kuda Hitam Juara! mina (Rating 78) Kuasai D1A, Lewati 9 Idol Berating Lebih Tinggi; Unggulan yuna (90) Gigit Jari");
    expect(points[0]!.getAttribute("aria-current")).toBe("step");
    fireEvent.click(screen.getByRole("button", { name: "Skip to the end" }));
    expect(points[2]!.getAttribute("aria-current")).toBe("step");
    fireEvent.click(screen.getByRole("tab", { name: "INK" }));
    expect(screen.getByText("QF")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(useSimTimeline.getState().items).toBeNull();
  });
});
