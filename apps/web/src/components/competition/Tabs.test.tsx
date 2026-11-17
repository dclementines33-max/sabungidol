// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { Tabs } from "./Tabs";

afterEach(cleanup);

const tab = (id: string) => ({ id, label: id, content: () => <p>{`${id} panel`}</p> });

it("Tabs: falls back to the first tab when the active one drops out of the list", () => {
  const { rerender } = render(<Tabs label="t" tabs={[tab("a"), tab("b")]} />);
  fireEvent.click(screen.getByRole("tab", { name: "b" }));
  rerender(<Tabs label="t" tabs={[tab("a"), tab("c")]} />);
  expect(screen.getByText("a panel")).toBeTruthy();
  expect(screen.getByRole("tab", { name: "a" }).getAttribute("aria-selected")).toBe("true");
});
