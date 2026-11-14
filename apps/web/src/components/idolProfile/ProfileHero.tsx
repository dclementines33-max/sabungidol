// Idol Profile hero (PRD §8; Update 2 ref "5 idol profile hero"): a dossier cover — an idol picker, the big torn photo,
// the name huge with its outline behind, group / nationality / age, rating tier, current league, then the career record
// as big numbers (W–D–L, win rate, titles, podiums, matches) and the Head to Head button.
import type { IdolRow } from "@sabung/db";
import { tierOf } from "@sabung/shared";
import { IdolPhoto, RatingBadge, SearchableIdolSelect } from "@sabung/ui";
import { Link, useNavigate } from "@tanstack/react-router";
import { GitCompareArrows } from "lucide-react";
import { useBranding } from "../../data/branding";

const age = (birthday: string | null) => (birthday ? Math.floor((Date.now() - Date.parse(birthday)) / 31_557_600_000) : null);
type CareerRecord = { titles: number; podiums: number; matches: number; wins: number; draws: number; losses: number; winRate: number };

export function ProfileHero({ idol, idolIds, league, record }: { idol: IdolRow; idolIds: string[]; league?: string; record: CareerRecord }) {
  const navigate = useNavigate();
  const { brand } = useBranding();
  const years = age(idol.birthday);
  const facts = [idol.groupName ?? "Soloist", idol.role, idol.nationality, years !== null ? `${years} yrs` : null, idol.active ? null : "Inactive"].filter(Boolean);
  const numbers: [string, string][] = [["Win rate", `${Math.round(record.winRate * 100)}%`], ["Titles", String(record.titles)], ["Podium", String(record.podiums)], ["Match", record.matches.toLocaleString("en-GB")]];
  return (
    <section aria-labelledby="idol-name" className="relative isolate space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <p className="kicker m-0 text-text-secondary">Player dossier / career archive</p>
        <div className="w-full max-w-xs">
          <SearchableIdolSelect key={idol.id} label="Find an idol" idolIds={idolIds} value={idol.id} onChange={(id) => id && navigate({ to: "/wiki/idols/$id", params: { id } })} />
        </div>
      </div>
      <p aria-hidden="true" className="outline-text pointer-events-none absolute top-16 right-0 -z-10 m-0 max-w-full truncate font-display text-[clamp(4rem,13vw,10rem)] leading-none opacity-40">{idol.name}</p>
      <div className="flex flex-col gap-8 md:flex-row md:items-end">
        <IdolPhoto idolId={idol.id} size={1024} className="photo-frame w-56 shrink-0 sm:w-72" />
        <div className="min-w-0 flex-1 space-y-4">
          <p className="m-0 flex flex-wrap items-center gap-2"><span className="tag">{league ? brand(league).name : "Reserve"}</span><RatingBadge rating={idol.rating} /><span className="font-gothic text-2xl text-accent-bright">Tier {tierOf(idol.rating)}</span></p>
          <h2 id="idol-name" className="m-0 text-[clamp(2.5rem,7vw,5.5rem)] leading-none break-words">{idol.name}</h2>
          <p className="kicker m-0 text-text-secondary">{facts.join(" · ")}</p>
          <p className="m-0 flex items-baseline gap-3 font-display tabular-nums" aria-label={`Career record ${record.wins} wins, ${record.draws} draws, ${record.losses} losses`}>
            <span className="text-[clamp(2rem,5vw,3.5rem)] text-cool">{record.wins}<small className="text-sm">M</small></span>
            <span className="text-[clamp(2rem,5vw,3.5rem)]">{record.draws}<small className="text-sm">S</small></span>
            <span className="text-[clamp(2rem,5vw,3.5rem)] text-danger">{record.losses}<small className="text-sm">K</small></span>
          </p>
          <dl className="m-0 flex flex-wrap gap-x-8 gap-y-2">
            {numbers.map(([label, value]) => (
              <div key={label} className="border-l-2 border-accent-bright pl-3"><dt className="text-[10px] font-bold tracking-[0.2em] text-text-secondary uppercase">{label}</dt><dd className="m-0 font-display text-2xl">{value}</dd></div>
            ))}
          </dl>
          <Link to="/wiki/h2h" search={{ a: idol.id }} className="inline-flex items-center gap-2 bg-surface-hover/60 px-3 py-2 text-xs font-bold uppercase hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-accent-bright">
            <GitCompareArrows aria-hidden="true" size={16} /> Bandingkan (Head to Head)
          </Link>
        </div>
      </div>
    </section>
  );
}
