// @vitest-environment jsdom
import type { Timeline } from "@sabung/engine";
import { IdolSourceProvider } from "@sabung/ui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
    news: [{ title: "D1A", stories: [{ kind: "underdog-champion", idol: "mina", title: "D1A", rating: 78, favourite: "yuna", favouriteRating: 90, above: 9 }], summary: null }] },
};
const ink: Timeline = { track: "INK", points: [{ comp: "INK", stage: "KO", round: "QF", stories: [{ kind: "giant-killer", idol: "rei", comp: "INK", wins: 2 }] }], finale: null };

describe("SimTimeline", () => {
  it("full screen; a league is a broadcast (cards revealed by the clock, live standings), a cup a news page; Skip, Close", () => {
    render(<QueryClientProvider client={new QueryClient()}><IdolSourceProvider source={{ idol: (id) => ({ id, name: id, rating: 80 }) as never, photo: () => undefined }}><SimTimeline /></IdolSourceProvider></QueryClientProvider>);
    expect(screen.queryByRole("dialog")).toBeNull();
    act(() => useSimTimeline.getState().show([d1a, ink]));
    expect(screen.getAllByRole("tab").map((t) => t.textContent)).toEqual(["D1A", "INK"]);
    expect(document.querySelector(".fixed.inset-0.bg-bg-base")).toBeTruthy(); // opaque backdrop: nothing behind shows
    expect(screen.getByRole("region", { name: "Live standings" }).textContent).toContain("after matchday 3");
    const track = screen.getByRole("list", { name: "Timeline" });
    const points = within(track).getAllByRole("listitem").filter((li) => li.parentElement === track);
    expect(points.map((li) => li.querySelector(".kicker")?.textContent)).toEqual(["Matchday 3", "Matchday 7", "Finale"]);
    expect(within(track).queryByText("rei")).toBeNull(); // the finale stays hidden until the clock gets there
    expect(points[0]!.getAttribute("aria-current")).toBe("step");
    fireEvent.click(screen.getByRole("button", { name: "Skip to the end" }));
    expect(points[2]!.getAttribute("aria-current")).toBe("step");
    expect(within(track).getByText("rei")).toBeTruthy(); // relegated, in the finale
    const news = within(track).getByRole("list", { name: "Biggest news" }); // the top title story, kicker + headline
    expect(within(news).getByText("Kuda hitam · D1A")).toBeTruthy();
    expect(news.textContent).toContain("Kuda Hitam Juara! mina (Rating 78) Kuasai D1A, Lewati 9 Idol Berating Lebih Tinggi; Unggulan yuna (90) Gigit Jari");
    fireEvent.click(screen.getByRole("tab", { name: "INK" }));
    expect(screen.getByRole("region", { name: "QF" }).textContent).toContain("Pembunuh Raksasa! rei"); // news card, no timeline
    expect(screen.queryByRole("list", { name: "Timeline" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(useSimTimeline.getState().items).toBeNull();
  });

  it("whole season: a review (headlines, every champion with one line, up and down, key moments), no sideways track", () => {
    const season: Timeline = {
      track: null,
      points: [{ comp: "INK", stage: "KO", round: "QF", stories: [{ kind: "shock-exit", matchId: "q", winner: "rei", loser: "yuna", comp: "INK", round: "QF", gap: 9 }, { kind: "giant-killer", idol: "rei", comp: "INK", wins: 2 }] }],
      finale: {
        champions: [], promoted: ["sol"], relegated: ["rei"], qualified: [], path: [], lines: [],
        news: [
          { title: "D1A", stories: [{ kind: "title-race", idol: "mina", runnerUp: "yuna", title: "D1A", margin: 0, how: "level" }], summary: { kind: "title-summary", idol: "mina", runnerUp: "yuna", title: "D1A", points: 80, margin: 0, score: null } },
          { title: "INK", stories: [], summary: { kind: "title-summary", idol: "rei", runnerUp: "mina", title: "INK", points: null, margin: null, score: "3–1" } },
        ],
      },
    };
    render(<QueryClientProvider client={new QueryClient()}><IdolSourceProvider source={{ idol: (id) => ({ id, name: id, rating: 80 }) as never, photo: () => undefined }}><SimTimeline /></IdolSourceProvider></QueryClientProvider>);
    act(() => useSimTimeline.getState().show([season]));
    expect(screen.queryByRole("list", { name: "Timeline" })).toBeNull();
    expect(within(screen.getByRole("region", { name: "Season headlines" })).getByText(/Sama Poin, Beda Nasib! mina Juara D1A/)).toBeTruthy();
    const champions = screen.getByRole("region", { name: "Champions" });
    expect(within(champions).getByText(/mina Juara D1A dengan 80 Poin/)).toBeTruthy(); // its story is a headline already: the summary
    expect(within(champions).getByText(/rei Juara INK, Kalahkan mina 3–1 di Final/)).toBeTruthy(); // no story: the summary
    expect(screen.getByRole("region", { name: "Promotion and relegation" }).textContent).toContain("sol");
    const moments = screen.getByRole("region", { name: "Key moments" });
    expect(within(moments).getAllByRole("listitem")).toHaveLength(1); // the shock exit; the timeline-only giant-killer is left out
  });
});
