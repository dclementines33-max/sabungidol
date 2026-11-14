// The wheel itself (2026-11-15): deep gradient segments in the two sides' colours with gold hairlines, a dark outer ring of
// engraved ticks, a gold blade pointer that ticks while it turns and a hub with the game number. A grand final gets a gold
// halo. Only a picture: where it stops comes from wheelMath.landing.
import { SEGMENTS, STEP } from "./wheelMath";

const R = 100;
const point = (deg: number, r: number) => [R + r * Math.sin((deg * Math.PI) / 180), R - r * Math.cos((deg * Math.PI) / 180)] as const;

export function WheelDisc({ rotation, durationMs, spinning, label, grand, initials }: {
  rotation: number;
  durationMs: number;
  spinning: boolean;
  label: string; // in the hub, e.g. "G3"
  grand?: boolean;
  initials: [string, string];
}) {
  return (
    <div className="relative aspect-square w-full">
      <div aria-hidden="true" className="absolute -inset-6 rounded-full blur-3xl transition-opacity duration-700"
        style={{ background: grand ? "radial-gradient(circle, var(--color-brand-gold), transparent 65%)" : "radial-gradient(circle, rgb(255 77 99 / 0.6), transparent 65%)", opacity: spinning ? 0.45 : 0.18 }} />
      <svg aria-hidden="true" viewBox="0 0 200 200" className="relative size-full"
        style={{ transform: `rotate(${rotation}deg)`, transition: durationMs ? `transform ${durationMs}ms cubic-bezier(0.12, 0.7, 0.1, 1)` : "none" }}>
        <defs>
          <radialGradient id="wheel-a" cx="50%" cy="50%" r="50%"><stop offset="35%" stopColor="var(--color-surface-hover)" /><stop offset="100%" stopColor="var(--color-accent)" /></radialGradient>
          <radialGradient id="wheel-b" cx="50%" cy="50%" r="50%"><stop offset="35%" stopColor="var(--color-bg-raised)" /><stop offset="100%" stopColor="var(--color-tier-f)" /></radialGradient>
        </defs>
        <circle cx={R} cy={R} r={R} fill="var(--color-bg-base)" />
        {Array.from({ length: SEGMENTS }, (_, i) => {
          const [x1, y1] = point(i * STEP, R - 12);
          const [x2, y2] = point((i + 1) * STEP, R - 12);
          const [tx, ty] = point((i + 0.5) * STEP, R - 30);
          return (
            <g key={i}>
              <path d={`M${R},${R} L${x1},${y1} A${R - 12},${R - 12} 0 0 1 ${x2},${y2} Z`} fill={`url(#wheel-${i % 2 === 0 ? "a" : "b"})`} stroke="var(--color-brand-gold)" strokeOpacity="0.55" strokeWidth="0.5" />
              <text x={tx} y={ty} transform={`rotate(${(i + 0.5) * STEP} ${tx} ${ty})`} textAnchor="middle" dominantBaseline="middle" fontSize="9" fontWeight="800"
                fill={i % 2 === 0 ? "var(--color-accent-bright)" : "var(--color-cool)"} opacity="0.9">{initials[i % 2]}</text>
            </g>
          );
        })}
        {Array.from({ length: 64 }, (_, i) => {
          const [x1, y1] = point(i * 5.625, R - 2);
          const [x2, y2] = point(i * 5.625, R - (i % 4 === 0 ? 9 : 5));
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={i % 4 === 0 ? "var(--color-brand-gold)" : "var(--color-text-secondary)"} strokeOpacity={i % 4 === 0 ? 0.9 : 0.35} strokeWidth="0.6" />;
        })}
        <circle cx={R} cy={R} r={R - 12} fill="none" stroke="var(--color-brand-gold)" strokeOpacity="0.7" strokeWidth="0.8" />
        <circle cx={R} cy={R} r="24" fill="var(--color-bg-base)" stroke="var(--color-brand-gold)" strokeWidth="1.5" />
      </svg>
      <span aria-hidden="true" className="absolute inset-0 m-auto flex size-16 items-center justify-center font-gothic text-[2rem] text-brand-gold">{label}</span>
      <svg aria-hidden="true" viewBox="0 0 24 34" className="absolute -top-3 left-1/2 z-10 w-6 -translate-x-1/2 origin-[50%_15%] drop-shadow-[0_0_10px_var(--color-brand-gold)]"
        style={{ animation: spinning ? "wheel-tick 90ms linear infinite" : "none" }}>
        <path d="M12 34 L4 8 L12 0 L20 8 Z" fill="var(--color-brand-gold)" stroke="var(--color-bg-base)" strokeWidth="1.5" />
      </svg>
    </div>
  );
}
