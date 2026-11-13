// One competition panel (PRD §8); an unknown slug is a "not found". Leagues, The Idols (+ playoff),
// the road to the Unzure Cup, and every other cup.
import { B_SIDE_CUPS, D1_LEAGUES, D2_LEAGUES } from "@sabung/shared";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { CupPanel } from "../../components/competition/CupPanel";
import { LeaguePanel } from "../../components/competition/LeaguePanel";
import { UnzurePanel } from "../../components/competition/UnzurePanel";
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
  if (comp === "the-idols") return <LeaguePanel key={comp} codes={["IDL"]} zoneKey="IDL" playoff={() => <CupPanel codes={["IDL"]} title="Playoff (double elimination)" />} />;
  if (comp === "unzure") return <UnzurePanel />;
  const cup = { inkigayo: ["INK"], nugu: ["NUG"], "b-side": [...B_SIDE_CUPS], daesang: ["DSG"], "music-bank": ["MBK"] }[comp];
  return cup ? <CupPanel key={comp} codes={cup} /> : null;
}
