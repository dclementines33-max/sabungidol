// Idol Profile → Records (PRD §8): the all-time records where this idol is in the top 10.
import { type RecordEntry, rankLabel } from "@sabung/engine";

type Held = RecordEntry & { id: string; label: string; kind: "total" | "percent" };

export function ProfileRecords({ records }: { records: Held[] }) {
  if (!records.length) return <p className="text-sm text-text-secondary">Not in any record top 10 yet.</p>;
  return (
    <>
    <p className="m-0 mb-3 text-xs text-text-secondary">This idol's place in the all-time records (top 10). Tied places share a number.</p>
    <ul className="m-0 list-none space-y-1 p-0 text-sm">
      {records.map((r) => (
        <li key={r.id} className="flex gap-3">
          <span className={`w-28 shrink-0 font-mono ${r.rank === 1 ? "text-brand-gold" : "text-accent-bright"}`}>{rankLabel(r)}</span>
          <span className="flex-1">{r.label}</span>
          <span className="font-mono tabular-nums">{r.kind === "percent" ? `${(r.value * 100).toFixed(1)}%` : r.value}</span>
        </li>
      ))}
    </ul>
    </>
  );
}
