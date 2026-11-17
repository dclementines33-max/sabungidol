// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { ShowMore } from "./ShowMore";

afterEach(cleanup);

it("ShowMore: compact first, the full view on the button, Show less back", () => {
  const items = ["a", "b", "c"];
  render(<ShowMore more label="Show all 3">{(open) => <p>{(open ? items : items.slice(0, 1)).join()}</p>}</ShowMore>);
  expect(screen.getByText("a")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Show all 3" }));
  expect(screen.getByText("a,b,c")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Show less" }));
  expect(screen.getByText("a")).toBeTruthy();
  render(<ShowMore more={false} label="x">{() => <p>all</p>}</ShowMore>);
  expect(screen.queryByRole("button", { name: "x" })).toBeNull();
});
