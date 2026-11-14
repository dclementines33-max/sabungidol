// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BlockerDialog } from "./BlockerDialog";
import { ErrorPanel } from "./ErrorPanel";
import { NotificationCenter } from "./NotificationCenter";
import type { Notice } from "./notice";
import { TOAST_MS, Toasts } from "./Toasts";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const notice = (id: string, level: Notice["level"], message: string, at = "2026-11-12T10:00:00Z"): Notice => ({ id, level, message, at });

describe("Toasts (PRD §14.1)", () => {
  it("shows info and success only, and dismisses them after 4 s", () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    render(<Toasts notices={[notice("1", "info", "Matchday 12 selesai di 13 leagues"), notice("2", "warning", "Roster kurang")]} onDismiss={onDismiss} />);
    expect(screen.getByText("Matchday 12 selesai di 13 leagues")).toBeTruthy();
    expect(screen.queryByText("Roster kurang")).toBeNull();
    act(() => vi.advanceTimersByTime(TOAST_MS - 1));
    expect(onDismiss).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(onDismiss).toHaveBeenCalledWith("1");
  });

  it("success offers Undo", () => {
    const undo = vi.fn();
    render(<Toasts notices={[{ ...notice("1", "success", "240 idol ditambahkan"), undo }]} onDismiss={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(undo).toHaveBeenCalledOnce();
  });
});

describe("BlockerDialog", () => {
  it("names the cause", () => {
    render(<BlockerDialog notice={notice("1", "blocker", "Start New Season diblokir: Nugu Cup belum selesai (R6)")} onClose={() => {}} />);
    expect(screen.getByText(/Nugu Cup belum selesai/)).toBeTruthy();
  });
});

describe("ErrorPanel", () => {
  it("shows code and message, and copies the report", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(<ErrorPanel code="E-DRAW-002" message="Group H hanya 3 idol" report="E-DRAW-002 stack…" />);
    expect(screen.getByRole("alert").textContent).toContain("E-DRAW-002");
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Copy report" })));
    expect(writeText).toHaveBeenCalledWith("E-DRAW-002 stack…");
    expect(screen.getByRole("button", { name: "Report copied" })).toBeTruthy();
  });
});

describe("NotificationCenter", () => {
  const history = [
    notice("1", "info", "Matchday 1 selesai", "2026-11-12T08:00:00Z"),
    notice("2", "error", "Group H hanya 3 idol", "2026-11-12T09:00:00Z"),
    notice("3", "warning", "Mina ada di dua leagues", "2026-11-12T10:00:00Z"),
  ];

  it("shows the unread count and lists newest first", () => {
    render(<NotificationCenter notices={history} unread={2} onExport={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Notifications, 2 unread" }));
    const items = screen.getAllByRole("listitem").map((li) => li.textContent);
    expect(items[0]).toContain("Mina ada di dua leagues");
    expect(items[2]).toContain("Matchday 1 selesai");
  });

  it("filters by level and exports what is shown", () => {
    const onExport = vi.fn();
    render(<NotificationCenter notices={history} unread={0} onExport={onExport} />);
    fireEvent.click(screen.getByRole("button", { name: "Notifications" }));
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "error" } });
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Export" }));
    expect(onExport).toHaveBeenCalledWith([history[1]]);
  });
});
