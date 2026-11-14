// All-time leaders on Home (Update 2): the most-titled idol as a big torn portrait, the other categories as a staircase
// list that steps right (not a grid): label, name, the number huge in outline.
import { IdolPhoto } from "@sabung/ui";
import type { Leader } from "../../data/homeFacts";
import { IdolLink } from "../wiki/IdolLink";

export function HomeLeaders({ leaders }: { leaders: Leader[] }) {
  const [top, ...rest] = leaders;
  if (!top) return null;
  return (
    <section aria-labelledby="leaders" className="relative">
      <p className="kicker m-0">All time</p>
      <h2 id="leaders" className="m-0 text-[clamp(2rem,5vw,3.5rem)]">The rulers</h2>
      <div className="mt-6 flex flex-col gap-10 lg:flex-row lg:items-start">
        <figure className="relative m-0 shrink-0 lg:w-80">
          <IdolPhoto idolId={top.idolId} size={1024} className="photo-frame w-full max-w-80" />
          <figcaption className="-mt-10 pl-4">
            <span className="tag">{top.label}</span>
            <IdolLink id={top.idolId} className="mt-2 block font-display text-3xl" />
            <span className="font-gothic text-4xl text-accent-bright">{top.value}</span>
          </figcaption>
        </figure>
        <ol className="m-0 flex-1 list-none space-y-4 p-0">
          {rest.map((l, i) => (
            <li key={l.label} className="flex items-center gap-4 border-b border-border/60 pb-3" style={{ marginLeft: `${(i % 4) * 1.5}rem` }}>
              <IdolPhoto idolId={l.idolId} size={64} className="h-12 w-10 shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="kicker block text-text-secondary">{l.label}</span>
                <IdolLink id={l.idolId} className="block truncate font-display text-xl" />
              </span>
              <span className="font-display text-2xl text-accent-bright tabular-nums">{l.value}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
