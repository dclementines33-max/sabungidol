// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LiveMatchVisualizer, isComeback } from "./LiveMatchVisualizer";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("isComeback", () => {
  it("is true when the winner was behind", () => {
    expect(isComeback(["B", "B", "A", "A", "A"])).toBe(true);
    expect(isComeback(["A", "B", "B", "A", "A"])).toBe(true);
  });
  it("is false for a lead kept, and for a draw", () => {
    expect(isComeback(["A", "A", "B", "A"])).toBe(false);
    expect(isComeback(["A", "B", "A", "B"])).toBe(false);
  });
});

describe("LiveMatchVisualizer (PRD §9)", () => {
  const games = ["B", "B", "A", "A", "A"] as const;
  const score = () => screen.getByText(/Game \d/).parentElement!.textContent;

  it("reveals one game per step, then highlights the comeback", () => {
    vi.useFakeTimers();
    const onDone = vi.fn();
    render(<LiveMatchVisualizer games={[...games]} nameA="Mina" nameB="Yuna" stepMs={500} onDone={onDone} />);
    const step = () => act(() => vi.advanceTimersByTime(500)); // React sets the next timer after each step renders
    expect(score()).toContain("Game 0 / 5");
    step();
    step();
    expect(score()).toContain("Game 2 / 5");
    expect(screen.queryByText("Comeback!")).toBeNull();
    step();
    step();
    step();
    expect(screen.getByText("Comeback!")).toBeTruthy();
    expect(onDone).toHaveBeenCalled();
  });

  it("Lewati jumps to the end", () => {
    render(<LiveMatchVisualizer games={[...games]} nameA="Mina" nameB="Yuna" />);
    fireEvent.click(screen.getByRole("button", { name: "Lewati" }));
    expect(score()).toContain("Game 5 / 5");
  });

  it("with reduced motion shows the final score straight away", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    render(<LiveMatchVisualizer games={[...games]} nameA="Mina" nameB="Yuna" />);
    expect(score()).toContain("Game 5 / 5");
    expect(screen.queryByRole("button", { name: "Lewati" })).toBeNull();
  });
});
