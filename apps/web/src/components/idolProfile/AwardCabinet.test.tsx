// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { AwardCabinet } from "./AwardCabinet";

afterEach(cleanup);

it("Award cabinet: one shelf per award in award order, with its seasons", () => {
  render(<AwardCabinet awards={[{ key: "encore", season: 1 }, { key: "mvi", season: 3 }, { key: "mvi", season: 1 }]} />);
  expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toEqual(["MVI 2×S3 · S1", "Encore 1×S1"]);
});
