// Season Honours (PRD §8): the season's top 3 over every competition as a podium (Update 3), then every champion.
import { IdolCard, KahootPodium } from "@sabung/ui";
import { useBranding } from "../../data/branding";

type Title = { champion: string; runnerUp: string };
const ORDER = ["DSG", "UZC", "IDL", "IDL-PO", "INK", "NUG"];

export function SeasonHonours({ titles, top }: { titles: Partial<Record<string, Title>>; top: string[] }) {
  const { label } = useBranding();
  const keys = Object.keys(titles).sort((a, b) => (ORDER.indexOf(a) + 1 || 99) - (ORDER.indexOf(b) + 1 || 99) || a.localeCompare(b));
  return (
    <section className="space-y-8" aria-labelledby="honours">
      <h2 id="honours" className="m-0 font-display text-2xl uppercase">Season Honours</h2>
      {top.length === 3 && <div className="pb-6"><KahootPodium title="Season top 3 · all competitions" first={top[0]!} second={top[1]!} third={top[2]!} /></div>}
      <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] gap-4 p-0">
        {keys.map((key) => (
          <li key={key} className="space-y-2">
            <p className="m-0 text-xs tracking-widest text-text-secondary uppercase">{label(key)}</p>
            <IdolCard idolId={titles[key]!.champion} />
          </li>
        ))}
      </ul>
    </section>
  );
}
