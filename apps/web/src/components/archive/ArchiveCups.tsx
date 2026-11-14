// Season Archive → every cup's top four (from the placements table; brackets are on the live panels only).
import { useBranding } from "../../data/branding";
import { IdolLink } from "../wiki/IdolLink";

export function ArchiveCups({ cups }: { cups: { comp: string; idolId: string; finalRank: number }[] }) {
  const { label } = useBranding();
  const keys = [...new Set(cups.map((c) => c.comp))];
  return (
    <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-3 p-0" aria-label="Cup results">
      {keys.map((key) => (
        <li key={key} className="panel p-3 text-sm">
          <p className="m-0 mb-1 text-xs tracking-widest text-text-secondary uppercase">{label(key)}</p>
          <ol className="m-0 list-none space-y-0.5 p-0">
            {cups.filter((c) => c.comp === key).map((c) => <li key={c.idolId}><span className="inline-block w-6 font-mono text-text-secondary">{c.finalRank}</span><IdolLink id={c.idolId} /></li>)}
          </ol>
        </li>
      ))}
    </ul>
  );
}
