// @vitest-environment jsdom
import {
  Outlet, RouterProvider, createMemoryHistory, createRootRoute, createRoute, createRouter,
} from "@tanstack/react-router";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PanelPlaceholder } from "../PanelPlaceholder";
import { AppShell } from "./AppShell";
import { COMPETITIONS, SPACES, panelFor } from "./nav";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const PRD_PANELS = [
  "Home", "Dashboard", "Sabung Idol", "Season Story", "Idol Database", "Girl Group Stats", "Career Stats", "Head to Head",
  "Hall of Champions", "All-time Records", "Match Database", "Season Archive", "Input Data", "Rating Manager", "Inactive Manager", "Settings",
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

describe("AppShell (agreed shell)", () => {
  it("titles the page and marks the active link", async () => {
    await showShellAt("/wiki/career");
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Career Stats");
    const rail = screen.getAllByRole("navigation", { name: "Navigasi utama" })[0];
    expect(within(rail).getByRole("link", { name: "Career Stats" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByText("Panel ini dibangun di Fase 4.")).toBeTruthy();
  });

  it("opens Kompetisi when a competition is the current page", async () => {
    await showShellAt("/play/unzure");
    const rail = screen.getAllByRole("navigation", { name: "Navigasi utama" })[0];
    expect(rail.querySelector("details")?.open).toBe(true);
    expect(within(rail).getByRole("link", { name: "Unzure Cup" }).getAttribute("aria-current")).toBe("page");
  });

  it("has a skip link to the content", async () => {
    await showShellAt("/");
    expect(screen.getByRole("link", { name: "Langsung ke konten" }).getAttribute("href")).toBe("#konten");
    expect(document.getElementById("konten")?.tagName).toBe("MAIN");
  });

  it("remembers a collapsed rail", async () => {
    await showShellAt("/");
    fireEvent.click(screen.getByRole("button", { name: "Ciutkan menu" }));
    expect(localStorage.getItem("sabung.railCollapsed")).toBe("1");
    expect(screen.getByRole("button", { name: "Ciutkan menu" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("the mobile Play button opens a sheet with the competitions, and a link closes it", async () => {
    await showShellAt("/");
    const bar = screen.getAllByRole("navigation", { name: "Navigasi utama" })[1];
    fireEvent.click(within(bar).getByRole("button", { name: "Play" }));
    const sheet = screen.getByRole("dialog", { name: "Play" });
    expect(within(sheet).getByRole("link", { name: "Nugu Cup" })).toBeTruthy();
    await act(async () => { fireEvent.click(within(sheet).getByRole("link", { name: "Dashboard" })); });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Dashboard");
  });
});
