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
  it("is true when the winner was behind at some point", () => {
    expect(isComeback(["B", "B", "A", "A", "A"])).toBe(true);
    expect(isComeback(["A", "B", "B", "A", "A"])).toBe(true);
  });
  it("is false when the winner never trailed, or for a draw", () => {
    expect(isComeback(["A", "A", "B", "A"])).toBe(false);
    expect(isComeback(["A", "B", "A", "B"])).toBe(false);
  });
});

describe("LiveMatchVisualizer (PRD §9)", () => {
  const games = ["B", "B", "A", "A", "A"] as const;
  const status = () => screen.getByText(/^(Game \d in play|Full time)/).textContent;

  it("reveals one game per step without telling how many games there will be, then the comeback", () => {
    vi.useFakeTimers();
    const onDone = vi.fn();
    render(<LiveMatchVisualizer games={[...games]} nameA="Mina" nameB="Yuna" target={3} stepMs={500} onDone={onDone} />);
    const step = () => act(() => vi.advanceTimersByTime(500)); // React sets the next timer after each step renders
    expect(status()).toBe("Game 1 in play");
    expect(document.body.textContent).not.toContain("/ 5"); // Update 3: no spoiler of the final score
    step();
    step();
    expect(status()).toContain("Game 3 in play");
    expect(screen.getByText("Match point")).toBeTruthy(); // Yuna leads 0–2 in a Bo5
    expect(screen.queryByText("Comeback!")).toBeNull();
    step();
    step();
    step();
    expect(screen.getByText("Comeback!")).toBeTruthy();
    expect(screen.getByText("Mina wins")).toBeTruthy();
    expect(onDone).toHaveBeenCalled();
  });

  it("Skip jumps to the end", () => {
    render(<LiveMatchVisualizer games={[...games]} nameA="Mina" nameB="Yuna" />);
    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    expect(status()).toBe("Full time");
  });

  it("with reduced motion shows the final score straight away", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    render(<LiveMatchVisualizer games={[...games]} nameA="Mina" nameB="Yuna" />);
    expect(status()).toBe("Full time");
    expect(screen.queryByRole("button", { name: "Skip" })).toBeNull();
  });
});
