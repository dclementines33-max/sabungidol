// One part of a page that fails shows a short card in its place; the rest of the page keeps working (2026-11-16: a bad
// value used to take a whole page down). The error goes to the bell history like a panel crash; "Try again" re-renders.
import { Component, type ReactNode } from "react";
import { Button } from "@sabung/ui";
import { useNotices } from "../data/notices";

export const SECTION_ERROR_CODE = "E-PANEL-002";

export class SectionBoundary extends Component<{ name: string; children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: unknown) { return { error: error instanceof Error ? error : new Error(String(error)) }; }
  componentDidCatch(error: unknown) {
    useNotices.getState().record({ level: "error", code: SECTION_ERROR_CODE, message: `${this.props.name} failed to load`, context: error instanceof Error ? error.message : String(error) });
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <section role="alert" className="flex flex-wrap items-center gap-3 border-t-2 border-danger py-4">
        <p className="m-0 flex-1 text-sm"><span className="font-display">{this.props.name}</span> couldn't load. <span className="text-text-secondary">{this.state.error.message}</span></p>
        <Button onClick={() => this.setState({ error: null })}>Try again</Button>
      </section>
    );
  }
}
