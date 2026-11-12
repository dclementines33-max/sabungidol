// @vitest-environment jsdom
import type { Side } from "@sabung/engine";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SampleIdols } from "./sampleIdols";
import { SPIN_MS, WheelPicker } from "./WheelPicker";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function Harness({ bestOf, sequence }: { bestOf: 3 | 4 | 5 | 7; sequence: number[] }) {
  const [games, setGames] = useState<Side[]>([]);
  let i = 0;
  return (
    <SampleIdols>
      <WheelPicker idolA="mina" idolB="yuna" bestOf={bestOf} games={games} onChange={setGames} random={() => sequence[i++ % sequence.length]} />
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

  it("Spin all finishes the series, and spinning stops when it is over", () => {
    render(<Harness bestOf={5} sequence={[0.7, 0.2]} />); // B, A, B, A, B
    fireEvent.click(screen.getByRole("button", { name: "Spin all" }));
    expect(screen.getByText(/2–3/).textContent).toContain("Yuna menang");
    expect((screen.getByRole("button", { name: /Spin game/ }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("Bo4 can end level at 2–2", () => {
    render(<Harness bestOf={4} sequence={[0.2, 0.7]} />); // A, B, A, B
    fireEvent.click(screen.getByRole("button", { name: "Spin all" }));
    expect(screen.getByText(/2–2/).textContent).toContain("Seri");
  });
});
