// One Season Story card (PRD §8: editorial news cards from templates, each linking to the real match — the
// pair's Head to Head, whose match log holds it). design/refs: red/black cards, small capital kicker.
import type { Story } from "@sabung/engine";
import { useIdolLookup } from "@sabung/ui";
import { Link } from "@tanstack/react-router";
import { useBranding } from "../../data/branding";

const KICKER: Record<Story["kind"], string> = { upset: "Upset", "reverse-sweep": "Reverse sweep", streak: "Streak", "first-title": "Juara pertama kali", "idol-of-month": "Idol of the Month" };
const LINK = "text-sm text-accent-bright underline underline-offset-4";

export function StoryCard({ story }: { story: Story }) {
  const { label } = useBranding();
  const lookup = useIdolLookup();
  const name = (id: string) => lookup(id)?.name ?? id;
  const s = story;
  const headline = s.kind === "upset" ? `${name(s.winner)} menumbangkan ${name(s.loser)} meski selisih rating ${s.gap}`
    : s.kind === "reverse-sweep" ? `${name(s.winner)} bangkit dari ketinggalan dan menyapu ${name(s.loser)}`
    : s.kind === "streak" ? `${name(s.idol)} menang ${s.wins} kali beruntun`
    : s.kind === "first-title" ? `${name(s.idol)} juara ${label(s.title)} untuk pertama kali`
    : `${name(s.idol)} jadi Idol of the Month (matchday ${s.from}–${s.to}, ${s.wins} kemenangan)`;
  return (
    <article className={`flex w-full flex-col gap-3 rounded-card border p-4 ${s.kind === "upset" || s.kind === "first-title" ? "border-accent bg-accent text-on-accent" : "border-border bg-bg-raised"}`}>
      <p className="m-0 text-xs tracking-widest uppercase opacity-80">{KICKER[s.kind]}</p>
      <h2 className="m-0 font-display text-lg leading-snug">{headline}</h2>
      <div className="mt-auto">
        {"matchId" in s && "loser" in s && <Link to="/wiki/h2h" search={{ a: s.winner, b: s.loser }} className={s.kind === "upset" ? "text-sm text-on-accent underline underline-offset-4" : LINK}>Match {s.matchId}</Link>}
        {s.kind === "streak" && <Link to="/wiki/idols/$id" params={{ id: s.idol }} className={LINK}>Sampai {s.matchId}</Link>}
        {s.kind === "first-title" && <Link to="/wiki/champions" className="text-sm text-on-accent underline underline-offset-4">Hall of Champions</Link>}
        {s.kind === "idol-of-month" && <Link to="/wiki/idols/$id" params={{ id: s.idol }} className={LINK}>Profil</Link>}
      </div>
    </article>
  );
}
