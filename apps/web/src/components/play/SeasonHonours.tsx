// Season Honours (PRD §8): a grand finale block in the Unzure gold theme — champion hero under a spotlight, the season's
// top 3 on a podium, what each did, then every champion arriving one after the other. No popup; motion is CSS only and
// shortens to a quick fade (no delay) with prefers-reduced-motion.
import { IdolCard, IdolPhoto, KahootPodium, useIdol } from "@sabung/ui";
import { useBranding } from "../../data/branding";
import { PodiumDetail } from "./PodiumDetail";

type Title = { champion: string; runnerUp: string };
const ORDER = ["DSG", "UZC", "IDL", "IDL-PO", "INK", "NUG"];
const NO_DELAY = "motion-reduce:[animation-delay:0ms]";

function Trophy() {
  return (
    <svg aria-hidden="true" viewBox="0 0 64 64" className="h-16 w-16 text-accent-bright drop-shadow-[0_0_18px_var(--color-accent-bright)]" fill="currentColor">
      <path d="M18 6h28v4h8v8c0 8-6 14-14 15-2 3-4 5-7 6v8h8v6H23v-6h8v-8c-3-1-5-3-7-6-8-1-14-7-14-15v-8h8V6Zm-4 8v4c0 4 3 7 6 8-1-3-2-7-2-12h-4Zm40 0h-4c0 5-1 9-2 12 3-1 6-4 6-8v-4Z" />
    </svg>
  );
}

function Champion({ idolId }: { idolId: string }) {
  const idol = useIdol(idolId);
  return (
    <div className={`animate-rise ${NO_DELAY} flex flex-col items-center gap-3 text-center`}>
      <Trophy />
      <p className="kicker m-0">Season champion</p>
      <IdolPhoto idolId={idolId} size={1024} className="photo-frame w-52 shadow-[0_0_80px_-10px_var(--color-accent-bright)] sm:w-64" />
      <p className="m-0 font-display text-3xl">{idol.name}</p>
    </div>
  );
}

export function SeasonHonours({ seasonId, titles, top }: { seasonId: string; titles: Partial<Record<string, Title>>; top: string[] }) {
  const { label } = useBranding();
  const keys = Object.keys(titles).sort((a, b) => (ORDER.indexOf(a) + 1 || 99) - (ORDER.indexOf(b) + 1 || 99) || a.localeCompare(b));
  return (
    <section data-arena="uzc" className="relative isolate space-y-10 overflow-hidden rounded-card px-4 py-8 sm:px-8" aria-labelledby="honours"
      style={{ background: "radial-gradient(40rem 30rem at 50% 0%, color-mix(in oklab, var(--color-accent-bright) 28%, transparent), transparent 70%), linear-gradient(180deg, color-mix(in oklab, var(--color-accent) 40%, var(--color-bg-base)), var(--color-bg-base) 80%)" }}>
      <p aria-hidden="true" className="outline-text pointer-events-none absolute inset-x-0 top-2 -z-10 m-0 text-center font-display text-[clamp(4rem,16vw,12rem)] leading-none opacity-40">Honours</p>
      <h2 id="honours" className="m-0 text-center font-display text-2xl uppercase">Season Honours</h2>
      {top.length === 3 && <Champion idolId={top[0]!} />}
      {top.length === 3 && <div className="pb-6"><KahootPodium title="Season top 3 · all competitions" first={top[0]!} second={top[1]!} third={top[2]!} /></div>}
      {top.length === 3 && <PodiumDetail seasonId={seasonId} top={top} />}
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
