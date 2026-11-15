// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { StorageTile } from "./StorageTile";

afterEach(cleanup);

it("shows used of quota with a bar, and warns only above 80%", () => {
  render(<StorageTile usage={300e6} quota={2e9} />);
  expect(screen.getByText(/used of 2\.0 GB/)).toBeTruthy();
  expect(screen.getByRole("meter", { name: "Storage used" }).getAttribute("aria-valuenow")).toBe("15");
  expect(screen.queryByRole("status")).toBeNull();
  cleanup();
  render(<StorageTile usage={850e6} quota={1e9} />);
  expect(screen.getByRole("status").textContent).toMatch(/almost full \(85%\)/);
  cleanup();
  render(<StorageTile />);
  expect(screen.getByText("–")).toBeTruthy();
});
