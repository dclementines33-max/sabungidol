// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IdolSourceProvider } from "./idolSource";
import { ManualBracketModal, ManualGroupModal } from "./ManualDrawModal";
import { swap } from "./SwapBoard";

afterEach(cleanup);

const names = ["Ana", "Bo", "Cy", "Di", "Ed", "Fa", "Gi", "Ha"];
const source = { idol: (id: string) => ({ id, name: id, groupName: null, rating: 70 }), photo: () => undefined };
const wrap = (ui: React.ReactNode) => render(<IdolSourceProvider source={source}>{ui}</IdolSourceProvider>);
// Test rule: Ana and Bo must not share a group.
const check = (columns: string[][]) => ({
  problems: columns.some((c) => c.includes("Ana") && c.includes("Bo")) ? ["Ana dan Bo satu group"] : [],
  warnings: [],
});

describe("swap", () => {
  it("swaps two spots and keeps column sizes", () => {
    expect(swap([["a", "b"], ["c", "d"]], { column: 0, row: 1 }, { column: 1, row: 0 })).toEqual([["a", "c"], ["b", "d"]]);
  });
});

describe("ManualGroupModal (PRD §9)", () => {
  it("swaps by picking two idols, re-checks, and blocks Apply while a rule is broken", () => {
    const onApply = vi.fn();
    wrap(<ManualGroupModal open onOpenChange={() => {}} groups={[names.slice(0, 4), names.slice(4)]} check={check} onApply={onApply} />);
    const apply = () => screen.getByRole("button", { name: "Apply" }) as HTMLButtonElement;
    expect(screen.getByRole("status").textContent).toContain("Ana dan Bo satu group");
    expect(apply().disabled).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Pick Bo" }));
    expect(screen.getByRole("button", { name: "Pick Bo" }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Swap with Ed" }));

    expect(screen.getByRole("status").textContent).toContain("All rules met");
    fireEvent.click(apply());
    expect(onApply).toHaveBeenCalledWith([["Ana", "Ed", "Cy", "Di"], ["Bo", "Fa", "Gi", "Ha"]]);
  });

  it("Reset puts the draw back", () => {
    wrap(<ManualGroupModal open onOpenChange={() => {}} groups={[names.slice(0, 4), names.slice(4)]} check={check} onApply={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Pick Bo" }));
    fireEvent.click(screen.getByRole("button", { name: "Swap with Ed" }));
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getByRole("status").textContent).toContain("Ana dan Bo satu group");
  });
});

describe("ManualBracketModal", () => {
  it("labels each pair as a match", () => {
    wrap(<ManualBracketModal open onOpenChange={() => {}} pairs={[["Ana", "Cy"], ["Bo", "Di"]]} check={() => ({ problems: [], warnings: ["Match 2 pairs league teammates"] })} onApply={() => {}} />);
    expect(screen.getByRole("region", { name: "Match 1" })).toBeTruthy();
    expect(screen.getByRole("status").textContent).toContain("league teammates");
  });
});
