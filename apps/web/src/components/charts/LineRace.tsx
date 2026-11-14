// A line chart of several idols over matchdays (title race, positions …): one coloured line per idol, the name at
// its end, light gridlines only. `invert` puts low values on top (rank 1 at the top).
import { useIdolLookup } from "@sabung/ui";

export const RACE_COLORS = ["var(--color-accent-bright)", "var(--color-cool)", "#f5c451", "#b07cff", "#5fd3a8", "#ff8a4c"];
const W = 640;
const H = 280;
const PAD = { l: 34, r: 110, t: 12, b: 26 };

export function LineRace({ series, label, invert = false, unit = "" }: { series: { id: string; values: number[] }[]; label: string; invert?: boolean; unit?: string }) {
  const lookup = useIdolLookup();
  const n = Math.max(1, ...series.map((s) => s.values.length - 1));
  const all = series.flatMap((s) => s.values);
  const lo = invert ? Math.min(1, ...all) : 0;
  const hi = Math.max(lo + 1, ...all);
  const x = (i: number) => PAD.l + (i / n) * (W - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + ((invert ? v - lo : hi - v) / (hi - lo)) * (H - PAD.t - PAD.b);
  const ticks = Array.from({ length: 5 }, (_, i) => Math.round(lo + ((hi - lo) * i) / 4));
  const leader = series[0];
  // End labels: sorted by height, pushed apart so names never overlap.
  const labelY = new Map<string, number>();
  let prev = -Infinity;
  for (const s of [...series].sort((a, b) => y(a.values.at(-1)!) - y(b.values.at(-1)!))) { const want = Math.max(y(s.values.at(-1)!), prev + 13); labelY.set(s.id, want); prev = want; }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`${label}: ${leader ? `${lookup(leader.id)?.name} ${leader.values.at(-1)}${unit}` : "no data yet"}`}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="var(--color-border)" strokeOpacity="0.5" strokeDasharray="2 4" />
          <text x={PAD.l - 6} y={y(t)} textAnchor="end" dominantBaseline="middle" fontSize="10" fill="var(--color-text-secondary)">{t}</text>
        </g>
      ))}
      <text x={W - PAD.r} y={H - 6} textAnchor="end" fontSize="10" fill="var(--color-text-secondary)">matchday {n}</text>
      {series.map((s, k) => {
        const color = RACE_COLORS[k % RACE_COLORS.length];
        const last = s.values.length - 1;
        return (
          <g key={s.id}>
            <polyline points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ")} fill="none" stroke={color} strokeWidth={k === 0 ? 3 : 1.8} strokeLinejoin="round" opacity={k === 0 ? 1 : 0.85} />
            <circle cx={x(last)} cy={y(s.values[last]!)} r="3.5" fill={color} />
            <text x={x(last) + 8} y={labelY.get(s.id)} dominantBaseline="middle" fontSize="11" fontWeight="700" fill={color}>{lookup(s.id)?.name} {s.values[last]}{unit}</text>
          </g>
        );
      })}
    </svg>
  );
}
