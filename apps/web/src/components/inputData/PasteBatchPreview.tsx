// The preview every Input Data source goes through (PRD §8): one row per idol, marked new,
// warning or refused, with the reason. Colours come from the notice levels (icon + label, not colour alone).
import type { PreviewRow } from "@sabung/shared";
import { LEVEL } from "@sabung/ui";

const LOOK = {
  new: { ...LEVEL.success, label: "Baru" },
  warning: { ...LEVEL.warning, label: "Peringatan" },
  duplicate: { ...LEVEL.error, label: "Ditolak" },
  invalid: { ...LEVEL.error, label: "Ditolak" },
};

export function PasteBatchPreview({ rows }: { rows: PreviewRow[] }) {
  const count = (s: PreviewRow["status"][]) => rows.filter((r) => s.includes(r.status)).length;
  return (
    <div className="space-y-2">
      <p className="m-0 text-sm text-text-secondary" aria-live="polite">
        {count(["new"])} baru · {count(["warning"])} peringatan · {count(["duplicate", "invalid"])} ditolak
      </p>
      <ol className="m-0 max-h-96 list-none space-y-1 overflow-auto p-0" aria-label="Pratinjau">
        {rows.map((r) => {
          const { icon: Icon, color, label } = LOOK[r.status];
          return (
            <li key={r.line} className="flex gap-3 rounded-control bg-surface/40 bg-surface px-3 py-2 text-sm">
              <span className={`${color} inline-flex w-28 shrink-0 items-center gap-1`}>
                <Icon aria-hidden="true" size={16} strokeWidth={1.5} /> {label}
              </span>
              <span className="w-8 shrink-0 font-mono text-text-secondary tabular-nums">{r.line}</span>
              <span className="min-w-0 flex-1">
                <span className="font-medium">{r.name || "(tanpa nama)"}</span>
                <span className="text-text-secondary"> · {r.groupName ?? "Soloist"}{r.input ? ` · ${r.input.rating}` : ""}</span>
                {r.reasons.length > 0 && <span className="block text-text-secondary">{r.reasons.join("; ")}</span>}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
