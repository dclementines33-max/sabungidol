// The season's shape on the Dashboard (Update 2): the order of the phases and every competition's entrants, format and
// best-of, as a flowing three-act line (no cards). Compact: names and best-of only; entrants and format on "Show details".
import { useBranding } from "../../data/branding";
import { ShowMore } from "../ShowMore";

const ACTS: { act: string; title: string; items: { key: string; who: string; format: string; bo: string }[] }[] = [
  { act: "01", title: "Opener", items: [
    { key: "DSG", who: "The Idols champion vs Unzure Cup champion (last season)", format: "One match", bo: "Bo7" },
    { key: "MBK", who: "Each D1 league champion vs its B-Side champion, ×6", format: "One match per league", bo: "Bo5" },
  ] },
  { act: "02", title: "League phase", items: [
    { key: "D1", who: "6 leagues × 20 idols", format: "Double round robin, 38 matchday", bo: "Bo4" },
    { key: "D2", who: "6 leagues × 20 idols", format: "Double round robin, 38 matchday", bo: "Bo4" },
    { key: "IDL", who: "Top 20 by rating", format: "38-matchday league", bo: "Bo4" },
  ] },
  { act: "03", title: "Cup phase", items: [
    { key: "SWS", who: "64 idols, 4 groups × 16", format: "Swiss to 3 wins / 3 losses", bo: "Bo3" },
    { key: "LCQ", who: "12 idols, 2 groups × 6", format: "Round robin", bo: "Bo3" },
    { key: "UZC", who: "64 idols: 36 league + 20 Swiss + 8 LCQ", format: "16 groups × 4, then a 32-idol knockout", bo: "Groups Bo4 · KO Bo5 · Final Bo7" },
    { key: "IDL-PO", who: "Top 10 The Idols", format: "Double elimination", bo: "Bo5 · GF Bo7" },
    { key: "INK", who: "6 D1 league champions", format: "Double elimination, seed 1–2 bye", bo: "Bo5 · GF Bo7" },
    { key: "NUG", who: "240 idol D1 + D2", format: "Single elimination, 9 rounds", bo: "Bo3 · SF Bo5 · F Bo7" },
    { key: "BS", who: "Top 16 of each D1 league, ×6", format: "Single elimination 16", bo: "Bo3 · F Bo5" },
  ] },
];

export function TournamentMap() {
  const { label } = useBranding();
  const name = (key: string) => (key === "D1" ? "Division 1" : key === "D2" ? "Division 2" : key === "BS" ? "B-Side Cup" : key === "MBK" ? "Music Bank Cup" : key === "SWS" ? "Swiss Play-in" : key === "LCQ" ? "Last Chance Qualifier" : label(key));
  return (
    <section aria-labelledby="map" className="space-y-6">
      <h2 id="map" className="section-title">Season map</h2>
      <ShowMore more label="Show formats and entrants">{(open) => (<>
      <ol className="m-0 flex list-none flex-col gap-10 p-0 lg:flex-row lg:gap-6">
        {ACTS.map((a, i) => (
          <li key={a.act} className={`relative flex-1 border-t-2 border-accent-bright pt-4 ${i === 1 ? "lg:mt-10" : i === 2 ? "lg:mt-20" : ""}`}>
            <span aria-hidden="true" className="absolute -top-9 right-0 font-gothic text-5xl text-accent/60">{a.act}</span>
            <h3 className="m-0 font-display text-xl">{a.title}</h3>
            <ul className={`m-0 mt-3 list-none p-0 ${open ? "space-y-3" : "space-y-1"}`}>
              {a.items.map((c) => (
                <li key={c.key}>
                  <p className="m-0 font-bold">{name(c.key)} <span className="font-mono text-xs text-accent-bright">{c.bo}</span></p>
                  {open && <p className="m-0 text-sm text-text-secondary">{c.who} · {c.format}</p>}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
      {open && <p className="m-0 text-sm text-text-secondary">Swiss 3–0 / 3–1 go to Unzure, 3–2 to the LCQ. D1: 1–6 straight to Unzure, 7–16 to Swiss, 18–20 go down. D2: 1–3 go up.</p>}
      </>)}</ShowMore>
    </section>
  );
}
