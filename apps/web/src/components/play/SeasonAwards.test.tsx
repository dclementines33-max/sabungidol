// @vitest-environment jsdom
import { IdolSourceProvider } from "@sabung/ui";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AwardList } from "./SeasonAwards";

afterEach(cleanup);
const source = { idol: (id: string) => ({ id, name: id, rating: 80 }) as never, photo: () => undefined };
const one = (key: string, id: string, value: number, top = [{ id, value }]) => ({ key, id, value, top }) as never;

describe("AwardList", () => {
  it("MVI and Idol of the Season lead; each award explains itself; MAMA names the group", () => {
    render(<IdolSourceProvider source={source}>
      <AwardList awards={[one("mvi", "mina", 91.5), one("iots", "yuna", 120.3), one("mama", "g1", 300), one("daebak", "rei", 4.2)]} groupName={(id) => (id === "g1" ? "TWICE" : id)} />
    </IdolSourceProvider>);
    expect(screen.getByRole("figure", { name: "Most Valuable Idol" }).textContent).toContain("91.5 MVI score");
    expect(screen.getByRole("figure", { name: "Best season overall" }).textContent).toContain("yuna");
    expect(screen.getByRole("figure", { name: "Best girl group" }).textContent).toContain("TWICE");
    expect(screen.getByRole("figure", { name: "Fewest losses" }).textContent).toMatch(/4\.2% lost.*Share of matches lost/);
  });
  it("the top 10 nominees open behind a button", () => {
    render(<IdolSourceProvider source={source}><AwardList awards={[one("mvi", "mina", 91, [{ id: "mina", value: 91 }, { id: "yuna", value: 88 }])]} /></IdolSourceProvider>);
    expect(screen.queryByRole("list", { name: "MVI nominees" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Top 2 nominees" }));
    expect(screen.getByRole("list", { name: "MVI nominees" }).textContent).toBe("1mina912yuna88");
  });
  it("nothing to show before the season is finished", () => {
    const { container } = render(<IdolSourceProvider source={{ idol: () => undefined, photo: () => undefined }}><AwardList awards={[]} /></IdolSourceProvider>);
    expect(container.textContent).toBe("");
  });
});
