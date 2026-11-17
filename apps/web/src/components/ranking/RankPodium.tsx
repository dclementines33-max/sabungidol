// The top three as a fight-night podium (Ranking, 2026-11-17): a spotlight from above, the photos tilted on their blocks,
// gold / silver / bronze faces with the place carved in, the blocks rising 3 → 2 → 1. Score optional (My Top 10 has none).
import { Crown } from "@sabung/ui/icons";
import { EntryFace } from "./EntryFace";
import { EntryLink } from "./EntryLink";
import type { Entry } from "./useEntries";

export type PodiumSpot = { entry: Entry; score?: number };

const PLACES = [
  { at: 1, block: "h-24 sm:h-32", photo: "w-24 sm:w-36 -rotate-3", tint: "var(--color-cool)", delay: 1 },
  { at: 0, block: "h-36 sm:h-48", photo: "w-28 sm:w-44 rotate-1", tint: "var(--color-winner)", delay: 2 },
  { at: 2, block: "h-16 sm:h-24", photo: "w-24 sm:w-32 rotate-3", tint: "var(--color-tier-s)", delay: 0 },
];

export function RankPodium({ spots, caption }: { spots: PodiumSpot[]; caption: string }) {
  return (
    <figure className="stage relative isolate m-0 overflow-hidden rounded-card px-2 pt-8 sm:px-8">
      <span aria-hidden="true" className="pointer-events-none absolute -top-10 left-1/2 -z-10 h-[130%] w-[70%] -translate-x-1/2 bg-[conic-gradient(from_160deg_at_50%_0,transparent,rgb(240_199_94/0.16),transparent_40deg)]" />
      <p aria-hidden="true" className="outline-text pointer-events-none absolute top-1 left-3 -z-10 m-0 font-display text-ornament leading-none opacity-30">Top 3</p>
      <figcaption className="kicker text-center text-text-secondary">{caption}</figcaption>
      <ol className="m-0 mt-4 flex list-none items-end justify-center gap-1 p-0 sm:gap-4">
        {PLACES.map(({ at, block, photo, tint, delay }) => {
          const spot = spots[at];
          if (!spot) return <li key={at} className="w-24 sm:w-40" aria-hidden="true" />;
          return (
            <li key={spot.entry.id} aria-label={`Place ${at + 1}: ${spot.entry.name}`} className="flex w-[31%] max-w-48 animate-rise flex-col items-center text-center" style={{ animationDelay: `${delay * 260}ms` }}>
              {at === 0 && <Crown size={34} strokeWidth={1.6} className="icon-tone mb-1 text-winner drop-shadow-[0_0_14px_rgb(240_199_94/0.6)]" />}
              <EntryFace entry={spot.entry} size={1024} logo="size-9" className={`photo-frame ${photo} ${at === 0 ? "shadow-[0_0_60px_-10px_var(--color-winner)]" : ""}`} />
              <EntryLink entry={spot.entry} className={`mt-3 block w-full truncate font-display ${at === 0 ? "text-xl sm:text-2xl" : "text-base sm:text-lg"}`} />
              <span className="kicker block w-full truncate text-text-secondary">{spot.entry.sub}</span>
              {spot.score !== undefined && <span className="score mt-1 text-2xl sm:text-3xl" style={{ color: tint }}>{spot.score.toFixed(1)}</span>}
              <div
                className={`relative mt-2 w-full overflow-hidden ${block} [clip-path:polygon(0_12%,100%_0,100%_100%,0_100%)]`}
                style={{ background: `linear-gradient(180deg, color-mix(in oklab, ${tint} 90%, white), ${tint} 35%, color-mix(in oklab, ${tint} 35%, black))` }}
              >
                <span aria-hidden="true" className="absolute inset-x-0 top-[18%] font-gothic text-5xl leading-none text-on-fill/80 sm:text-7xl">{at + 1}</span>
                <span aria-hidden="true" className="absolute inset-0 bg-[repeating-linear-gradient(115deg,transparent_0_14px,rgb(255_255_255/0.08)_14px_16px)]" />
              </div>
            </li>
          );
        })}
      </ol>
    </figure>
  );
}
