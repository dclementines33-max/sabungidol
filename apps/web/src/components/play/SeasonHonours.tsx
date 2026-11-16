// Season Honours (PRD §8): a grand finale block in the Unzure gold theme — the top 3 as a podium spread with their whole
// season (PodiumDetail), the Unzure Cup champion, then every champion arriving one after the other. No popup; motion is CSS only and
// shortens to a quick fade (no delay) with prefers-reduced-motion.
import { IdolCard } from "@sabung/ui";
import { useBranding } from "../../data/branding";
import { PodiumDetail } from "./PodiumDetail";
import { SeasonAwards } from "./SeasonAwards";

type Title = { champion: string; runnerUp: string };
const ORDER = ["DSG", "UZC", "IDL", "IDL-PO", "INK", "NUG"];
const NO_DELAY = "motion-reduce:[animation-delay:0ms]";

export function SeasonHonours({ seasonId, titles, top }: { seasonId: string; titles: Partial<Record<string, Title>>; top: string[] }) {
  const { label } = useBranding();
  const keys = Object.keys(titles).sort((a, b) => (ORDER.indexOf(a) + 1 || 99) - (ORDER.indexOf(b) + 1 || 99) || a.localeCompare(b));
  return (
    <section data-arena="uzc" className="relative isolate space-y-10 overflow-hidden rounded-card px-4 py-8 sm:px-8" aria-labelledby="honours"
      style={{ background: "radial-gradient(40rem 30rem at 50% 0%, color-mix(in oklab, var(--color-accent-bright) 28%, transparent), transparent 70%), linear-gradient(180deg, color-mix(in oklab, var(--color-accent) 40%, var(--color-bg-base)), var(--color-bg-base) 80%)" }}>
      <p aria-hidden="true" className="outline-text pointer-events-none absolute inset-x-0 top-2 -z-10 m-0 text-center font-display text-[clamp(4rem,16vw,12rem)] leading-none opacity-40">Honours</p>
      <h2 id="honours" className="m-0 text-center font-display text-2xl uppercase">Season Honours</h2>
      {top.length === 3 && <PodiumDetail seasonId={seasonId} top={top} unzure={titles.UZC?.champion} />}
      <SeasonAwards seasonId={seasonId} />
      <div>
        <h3 className="kicker mb-4 text-center">Every champion</h3>
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] gap-4 p-0">
          {keys.map((key, i) => (
            <li key={key} className={`animate-rise ${NO_DELAY} space-y-2`} style={{ animationDelay: `${i * 90}ms` }}>
              <p className="m-0 text-xs tracking-widest text-accent-bright uppercase">{label(key)}</p>
              <IdolCard idolId={titles[key]!.champion} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
