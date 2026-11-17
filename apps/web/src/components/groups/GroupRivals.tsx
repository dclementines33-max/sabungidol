// The group against the others (members' head-to-heads summed per group): the favourite victim and the bogey group as
// callouts, the most frequent opponents as fight-card rows, and the civil war (members against each other).
import { IdolPhoto, useIdolLookup } from "@sabung/ui";
import { Link } from "@tanstack/react-router";
import type { CivilWar, GroupLine } from "../../data/groupMatchups";
import { CompetitionLogo } from "../CompetitionLogo";

type GroupInfo = { name: string; logoId: string | null };
const MIN = 5; // meetings before a group counts as a victim or a bogey
const share = (l: GroupLine) => (l.wins + l.draws / 2) / l.meetings;

function Line({ l, info }: { l: GroupLine; info?: GroupInfo }) {
  return (
    <Link to="/wiki/group/$id" params={{ id: l.groupId }} className="panel grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3 p-2 pr-4 hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-accent-bright">
      <span className="grid size-10 place-items-center">{info?.logoId ? <CompetitionLogo logoId={info.logoId} className="size-10" /> : <span aria-hidden="true" className="font-gothic text-lg">{(info?.name ?? "?").slice(0, 2)}</span>}</span>
      <span className="min-w-0">
        <span className="block truncate font-display text-lg">{info?.name ?? l.groupId}</span>
        <span aria-hidden="true" className="mt-1 flex h-1.5 -skew-x-12 overflow-hidden"><span className="bg-accent-bright" style={{ width: `${share(l) * 100}%` }} /><span className="flex-1 bg-cool" /></span>
      </span>
      <span className="text-right"><span className="score block text-lg">{l.wins}–{l.draws}–{l.losses}</span><span className="kicker text-text-secondary">{l.meetings} matches</span></span>
    </Link>
  );
}

export function GroupRivals({ rivals, civil, groups }: { rivals: GroupLine[]; civil: CivilWar[]; groups: Map<string, GroupInfo> }) {
  const lookup = useIdolLookup();
  const sample = rivals.filter((l) => l.meetings >= MIN);
  const victim = [...sample].sort((x, y) => share(y) - share(x) || y.meetings - x.meetings)[0];
  const bogey = [...sample].sort((x, y) => share(x) - share(y) || y.meetings - x.meetings)[0];
  return (
    <section aria-labelledby="group-rivals" className="space-y-4">
      <h3 id="group-rivals" className="section-title m-0">Group wars</h3>
      {rivals.length === 0 ? <p className="m-0 text-sm text-text-secondary">No matches against other groups yet.</p> : <>
        <div className="grid gap-3 sm:grid-cols-2">
          {victim && <div className="space-y-1"><p className="kicker m-0 text-winner">Favourite victim</p><Line l={victim} info={groups.get(victim.groupId)} /></div>}
          {bogey && bogey !== victim && <div className="space-y-1"><p className="kicker m-0">Bogey group</p><Line l={bogey} info={groups.get(bogey.groupId)} /></div>}
        </div>
        <p className="kicker m-0 text-text-secondary">Most frequent opponents</p>
        <ul className="m-0 grid list-none gap-2 p-0 md:grid-cols-2">{rivals.slice(0, 6).map((l) => <li key={l.groupId}><Line l={l} info={groups.get(l.groupId)} /></li>)}</ul>
      </>}
      {civil.length > 0 && <>
        <p className="kicker m-0 text-accent-bright">Civil war · members against each other</p>
        <ul className="m-0 grid list-none gap-2 p-0 md:grid-cols-3">
          {civil.slice(0, 3).map((c) => (
            <li key={`${c.a}|${c.b}`}>
              <Link to="/wiki/h2h" search={{ a: c.a, b: c.b }} className="panel flex items-center justify-between gap-2 p-2 hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-accent-bright">
                <span className="flex min-w-0 items-center gap-2"><IdolPhoto idolId={c.a} size={64} className="h-9 w-7 shrink-0 rounded-[3px]" /><span className="truncate text-sm">{lookup(c.a)?.name}</span></span>
                <span className="score shrink-0">{c.winsA}–{c.draws}–{c.winsB}</span>
                <span className="flex min-w-0 items-center justify-end gap-2"><span className="truncate text-right text-sm">{lookup(c.b)?.name}</span><IdolPhoto idolId={c.b} size={64} className="h-9 w-7 shrink-0 rounded-[3px]" /></span>
              </Link>
            </li>
          ))}
        </ul>
      </>}
    </section>
  );
}
