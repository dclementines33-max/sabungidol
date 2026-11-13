// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MatchModal } from "./MatchModal";
import { SampleIdols } from "./sampleIdols";

afterEach(cleanup);

const open = (props: Partial<Parameters<typeof MatchModal>[0]> = {}) => {
  const onAccept = vi.fn();
  render(
    <SampleIdols>
      <MatchModal open onOpenChange={() => {}} title="Unzure Cup · R32 · Match 4" idolA="mina" idolB="yuna" bestOf={5}
        simulate={() => ["A", "B", "A", "A"]} random={() => 0.2} onAccept={onAccept} {...props} />
    </SampleIdols>,
  );
  return onAccept;
};
const accept = () => screen.getByRole("button", { name: "Accept Result" }) as HTMLButtonElement;

describe("MatchModal (PRD §9)", () => {
  it("shows both idols, the format and the chance to win", () => {
    open({ h2h: { winsA: 3, draws: 1, winsB: 2 } });
    expect(screen.getByText("Mina Kim")).toBeTruthy();
    expect(screen.getByText("Bo5")).toBeTruthy();
    expect(screen.getByText(/Peluang menang: Mina Kim \d+%, Yuna \d+%/)).toBeTruthy();
    expect(screen.getByText("3–1–2")).toBeTruthy();
  });

  it("writes nothing until Accept Result, then sends the simulated games", () => {
    const onAccept = open();
    expect(accept().disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Simulate" }));
    fireEvent.click(accept());
    expect(onAccept).toHaveBeenCalledWith({ method: "sim", scoreA: 3, scoreB: 1, result: "A", games: ["A", "B", "A", "A"] });
  });

  it("manual = the winner of each game in order, so a reverse sweep stays true", () => {
    const onAccept = open();
    fireEvent.click(screen.getByRole("radio", { name: "Manual" }));
    const win = (name: RegExp) => fireEvent.click(screen.getByRole("button", { name }));
    win(/^Mina Kim menang game 1/);
    win(/^Mina Kim menang game 2/);
    win(/^Yuna menang game 3/);
    expect(accept().disabled).toBe(true); // 2–1 is not over in Bo5
    win(/^Yuna menang game 4/);
    win(/^Mina Kim menang game 5/);
    fireEvent.click(screen.getByRole("button", { name: "Batalkan game terakhir" }));
    win(/^Yuna menang game 5/);
    expect(screen.getAllByRole("button", { name: /menang game 6/ }).every((b) => (b as HTMLButtonElement).disabled)).toBe(true);
    fireEvent.click(accept());
    expect(onAccept).toHaveBeenCalledWith({ method: "manual", scoreA: 2, scoreB: 3, result: "B", games: ["A", "A", "B", "B", "B"] });
  });

  it("wheel results are accepted as method wheel", () => {
    const onAccept = open();
    fireEvent.click(screen.getByRole("radio", { name: "Wheel Picker" }));
    fireEvent.click(screen.getByRole("button", { name: "Spin all" }));
    fireEvent.click(accept());
    expect(onAccept).toHaveBeenCalledWith({ method: "wheel", scoreA: 3, scoreB: 0, result: "A", games: ["A", "A", "A"] });
  });
});
