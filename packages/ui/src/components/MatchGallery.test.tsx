// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MatchModal } from "./MatchModal";
import { IdolSourceProvider } from "./idolSource";
import { SAMPLE_IDOLS } from "./sampleIdols";

afterEach(cleanup);

const show = (gallery: string[]) => {
  const idols = new Map(SAMPLE_IDOLS.map((i) => [i.id, i.id === "mina" ? { ...i, gallery } : i]));
  render(
    <IdolSourceProvider source={{ idol: (id) => idols.get(id), photo: () => undefined, galleryPhoto: (id, size) => `blob:${id}-${size}` }}>
      <MatchModal open onOpenChange={() => {}} title="Match" idolA="mina" idolB="yuna" bestOf={5} simulate={() => []} onAccept={() => {}} />
    </IdolSourceProvider>,
  );
};

describe("MatchModal gallery", () => {
  it("shows 3 random gallery photos of an idol beside the match, only for idols that have one", () => {
    show(["g1", "g2", "g3", "g4", "g5"]);
    const strip = screen.getByRole("region", { name: "Mina Kim gallery" });
    expect(within(strip).getAllByRole("button")).toHaveLength(3);
    expect(new Set([...strip.querySelectorAll("img")].map((i) => i.getAttribute("src"))).size).toBe(3);
    expect(screen.queryByRole("region", { name: "Gallery Yuna" })).toBeNull();
  });

  it("opens a photo large and steps through all of them, wrapping around", () => {
    show(["g1", "g2", "g3"]);
    fireEvent.click(screen.getByRole("button", { name: "View photo 1 of 3, Mina Kim" }));
    expect(screen.getByRole("dialog", { name: "Mina Kim · 1/3" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Previous photo" }));
    expect(screen.getByRole("dialog", { name: "Mina Kim · 3/3" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Next photo" }));
    expect(screen.getByRole("dialog", { name: "Mina Kim · 1/3" }).querySelector("img")?.getAttribute("src")).toMatch(/-1024$/);
  });

  it("keeps the old layout when neither idol has a gallery", () => {
    show([]);
    expect(screen.queryByText(/Gallery/)).toBeNull();
  });
});
