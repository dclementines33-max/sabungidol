// A paged list of saved matches (PRD §8 Match Database, Idol Profile, Head to Head): 50 at a time from the
// Worker with a cursor, never everything at once, and the number of results.
import type { MatchFilter } from "@sabung/db";
import { Button } from "@sabung/ui";
import { useInfiniteQuery } from "@tanstack/react-query";
import { engine } from "../../data/engineClient";
import { IdolLink } from "./IdolLink";

export function MatchLog({ filter, newest = true, label = "Match" }: { filter: MatchFilter; newest?: boolean; label?: string }) {
  const query = useInfiniteQuery({
    queryKey: ["matches", filter, newest],
    queryFn: ({ pageParam }) => engine().matchPage(filter, { after: pageParam, newest }),
    initialPageParam: undefined as string | undefined,
    staleTime: 0, // wiki data changes whenever a match is played
    getNextPageParam: (last) => last.next ?? undefined,
  });
  const total = query.data?.pages[0]?.total;
  const rows = query.data?.pages.flatMap((p) => p.rows) ?? [];
  if (query.isPending) return <p className="text-text-secondary">Loading matches…</p>;
  return (
    <div className="space-y-3">
      <p className="m-0 text-sm text-text-secondary" aria-live="polite">{label}: {total ?? 0} matches</p>
      {rows.length > 0 && (
        <ul className="m-0 list-none space-y-1 p-0 text-sm" aria-label={label}>
          {rows.map((m) => (
            <li key={m.id} className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 rounded-[4px] bg-stage-hi/50 px-3 py-2 odd:bg-stage-hi/80 sm:grid-cols-[11rem_minmax(0,1fr)_auto_minmax(0,1fr)]">
              <span className="col-span-3 font-mono text-xs text-text-secondary sm:col-span-1">{m.id.split("-").slice(0, 4).join(" · ")}</span>
              <span className={`truncate text-right ${m.result === "A" ? "font-display uppercase" : m.result === "B" ? "text-text-secondary" : ""}`}><IdolLink id={m.idolA} /></span>
              <span className="score w-16 -skew-x-12 bg-bg-base/80 py-1 text-center shadow-[inset_0_-2px_0_var(--color-accent-bright)]">{m.scoreA}–{m.scoreB}</span>
              <span className={`truncate ${m.result === "B" ? "font-display uppercase" : m.result === "A" ? "text-text-secondary" : ""}`}><IdolLink id={m.idolB} /></span>
            </li>
          ))}
        </ul>
      )}
      {query.hasNextPage && <Button disabled={query.isFetchingNextPage} onClick={() => query.fetchNextPage()}>Load 50 more</Button>}
    </div>
  );
}
