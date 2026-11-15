// One Season Story item (PRD §8: editorial news from templates, each linking to the real match — the pair's
// Head to Head, whose match log holds it). Update 3: no full crimson blocks (too harsh); a newspaper look —
// a coloured line and kicker per kind, the idol's framed photo, the lead story big.
import type { AnyStory as Story } from "@sabung/engine";
import { IdolPhoto, useIdolLookup } from "@sabung/ui";
import { Link } from "@tanstack/react-router";
import { useBranding } from "../../data/branding";
import { KICKER, TONE, headline, starOf } from "./storyText";

const LINK = "text-sm text-text-secondary underline underline-offset-4 hover:text-text-primary";

export function StoryCard({ story, lead = false }: { story: Story; lead?: boolean }) {
  const { label } = useBranding();
  const lookup = useIdolLookup();
  const name = (id: string) => lookup(id)?.name ?? id;
  const s = story;
  const star = starOf(s);
  const tone = `var(--color-${TONE[s.kind]})`;
  return (
    <article className={`flex w-full gap-4 border-t-2 pt-3 ${lead ? "flex-col sm:flex-row sm:items-end" : ""}`} style={{ borderColor: tone }}>
      <IdolPhoto idolId={star} size={lead ? 1024 : 256} className={`photo-frame shrink-0 ${lead ? "w-48 sm:w-64" : "w-16"}`} />
      <div className="flex min-w-0 flex-col gap-2">
        <p lang="id" className="m-0 text-xs font-bold tracking-[0.25em] uppercase" style={{ color: tone }}>{KICKER[s.kind]}</p>
        <h2 lang="id" className={`m-0 font-display leading-tight ${lead ? "text-[clamp(1.6rem,3.5vw,2.75rem)] uppercase" : "text-base"}`}>{headline(s, name, label)}</h2>
        <div>
          {"matchId" in s && "loser" in s && <Link to="/wiki/h2h" search={{ a: s.winner, b: s.loser }} className={LINK}>Match {s.matchId}</Link>}
          {s.kind === "streak" && <Link to="/wiki/idols/$id" params={{ id: s.idol }} className={LINK}>Up to {s.matchId}</Link>}
          {s.kind === "rivalry" && <Link to="/wiki/h2h" search={{ a: s.a, b: s.b }} className={LINK}>Head to Head</Link>}
          {(s.kind === "first-title" || s.kind === "champion") && <Link to="/wiki/champions" className={LINK}>Hall of Champions</Link>}
          {(s.kind === "points-record" || s.kind === "late-promotion" || s.kind === "idol-of-month" || s.kind === "multi-title" || s.kind === "title-milestone" || s.kind === "slump" || s.kind === "unbeaten" || s.kind === "clinched") && <Link to="/wiki/idols/$id" params={{ id: s.idol }} className={LINK}>Profile</Link>}
        </div>
      </div>
    </article>
  );
}
