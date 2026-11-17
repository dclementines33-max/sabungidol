// One All-time Records leaderboard (PRD §8): the top 10, and "See all" for the whole ranking. The rank
// comes ranked from the Worker; hiding rows (name search) never changes it. The first row is the holder: a big value
// and photo on a glow in the card's arena colour (data-arena, tokens.css); the rest is a plain ranked list.
import { Button, IdolPhoto } from "@sabung/ui";
import { type ReactNode, useState } from "react";

export type RecordRow = { key: string; rank: string; who: ReactNode; value: string; idolId?: string };

export function RecordCard({ title, rows, arena }: { title: string; rows: RecordRow[]; arena?: string }) {
  const [all, setAll] = useState(false);
  const shown = all ? rows : rows.slice(0, 10);
  return (
    <section data-arena={arena} className="flex flex-col panel p-4" aria-label={title}
      style={{ backgroundImage: "radial-gradient(22rem 12rem at 100% 0%, color-mix(in oklab, var(--color-accent-bright) 22%, transparent), transparent 70%), linear-gradient(180deg, color-mix(in oklab, var(--color-surface-hover) 55%, transparent), color-mix(in oklab, var(--color-bg-raised) 65%, transparent))" }}>
      <h3 className="section-title mb-4 text-base">{title}</h3>
      {rows.length === 0 ? <p className="m-0 text-sm text-text-secondary">None yet.</p> : (
        <ol className="m-0 max-h-[32rem] list-none space-y-1 overflow-auto p-0 text-sm">
          {shown.map((r, i) => (
            <li key={r.key} className={i === 0 ? "mb-2 flex items-center gap-3 rounded-[4px] bg-[linear-gradient(90deg,color-mix(in_oklab,var(--color-winner)_22%,transparent),transparent)] p-2" : "flex items-center gap-2 rounded-[3px] px-2 py-1 odd:bg-stage-hi/40"}>
              <span className={i === 0 ? "score w-9 shrink-0 text-3xl text-winner" : "score w-9 shrink-0 text-accent-bright"}>{r.rank}</span>
              {i === 0 && r.idolId && <IdolPhoto idolId={r.idolId} size={256} className="photo-frame h-20 w-16 shrink-0" />}
              <span className={i === 0 ? "min-w-0 flex-1 font-display text-base uppercase" : "min-w-0 flex-1 truncate"}>{r.who}</span>
              <span className={i === 0 ? "score text-2xl text-winner" : "font-mono tabular-nums"}>{r.value}</span>
            </li>
          ))}
        </ol>
      )}
      {rows.length > 10 && <Button className="mt-3 self-start px-2 py-1 text-xs" onClick={() => setAll(!all)}>{all ? "Top 10 only" : `See all (${rows.length})`}</Button>}
    </section>
  );
}
