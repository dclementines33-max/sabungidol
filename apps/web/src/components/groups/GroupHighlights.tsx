// A row of four highlights above the rankings: the group with the most titles, the best win rate (50+ matches), the
// highest average rating and the biggest roster; each links to its group page.
import { Link } from "@tanstack/react-router";
import type { GroupStat } from "./groupStats";

const best = (stats: GroupStat[], by: (g: GroupStat) => number) => stats.reduce<GroupStat | undefined>((top, g) => (!top || by(g) > by(top) ? g : top), undefined);

export function GroupHighlights({ stats }: { stats: GroupStat[] }) {
  const items: [string, GroupStat | undefined, string][] = [];
  const titles = best(stats, (g) => g.titles);
  const rate = best(stats.filter((g) => g.matches >= 50), (g) => g.winRate);
  const rating = best(stats, (g) => g.avgRating);
  const roster = best(stats, (g) => g.members.length);
  if (titles?.titles) items.push(["Most titles", titles, `${titles.titles} titles`]);
  if (rate) items.push(["Best win rate", rate, `${(rate.winRate * 100).toFixed(1)}%`]);
  if (rating) items.push(["Highest average rating", rating, rating.avgRating.toFixed(1)]);
  if (roster) items.push(["Biggest roster", roster, `${roster.members.length} members`]);
  if (!items.length) return null;
  return (
    <ul aria-label="Highlights" className="m-0 grid list-none grid-cols-2 gap-3 p-0 lg:grid-cols-4">
      {items.map(([label, g, value]) => (
        <li key={label} className="panel px-4 py-3">
          <p className="kicker m-0">{label}</p>
          <p className="m-0 font-display text-2xl tabular-nums text-accent-bright">{value}</p>
          <Link to="/wiki/group/$id" params={{ id: g!.id }} className="text-sm underline underline-offset-4">{g!.name}</Link>
        </li>
      ))}
    </ul>
  );
}
