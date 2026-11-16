// @vitest-environment jsdom
import { IdolSourceProvider } from "@sabung/ui";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AwardList } from "./SeasonAwards";

afterEach(cleanup);

describe("AwardList", () => {
  it("MVI leads on its own; the rest follow in prestige order with their numbers", () => {
    render(<IdolSourceProvider source={{ idol: (id) => ({ id, name: id, rating: 80 }) as never, photo: () => undefined }}>
      <AwardList awards={[{ key: "mvi", idol: "mina", value: 91.5 }, { key: "daebak", idol: "yuna", value: 1 }, { key: "glow-up", idol: "rei", value: 4 }]} />
    </IdolSourceProvider>);
    const lead = screen.getByRole("figure", { name: "Most Valuable Idol" });
    expect(lead.textContent).toContain("mina");
    expect(lead.textContent).toContain("91.5 MVI score");
    const rest = within(screen.getByRole("list")).getAllByRole("listitem").map((li) => li.textContent);
    expect(rest).toEqual(["DaebakyunaFewest losses · 1 loss", "Glow UpreiBiggest rating growth · +4 rating"]);
  });
  it("nothing to show before the season is finished", () => {
    const { container } = render(<IdolSourceProvider source={{ idol: () => undefined, photo: () => undefined }}><AwardList awards={[]} /></IdolSourceProvider>);
    expect(container.textContent).toBe("");
  });
});
