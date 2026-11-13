// One random all-time fact (Update 2): a giant blackletter quote mark, the idols' torn photos, and a button for another.
import { Button, IdolPhoto, useIdolLookup } from "@sabung/ui";
import { useState } from "react";
import type { Fact } from "../../data/homeFacts";

export function HomeFact({ facts }: { facts: Fact[] }) {
  const lookup = useIdolLookup();
  const [i, setI] = useState(() => Math.floor(Math.random() * Math.max(1, facts.length)));
  const fact = facts[i % Math.max(1, facts.length)];
  if (!fact) return null;
  return (
    <section aria-labelledby="fact" className="relative isolate overflow-hidden py-6 pl-4 sm:pl-16">
      <span aria-hidden="true" className="pointer-events-none absolute -top-10 left-0 -z-10 font-gothic text-[12rem] leading-none text-accent/30">“</span>
      <p className="kicker m-0 text-accent-bright">Fakta acak</p>
      <h2 id="fact" className="m-0 mt-2 max-w-[22ch] text-[clamp(1.75rem,4vw,3rem)]">{fact.label}</h2>
      <div className="mt-4 flex flex-wrap items-end gap-5">
        {fact.ids.map((id, k) => (
          <figure key={id} className={`m-0 ${k === 1 ? "sm:translate-y-6" : ""}`}>
            <IdolPhoto idolId={id} size={256} className="photo-frame w-28 sm:w-36" />
            <figcaption className="mt-1 font-display text-lg">{lookup(id)?.name ?? id}</figcaption>
          </figure>
        ))}
        <p className="m-0 max-w-sm pb-2 text-lg text-text-secondary">{fact.value}</p>
      </div>
      {facts.length > 1 && <Button className="mt-8" onClick={() => setI((n) => n + 1 + Math.floor(Math.random() * (facts.length - 1)))}>Fakta lain</Button>}
    </section>
  );
}
