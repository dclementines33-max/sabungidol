// One All-time Records leaderboard (PRD §8): the top 10, and "lihat semua" for the whole ranking. The rank
// comes ranked from the Worker; hiding rows (name search) never changes it.
import { Button } from "@sabung/ui";
import { type ReactNode, useState } from "react";

export type RecordRow = { key: string; rank: string; who: ReactNode; value: string };

export function RecordCard({ title, rows }: { title: string; rows: RecordRow[] }) {
  const [all, setAll] = useState(false);
  const shown = all ? rows : rows.slice(0, 10);
  return (
    <section className="flex flex-col panel p-4" aria-label={title}>
      <h3 className="m-0 mb-3 text-xs tracking-widest text-text-secondary uppercase">{title}</h3>
      {rows.length === 0 ? <p className="m-0 text-sm text-text-secondary">Belum ada.</p> : (
        <ol className="m-0 max-h-[32rem] list-none space-y-1 overflow-auto p-0 text-sm">
          {shown.map((r) => (
            <li key={r.key} className="flex items-center gap-2">
              <span className="w-9 shrink-0 font-mono text-accent-bright">{r.rank}</span>
              <span className="min-w-0 flex-1 truncate">{r.who}</span>
              <span className="font-mono tabular-nums">{r.value}</span>
            </li>
          ))}
        </ol>
      )}
      {rows.length > 10 && <Button className="mt-3 self-start px-2 py-1 text-xs" onClick={() => setAll(!all)}>{all ? "Top 10 saja" : `Lihat semua (${rows.length})`}</Button>}
    </section>
  );
}
