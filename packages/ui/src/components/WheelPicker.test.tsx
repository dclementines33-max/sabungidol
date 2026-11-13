// @vitest-environment jsdom
import type { Side } from "@sabung/engine";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useRef, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SampleIdols } from "./sampleIdols";
import { PAUSE_MS, SPIN_MS, WheelPicker } from "./WheelPicker";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function Harness({ bestOf, sequence }: { bestOf: 3 | 4 | 5 | 7; sequence: number[] }) {
  const [games, setGames] = useState<Side[]>([]);
  const i = useRef(0);
  return (
    <SampleIdols>
      <WheelPicker idolA="mina" idolB="yuna" bestOf={bestOf} games={games} onChange={setGames} random={() => sequence[i.current++ % sequence.length]} />
    </SampleIdols>
  );
}

describe("WheelPicker (PRD §9)", () => {
  it("each spin decides one game after the wheel stops", () => {
    vi.useFakeTimers();
    render(<Harness bestOf={3} sequence={[0.2]} />);
    fireEvent.click(screen.getByRole("button", { name: "Spin game 1" }));
    expect(screen.getByText("0–0")).toBeTruthy(); // still spinning
    act(() => vi.advanceTimersByTime(SPIN_MS));
    expect(screen.getByText("1–0")).toBeTruthy();
  });

  it("Spin all spins once per game until the series is over (Bo5: five spins for 2–3)", () => {
    vi.useFakeTimers();
    render(<Harness bestOf={5} sequence={[0.7, 0.2]} />); // B, A, B, A, B
    fireEvent.click(screen.getByRole("button", { name: "Spin all" }));
    act(() => vi.advanceTimersByTime(SPIN_MS));
    expect(screen.getByText("0–1")).toBeTruthy(); // one game per spin, not all at once
    for (let i = 0; i < 4; i++) act(() => vi.advanceTimersByTime(PAUSE_MS + SPIN_MS));
    expect(screen.getByText(/2–3/).textContent).toContain("Yuna menang");
    expect((screen.getByRole("button", { name: /Spin game/ }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("Bo4 can end level at 2–2", () => {
    vi.useFakeTimers();
    render(<Harness bestOf={4} sequence={[0.2, 0.7]} />); // A, B, A, B
    fireEvent.click(screen.getByRole("button", { name: "Spin all" }));
    for (let i = 0; i < 4; i++) act(() => vi.advanceTimersByTime(PAUSE_MS + SPIN_MS));
    expect(screen.getByText(/2–2/).textContent).toContain("Seri");
  });
});
