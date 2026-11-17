// @vitest-environment jsdom
import {
  Outlet, RouterProvider, createMemoryHistory, createRootRoute, createRoute, createRouter,
} from "@tanstack/react-router";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useNotices } from "../../data/notices";
import { PANEL_ERROR_CODE, PanelError } from "../PanelError";
import { PanelPlaceholder } from "../PanelPlaceholder";
import { AppShell } from "./AppShell";
import { COMPETITIONS, SPACES, panelFor } from "./nav";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const PRD_PANELS = [
  "Home", "Dashboard", "Sabung Idol", "Season Story", "Idol Database", "Idol Profile", "Girl Group Stats", "Career Stats", "Ranking", "Tier List", "Head to Head",
  "Hall of Champions", "All-time Records", "Hall of Shame", "Match Database", "Season Progression", "Season Archive", "Input Data", "Rating Manager", "Inactive Manager", "Settings",
];

describe("nav (PRD §8)", () => {
  const all = [...SPACES.flatMap((s) => s.items), ...COMPETITIONS];
  it("has every PRD panel and the 9 competitions, each at its own path", () => {
    expect(SPACES.flatMap((s) => s.items.map((i) => i.label)).sort()).toEqual([...PRD_PANELS].sort());
    expect(COMPETITIONS).toHaveLength(9);
    expect(new Set(all.map((i) => i.to)).size).toBe(all.length);
  });
  it("finds the panel for a path, including an idol's own page", () => {
    expect(panelFor("/play/unzure")?.label).toBe("Unzure Cup");
    expect(panelFor("/wiki/idols/abc")?.label).toBe("Idol Profile");
    expect(panelFor("/nope")).toBeUndefined();
  });
});

// A small router with the real shell around placeholder panels.
async function showShellAt(path: string) {
  const root = createRootRoute({ component: () => <AppShell><Outlet /></AppShell> });
  const paths = [...SPACES.flatMap((s) => s.items), ...COMPETITIONS].map((i) => i.to).filter((p) => p !== "/");
  const routes = [createRoute({ getParentRoute: () => root, path: "/", component: PanelPlaceholder }),
    ...paths.map((p) => createRoute({ getParentRoute: () => root, path: p, component: PanelPlaceholder }))];
  const router = createRouter({ routeTree: root.addChildren(routes), history: createMemoryHistory({ initialEntries: [path] }) });
  await act(async () => { render(<RouterProvider router={router} />); });
  return router;
}

describe("a crashing panel (PRD §14.2)", () => {
  it("shows the error card inside the shell, logs it, and reports route and last action", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    const root = createRootRoute({ component: () => <AppShell><Outlet /></AppShell> });
    const boom = createRoute({ getParentRoute: () => root, path: "/boom", component: () => { throw new Error("tabel klasemen empty"); } });
    const router = createRouter({ routeTree: root.addChildren([boom]), history: createMemoryHistory({ initialEntries: ["/boom"] }), defaultErrorComponent: PanelError });
    vi.spyOn(console, "error").mockImplementation(() => {}); // React logs the thrown error
    await act(async () => { render(<RouterProvider router={router} />); });

    expect(screen.getAllByRole("navigation", { name: "Main navigation" })).toHaveLength(2); // the shell still stands
    const card = screen.getByRole("alert");
    expect(card.textContent).toContain(PANEL_ERROR_CODE);
    expect(card.textContent).toContain("This panel failed to load");
    expect(screen.getByRole("button", { name: "Reload panel" })).toBeTruthy();
    expect(useNotices.getState().notices.some((n) => n.code === PANEL_ERROR_CODE)).toBe(true);

    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Copy report" })); });
    const report = writeText.mock.calls[0][0] as string;
    expect(report).toContain("Route: /boom");
    // The report is made when the panel fails: its last action is what led there, not the copy click.
    expect(report).toMatch(/^Last action: /m);
    expect(report).not.toContain("Copy report");
    expect(report).toMatch(/^Version: /m);
    expect(report).toContain("tabel klasemen empty");
    vi.restoreAllMocks();
  });

  it("leaving the crashed panel does not log a second, false failure", async () => {
    useNotices.setState({ notices: [], unread: 0, toasts: [], pinned: [], blocker: null, persister: null });
    const root = createRootRoute({ component: () => <AppShell><Outlet /></AppShell> });
    const boom = createRoute({ getParentRoute: () => root, path: "/boom", component: () => { throw new Error("x"); } });
    const fine = createRoute({ getParentRoute: () => root, path: "/studio/settings", component: PanelPlaceholder });
    const router = createRouter({ routeTree: root.addChildren([boom, fine]), history: createMemoryHistory({ initialEntries: ["/boom"] }), defaultErrorComponent: PanelError });
    vi.spyOn(console, "error").mockImplementation(() => {});
    await act(async () => { render(<RouterProvider router={router} />); });
    await act(async () => { await router.navigate({ to: "/studio/settings" }); });
    const failures = useNotices.getState().notices.filter((n) => n.code === PANEL_ERROR_CODE).map((n) => n.message);
    expect(failures).toEqual(["Panel /boom failed to load"]);
    vi.restoreAllMocks();
  });
});

describe("AppShell (agreed shell)", () => {
  it("titles the page and marks the active link", async () => {
    await showShellAt("/wiki/career");
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Career Stats");
    const rail = screen.getAllByRole("navigation", { name: "Main navigation" })[0];
    expect(within(rail).getByRole("link", { name: "Career Stats" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByText("This panel arrives in phase 4.")).toBeTruthy();
  });

  it("opens Competition when a competition is the current page", async () => {
    await showShellAt("/play/unzure");
    const rail = screen.getAllByRole("navigation", { name: "Main navigation" })[0];
    expect(rail.querySelector("details")?.open).toBe(true);
    expect(within(rail).getByRole("link", { name: "Unzure Cup" }).getAttribute("aria-current")).toBe("page");
  });

  it("has a skip link to the content", async () => {
    await showShellAt("/");
    expect(screen.getByRole("link", { name: "Skip to content" }).getAttribute("href")).toBe("#content");
    expect(document.getElementById("content")?.tagName).toBe("MAIN");
  });

  it("remembers a collapsed rail", async () => {
    await showShellAt("/");
    fireEvent.click(screen.getByRole("button", { name: "Collapse menu" }));
    expect(localStorage.getItem("sabung.railCollapsed")).toBe("1");
    expect(screen.getByRole("button", { name: "Collapse menu" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("Ctrl+K opens the palette; Enter on a result goes to that panel", async () => {
    await showShellAt("/");
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    const input = screen.getByRole("combobox", { name: "Search panels or commands" });
    fireEvent.change(input, { target: { value: "nugu" } });
    expect(screen.getAllByRole("option")[0].textContent).toContain("Nugu Cup");
    await act(async () => { fireEvent.keyDown(input, { key: "Enter" }); });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Nugu Cup");
  });

  it("palette commands run, and the header and mobile Search buttons open it", async () => {
    await showShellAt("/");
    fireEvent.click(screen.getByRole("button", { name: /Search…/ }));
    const input = screen.getByRole("combobox", { name: "Search panels or commands" });
    fireEvent.change(input, { target: { value: "collapse" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(localStorage.getItem("sabung.railCollapsed")).toBe("1");
    const bar = screen.getAllByRole("navigation", { name: "Main navigation" })[1];
    fireEvent.click(within(bar).getByRole("button", { name: "Search" }));
    expect(screen.getByRole("dialog", { name: "Search panels or commands" })).toBeTruthy();
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "zzz" } });
    expect(screen.getByText("No results for “zzz”.")).toBeTruthy();
  });

  it("the mobile Play button opens a sheet with the competitions, and a link closes it", async () => {
    await showShellAt("/");
    const bar = screen.getAllByRole("navigation", { name: "Main navigation" })[1];
    fireEvent.click(within(bar).getByRole("button", { name: "Play" }));
    const sheet = screen.getByRole("dialog", { name: "Play" });
    expect(within(sheet).getByRole("link", { name: "Nugu Cup" })).toBeTruthy();
    await act(async () => { fireEvent.click(within(sheet).getByRole("link", { name: "Dashboard" })); });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Dashboard");
  });
});
