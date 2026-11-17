// One idol's telemetry across every season (2026-11-17), opened from a Telemetry dot: a chart of her share of games won
// against what her rating expected, season by season, then per season and competition the same numbers plus her
// achievement (0–100 place value) against what the rating model expected for her rating.
import { Modal, useIdol } from "@sabung/ui";
import { useQuery } from "@tanstack/react-query";
import { useBranding } from "../../data/branding";
import { engine } from "../../data/engineClient";

type Data = Awaited<ReturnType<ReturnType<typeof engine>["idolTelemetry"]>>;
const W = 560;
const H = 180;
const PAD = { l: 36, r: 12, t: 12, b: 24 };
const pct = (v: number) => `${Math.round(v * 100)}%`;
const signed = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(Math.round(v))}`;

function SeasonChart({ data }: { data: Data }) {
  const x = (i: number) => PAD.l + (data.length < 2 ? (W - PAD.l - PAD.r) / 2 : (i / (data.length - 1)) * (W - PAD.l - PAD.r));
  const y = (v: number) => PAD.t + (1 - v) * (H - PAD.t - PAD.b);
  const line = (key: "actual" | "expected") => data.map((s, i) => `${i ? "L" : "M"}${x(i)},${y(s.overall[key])}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img"
      aria-label={`Games won per season against expectation: ${data.map((s) => `${s.name} ${pct(s.overall.actual)} vs ${pct(s.overall.expected)}`).join("; ")}.`}>
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <g key={t}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="var(--color-border)" strokeOpacity={t === 0.5 ? 1 : 0.5} strokeDasharray={t === 0.5 ? undefined : "2 4"} />
          <text x={PAD.l - 6} y={y(t)} textAnchor="end" dominantBaseline="middle" fontSize="10" fill="var(--color-text-secondary)">{pct(t)}</text>
        </g>
      ))}
      <path d={line("expected")} fill="none" stroke="var(--color-text-secondary)" strokeWidth="2" strokeDasharray="5 4" />
      <path d={line("actual")} fill="none" stroke="var(--color-cool)" strokeWidth="2.5" />
      {data.map((s, i) => (
        <g key={s.season}>
          <circle cx={x(i)} cy={y(s.overall.expected)} r="3" fill="var(--color-text-secondary)" />
          <circle cx={x(i)} cy={y(s.overall.actual)} r="5" fill={s.overall.delta >= 0 ? "var(--color-cool)" : "var(--color-accent-bright)"} />
          <text x={x(i)} y={H - 6} textAnchor="middle" fontSize="10" fill="var(--color-text-secondary)">S{s.season}</text>
        </g>
      ))}
    </svg>
  );
}

export function IdolTelemetry({ id, onClose }: { id: string; onClose: () => void }) {
  const idol = useIdol(id);
  const { label } = useBranding();
  const { data } = useQuery({ queryKey: ["idol-telemetry", id], queryFn: () => engine().idolTelemetry(id), enabled: typeof Worker !== "undefined" });
  return (
    <Modal open onOpenChange={(o) => !o && onClose()} title={`${idol.name} · telemetry`} className="max-w-3xl"
      description="Games won against what her rating expected, and each competition's result (0–100) against what an idol of her rating usually achieves.">
      {!data ? <p className="text-sm text-text-secondary">Replaying her seasons…</p> : data.length === 0 ? <p className="text-sm text-text-secondary">No matches played yet.</p> : (
        <div className="mt-4 space-y-6">
          <div>
            <SeasonChart data={data} />
            <p className="m-0 text-xs text-text-secondary"><span className="text-cool">━</span> games won · <span>╍</span> expected for her rating</p>
          </div>
          {[...data].reverse().map((s) => {
            const comps = [...new Set([...s.comps.map((c) => c.comp), ...s.places.map((p) => p.comp)])];
            return (
              <section key={s.season} aria-label={s.name} className="space-y-2">
                <h3 className="kicker m-0">{s.name} · rating {s.overall.rating} · {pct(s.overall.actual)} won vs {pct(s.overall.expected)} expected</h3>
                <div className="overflow-x-auto">
                  <table className="board text-sm">
                    <thead>
                      <tr className="text-left text-[10px] tracking-[0.15em] text-text-secondary uppercase">
                        {["Competition", "Games", "Won", "Expected", "Result", "Achieved", "Expected", "±"].map((h, i) => <th key={i} scope="col" className="px-2 pb-1 font-bold whitespace-nowrap">{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {comps.map((comp) => {
                        const c = s.comps.find((x) => x.comp === comp);
                        const p = s.places.find((x) => x.comp === comp);
                        const d = p ? p.actual - p.expected : null;
                        return (
                          <tr key={comp} className="border-t border-border/50">
                            <th scope="row" className="px-2 py-1 text-left font-normal whitespace-nowrap">{label(comp)}</th>
                            <td className="px-2 font-mono">{c?.games ?? "–"}</td>
                            <td className="px-2 font-mono">{c ? pct(c.actual) : "–"}</td>
                            <td className="px-2 font-mono text-text-secondary">{c ? pct(c.expected) : "–"}</td>
                            <td className="px-2">{p?.stage ?? "–"}</td>
                            <td className="px-2 font-mono">{p ? Math.round(p.actual) : "–"}</td>
                            <td className="px-2 font-mono text-text-secondary">{p ? Math.round(p.expected) : "–"}</td>
                            <td className={`px-2 font-display ${d === null ? "" : d >= 0 ? "text-cool" : "text-accent-bright"}`}>{d === null ? "–" : signed(d)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
