// @vitest-environment jsdom
import type { Side } from "@sabung/engine";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useRef, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SampleIdols } from "./sampleIdols";
import { PAUSE_MS, SPIN_MS, TENSE_MS, WheelPicker } from "./WheelPicker";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function Harness({ bestOf, sequence, grand, idolB = "yuna" }: { bestOf: 3 | 4 | 5 | 7; sequence: number[]; grand?: boolean; idolB?: string }) {
  const [games, setGames] = useState<Side[]>([]);
  const i = useRef(0);
  return (
    <SampleIdols>
      <WheelPicker idolA="mina" idolB={idolB} bestOf={bestOf} games={games} onChange={setGames} random={() => sequence[i.current++ % sequence.length]!} grand={grand} />
    </SampleIdols>
  );
}
const runAll = () => { for (let i = 0; i < 10; i++) act(() => vi.advanceTimersByTime(PAUSE_MS + TENSE_MS)); };

describe("WheelPicker (2026-11-15)", () => {
  it("each spin decides one game when the wheel stops", () => {
    vi.useFakeTimers();
    render(<Harness bestOf={3} sequence={[0.2]} />);
    fireEvent.click(screen.getByRole("button", { name: "Spin game 1" }));
    expect(screen.getByText("0–0")).toBeTruthy(); // still turning
    act(() => vi.advanceTimersByTime(SPIN_MS));
    expect(screen.getByText("1–0")).toBeTruthy();
  });

  it("match point: the call shows and the next spin takes longer", () => {
    vi.useFakeTimers();
    render(<Harness bestOf={3} sequence={[0.2, 0.7]} />);
    fireEvent.click(screen.getByRole("button", { name: "Spin game 1" }));
    act(() => vi.advanceTimersByTime(SPIN_MS));
    expect(screen.getByText("match point")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Spin game 2" }));
    act(() => vi.advanceTimersByTime(SPIN_MS));
    expect(screen.getByText("1–0")).toBeTruthy(); // not stopped yet: a tense spin
    act(() => vi.advanceTimersByTime(TENSE_MS - SPIN_MS));
    expect(screen.getByText("1–1")).toBeTruthy();
    expect(screen.getByText("decider")).toBeTruthy();
  });

  it("Spin all spins once per game until the series is over (Bo5: 2–3), then names the winner", () => {
    vi.useFakeTimers();
    render(<Harness bestOf={5} sequence={[0.7, 0.2]} />); // B, A, B, A, B
    fireEvent.click(screen.getByRole("button", { name: "Spin all" }));
    act(() => vi.advanceTimersByTime(1));
    act(() => vi.advanceTimersByTime(SPIN_MS));
    expect(screen.getByText("0–1")).toBeTruthy(); // one game per spin, not all at once
    runAll();
    expect(screen.getByText("2–3")).toBeTruthy();
    expect(screen.getByText("Yuna wins")).toBeTruthy();
    expect((screen.getByRole("button", { name: /Spin game/ }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("Bo4 can end level at 2–2", () => {
    vi.useFakeTimers();
    render(<Harness bestOf={4} sequence={[0.2, 0.7]} />); // A, B, A, B
    fireEvent.click(screen.getByRole("button", { name: "Spin all" }));
    runAll();
    expect(screen.getByText("2–2")).toBeTruthy();
    expect(screen.getByText("Draw")).toBeTruthy();
  });

  it("an upset (a 10+ rating gap) gets the stamp", () => {
    vi.useFakeTimers();
    render(<Harness bestOf={3} sequence={[0.9]} idolB="sora" />); // B, B: Sora (76) beats Mina (92)
    fireEvent.click(screen.getByRole("button", { name: "Spin all" }));
    runAll();
    expect(screen.getByText(/ wins$/)).toBeTruthy();
    expect(screen.getByText("Upset")).toBeTruthy();
  });
});
