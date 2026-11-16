// @vitest-environment jsdom
import { IdolSourceProvider } from "@sabung/ui";
import { act, cleanup, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LineRace } from "../charts/LineRace";
import { ReplayControls } from "./ReplayControls";
import { TimingTower, tower } from "./TimingTower";
import { REPLAY_STEP_MS, useReplay } from "./useReplay";

afterEach(() => { cleanup(); vi.useRealTimers(); });
const source = { idol: (id: string) => ({ id, name: id, rating: 80 }) as never, photo: () => undefined };

describe("replay", () => {
  it("shows the latest matchday until Play; Play runs to the end and stops; Replay starts at 1; seek pauses", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useReplay(3));
    expect(result.current.day).toBe(3);
    act(() => result.current.toggle()); // from the end: back to matchday 1, playing
    expect([result.current.day, result.current.playing]).toEqual([1, true]);
    act(() => { vi.advanceTimersByTime(REPLAY_STEP_MS); });
    expect(result.current.day).toBe(2);
    act(() => { vi.advanceTimersByTime(REPLAY_STEP_MS * 5); });
    expect([result.current.day, result.current.playing]).toEqual([3, false]);
    act(() => result.current.replay());
    act(() => result.current.seek(2));
    act(() => { vi.advanceTimersByTime(REPLAY_STEP_MS * 3); });
    expect([result.current.day, result.current.playing]).toEqual([2, false]);
  });

  it("controls: Play/Pause and a matchday scrubber", () => {
    const r = { day: 2, total: 38, playing: false, toggle: vi.fn(), replay: vi.fn(), seek: vi.fn() };
    render(<ReplayControls r={r} label="Title race" />);
    expect(screen.getByText("Matchday 2 / 38")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    fireEvent.change(screen.getByRole("slider", { name: "Title race matchday" }), { target: { value: "20" } });
    expect([r.toggle.mock.calls.length, r.seek.mock.calls[0]]).toEqual([1, [20]]);
  });

  it("tower: standings at a matchday with movement and gap; rows placed by rank", () => {
    const view = {
      roster: ["a", "b", "c"],
      positions: { a: [1, 2], b: [2, 1], c: [3, 3] },
      fixtures: [
        { round: "MD01", matches: [{ idolA: "a", idolB: "c", scoreA: 2, scoreB: 0 }] },
        { round: "MD02", matches: [{ idolA: "b", idolB: "c", scoreA: 2, scoreB: 0 }, { idolA: "b", idolB: "a", scoreA: 2, scoreB: 1 }] },
      ],
    };
    const rows = tower(view, 2);
    expect(rows).toEqual([{ idolId: "b", rank: 1, moved: 1, points: 6, gap: 0 }, { idolId: "a", rank: 2, moved: -1, points: 3, gap: 3 }, { idolId: "c", rank: 3, moved: 0, points: 0, gap: 6 }]);
    render(<IdolSourceProvider source={source}><TimingTower rows={rows} label="Standings D1A after matchday 2" /></IdolSourceProvider>);
    const items = screen.getAllByRole("listitem");
    expect(items.map((li) => li.textContent)).toEqual(["1▲1up 1b6Leader", "2▼1down 1a3−3", "3–no changec0−6"]);
    expect(items[1]!.style.transform).toBe("translateY(30px)");
  });

  it("line race up to a matchday: only the first points are drawn", () => {
    render(<IdolSourceProvider source={source}><LineRace label="Race" series={[{ id: "a", values: [0, 3, 6, 9] }]} upTo={2} /></IdolSourceProvider>);
    expect(document.querySelector("polyline")!.getAttribute("points")!.split(" ")).toHaveLength(2);
    expect(screen.getByText("a 3")).toBeTruthy();
  });
});
