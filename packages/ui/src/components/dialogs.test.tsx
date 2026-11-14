// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "./ConfirmDialog";
import { ImportDialog } from "./ImportDialog";
import { ResetSeasonModal } from "./ResetSeasonModal";

afterEach(cleanup);

describe("ConfirmDialog (PRD §9)", () => {
  it("starts with focus on Cancel", () => {
    render(<ConfirmDialog open onOpenChange={() => {}} title="Delete?" message="Yakin?" confirmLabel="Delete" onConfirm={() => {}} />);
    expect(document.activeElement?.textContent).toBe("Cancel");
  });

  it("confirms and closes", () => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    render(<ConfirmDialog open onOpenChange={onOpenChange} title="Save?" message="Save ratings?" confirmLabel="Save" onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("type-to-confirm keeps the button off until the word matches exactly", () => {
    render(<ConfirmDialog open onOpenChange={() => {}} title="Delete all?" message="All data hilang." confirmLabel="Delete all" danger typeToConfirm="DELETE" onConfirm={() => {}} />);
    const confirm = screen.getByRole("button", { name: "Delete all" }) as HTMLButtonElement;
    expect(confirm.disabled).toBe(true);
    expect(confirm.className).toContain("bg-danger/15");
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "hapus" } });
    expect(confirm.disabled).toBe(true);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "DELETE" } });
    expect(confirm.disabled).toBe(false);
  });
});

describe("ResetSeasonModal (PRD §9)", () => {
  it("says what is deleted, needs the season name, and passes the redraw choice", () => {
    const onReset = vi.fn();
    render(<ResetSeasonModal open onOpenChange={() => {}} seasonName="Season 3" matchCount={5590} competitionCount={9} onReset={onReset} />);
    expect(screen.getByText(/5,590 matches from 9 competitions/)).toBeTruthy();
    fireEvent.click(screen.getByRole("checkbox", { name: "Redraw groups and brackets" }));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Season 3" } });
    fireEvent.click(screen.getByRole("button", { name: "Reset season" }));
    expect(onReset).toHaveBeenCalledWith({ redraw: true });
  });
});

describe("ImportDialog with a file already chosen (cloud restore)", () => {
  it("skips the picker and previews the file at once", async () => {
    const readFile = vi.fn(async () => ({ added: 7, replaced: 2, conflicts: [], unknown: [] }));
    const file = new File([new Uint8Array([1])], "sabung-idol-2026-11-13.sabung");
    render(<ImportDialog open onOpenChange={() => {}} title="Import" accept=".sabung" readFile={readFile} onApply={() => {}} file={file} />);
    expect(screen.queryByLabelText("File")).toBeNull();
    expect(await screen.findByText("added", { exact: false })).toBeTruthy();
    expect(readFile).toHaveBeenCalledWith(file);
  });
});
