// The Grudge Match strip (2026-11-18): shown when two official rivals meet (match screen) or are compared (Head to Head).
// A burning skewed band with the rivalry's name and tier; the flames flicker unless the user asked for less motion.
import { Flame } from "../icons";

export type Grudge = { name: string; tier: string; record?: string };

export function GrudgeBanner({ grudge, label = "Grudge match" }: { grudge: Grudge; label?: string }) {
  return (
    <div role="note" aria-label={`${label}: ${grudge.name}, ${grudge.tier}${grudge.record ? `, ${grudge.record}` : ""}`}
      className="relative isolate flex -skew-x-6 items-center justify-center gap-3 overflow-hidden px-4 py-2 text-center shadow-[0_0_40px_-12px_var(--color-accent-bright)]"
      style={{ background: "linear-gradient(90deg, color-mix(in oklab, var(--color-accent) 85%, black), color-mix(in oklab, var(--color-accent-bright) 55%, var(--color-winner)) 50%, color-mix(in oklab, var(--color-accent) 85%, black))" }}>
      <Flame aria-hidden="true" size={22} className="icon-tone skew-x-6 text-winner motion-safe:animate-pulse" />
      <span aria-hidden="true" className="skew-x-6">
        <span className="block text-[10px] font-extrabold tracking-[0.45em] text-on-fill/80 uppercase">{label} · {grudge.tier}</span>
        <span className="block font-gothic text-xl leading-tight text-on-fill sm:text-2xl">{grudge.name}</span>
        {grudge.record && <span className="block font-mono text-xs text-on-fill/80">{grudge.record}</span>}
      </span>
      <Flame aria-hidden="true" size={22} className="icon-tone skew-x-6 text-winner motion-safe:animate-pulse" />
    </div>
  );
}
