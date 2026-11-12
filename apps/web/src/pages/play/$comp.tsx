// One competition panel (PRD §8); an unknown slug is a "not found". Leagues are built (Fase 3 step 4);
// the cups follow in step 5.
import { D1_LEAGUES, D2_LEAGUES } from "@sabung/shared";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { LeaguePanel } from "../../components/competition/LeaguePanel";
import { PanelPlaceholder } from "../../components/PanelPlaceholder";
import { COMPETITIONS } from "../../components/shell/nav";

export const Route = createFileRoute("/play/$comp")({
  beforeLoad: ({ params }) => {
    if (!COMPETITIONS.some((c) => c.to === `/play/${params.comp}`)) throw notFound();
  },
  component: Competition,
});

function Competition() {
  const { comp } = Route.useParams();
  if (comp === "d1") return <LeaguePanel key={comp} codes={[...D1_LEAGUES]} zoneKey="D1" />;
  if (comp === "d2") return <LeaguePanel key={comp} codes={[...D2_LEAGUES]} zoneKey="D2" />;
  if (comp === "the-idols") return <LeaguePanel key={comp} codes={["IDL"]} zoneKey="IDL" />;
  return <PanelPlaceholder />;
}
