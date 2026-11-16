// @vitest-environment jsdom
import { IdolSourceProvider } from "@sabung/ui";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SeasonVerdict } from "./SeasonVerdict";

vi.mock("../../data/branding", () => ({ useBranding: () => ({ label: (k: string) => k, brand: () => ({}) }) }));
afterEach(cleanup);

describe("SeasonVerdict", () => {
  it("counts the board targets by grade and shows each idol's target, finish and grade", () => {
    render(<IdolSourceProvider source={{ idol: (id) => ({ id, name: id, rating: 80 }) as never, photo: () => undefined }}>
      <SeasonVerdict open onOpenChange={() => {}} busy={false} onSave={() => {}}
        rows={[{ idolId: "mina", current: 80, new: 83, parts: [] }, { idolId: "yuna", current: 88, new: 85, parts: [] }]}
        targets={[
          { idolId: "mina", league: "D1A", kind: "survive", place: 17, rank: 3, grade: "exceeded" },
          { idolId: "yuna", league: "D1A", kind: "title", place: 1, rank: 9, grade: "failed" },
          { idolId: "rei", league: "D1A", kind: "top-half", place: 10, rank: 10, grade: "met" },
        ]} />
    </IdolSourceProvider>);
    expect(screen.getByLabelText("Board targets").textContent).toBe("Board targets1 Exceeded1 Met0 Missed1 Failed");
    expect(screen.getByText(/Avoid relegation · finished #3/).parentElement!.textContent).toContain("Exceeded");
    expect(screen.getByText(/Win the title · finished #9/).parentElement!.textContent).toContain("Failed");
  });
});
