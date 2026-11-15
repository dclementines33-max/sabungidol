// @vitest-environment jsdom
import { IdolSourceProvider } from "@sabung/ui";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SimTimeline } from "./SimTimeline";
import { useSimTimeline } from "./timelineStore";

vi.mock("../../data/branding", () => ({ useBranding: () => ({ label: (k: string) => k, brand: () => ({}) }) }));
afterEach(cleanup);

describe("SimTimeline", () => {
  it("shows nothing until a bulk play sends highlights; Skip shows all at once, Close empties it", () => {
    render(<IdolSourceProvider source={{ idol: (id) => ({ id, name: id, rating: 80 }) as never, photo: () => undefined }}><SimTimeline /></IdolSourceProvider>);
    expect(screen.queryByRole("dialog")).toBeNull();
    act(() => useSimTimeline.getState().show([
      { at: 1, story: { kind: "upset", matchId: "m1", winner: "mina", loser: "yuna", gap: 12 } },
      { at: 2, story: { kind: "champion", idol: "mina", title: "D1A", runnerUp: "yuna" } },
    ]));
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[1]!.style.animationDelay).not.toBe("0ms"); // the second rises later
    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    expect(screen.getAllByRole("listitem").every((li) => li.style.animationDelay === "0ms")).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(useSimTimeline.getState().items).toBeNull();
  });
});
