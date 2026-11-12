import {
  type BracketMatch, idolsPlayoffTemplate, knockoutTemplate, matchRng, resolveBracket, runBracket, runSwiss,
} from "@sabung/engine";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ReactNode, useState } from "react";
import { IdolSourceProvider, type IdolInfo } from "./idolSource";
import { KahootPodium } from "./KahootPodium";
import { SearchableIdolSelect } from "./SearchableIdolSelect";
import { SwissPlayInBracket } from "./SwissPlayInBracket";
import { TournamentBracketTree } from "./TournamentBracketTree";
import { WildcardPlayInBracket } from "./WildcardPlayInBracket";

// 240 sample idols; lower number = stronger, so favourites usually win.
const colors = ["brand-rose", "brand-indigo", "brand-teal", "brand-amber", "brand-violet", "brand-sage"];
const ids = Array.from({ length: 240 }, (_, i) => `s${i + 1}`);
const idols = new Map<string, IdolInfo>(ids.map((id, i) => [id, {
  id, name: `Idol ${String(i + 1).padStart(3, "0")}`, groupName: `Group ${(i % 40) + 1}`, groupColor: colors[i % 6], rating: Math.max(45, 98 - Math.floor(i / 4)),
}]));
const Source = ({ children }: { children: ReactNode }) =>
  <IdolSourceProvider source={{ idol: (id) => idols.get(id), photo: () => undefined }}>{children}</IdolSourceProvider>;

const meta: Meta = { title: "Tournament/Brackets", decorators: [(Story) => <Source><Story /></Source>] };
export default meta;

function played(template: BracketMatch[], entrants: string[], seed: string, upTo = Infinity) {
  const rng = matchRng("story", seed);
  const strength = (id: string) => idols.get(id)!.rating;
  const run = runBracket(template, entrants, (_, a, b) => (rng.next() < 1 / (1 + 10 ** ((strength(b) - strength(a)) / 40)) ? "A" : "B"));
  return resolveBracket(template, entrants, new Map(run.slice(0, upTo).map((r) => [r.key, { winner: r.winner, score: r.winner === r.a ? "2–1" : "1–2" }])));
}

function WithPath({ cells, entrants }: { cells: ReturnType<typeof played>; entrants: string[] }) {
  const [idol, setIdol] = useState<string | null>(null);
  return (
    <div className="space-y-4">
      <div className="max-w-xs"><SearchableIdolSelect label="Lihat jalur idol" idolIds={entrants} value={idol} onChange={setIdol} /></div>
      <TournamentBracketTree cells={cells} highlightIdol={idol} onMatchClick={() => {}} />
    </div>
  );
}

export const BSideCup: StoryObj = {
  render: () => <WithPath cells={played(knockoutTemplate([16], { pairing: "seed" }), ids.slice(0, 16), "bside")} entrants={ids.slice(0, 16)} />,
};

export const BSideHalfway: StoryObj = {
  render: () => <WithPath cells={played(knockoutTemplate([16], { pairing: "seed" }), ids.slice(0, 16), "bside", 10)} entrants={ids.slice(0, 16)} />,
};

export const TheIdolsPlayoff: StoryObj = {
  render: () => <WithPath cells={played(idolsPlayoffTemplate(), ids.slice(0, 10), "idols")} entrants={ids.slice(0, 10)} />,
};

// Nugu Cup: D2 (weakest 120) in R1, D1 in R2/R3, paired by rank — 239 matches.
const nuguEntrants = [...ids.slice(120), ...ids.slice(76, 120), ...ids.slice(0, 76)];
export const NuguCup239: StoryObj = {
  render: () => <WithPath cells={played(knockoutTemplate([120, 44, 76], { pairing: "seed" }), nuguEntrants, "nugu")} entrants={nuguEntrants} />,
};

const swissRng = matchRng("story", "swiss");
export const SwissGroup: StoryObj = {
  render: () => <SwissPlayInBracket group="A" seededIds={ids.slice(0, 16)} rounds={runSwiss(ids.slice(0, 16), swissRng, () => (swissRng.next() < 0.5 ? "A" : "B")).matches} />,
};

export const Podium: StoryObj = { render: () => <KahootPodium first="s1" second="s2" third="s3" title="Unzure Cup · Season 3" /> };

export const WildcardArchive: StoryObj = {
  render: () => <WildcardPlayInBracket rounds={[
    { label: "WC1", matches: [{ a: "s9", b: "s12", winner: "s9", score: "2–0" }, { a: "s10", b: "s11", winner: "s11", score: "1–2" }] },
    { label: "WC2", matches: [{ a: "s9", b: "s11", winner: "s9", score: "2–1" }] },
  ]} />,
};
