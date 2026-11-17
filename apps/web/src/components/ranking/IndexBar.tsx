// Where an entry's Sabung Index comes from: one stacked bar, each part in its own colour, scaled to the leader's score.
import { type IndexParts, PARTS } from "./sabungIndex";

export const PART_COLOR: Record<keyof IndexParts, string> = {
  titles: "bg-winner", podiums: "bg-tier-s", awards: "bg-brand-orchid", form: "bg-accent-bright", rating: "bg-cool", feats: "bg-brand-teal",
};

export const describeParts = (parts: IndexParts) => PARTS.filter((p) => parts[p.key] > 0).map((p) => `${p.label} ${parts[p.key].toFixed(1)}`).join(" · ");

export function IndexBar({ parts, max }: { parts: IndexParts; max: number }) {
  return (
    <span className="block" title={describeParts(parts)}>
      <span aria-hidden="true" className="flex h-2.5 w-full -skew-x-12 overflow-hidden rounded-[2px] bg-stage-hi">
        {PARTS.map(({ key }) => parts[key] > 0 && <span key={key} className={PART_COLOR[key]} style={{ width: `${(parts[key] / Math.max(max, 1)) * 100}%` }} />)}
      </span>
      <span className="sr-only">{describeParts(parts)}</span>
    </span>
  );
}

export function IndexLegend() {
  return (
    <ul aria-label="Index parts" className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-xs text-text-secondary">
      {PARTS.map(({ key, label }) => <li key={key} className="flex items-center gap-1.5"><span aria-hidden="true" className={`size-2.5 -skew-x-12 ${PART_COLOR[key]}`} />{label}</li>)}
    </ul>
  );
}
