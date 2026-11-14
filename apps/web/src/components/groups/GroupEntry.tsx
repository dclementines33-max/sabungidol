// One girl group in the ranked list (Update 2 ref "3 girl group stats"): blackletter rank, name, titles and record,
// titles per competition as chips, the group logo (Update 3), the members' photos; opened, a member table with titles per competition.
import type { CareerRow } from "@sabung/engine";
import { SEASON_COMPETITIONS } from "@sabung/shared";
import { IdolPhoto } from "@sabung/ui";
import { Link } from "@tanstack/react-router";
import { CompetitionLogo } from "../CompetitionLogo";
import { IdolLink } from "../wiki/IdolLink";
import { TierMix } from "./TierMix";
import type { GroupStat, TitleLine } from "./groupStats";

const NAME = Object.fromEntries(SEASON_COMPETITIONS.map((c) => [c.key, c.name]));
const pct = (x: number) => `${(x * 100).toFixed(1)}%`;

export function GroupEntry({ rank, g, logoId, open, onToggle, career, titles }: {
  rank: number; g: GroupStat; logoId?: string | null; open: boolean; onToggle: () => void; career: Map<string, CareerRow>; titles: TitleLine[];
}) {
  const comps = Object.keys(g.byComp);
  const numbers: [string, string, string][] = [["Wins", String(g.wins), "text-cool"], ["Draws", String(g.draws), ""], ["Losses", String(g.losses), "text-danger"], ["Win rate", pct(g.winRate), "text-accent-bright"], ["Diff", g.gameDiff > 0 ? `+${g.gameDiff}` : String(g.gameDiff), ""], ["Avg rating", g.avgRating.toFixed(1), ""]];
  return (
    <li className={`relative border-t border-border/60 py-6 ${rank <= 3 ? "pl-0" : "sm:pl-16"}`}>
      <div className="flex flex-wrap items-start gap-x-6 gap-y-3">
        <span aria-hidden="true" className={`font-gothic leading-none text-accent-bright ${rank <= 3 ? "text-7xl" : "text-4xl opacity-70"}`}>{rank}</span>
        <CompetitionLogo logoId={logoId} className={rank <= 3 ? "size-16" : "size-10"} />
        <div className="min-w-0 flex-1">
          <h2 className="m-0 text-[clamp(1.5rem,3.5vw,2.5rem)]">
            <button type="button" aria-expanded={open} onClick={onToggle} className="text-left hover:text-accent-bright focus-visible:outline-2 focus-visible:outline-accent-bright">{g.name}</button>
          </h2>
          <p className="kicker m-0 text-text-secondary"><span className="text-accent-bright">{g.titles} titles</span> · {g.members.length} members · {g.matches.toLocaleString("en-GB")} matches · <Link to="/wiki/group/$id" params={{ id: g.id }} className="text-text-primary underline underline-offset-4">Group page</Link></p>
          <p className="m-0 mt-1 text-sm text-text-secondary">Top member <IdolLink id={g.best} /></p>
          <TierMix tiers={g.tiers} name={g.name} />
          {comps.length > 0 && (
            <ul className="m-0 mt-2 flex list-none flex-wrap gap-1 p-0" aria-label={`${g.name} titles`}>
              {comps.map((c) => <li key={c} className="bg-surface-hover/60 px-2 py-0.5 text-xs">{NAME[c] ?? c} <b className="text-accent-bright">{g.byComp[c]}</b></li>)}
            </ul>
          )}
        </div>
        <dl className="m-0 flex flex-wrap gap-x-6 gap-y-1">
          {numbers.map(([label, value, tone]) => (
            <div key={label}><dt className="text-[10px] font-bold tracking-[0.18em] text-text-secondary uppercase">{label}</dt><dd className={`m-0 font-display text-xl tabular-nums ${tone}`}>{value}</dd></div>
          ))}
        </dl>
      </div>
      <ul className="m-0 mt-4 flex list-none gap-1 p-0" aria-label={`Member ${g.name}`}>
        {g.members.map((id) => <li key={id} className={id === g.best ? "outline-2 outline-brand-gold" : ""}><IdolPhoto idolId={id} size={64} className="h-12 w-10" /></li>)}
      </ul>
      {open && (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full border-collapse text-sm tabular-nums">
            <caption className="kicker pb-2 text-left">{g.name} member stats</caption>
            <thead>
              <tr className="text-left text-[10px] tracking-[0.15em] text-text-secondary uppercase">
                {["#", "Member", ...comps.map((c) => NAME[c] ?? c), "Matches", "W-D-L", "Win rate"].map((h) => <th key={h} scope="col" className="px-2 pb-1 font-bold whitespace-nowrap">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {g.members.map((id, i) => {
                const l = career.get(id);
                return (
                  <tr key={id} className="border-t border-border/50">
                    <td className="px-2 font-display">{i + 1}</td>
                    <td className="px-2 py-1"><span className="flex items-center gap-2"><IdolPhoto idolId={id} size={64} className="h-8 w-6" /><IdolLink id={id} /></span></td>
                    {comps.map((c) => <td key={c} className="px-2 font-mono text-accent-bright">{titles.find((t) => t.idolId === id && t.comp === c)?.titles ?? 0}</td>)}
                    <td className="px-2 font-mono">{l?.matches ?? 0}</td>
                    <td className="px-2 font-mono">{l ? `${l.wins}-${l.draws}-${l.losses}` : "0-0-0"}</td>
                    <td className="px-2 font-mono">{pct(l?.winRate ?? 0)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </li>
  );
}
