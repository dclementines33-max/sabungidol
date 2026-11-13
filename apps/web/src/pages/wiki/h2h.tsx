import { createFileRoute } from "@tanstack/react-router";
import { PanelPlaceholder } from "../../components/PanelPlaceholder";

const id = (v: unknown) => (typeof v === "string" && v ? v : undefined);
export const Route = createFileRoute("/wiki/h2h")({ validateSearch: (s): { a?: string; b?: string } => ({ a: id(s.a), b: id(s.b) }), component: PanelPlaceholder });
