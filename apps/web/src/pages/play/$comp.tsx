// One competition panel (PRD §8); an unknown slug is a "not found".
import { createFileRoute, notFound } from "@tanstack/react-router";
import { PanelPlaceholder } from "../../components/PanelPlaceholder";
import { COMPETITIONS } from "../../components/shell/nav";

export const Route = createFileRoute("/play/$comp")({
  beforeLoad: ({ params }) => {
    if (!COMPETITIONS.some((c) => c.to === `/play/${params.comp}`)) throw notFound();
  },
  component: PanelPlaceholder,
});
