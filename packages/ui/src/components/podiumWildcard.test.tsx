// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { KahootPodium, RISE_GAP_MS } from "./KahootPodium";
import { SampleIdols } from "./sampleIdols";
import { WildcardPlayInBracket } from "./WildcardPlayInBracket";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const delayOf = (el: HTMLElement) => Number(el.style.animationDelay.replace("ms", ""));

describe("KahootPodium (PRD §9)", () => {
  it("stands 2 – 1 – 3 from left to right, and rises 3 → 2 → 1", () => {
    render(<SampleIdols><KahootPodium first="mina" second="yuna" third="sora" title="Unzure Cup" /></SampleIdols>);
    const places = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(places.map((p) => p.getAttribute("aria-label"))).toEqual(["Juara 2: Yuna", "Juara 1: Mina Kim", "Juara 3: Han Sora"]);
    const [second, first, third] = places.map(delayOf);
    expect([third, second, first]).toEqual([0, RISE_GAP_MS, 2 * RISE_GAP_MS]);
  });

  it("rises with the CSS animation (no JavaScript timing that could leave it hidden)", () => {
    render(<SampleIdols><KahootPodium first="mina" second="yuna" third="sora" /></SampleIdols>);
    for (const place of screen.getAllByRole("listitem")) expect(place.className).toContain("animate-rise");
  });

  it("with reduced motion: a fade with no delay and no movement", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    render(<SampleIdols><KahootPodium first="mina" second="yuna" third="sora" /></SampleIdols>);
    for (const place of screen.getAllByRole("listitem")) {
      expect(delayOf(place)).toBe(0);
      expect(place.className).toContain("animate-fade-in");
      expect(place.className).not.toContain("animate-rise");
    }
  });
});

describe("WildcardPlayInBracket", () => {
  it("shows old rounds read-only, with the winner marked", () => {
    render(<SampleIdols><WildcardPlayInBracket rounds={[{ label: "WC1", matches: [{ a: "mina", b: "rina", winner: "rina", score: "2–1" }] }]} /></SampleIdols>);
    expect(screen.getByRole("region", { name: "Wildcard play-in (arsip lama)" })).toBeTruthy();
    expect(screen.getByText("Rina").className).toContain("text-accent-bright");
    expect(screen.getByText("2–1")).toBeTruthy();
  });
});
