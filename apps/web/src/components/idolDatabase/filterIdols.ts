// Idol Database filters and sort (PRD §8: group, league, tier, status, nationality; sort rating/name).
// An empty value means "all". Group "solo" = Soloists; league "reserve" = in no league this season.
import type { IdolRow } from "@sabung/db";
import { tierOf } from "@sabung/shared";

export type IdolFilter = { group: string; league: string; tier: string; status: string; nationality: string; sort: "rating" | "name" };
export const NO_FILTER: IdolFilter = { group: "", league: "", tier: "", status: "", nationality: "", sort: "rating" };

export function filterIdols(idols: IdolRow[], leagueOf: Map<string, string>, f: IdolFilter): IdolRow[] {
  const shown = idols.filter((i) =>
    (!f.group || (i.groupId ?? "solo") === f.group)
    && (!f.league || (leagueOf.get(i.id) ?? "reserve") === f.league)
    && (!f.tier || tierOf(i.rating) === f.tier)
    && (!f.status || i.active === (f.status === "active"))
    && (!f.nationality || i.nationality === f.nationality));
  const byName = (a: IdolRow, b: IdolRow) => a.name.localeCompare(b.name);
  return shown.sort(f.sort === "name" ? byName : (a, b) => b.rating - a.rating || byName(a, b));
}
