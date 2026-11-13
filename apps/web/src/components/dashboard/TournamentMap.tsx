// The season's shape on the Dashboard (Update 2): the order of the phases and every competition's entrants, format and
// best-of, as a flowing three-act line (no cards).
import { useBranding } from "../../data/branding";

const ACTS: { act: string; title: string; items: { key: string; who: string; format: string; bo: string }[] }[] = [
  { act: "01", title: "Pembuka", items: [
    { key: "DSG", who: "Juara The Idols vs juara Unzure Cup (season lalu)", format: "Satu match", bo: "Bo7" },
    { key: "MBK", who: "Juara liga D1 vs juara B-Side liga itu, ×6", format: "Satu match per liga", bo: "Bo5" },
  ] },
  { act: "02", title: "Fase liga", items: [
    { key: "D1", who: "6 liga × 20 idol", format: "Double round robin, 38 matchday", bo: "Bo4" },
    { key: "D2", who: "6 liga × 20 idol", format: "Double round robin, 38 matchday", bo: "Bo4" },
    { key: "IDL", who: "20 rating tertinggi", format: "Liga 38 matchday", bo: "Bo4" },
  ] },
  { act: "03", title: "Fase cup", items: [
    { key: "SWS", who: "64 idol, 4 grup × 16", format: "Swiss sampai 3 menang / 3 kalah", bo: "Bo3" },
    { key: "LCQ", who: "12 idol, 2 grup × 6", format: "Round robin", bo: "Bo3" },
    { key: "UZC", who: "64 idol: 36 liga + 20 Swiss + 8 LCQ", format: "16 grup × 4, lalu knockout 32", bo: "Grup Bo4 · KO Bo5 · Final Bo7" },
    { key: "IDL-PO", who: "Top 10 The Idols", format: "Double elimination", bo: "Bo5 · GF Bo7" },
    { key: "INK", who: "6 juara liga D1", format: "Double elimination, seed 1–2 bye", bo: "Bo5 · GF Bo7" },
    { key: "NUG", who: "240 idol D1 + D2", format: "Single elimination, 9 ronde", bo: "Bo3 · SF Bo5 · F Bo7" },
    { key: "BS", who: "Top 16 tiap liga D1, ×6", format: "Single elimination 16", bo: "Bo3 · F Bo5" },
  ] },
];

export function TournamentMap() {
  const { label } = useBranding();
  const name = (key: string) => (key === "D1" ? "Liga Divisi 1" : key === "D2" ? "Liga Divisi 2" : key === "BS" ? "B-Side Cup" : key === "MBK" ? "Music Bank Cup" : key === "SWS" ? "Swiss Play-in" : key === "LCQ" ? "Last Chance Qualifier" : label(key));
  return (
    <section aria-labelledby="map" className="space-y-6">
      <h2 id="map" className="m-0 text-[clamp(2rem,5vw,3.5rem)]">Peta season</h2>
      <ol className="m-0 flex list-none flex-col gap-10 p-0 lg:flex-row lg:gap-6">
        {ACTS.map((a, i) => (
          <li key={a.act} className={`relative flex-1 border-t-2 border-accent-bright pt-4 ${i === 1 ? "lg:mt-10" : i === 2 ? "lg:mt-20" : ""}`}>
            <span aria-hidden="true" className="absolute -top-9 right-0 font-gothic text-5xl text-accent/60">{a.act}</span>
            <h3 className="m-0 font-display text-xl">{a.title}</h3>
            <ul className="m-0 mt-3 list-none space-y-3 p-0">
              {a.items.map((c) => (
                <li key={c.key}>
                  <p className="m-0 font-bold">{name(c.key)} <span className="font-mono text-xs text-accent-bright">{c.bo}</span></p>
                  <p className="m-0 text-sm text-text-secondary">{c.who} · {c.format}</p>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
      <p className="m-0 text-sm text-text-secondary">Swiss 3–0 / 3–1 lolos ke Unzure, 3–2 ke LCQ. Liga D1: 1–6 langsung Unzure, 7–16 Swiss, 18–20 turun. D2: 1–3 naik.</p>
    </section>
  );
}
