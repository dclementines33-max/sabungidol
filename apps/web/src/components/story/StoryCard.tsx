// One Season Story item (PRD §8: editorial news from templates, each linking to the real match — the pair's
// Head to Head, whose match log holds it). Update 3: no full crimson blocks (too harsh); a newspaper look —
// a coloured line and kicker per kind, the idol's framed photo, the lead story big.
import type { DramaStory, Story as BaseStory } from "@sabung/engine";
import { IdolPhoto, useIdolLookup } from "@sabung/ui";
import { Link } from "@tanstack/react-router";
import { useBranding } from "../../data/branding";

type Story = BaseStory | DramaStory;
const KICKER: Record<Story["kind"], string> = { "points-record": "Rekor pecah", "late-promotion": "Promosi dramatis", upset: "Upset", "reverse-sweep": "Reverse sweep", streak: "Streak", "first-title": "Juara pertama kali", "idol-of-month": "Idol of the Month" };
const TONE: Record<Story["kind"], string> = { "points-record": "brand-gold", "first-title": "brand-gold", upset: "accent-bright", "reverse-sweep": "brand-violet", streak: "brand-teal", "late-promotion": "brand-lime", "idol-of-month": "brand-rose" };
const LINK = "text-sm text-text-secondary underline underline-offset-4 hover:text-text-primary";

export function StoryCard({ story, lead = false }: { story: Story; lead?: boolean }) {
  const { label } = useBranding();
  const lookup = useIdolLookup();
  const name = (id: string) => lookup(id)?.name ?? id;
  const s = story;
  const star = "winner" in s ? s.winner : s.idol;
  const headline = s.kind === "upset" ? `${name(s.winner)} menumbangkan ${name(s.loser)} meski selisih rating ${s.gap}`
    : s.kind === "reverse-sweep" ? `${name(s.winner)} bangkit dari ketinggalan dan menyapu ${name(s.loser)}`
    : s.kind === "streak" ? `${name(s.idol)} menang ${s.wins} kali beruntun`
    : s.kind === "first-title" ? `${name(s.idol)} juara ${label(s.title)} untuk pertama kali`
    : s.kind === "points-record" ? `${name(s.idol)} memecahkan rekor poin liga: ${s.points} poin di ${label(s.league)} (rekor lama ${s.previous})`
    : s.kind === "late-promotion" ? `${name(s.idol)} melesat dari peringkat ${s.from} ke ${s.to} dan naik dari ${label(s.league)}`
    : `${name(s.idol)} jadi Idol of the Month (matchday ${s.from}–${s.to}, ${s.wins} kemenangan)`;
  const tone = `var(--color-${TONE[s.kind]})`;
  return (
    <article className={`flex w-full gap-4 border-t-2 pt-3 ${lead ? "flex-col sm:flex-row sm:items-end" : ""}`} style={{ borderColor: tone }}>
      <IdolPhoto idolId={star} size={lead ? 1024 : 256} className={`photo-frame shrink-0 ${lead ? "w-48 sm:w-64" : "w-16"}`} />
      <div className="flex min-w-0 flex-col gap-2">
        <p className="m-0 text-xs font-bold tracking-[0.25em] uppercase" style={{ color: tone }}>{KICKER[s.kind]}</p>
        <h2 className={`m-0 font-display leading-tight ${lead ? "text-[clamp(1.6rem,3.5vw,2.75rem)] uppercase" : "text-base"}`}>{headline}</h2>
        <div>
          {"matchId" in s && "loser" in s && <Link to="/wiki/h2h" search={{ a: s.winner, b: s.loser }} className={LINK}>Match {s.matchId}</Link>}
          {s.kind === "streak" && <Link to="/wiki/idols/$id" params={{ id: s.idol }} className={LINK}>Sampai {s.matchId}</Link>}
          {s.kind === "first-title" && <Link to="/wiki/champions" className={LINK}>Hall of Champions</Link>}
          {(s.kind === "points-record" || s.kind === "late-promotion" || s.kind === "idol-of-month") && <Link to="/wiki/idols/$id" params={{ id: s.idol }} className={LINK}>Profil</Link>}
        </div>
      </div>
    </article>
  );
}
