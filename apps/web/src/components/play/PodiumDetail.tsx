// Season Honours: the season's top 3 as a podium spread (2026-11-16, no boxes) — the Idol of the Season raised in the
// middle, #2 and #3 lower at her sides, each with her whole season — then the Unzure Cup champion. Stats arrive in one
// fast query; the news is the shared Season Story query, filtered per idol, most important first.
import { type AnyStory, newsScore } from "@sabung/engine";
import { useQuery } from "@tanstack/react-query";
import { engine } from "../../data/engineClient";
import { involves } from "../../data/podiumDetail";
import { HonoursIdol } from "./HonoursIdol";

const NO_DELAY = "motion-reduce:[animation-delay:0ms]";
// Grid columns: #2 left, #1 middle (raised), #3 right; stacked 1, 2, 3 on small screens.
const SPOTS = [
  { kicker: "Idol of the Season", mark: "01", cls: "lg:order-2", delay: 0 },
  { kicker: "2nd", mark: "02", cls: "lg:order-1 lg:mt-28", delay: 250 },
  { kicker: "3rd", mark: "03", cls: "lg:order-3 lg:mt-40", delay: 500 },
];

export function PodiumDetail({ seasonId, top, unzure }: { seasonId: string; top: string[]; unzure?: string }) {
  const ids = unzure ? [...top, unzure] : top;
  const live = typeof Worker !== "undefined";
  const { data } = useQuery({ queryKey: ["podium-detail", seasonId, ids], queryFn: () => engine().podiumDetail(seasonId, ids), staleTime: 0, enabled: live });
  const { data: stories = [] } = useQuery({ queryKey: ["season-story", seasonId], queryFn: () => engine().seasonStory(seasonId), staleTime: 0, enabled: live });
  if (!data) return null;
  const newsOf = (id: string): AnyStory[] => stories.filter((s) => involves(s, id)).sort((a, b) => newsScore(b) - newsScore(a));
  const uzc = unzure ? data[top.length] : undefined;
  return (
    <>
      <ol aria-label="Season top 3" className="m-0 grid list-none items-start gap-12 p-0 lg:grid-cols-3 lg:gap-8">
        {data.slice(0, top.length).map((d, i) => (
          <li key={d.id} className={`animate-rise ${NO_DELAY} ${SPOTS[i]!.cls}`} style={{ animationDelay: `${SPOTS[i]!.delay}ms` }}>
            <HonoursIdol d={d} kicker={SPOTS[i]!.kicker} mark={SPOTS[i]!.mark} lead={i === 0} stories={newsOf(d.id)} />
          </li>
        ))}
      </ol>
      {uzc && (
        <div data-arena="uzc" className="border-t border-border pt-10">
          <HonoursIdol d={uzc} kicker="Unzure Cup champion" mark="UZC" stories={newsOf(uzc.id)} />
        </div>
      )}
    </>
  );
}
