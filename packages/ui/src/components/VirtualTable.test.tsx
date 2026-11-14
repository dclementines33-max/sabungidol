// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { VirtualTable } from "./VirtualTable";

afterEach(cleanup);
// jsdom has no layout: give every element an 800 × 800 box so the table has a view to fill.
for (const size of ["clientHeight", "clientWidth"]) Object.defineProperty(HTMLElement.prototype, size, { configurable: true, get: () => 800 });

const rows = Array.from({ length: 1000 }, (_, i) => ({ id: `r${i}`, name: `Row ${i}` }));

describe("VirtualTable", () => {
  it("renders only the rows in view, but tells assistive tech the full count", () => {
    render(<VirtualTable rows={rows} rowKey={(r) => r.id} label="Rows" columns={[{ header: "Name", cell: (r) => r.name }]} />);
    expect(screen.getByRole("columnheader", { name: "Name" })).toBeTruthy();
    expect(screen.getByText("Row 0")).toBeTruthy();
    expect(screen.queryByText("Row 999")).toBeNull();
    const shown = screen.getAllByRole("row").length;
    expect(shown).toBeGreaterThan(5);
    expect(shown).toBeLessThan(60);
    expect(screen.getByRole("table").getAttribute("aria-rowcount")).toBe("1001");
  });
});
