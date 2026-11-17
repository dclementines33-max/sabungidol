// Head to Head → Official Rivalries: the hottest rivalry as a big poster, the next ones as cards, the rest on demand.
// Explains the tiers once, so the names mean something.
import type { Rivalry } from "@sabung/engine";
import { ShowMore } from "../ShowMore";
import { RivalryCard } from "./RivalryCard";

const COMPACT = 7; // the poster + six cards

export function OfficialRivalries({ list }: { list: Rivalry[] }) {
  return (
    <section aria-labelledby="official-rivalries" className="space-y-3">
      <h2 id="official-rivalries" className="section-title">Official Rivalries</h2>
      <p className="m-0 max-w-prose text-sm text-text-secondary">
        Pairs earn a name once they keep meeting: <b>Eternal Rivalry</b> (10+ meetings, close), <b>Blood Feud</b> (6+), <b>Rising Rivalry</b> (4+), or <b>Nemesis</b> when one side keeps winning. When they meet again it is a <b>Grudge Match</b>.
      </p>
      {list.length === 0 ? <p className="m-0 text-sm text-text-secondary">No rivalry yet: pairs need four meetings first.</p> : (
        <ShowMore more={list.length > COMPACT} label={`Show all ${list.length} rivalries`}>{(open) => (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="sm:col-span-2 xl:col-span-3"><RivalryCard r={list[0]!} big /></div>
            {(open ? list : list.slice(0, COMPACT)).slice(1).map((r) => <RivalryCard key={`${r.a}|${r.b}`} r={r} />)}
          </div>
        )}</ShowMore>
      )}
    </section>
  );
}
