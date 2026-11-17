// A big number with its label and change (PRD §9 proposal).
export function StatTile({ label, value, delta }: { label: string; value: string | number; delta?: number }) {
  const deltaText = delta === undefined ? null : delta > 0 ? `+${delta}` : delta < 0 ? `−${-delta}` : "±0";
  const deltaColor = !delta ? "text-muted" : delta > 0 ? "text-cool" : "text-danger";
  return (
    <dl className="m-0 panel p-4">
      <dt className="kicker text-text-secondary">{label}</dt>
      <dd className="m-0 mt-1 flex items-baseline gap-2">
        <span className="score text-2xl">{value}</span>
        {deltaText && <span className={`${deltaColor} font-mono text-sm tabular-nums`}>{deltaText}</span>}
      </dd>
    </dl>
  );
}
