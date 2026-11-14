// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MatchModal } from "./MatchModal";
import { PAUSE_MS, TENSE_MS } from "./WheelPicker";
import { SampleIdols } from "./sampleIdols";

afterEach(cleanup);

const open = (props: Partial<Parameters<typeof MatchModal>[0]> = {}) => {
  const onAccept = vi.fn();
  render(
    <SampleIdols>
      <MatchModal open onOpenChange={() => {}} title="Unzure Cup · R32 · Match 4" idolA="mina" idolB="yuna" bestOf={5}
        random={() => 0.2} onAccept={onAccept} {...props} />
    </SampleIdols>,
  );
  return onAccept;
};
const accept = () => screen.getByRole("button", { name: "Accept Result" }) as HTMLButtonElement;

describe("MatchModal (PRD §9)", () => {
  it("shows both idols, the format and the chance to win", () => {
    open({ h2h: { winsA: 3, draws: 1, winsB: 2 } });
    expect(screen.getAllByText("Mina Kim").length).toBeGreaterThan(0); // header and wheel stage
    expect(screen.getByText("Bo5")).toBeTruthy();
    expect(screen.getByText(/Win odds: Mina Kim \d+%, Yuna \d+%/)).toBeTruthy();
    expect(screen.getByText("3–1–2")).toBeTruthy();
  });

  it("opens on the wheel; there is no Simulate any more (2026-11-15) and nothing is decided before a spin", () => {
    open();
    expect(screen.getByRole("radio", { name: "Wheel" }).getAttribute("aria-checked")).toBe("true");
    expect(screen.queryByRole("radio", { name: "Simulate" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Simulate" })).toBeNull();
    expect(accept().disabled).toBe(true);
  });

  it("preset = one click on a final score; games alternate with the winner last", () => {
    const onAccept = open({ facts: [{ label: "This season", a: "5-1", b: "2-4" }] });
    expect(screen.getByRole("rowheader", { name: "This season" })).toBeTruthy();
    fireEvent.click(screen.getByRole("radio", { name: "Score presets" }));
    expect(screen.getAllByRole("button", { name: /^[0-9]–[0-9] / })).toHaveLength(6); // Bo5: 3–0 3–1 3–2 2–3 1–3 0–3
    fireEvent.click(screen.getByRole("button", { name: "2–3 Yuna" }));
    fireEvent.click(accept());
    expect(onAccept).toHaveBeenCalledWith({ method: "manual", scoreA: 2, scoreB: 3, result: "B", games: ["B", "A", "B", "A", "B"] });
  });

  it("manual = set the score directly; only a final score can be accepted", () => {
    const onAccept = open();
    fireEvent.click(screen.getByRole("radio", { name: "Manual" }));
    const plus = (name: string, n: number) => { for (let i = 0; i < n; i++) fireEvent.click(screen.getByRole("button", { name: `Raise ${name}'s score` })); };
    plus("Mina Kim", 2);
    plus("Yuna", 1);
    expect(accept().disabled).toBe(true); // 2–1 is not over in Bo5
    expect(screen.getByText("Not a valid Bo5 score yet")).toBeTruthy();
    plus("Mina Kim", 1);
    expect((screen.getByRole("button", { name: "Raise Mina Kim's score" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(accept());
    expect(onAccept).toHaveBeenCalledWith({ method: "manual", scoreA: 3, scoreB: 1, result: "A", games: ["A", "B", "A", "A"] });
  });

  it("wheel results are accepted as method wheel", () => {
    const onAccept = open();
    vi.useFakeTimers();
    fireEvent.click(screen.getByRole("button", { name: "Spin all" }));
    for (let i = 0; i < 6; i++) act(() => vi.advanceTimersByTime(PAUSE_MS + TENSE_MS));
    vi.useRealTimers();
    fireEvent.click(accept());
    expect(onAccept).toHaveBeenCalledWith({ method: "wheel", scoreA: 3, scoreB: 0, result: "A", games: ["A", "A", "A"] });
  });
});
