// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ImportDialog, type ImportPreview } from "./ImportDialog";

afterEach(cleanup);

const preview: ImportPreview = { added: 238, replaced: 2, conflicts: ["Mina (Aurora): rating 92 → 88"], unknown: ["Minah"] };
const pick = async (readFile: (f: File) => Promise<ImportPreview>) => {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  await act(async () => fireEvent.change(input, { target: { files: [new File(["x"], "roster.csv")] } }));
};

describe("ImportDialog (PRD §9, §12.3)", () => {
  it("writes nothing before a preview exists", () => {
    render(<ImportDialog open onOpenChange={() => {}} title="Import roster" accept=".csv" readFile={async () => preview} onApply={() => {}} />);
    expect((screen.getByRole("button", { name: "Confirm & Apply" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("shows counts, conflicts and unknown names, then applies in the chosen mode", async () => {
    const onApply = vi.fn();
    render(<ImportDialog open onOpenChange={() => {}} title="Import roster" accept=".csv" readFile={async () => preview} onApply={onApply} />);
    await pick(async () => preview);
    expect(screen.getByText(/added/).textContent).toContain("238");
    expect(screen.getByText("Conflicts (1)")).toBeTruthy();
    expect(screen.getByText("Not recognised (1)")).toBeTruthy();
    fireEvent.click(screen.getByRole("radio", { name: /Replace/ }));
    const apply = screen.getByRole("button", { name: "Confirm & Apply" });
    expect(apply.className).toContain("bg-danger/15");
    fireEvent.click(apply);
    expect(onApply).toHaveBeenCalledWith("replace");
  });

  it("shows why a file is refused", async () => {
    const readFile = async () => { throw new Error("Backup of versi lebih baru (skema 5); aplikasi ini skema 3."); };
    render(<ImportDialog open onOpenChange={() => {}} title="Restore" accept=".sabung" readFile={readFile} onApply={() => {}} />);
    await pick(readFile);
    expect(screen.getByRole("alert").textContent).toContain("versi lebih baru");
    expect((screen.getByRole("button", { name: "Confirm & Apply" }) as HTMLButtonElement).disabled).toBe(true);
  });
});
