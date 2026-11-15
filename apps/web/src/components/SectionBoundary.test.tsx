// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useNotices } from "../data/notices";
import { SECTION_ERROR_CODE, SectionBoundary } from "./SectionBoundary";

afterEach(cleanup);

let broken = true;
function Fragile() {
  if (broken) throw new Error("tuning out of range");
  return <p>Engine Tuning works</p>;
}

describe("SectionBoundary", () => {
  it("a failing part shows a short card, the rest of the page keeps working, Try again re-renders it", () => {
    vi.spyOn(console, "error").mockImplementation(() => {}); // React logs the caught error
    const record = vi.spyOn(useNotices.getState(), "record");
    render(<><SectionBoundary name="Engine Tuning"><Fragile /></SectionBoundary><p>Danger Zone still here</p></>);
    expect(screen.getByRole("alert").textContent).toContain("Engine Tuning couldn't load");
    expect(screen.getByText("Danger Zone still here")).toBeTruthy();
    expect(record).toHaveBeenCalledWith(expect.objectContaining({ code: SECTION_ERROR_CODE }));
    broken = false;
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(screen.getByText("Engine Tuning works")).toBeTruthy();
  });
});
