// @vitest-environment jsdom
import { IdolSourceProvider } from "@sabung/ui";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Telemetry } from "./Telemetry";

afterEach(cleanup);
const row = (idolId: string, rating: number, actual: number, expected: number) => ({ idolId, rating, games: 30, actual, expected, delta: actual - expected });

describe("Telemetry", () => {
  it("a dot per idol, over- and under-performers listed with won vs expected", () => {
    render(<IdolSourceProvider source={{ idol: (id) => ({ id, name: id, rating: 80 }) as never, photo: () => undefined }}>
      <Telemetry rows={[row("mina", 78, 0.7, 0.5), row("rei", 80, 0.5, 0.5), row("yuna", 90, 0.55, 0.75)]} />
    </IdolSourceProvider>);
    expect(screen.getByRole("img").getAttribute("aria-label")).toBe("Games won against expectation for 3 idols. Best: mina +20 points; worst: yuna −20 points.");
    expect(document.querySelectorAll("circle")).toHaveLength(3);
    expect(within(screen.getByRole("region", { name: "Over-performers" })).getByRole("listitem").textContent).toBe("mina · rating 7870% vs 50%+20");
    expect(within(screen.getByRole("region", { name: "Under-performers" })).getByRole("listitem").textContent).toBe("yuna · rating 9055% vs 75%−20");
  });
  it("nothing played yet", () => {
    render(<IdolSourceProvider source={{ idol: () => undefined, photo: () => undefined }}><Telemetry rows={[]} /></IdolSourceProvider>);
    expect(screen.getByText("Not enough matches played yet.")).toBeTruthy();
  });
});
