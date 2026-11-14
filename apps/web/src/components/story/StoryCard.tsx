// One Season Story item (PRD §8: editorial news from templates, each linking to the real match — the pair's
// Head to Head, whose match log holds it). Update 3: no full crimson blocks (too harsh); a newspaper look —
// a coloured line and kicker per kind, the idol's framed photo, the lead story big.
import type { AnyStory as Story } from "@sabung/engine";
import { IdolPhoto, useIdolLookup } from "@sabung/ui";
import { Link } from "@tanstack/react-router";
import { useBranding } from "../../data/branding";

// Copy (user via router, 2026-11-15): news stays Indonesian, lively sports-media headlines, semi-formal.
const KICKER: Record<Story["kind"], string> = { "points-record": "Rekor pecah", "late-promotion": "Promosi dramatis", upset: "Kejutan", "reverse-sweep": "Comeback", streak: "Tren positif", "first-title": "Juara baru", "idol-of-month": "Bintang bulan ini", rivalry: "Rivalitas", "multi-title": "Borong gelar", "title-milestone": "Tonggak sejarah", slump: "Krisis", unbeaten: "Tak terkalahkan" };
const TONE: Record<Story["kind"], string> = { "points-record": "brand-gold", "first-title": "brand-gold", upset: "accent-bright", "reverse-sweep": "brand-violet", streak: "brand-teal", "late-promotion": "brand-lime", "idol-of-month": "brand-rose", rivalry: "brand-orchid", "multi-title": "brand-gold", "title-milestone": "brand-amber", slump: "brand-sky", unbeaten: "brand-gold" };
const LINK = "text-sm text-text-secondary underline underline-offset-4 hover:text-text-primary";

export function StoryCard({ story, lead = false }: { story: Story; lead?: boolean }) {
  const { label } = useBranding();
  const lookup = useIdolLookup();
  const name = (id: string) => lookup(id)?.name ?? id;
  const s = story;
  const star = "winner" in s ? s.winner : "idol" in s ? s.idol : s.a;
  const headline = s.kind === "upset" ? `Kejutan Besar! ${name(s.winner)} Tumbangkan ${name(s.loser)} Meski Kalah Rating ${s.gap} Poin`
    : s.kind === "reverse-sweep" ? `Bangkit dari Jurang, ${name(s.winner)} Balikkan Keadaan atas ${name(s.loser)}`
    : s.kind === "streak" ? `${name(s.idol)} Tak Terbendung, Sapu ${s.wins} Kemenangan Beruntun`
    : s.kind === "first-title" ? `Penantian Berakhir! ${name(s.idol)} Rebut Gelar ${label(s.title)} Perdananya`
    : s.kind === "points-record" ? `Sejarah Tercipta: ${name(s.idol)} Kumpulkan ${s.points} Poin di ${label(s.league)}, Rekor ${s.previous} Tumbang`
    : s.kind === "late-promotion" ? `Comeback Dramatis! ${name(s.idol)} Melesat dari Peringkat ${s.from} ke ${s.to} dan Promosi dari ${label(s.league)}`
    : s.kind === "rivalry" ? `${name(s.a)} vs ${name(s.b)}: ${s.meetings} Duel Panas Musim Ini, Skor Sementara ${s.winsA}–${s.winsB}`
    : s.kind === "multi-title" ? `${name(s.idol)} Berpesta Gelar! Borong ${s.titles.length} Trofi: ${s.titles.map(label).join(", ")}`
    : s.kind === "title-milestone" ? `${name(s.idol)} Cetak Sejarah, Kini Koleksi ${s.total} Gelar Sepanjang Karier`
    : s.kind === "slump" ? `Alarm Bahaya! ${name(s.idol)} (Rating ${s.rating}) Telan ${s.losses} Kekalahan Beruntun`
    : s.kind === "unbeaten" ? `Tanpa Cela! ${name(s.idol)} Tak Tersentuh Kekalahan di ${label(s.league)}: ${s.wins} Menang, ${s.draws} Seri`
    : `${name(s.idol)} Bersinar Paling Terang di Matchday ${s.from}–${s.to} dengan ${s.wins} Kemenangan`;
  const tone = `var(--color-${TONE[s.kind]})`;
  return (
    <article className={`flex w-full gap-4 border-t-2 pt-3 ${lead ? "flex-col sm:flex-row sm:items-end" : ""}`} style={{ borderColor: tone }}>
      <IdolPhoto idolId={star} size={lead ? 1024 : 256} className={`photo-frame shrink-0 ${lead ? "w-48 sm:w-64" : "w-16"}`} />
      <div className="flex min-w-0 flex-col gap-2">
        <p lang="id" className="m-0 text-xs font-bold tracking-[0.25em] uppercase" style={{ color: tone }}>{KICKER[s.kind]}</p>
        <h2 lang="id" className={`m-0 font-display leading-tight ${lead ? "text-[clamp(1.6rem,3.5vw,2.75rem)] uppercase" : "text-base"}`}>{headline}</h2>
        <div>
          {"matchId" in s && "loser" in s && <Link to="/wiki/h2h" search={{ a: s.winner, b: s.loser }} className={LINK}>Match {s.matchId}</Link>}
          {s.kind === "streak" && <Link to="/wiki/idols/$id" params={{ id: s.idol }} className={LINK}>Up to {s.matchId}</Link>}
          {s.kind === "rivalry" && <Link to="/wiki/h2h" search={{ a: s.a, b: s.b }} className={LINK}>Head to Head</Link>}
          {s.kind === "first-title" && <Link to="/wiki/champions" className={LINK}>Hall of Champions</Link>}
          {(s.kind === "points-record" || s.kind === "late-promotion" || s.kind === "idol-of-month" || s.kind === "multi-title" || s.kind === "title-milestone" || s.kind === "slump" || s.kind === "unbeaten") && <Link to="/wiki/idols/$id" params={{ id: s.idol }} className={LINK}>Profile</Link>}
        </div>
      </div>
    </article>
  );
}
