import { createRouter } from "@tanstack/react-router";
import { PanelError } from "./components/PanelError";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  // Every route gets its own error boundary: a crashing panel never takes the shell down (PRD §14.2).
  return createRouter({ routeTree, scrollRestoration: true, defaultErrorComponent: PanelError });
}
