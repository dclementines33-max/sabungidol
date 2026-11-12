// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IdolSourceProvider, type IdolInfo } from "./idolSource";
import { LeagueRosterModal } from "./LeagueRosterModal";

afterEach(cleanup);

// 22 idols: 20 in D1A, plus "Mina" twice (two groups) and "Rina" who plays in D2C.
const idols: IdolInfo[] = [
  ...Array.from({ length: 19 }, (_, i) => ({ id: `i${i}`, name: `Idol ${i}`, groupName: null, rating: 70 })),
  { id: "mina-a", name: "Mina", groupName: "Aurora", rating: 80 },
  { id: "mina-v", name: "Mina", groupName: "Velvet", rating: 75 },
  { id: "rina", name: "Rina", groupName: null, rating: 72 },
];
const byId = new Map(idols.map((i) => [i.id, i]));
const roster = [...Array.from({ length: 19 }, (_, i) => `i${i}`), "mina-a"];
const leagueOf = (id: string) => (id === "rina" ? "D2C" : roster.includes(id) ? "D1A" : null);

const open = (onApply = vi.fn()) => {
  render(
    <IdolSourceProvider source={{ idol: (id) => byId.get(id), photo: () => undefined }}>
      <LeagueRosterModal open onOpenChange={() => {}} league="D1A" roster={roster} idolIds={idols.map((i) => i.id)} leagueOf={leagueOf} onApply={onApply} />
    </IdolSourceProvider>,
  );
  return onApply;
};
const apply = () => screen.getByRole("button", { name: "Apply" }) as HTMLButtonElement;

describe("LeagueRosterModal (PRD §9)", () => {
  it("counts 20 / 20 and allows Apply", () => {
    const onApply = open();
    expect(screen.getByRole("status").textContent).toContain("20 / 20");
    fireEvent.click(apply());
    expect(onApply).toHaveBeenCalledWith(roster);
  });

  it("blocks Apply below 20", () => {
    open();
    fireEvent.click(screen.getByRole("button", { name: "Hapus Idol 0 dari D1A" }));
    expect(screen.getByRole("status").textContent).toContain("19 / 20");
    expect(apply().disabled).toBe(true);
  });

  it("pasting adds known names and lists unknown or ambiguous ones instead of guessing", () => {
    open();
    fireEvent.click(screen.getByRole("button", { name: "Hapus Idol 0 dari D1A" }));
    fireEvent.change(screen.getByRole("textbox", { name: /Tempel nama/ }), { target: { value: "rina\nMina\nNobody" } });
    fireEvent.click(screen.getByRole("button", { name: "Tambahkan dari teks" }));
    expect(screen.getByRole("status").textContent).toContain("20 / 20");
    const problems = screen.getByRole("alert").textContent;
    expect(problems).toContain("Nobody — tidak dikenal");
    expect(problems).toContain("Mina — 2 idol bernama sama");
    expect(screen.getByText(/Juga di liga lain: Rina \(D2C\)/)).toBeTruthy();
    expect(apply().disabled).toBe(false); // another league is a warning, not a block
  });
});
