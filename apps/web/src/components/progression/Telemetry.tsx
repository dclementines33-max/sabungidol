// Season telemetry (2026-11-17): every idol as a dot — rating across, games won above or below what that rating expected
// up and down (0 = on par). Over-performers in the cool colour, under-performers in the accent, the five furthest each
// way named; hovering a dot names it at once, clicking it (or a name in the lists, or the idol search) opens her telemetry
// across every season (IdolTelemetry). The two lists below are the same data as text.
import type { Telemetry as Row } from "@sabung/engine";
import { SearchableIdolSelect, useIdolLookup } from "@sabung/ui";
import { useState } from "react";
import { IdolTelemetry } from "./IdolTelemetry";

const W = 640;
const H = 300;
const PAD = { l: 40, r: 16, t: 14, b: 30 };
const NAMED = 5;
const pts = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(Math.round(v * 1000) / 10)}`;

export function Telemetry({ rows }: { rows: Row[] }) {
  const lookup = useIdolLookup();
  const name = (id: string) => lookup(id)?.name ?? id;
  const [hover, setHover] = useState<Row | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  if (!rows.length) return <p className="m-0 text-sm text-text-secondary">Not enough matches played yet.</p>;
  const over = rows.slice(0, NAMED).filter((r) => r.delta > 0);
  const under = rows.slice(-NAMED).reverse().filter((r) => r.delta < 0);
  const named = new Set([...over, ...under].map((r) => r.idolId));
  const [lo, hi] = [Math.min(...rows.map((r) => r.rating)) - 1, Math.max(...rows.map((r) => r.rating)) + 1];
  const top = Math.max(0.05, ...rows.map((r) => Math.abs(r.delta)));
  const x = (rating: number) => PAD.l + ((rating - lo) / (hi - lo)) * (W - PAD.l - PAD.r);
  const y = (d: number) => PAD.t + ((top - d) / (2 * top)) * (H - PAD.t - PAD.b);
  const ticks = [-top, -top / 2, 0, top / 2, top];
  // Name labels: pushed apart (13px) so no two overlap; one pushed over 20px from its dot is dropped (the lists name it).
  const labelY = new Map<string, number>();
  for (const list of [over, under]) {
    let prev = -Infinity;
    for (const r of [...list].sort((a, b) => y(a.delta) - y(b.delta))) { const want = Math.max(y(r.delta), prev + 13); if (want - y(r.delta) > 20) continue; labelY.set(r.idolId, want); prev = want; }
  }
  const tone = (d: number) => (d >= 0 ? "var(--color-cool)" : "var(--color-accent-bright)");
  const List = ({ title, list }: { title: string; list: Row[] }) => (
    <section aria-label={title} className="min-w-0">
      <p className="kicker m-0">{title}</p>
      <ol className="m-0 mt-2 list-none space-y-1 p-0 text-sm">
        {list.map((r) => (
          <li key={r.idolId} className="flex items-baseline gap-2 border-b border-border pb-1">
            <span className="min-w-0 flex-1 truncate"><button type="button" onClick={() => setOpen(r.idolId)} className="underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-accent-bright">{name(r.idolId)}</button> <span className="text-text-secondary">· rating {r.rating}</span></span>
            <span className="font-mono text-xs text-text-secondary tabular-nums">{Math.round(r.actual * 100)}% vs {Math.round(r.expected * 100)}%</span>
            <span className="font-display tabular-nums">{pts(r.delta)}</span>
          </li>
        ))}
      </ol>
    </section>
  );
  return (
    <div className="space-y-6">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img"
        aria-label={`Games won against expectation for ${rows.length} idols. Best: ${name(rows[0]!.idolId)} ${pts(rows[0]!.delta)} points; worst: ${name(rows.at(-1)!.idolId)} ${pts(rows.at(-1)!.delta)} points.`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="var(--color-border)" strokeOpacity={t === 0 ? 1 : 0.5} strokeDasharray={t === 0 ? undefined : "2 4"} />
            <text x={PAD.l - 6} y={y(t)} textAnchor="end" dominantBaseline="middle" fontSize="10" fill="var(--color-text-secondary)">{pts(t)}</text>
          </g>
        ))}
        <text x={W - PAD.r} y={H - 6} textAnchor="end" fontSize="10" fill="var(--color-text-secondary)">rating {Math.floor(hi)} →</text>
        <text x={PAD.l} y={H - 6} fontSize="10" fill="var(--color-text-secondary)">{Math.ceil(lo)}</text>
        {rows.map((r) => (
          <circle key={r.idolId} cx={x(r.rating)} cy={y(r.delta)} r={named.has(r.idolId) || hover === r ? 6 : 4} fill={tone(r.delta)} fillOpacity={named.has(r.idolId) || hover === r ? 1 : 0.45} stroke="var(--color-bg-base)" strokeWidth="2"
            className="cursor-pointer" onMouseEnter={() => setHover(r)} onMouseLeave={() => setHover(null)} onClick={() => setOpen(r.idolId)}>
            <title>{`${name(r.idolId)} · rating ${r.rating} · ${Math.round(r.actual * 100)}% of games won vs ${Math.round(r.expected * 100)}% expected (${pts(r.delta)})`}</title>
          </circle>
        ))}
        {[...over, ...under].filter((r) => labelY.has(r.idolId)).map((r) => (
          <text key={r.idolId} x={x(r.rating) + (x(r.rating) > W - 120 ? -8 : 8)} y={labelY.get(r.idolId)} textAnchor={x(r.rating) > W - 120 ? "end" : "start"} dominantBaseline="middle" fontSize="11" fontWeight="700" fill="var(--color-text-primary)" stroke="var(--color-bg-base)" strokeWidth="3" paintOrder="stroke">{name(r.idolId)}</text>
        ))}
        {hover && (
          <text pointerEvents="none" x={x(hover.rating) + (x(hover.rating) > W - 200 ? -10 : 10)} y={Math.max(PAD.t + 10, y(hover.delta) - 12)} textAnchor={x(hover.rating) > W - 200 ? "end" : "start"}
            fontSize="12" fontWeight="700" fill="var(--color-text-primary)" stroke="var(--color-bg-base)" strokeWidth="4" paintOrder="stroke">
            {name(hover.idolId)} · {hover.rating} · {pts(hover.delta)}
          </text>
        )}
      </svg>
      <div className="max-w-sm"><SearchableIdolSelect label="Open an idol's telemetry" idolIds={rows.map((r) => r.idolId)} value={null} onChange={(id) => id && setOpen(id)} /></div>
      <div className="grid gap-8 md:grid-cols-2">
        <List title="Over-performers" list={over} />
        <List title="Under-performers" list={under} />
      </div>
      {open && <IdolTelemetry id={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
