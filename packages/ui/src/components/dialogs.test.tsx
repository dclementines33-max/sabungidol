// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "./ConfirmDialog";
import { ResetSeasonModal } from "./ResetSeasonModal";

afterEach(cleanup);

describe("ConfirmDialog (PRD §9)", () => {
  it("starts with focus on Cancel", () => {
    render(<ConfirmDialog open onOpenChange={() => {}} title="Hapus?" message="Yakin?" confirmLabel="Hapus" onConfirm={() => {}} />);
    expect(document.activeElement?.textContent).toBe("Batal");
  });

  it("confirms and closes", () => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    render(<ConfirmDialog open onOpenChange={onOpenChange} title="Simpan?" message="Simpan rating?" confirmLabel="Simpan" onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("type-to-confirm keeps the button off until the word matches exactly", () => {
    render(<ConfirmDialog open onOpenChange={() => {}} title="Hapus semua?" message="Semua data hilang." confirmLabel="Hapus semua" danger typeToConfirm="HAPUS" onConfirm={() => {}} />);
    const confirm = screen.getByRole("button", { name: "Hapus semua" }) as HTMLButtonElement;
    expect(confirm.disabled).toBe(true);
    expect(confirm.className).toContain("bg-danger");
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "hapus" } });
    expect(confirm.disabled).toBe(true);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "HAPUS" } });
    expect(confirm.disabled).toBe(false);
  });
});

describe("ResetSeasonModal (PRD §9)", () => {
  it("says what is deleted, needs the season name, and passes the redraw choice", () => {
    const onReset = vi.fn();
    render(<ResetSeasonModal open onOpenChange={() => {}} seasonName="Season 3" matchCount={5590} competitionCount={9} onReset={onReset} />);
    expect(screen.getByText(/5\.590 match dari 9 kompetisi/)).toBeTruthy();
    fireEvent.click(screen.getByRole("checkbox", { name: "Undi ulang grup dan bracket" }));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Season 3" } });
    fireEvent.click(screen.getByRole("button", { name: "Reset season" }));
    expect(onReset).toHaveBeenCalledWith({ redraw: true });
  });
});
