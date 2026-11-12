// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ColorSwatchPicker } from "./ColorSwatchPicker";

afterEach(cleanup);

describe("ColorSwatchPicker", () => {
  it("offers the 12 branding colours by name and reports the token", () => {
    const onChange = vi.fn();
    render(<ColorSwatchPicker label="Warna" value="brand-rose" onChange={onChange} />);
    expect(screen.getAllByRole("radio")).toHaveLength(12);
    expect((screen.getByRole("radio", { name: "rose" }) as HTMLInputElement).checked).toBe(true);
    fireEvent.click(screen.getByRole("radio", { name: "teal" }));
    expect(onChange).toHaveBeenCalledWith("brand-teal");
  });
});
